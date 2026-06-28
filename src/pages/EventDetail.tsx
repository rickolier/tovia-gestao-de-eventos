import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getDocument, listDocuments } from '../lib/firebase-utils';
import { Evento, AppNotification } from '../types';
import { where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../lib/AuthContext';
import Logo from '../components/Logo';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import {
  ArrowLeft,
  LayoutDashboard,
  Ticket as TicketIcon,
  Users,
  User,
  DollarSign,
  BarChart3,
  Heart,
  Bed,
  Wallet,
  LogOut,
  MapPin,
  Bell,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
  Settings2,
  UserCog,
  Calculator,
  ScanLine,
  ChevronRight,
} from 'lucide-react';
import OverviewTab from './event-tabs/OverviewTab';
import TicketsTab from './event-tabs/TicketsTab';
import RegistrationsTab from './event-tabs/RegistrationsTab';
import FinancialTab from './event-tabs/FinancialTab';
import DonationsTab from './event-tabs/DonationsTab';
import ReportsTab from './event-tabs/ReportsTab';
import RoomsTab from './event-tabs/RoomsTab';
import ManagementTab from './event-tabs/ManagementTab';
import CalculatorTab from './dashboard-tabs/CalculatorTab';
import NotificationsTab from './event-tabs/NotificationsTab';
import SalesPagesTab from './event-tabs/SalesPagesTab';
import EquipeTab from './event-tabs/EquipeTab';
import CheckinTab from './event-tabs/CheckinTab';
import { toast } from 'sonner';
import { getPlanConfig } from '../lib/plan-limits';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, logout } = useAuth();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const navigate = useNavigate();

  const plan = getPlanConfig(profile?.plano);

  // Roles — calculados assim que o evento carrega
  const isOwner = !!user && !!evento && evento.criado_por === user.uid;
  const guestEntry = user && evento ? (evento.equipe || []).find(m => m.userId === user.uid) : null;
  const isGuest = !!guestEntry && !isOwner;
  const guestPerms = guestEntry?.permissoes ?? [];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const fetchEventoData = async () => {
    if (!id) return;
    const data = await getDocument<Evento>('eventos', id);
    if (!data) {
      navigate('/dashboard');
      return;
    }
    setEvento({ ...data, id });
    setLoading(false);
  };

  const fetchUnreadCount = async () => {
    if (!user || !id) return;
    try {
      const data = await listDocuments<AppNotification>('notificacoes', [
        where('userId', '==', user.uid),
        where('eventoId', '==', id),
        where('lida', '==', false)
      ]);
      setUnreadNotifications(data.length);
    } catch (error) {
      console.error('Error fetching event unread notifications:', error);
    }
  };

  useEffect(() => {
    fetchEventoData();
  }, [id, navigate]);

  useEffect(() => {
    fetchUnreadCount();
  }, [user, id, activeTab]);

  // Auto-expand the sidebar section that contains the active tab
  useEffect(() => {
    const tabToCategory: Record<string, string> = {
      tickets: 'Inscrições', 'sales-pages': 'Inscrições', registrations: 'Inscrições', 'checkin-list': 'Inscrições',
      financial: 'Financeiro', donations: 'Financeiro',
      calculadora: 'Gestão', management: 'Gestão', grupos: 'Gestão', equipe: 'Gestão',
    };
    const cat = tabToCategory[activeTab];
    if (cat) setExpandedSections(prev => new Set([...prev, cat]));
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!evento) return null;

  // Para convidados, visibilidade baseada nas permissões concedidas
  // Para donos, visibilidade baseada no plano como antes
  const showTab = (key: 'registrations' | 'management' | 'rooms' | 'tasks', planFlag: boolean) => {
    if (isGuest) return guestPerms.includes(key);
    return planFlag;
  };

  // Flat tab list — used by mobile bottom bar
  const allTabs = [
    { value: 'overview',       label: 'Dashboard',    shortLabel: 'Início',    icon: LayoutDashboard, show: !isGuest },
    { value: 'notifications',  label: 'Notificações', shortLabel: 'Notif.',    icon: Bell,            show: !isGuest, badge: unreadNotifications },
    { value: 'tickets',        label: 'Ingressos',    shortLabel: 'Ingressos', icon: TicketIcon,      show: !isGuest && plan.modules.registrations },
    { value: 'registrations',  label: 'Participantes',shortLabel: 'Pessoas',   icon: Users,           show: showTab('registrations', plan.modules.registrations) },
    { value: 'financial',      label: 'Pagamentos',   shortLabel: 'Pagam.',    icon: DollarSign,      show: !isGuest && plan.modules.manualPayments },
    { value: 'donations',      label: 'Doações',      shortLabel: 'Doações',   icon: Heart,           show: !isGuest && plan.modules.donations },
    { value: 'calculadora',    label: 'Calculadora',  shortLabel: 'Calc.',     icon: Calculator,      show: showTab('management', plan.modules.eventManagement) },
    { value: 'management',     label: 'Recursos',     shortLabel: 'Recursos',  icon: Wallet,          show: showTab('management', plan.modules.eventManagement) },
    { value: 'grupos',         label: 'Grupos',       shortLabel: 'Grupos',    icon: Bed,             show: showTab('rooms', plan.modules.eventManagement) },
    { value: 'sales-pages',       label: 'Páginas',        shortLabel: 'Páginas',  icon: Globe,      show: !isGuest && plan.modules.registrations },
    { value: 'reports',           label: 'Relatórios',     shortLabel: 'Relatórios',icon: BarChart3, show: !isGuest && plan.modules.reports },
    { value: 'equipe',            label: 'Equipe',         shortLabel: 'Equipe',   icon: UserCog,    show: showTab('tasks', plan.modules.tasksAndTeam) },
  ].filter(t => t.show);

  // Categorised sidebar structure
  const sidebarSections: Array<{ category: string | null; items: Array<{ value: string; label: string; icon: React.ForwardRefExoticComponent<any>; show: boolean; badge?: number }> }> = [
    {
      category: null,
      items: [
        { value: 'overview',      label: 'Dashboard',    icon: LayoutDashboard, show: !isGuest },
        { value: 'notifications', label: 'Notificações', icon: Bell,            show: !isGuest, badge: unreadNotifications },
        { value: 'reports',       label: 'Relatórios',   icon: BarChart3,       show: !isGuest && plan.modules.reports },
      ],
    },
    {
      category: 'Inscrições',
      items: [
        { value: 'tickets',       label: 'Ingressos',     icon: TicketIcon,  show: !isGuest && plan.modules.registrations },
        { value: 'sales-pages',   label: 'Páginas',       icon: Globe,       show: !isGuest && plan.modules.registrations },
        { value: 'registrations', label: 'Participantes', icon: Users,       show: showTab('registrations', plan.modules.registrations) },
        { value: 'checkin-list',  label: 'Check-in',      icon: ScanLine,    show: !isGuest && plan.modules.registrations },
      ],
    },
    {
      category: 'Financeiro',
      items: [
        { value: 'financial',         label: 'Pagamentos',    icon: DollarSign, show: !isGuest && plan.modules.manualPayments },
        { value: 'donations',         label: 'Doações',       icon: Heart,      show: !isGuest && plan.modules.donations },
      ],
    },
    {
      category: 'Gestão',
      items: [
        { value: 'calculadora', label: 'Calculadora', icon: Calculator, show: showTab('management', plan.modules.eventManagement) },
        { value: 'management', label: 'Recursos',    icon: Wallet,     show: showTab('management', plan.modules.eventManagement) },
        { value: 'grupos',     label: 'Grupos',      icon: Bed,        show: showTab('rooms', plan.modules.eventManagement) },
        { value: 'equipe',     label: 'Equipe',   icon: UserCog,  show: showTab('tasks', plan.modules.tasksAndTeam) },
      ],
    },
  ].map(s => ({ ...s, items: s.items.filter(i => i.show) }))
   .filter(s => s.items.length > 0);

  const toggleSection = (category: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  };

  // Shared sidebar trigger style (dark sidebar)
  // Base UI uses data-active (not data-[state=active]), and its default data-active:bg-background would make the
  // active item white on the dark sidebar — override it with our custom active colors.
  const triggerBase = "sidebar-nav-item w-full border-none !shadow-none text-sm !justify-start data-active:!bg-[var(--sidebar-active-bg)] data-active:!text-white data-active:!font-semibold";
  const triggerWithBadge = "sidebar-nav-item w-full border-none !shadow-none text-sm !justify-start flex items-center justify-between data-active:!bg-[var(--sidebar-active-bg)] data-active:!text-white data-active:!font-semibold group";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile compact top header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--sidebar)] h-14 flex items-center px-3 gap-2">
        <Link to="/dashboard" className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-sm font-semibold text-white leading-tight truncate flex-1">{evento.nome}</h1>
        <button onClick={handleLogout} className="p-2 rounded-lg text-white/60 hover:text-red-300 hover:bg-red-500/10 transition-colors shrink-0">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex flex-col md:flex-row min-h-screen">
        {/* Sidebar — desktop only, dark green */}
        <aside className={cn(
          "hidden md:flex bg-[var(--sidebar)] sticky top-0 h-screen flex-col z-30 shrink-0 transition-all duration-200",
          sidebarOpen ? "w-64" : "w-16"
        )}>
          {/* Logo area */}
          <div className="h-16 px-3 flex items-center gap-2 border-b border-[var(--sidebar-border)] shrink-0">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              title={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            {sidebarOpen && <Logo variant="white" />}
          </div>

          {/* Back + event name — hidden when collapsed */}
          {sidebarOpen && (
            <div className="px-4 py-4 border-b border-[var(--sidebar-border)] shrink-0">
              <Link to="/dashboard" className="flex items-center gap-2 text-white/50 hover:text-white/80 text-xs mb-3 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar ao painel
              </Link>
              <h1 className="text-sm font-semibold text-white leading-snug line-clamp-2">{evento.nome}</h1>
              <p className="text-[10px] text-white/40 mt-1">
                {new Date(evento.data_inicio).toLocaleDateString('pt-BR')}
              </p>
              {isGuest && (
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full">
                  <UserCog className="w-3 h-3" /> Convidado
                </span>
              )}
            </div>
          )}

          {/* Collapsed: back arrow icon only */}
          {!sidebarOpen && (
            <div className="px-3 py-4 border-b border-[var(--sidebar-border)] shrink-0 flex justify-center">
              <Link to="/dashboard" className="p-2 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors" title="Voltar ao painel">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Tab list — plain buttons to avoid Base UI TabsList/TabsTrigger CSS conflicts */}
          <nav className="flex-1 px-3 py-3 flex flex-col gap-0 overflow-y-auto min-h-0">
            {sidebarSections.map((section, si) => {
              const isExpanded = !section.category || expandedSections.has(section.category);
              const hasActiveChild = section.items.some(i => i.value === activeTab);

              return (
                <div key={si} className={cn('w-full', si > 0 && 'mt-1')}>
                  {/* Category header — clickable accordion toggle */}
                  {section.category && sidebarOpen && (
                    <button
                      onClick={() => toggleSection(section.category!)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-lg mb-0.5',
                        'text-[11px] uppercase tracking-widest text-white font-bold',
                      )}
                    >
                      <span>{section.category}</span>
                      <ChevronRight className={cn('w-3 h-3 transition-transform duration-200', isExpanded && 'rotate-90')} />
                    </button>
                  )}
                  {section.category && !sidebarOpen && si > 0 && (
                    <div className="mx-3 mb-2 border-t border-white/10" />
                  )}

                  {/* Items — shown when expanded (or no category) */}
                  {isExpanded && (
                    <div className="flex flex-col gap-0.5">
                      {section.items.map(tab => {
                        const isActive = activeTab === tab.value;
                        return (
                          <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            title={!sidebarOpen ? tab.label : undefined}
                            className={cn(
                              'sidebar-nav-item w-full',
                              isActive && 'active',
                              !sidebarOpen && 'justify-center px-0',
                              section.category && sidebarOpen && 'pl-4',
                            )}
                          >
                            {sidebarOpen ? (
                              <>
                                <div className="flex items-center gap-2.5">
                                  <tab.icon className="w-[17px] h-[17px] shrink-0" />
                                  <span>{tab.label}</span>
                                </div>
                                {tab.badge !== undefined && (tab.badge as number) > 0 && (
                                  <span className="ml-auto bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                                    {(tab.badge as number) > 9 ? '9+' : tab.badge}
                                  </span>
                                )}
                              </>
                            ) : (
                              <div className="relative">
                                <tab.icon className="w-[17px] h-[17px] shrink-0" />
                                {tab.badge !== undefined && (tab.badge as number) > 0 && (
                                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                                    {(tab.badge as number) > 9 ? '9+' : tab.badge}
                                  </span>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Logout at bottom */}
          <div className="mt-auto px-3 py-4 border-t border-[var(--sidebar-border)] shrink-0">
            <button
              onClick={handleLogout}
              className={cn(
                "sidebar-nav-item text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full",
                !sidebarOpen && "justify-center !justify-center px-0"
              )}
              title={!sidebarOpen ? 'Sair' : undefined}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Sair</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pt-14 md:pt-0 pb-16 md:pb-0">
          {/* Desktop top header */}
          <header className="hidden md:flex bg-card border-b border-border h-16 items-center justify-end px-6 shrink-0 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-foreground">{profile?.nome}</span>
                <span className="text-[11px] text-muted-foreground">{user?.email}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20 overflow-hidden">
                {profile?.imagem_url ? (
                  <img src={profile.imagem_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </header>

          {/* Event Header Banner */}
          <div className={`relative ${activeTab === 'overview' ? 'h-40 md:h-48' : 'h-20 md:h-24'} w-full overflow-hidden bg-muted shrink-0 transition-all duration-300`}>
            <div className={`absolute inset-0 z-10 transition-opacity duration-300 ${activeTab === 'overview' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {evento.imagem_url ? (
                <img src={evento.imagem_url} alt={evento.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: evento.cor_tema || '#1a4d2e' }}>
                  <Logo className="opacity-20 scale-150" showTagline={false} />
                </div>
              )}
            </div>
            <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: evento.cor_tema || '#1a4d2e' }} />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-between ${activeTab === 'overview' ? 'p-5 md:p-8' : 'p-4 md:p-6'} z-20 transition-all duration-300`}>
              <div className="text-white">
                <h2 className={`${activeTab === 'overview' ? 'text-2xl md:text-4xl' : 'text-lg md:text-2xl'} font-black mb-1 drop-shadow-xl tracking-tight transition-all duration-300`}>{evento.nome}</h2>
                <p className={`text-sm font-bold opacity-90 flex items-center gap-2 drop-shadow-lg ${activeTab === 'overview' ? 'flex' : 'hidden md:flex'}`}>
                  <MapPin className="w-4 h-4 text-primary-foreground" /> {evento.local}
                </p>
              </div>
              {activeTab === 'overview' && (
                <Link
                  to={`/eventos/${evento.id}/checkin`}
                  className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/25 text-white text-xs font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-all shrink-0"
                >
                  <ScanLine className="w-4 h-4" />
                  <span className="hidden sm:inline">Checkin</span>
                </Link>
              )}
            </div>
          </div>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8">
            <TabsContent value="overview" className="mt-0 border-none p-0 shadow-none bg-transparent">
              <OverviewTab evento={evento} />
            </TabsContent>
            <TabsContent value="notifications" className="mt-0 border-none p-0 shadow-none bg-transparent">
              <NotificationsTab eventoId={evento.id} />
            </TabsContent>
            <TabsContent value="tickets" className="mt-0 border-none p-0 shadow-none bg-transparent">
              <TicketsTab eventoId={evento.id} />
            </TabsContent>
            <TabsContent value="registrations" className="mt-0 border-none p-0 shadow-none bg-transparent">
              <RegistrationsTab eventoId={evento.id} readOnly={isGuest} />
            </TabsContent>
            <TabsContent value="checkin-list" className="mt-0 border-none p-0 shadow-none bg-transparent">
              <CheckinTab eventoId={evento.id} />
            </TabsContent>
            <TabsContent value="financial" className="mt-0 border-none p-0 shadow-none bg-transparent">
              <FinancialTab eventoId={evento.id} />
            </TabsContent>
            <TabsContent value="calculadora" className="mt-0 border-none p-0 shadow-none bg-transparent">
              <CalculatorTab evento={evento} onUpdate={fetchEventoData} />
            </TabsContent>
            <TabsContent value="management" className="mt-0 border-none p-0 shadow-none bg-transparent">
              <ManagementTab evento={evento} onUpdate={fetchEventoData} />
            </TabsContent>
            <TabsContent value="donations" className="mt-0 border-none p-0 shadow-none bg-transparent">
              <DonationsTab eventoId={evento.id} />
            </TabsContent>
            <TabsContent value="grupos" className="mt-0 border-none p-0 shadow-none bg-transparent">
              <RoomsTab eventoId={evento.id} />
            </TabsContent>
            <TabsContent value="sales-pages" className="mt-0 border-none p-0 shadow-none bg-transparent">
              <SalesPagesTab eventoId={evento.id} />
            </TabsContent>
            <TabsContent value="reports" className="mt-0 border-none p-0 shadow-none bg-transparent">
              <ReportsTab evento={evento} />
            </TabsContent>

            <TabsContent value="equipe" className="mt-0 border-none p-0 shadow-none bg-transparent">
              <EquipeTab evento={evento} onUpdate={fetchEventoData} />
            </TabsContent>
          </main>
        </div>
      </Tabs>

      {/* Mobile-only bottom category nav */}
      <div className="md:hidden">
        {/* Submenu overlay */}
        {mobileSubmenu && (
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setMobileSubmenu(null)}
          />
        )}
        {/* Submenu drawer */}
        {mobileSubmenu && (() => {
          const section = sidebarSections.find(s => s.category === mobileSubmenu);
          if (!section) return null;
          return (
            <div className="fixed bottom-[57px] left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 px-1">{mobileSubmenu}</p>
              <div className="flex flex-col gap-1">
                {section.items.filter(t => t.show !== false).map(tab => {
                  const isActive = activeTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => { setActiveTab(tab.value); setMobileSubmenu(null); }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full text-left",
                        isActive ? "bg-primary text-white font-semibold" : "text-foreground hover:bg-muted"
                      )}
                    >
                      <tab.icon className="w-4 h-4 shrink-0" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Bottom category bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex">
          {/* Direct items */}
          {[
            { value: 'overview',      label: 'Dashboard',    icon: LayoutDashboard, badge: undefined as number | undefined },
            { value: 'notifications', label: 'Notif.',       icon: Bell,            badge: unreadNotifications > 0 ? unreadNotifications : undefined },
            { value: 'reports',       label: 'Relatórios',   icon: BarChart3,       badge: undefined as number | undefined },
          ].map(item => (
            <button
              key={item.value}
              onClick={() => { setActiveTab(item.value); setMobileSubmenu(null); }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 py-2 flex-1 transition-colors",
                activeTab === item.value && mobileSubmenu === null ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-bold leading-none">{item.label}</span>
              {item.badge !== undefined && (
                <span className="absolute top-1 right-[calc(50%-18px)] w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          ))}

          {/* Category buttons */}
          {(['Inscrições', 'Financeiro', 'Gestão do Evento'] as const).map(cat => {
            const section = sidebarSections.find(s => s.category === cat);
            const items = section?.items.filter(t => t.show !== false) ?? [];
            const isActiveCategory = mobileSubmenu === cat ||
              (mobileSubmenu === null && items.some(t => activeTab === t.value));
            const labels: Record<string, string> = { 'Inscrições': 'Inscrições', 'Financeiro': 'Financeiro', 'Gestão do Evento': 'Gestão' };
            const icons: Record<string, React.ElementType> = { 'Inscrições': Users, 'Financeiro': DollarSign, 'Gestão do Evento': Wallet };
            const Icon = icons[cat];
            return (
              <button
                key={cat}
                onClick={() => setMobileSubmenu(prev => prev === cat ? null : cat)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 flex-1 transition-colors",
                  isActiveCategory ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-bold leading-none">{labels[cat]}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
