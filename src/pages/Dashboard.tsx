import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { listDocuments, createDocument } from '../lib/firebase-utils';
import { Evento, AppNotification, FinancialTransaction } from '../types';
import { where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  Plus,
  LayoutDashboard,
  BarChart3,
  User,
  Calendar as CalendarIcon,
  Bell,
  Menu,
  X,
  Calculator,
  Search,
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// Tabs
import HomeTab from './dashboard-tabs/HomeTab';
import ReportsTab from './dashboard-tabs/ReportsTab';
import ProfileTab from './dashboard-tabs/ProfileTab';
import CalendarTab from './dashboard-tabs/CalendarTab';
import CalculatorTab from './dashboard-tabs/CalculatorTab';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inicio');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const [eventosData, notifications] = await Promise.all([
            listDocuments<Evento>('eventos', [where('criado_por', '==', user.uid)]),
            listDocuments<AppNotification>('notificacoes', [
              where('userId', '==', user.uid),
              where('lida', '==', false),
            ]),
          ]);
          setEventos(eventosData);
          setUnreadCount(notifications.length);
          generateDailySummary(eventosData);
        } catch (error: any) {
          console.error('Error fetching dashboard data:', error);
          const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
          try {
            const parsed = JSON.parse(errorMsg);
            if (parsed.error && parsed.error.includes('permissions')) {
              toast.error('Erro de permissão no Firebase. Verifique as regras.');
            } else {
              toast.error('Erro ao carregar dados: ' + errorMsg);
            }
          } catch {
            toast.error('Erro ao carregar dados do painel');
          }
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const generateDailySummary = async (userEvents: Evento[]) => {
    if (!user || userEvents.length === 0) return;
    const today = new Date();
    if (today.getHours() < 18) return;
    const todayStr = today.toISOString().split('T')[0];
    const existingSummaries = await listDocuments<AppNotification>('notificacoes', [
      where('userId', '==', user.uid),
      where('tipo', '==', 'resumo_diario'),
    ]);
    const hasTodaySummary = existingSummaries.some(n => n.data.startsWith(todayStr));
    if (hasTodaySummary) return;
    let totalEntradas = 0;
    let totalSaidas = 0;
    for (const evento of userEvents) {
      const transacoes = await listDocuments<FinancialTransaction>(`eventos/${evento.id}/transacoes`, [
        where('data', '==', todayStr),
      ]);
      transacoes.forEach(t => {
        if (t.tipo === 'entrada') totalEntradas += t.valor;
        if (t.tipo === 'saida') totalSaidas += t.valor;
      });
    }
    if (totalEntradas > 0 || totalSaidas > 0) {
      const notifId = uuidv4();
      await createDocument('notificacoes', notifId, {
        id: notifId,
        userId: user.uid,
        tipo: 'resumo_diario',
        titulo: 'Resumo Financeiro do Dia',
        mensagem: `Hoje tivemos ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEntradas)} em entradas e ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSaidas)} em saídas.`,
        data: today.toISOString(),
        lida: false,
        acao_requirida: false,
      } as AppNotification);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const menuItems: { id: string; label: string; icon: React.ComponentType<any>; badge?: number }[] = [
    { id: 'inicio', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda', icon: CalendarIcon },
    { id: 'calculadora', label: 'Calculadora', icon: Calculator },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'perfil', label: 'Meu Perfil', icon: User },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Carregando painel...</p>
        </div>
      </div>
    );
  }

  const currentLabel = menuItems.find(i => i.id === activeTab)?.label ?? '';

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      {/* ── Mobile top bar ── */}
      <header className="md:hidden bg-[var(--sidebar)] h-14 flex items-center justify-between px-4 sticky top-0 z-50">
        <Logo variant="white" className="scale-75 origin-left" />
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0',
          'bg-[var(--sidebar)]',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="h-16 px-6 flex items-center border-b border-[var(--sidebar-border)] shrink-0">
          <Logo variant="white" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-0.5 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={cn(
                'sidebar-nav-item',
                activeTab === item.id && 'active',
              )}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          {/* Divider */}
          <div className="pt-6 pb-2">
            <p className="px-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">
              Ações
            </p>
            <Link to="/eventos/novo">
              <button className="sidebar-nav-item w-full bg-primary/90 hover:bg-primary text-white font-semibold">
                <Plus className="w-[18px] h-[18px]" />
                Criar Evento
              </button>
            </Link>
          </div>
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-[var(--sidebar-border)] shrink-0">
          <button
            onClick={handleLogout}
            className="sidebar-nav-item text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 bg-card border-b border-border items-center px-6 gap-4 sticky top-0 z-30 shrink-0">
          {/* Search bar */}
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-sm bg-muted/60 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* User avatar + info */}
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-foreground leading-tight">{profile?.nome}</p>
                <p className="text-[11px] text-muted-foreground">{currentLabel}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
                {profile?.imagem_url ? (
                  <img src={profile.imagem_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
            {activeTab === 'inicio'       && <HomeTab eventos={eventos} />}
            {activeTab === 'agenda'       && <CalendarTab eventos={eventos} />}
            {activeTab === 'calculadora'  && <CalculatorTab />}
            {activeTab === 'relatorios'   && <ReportsTab eventos={eventos} />}
            {activeTab === 'perfil'       && <ProfileTab />}
          </div>
        </div>
      </main>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
