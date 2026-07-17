import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '~/context/AuthContext';
import Logo from '~/components/Logo';
import { ADMIN_EMAILS } from '~/utils/admin-config';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, TrendingUp, LogOut, ShieldCheck,
  Menu, X, BookOpen, Calculator, Wifi, Headphones, LifeBuoy, Megaphone, KeyRound,
  ChevronDown,
} from 'lucide-react';
import AdminOverviewTab from './AdminOverviewTab';
import AdminFinancialTab from './AdminFinancialTab';
import AdminClientesTab from './AdminClientesTab';
import AdminKnowledgeBaseTab from './AdminKnowledgeBaseTab';
import AdminCalculatorTab from './AdminCalculatorTab';
import AdminGatewayTab from './AdminGatewayTab';
import AdminTicketsTab from './AdminTicketsTab';
import AdminCSPanelTab from './AdminCSPanelTab';
import AdminComunicadosTab from './AdminComunicadosTab';
import AdminBillingKeyTab from './AdminBillingKeyTab';
import AdminLeadsTab from './AdminLeadsTab';

type AdminRole = 'criador' | 'suporte';

function getRole(email: string | null | undefined): AdminRole {
  return email === ADMIN_EMAILS[1] ? 'suporte' : 'criador';
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AdminRole[];
}
interface NavGroup {
  section: string;
  roles: AdminRole[];
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    section: 'Geral', roles: ['criador'],
    items: [
      { id: 'overview',     label: 'Visão Geral',        icon: LayoutDashboard, roles: ['criador'] },
      { id: 'relatorios',   label: 'Relatórios',         icon: TrendingUp,      roles: ['criador'] },
      { id: 'billing-key',  label: 'Configuração de API', icon: KeyRound,       roles: ['criador'] },
    ],
  },
  {
    section: 'Clientes', roles: ['criador', 'suporte'],
    items: [
      { id: 'knowledge-base', label: 'Base de Conhecimento', icon: BookOpen,   roles: ['criador', 'suporte'] },
      { id: 'clientes',       label: 'Clientes',             icon: Users,      roles: ['criador'] },
      { id: 'gateway',        label: 'Monitor Gateway',      icon: Wifi,       roles: ['criador'] },
      { id: 'cs-panel',       label: 'Painel CS',            icon: Headphones, roles: ['criador', 'suporte'] },
      { id: 'tickets',        label: 'Suporte',              icon: LifeBuoy,   roles: ['criador', 'suporte'] },
    ],
  },
  {
    section: 'Marketing', roles: ['criador'],
    items: [
      { id: 'leads',              label: 'Leads',                icon: Users,      roles: ['criador'] },
      { id: 'calculator',         label: 'Calculadora',          icon: Calculator, roles: ['criador'] },
      { id: 'comunicados',        label: 'Comunicados',          icon: Megaphone,  roles: ['criador'] },
    ],
  },
];

const TAB_TITLES: Record<string, string> = {
  overview:             'Visão Geral',
  relatorios:           'Relatórios',
  'billing-key':        'Configuração de API',
  'knowledge-base':     'Base de Conhecimento',
  clientes:             'Clientes',
  gateway:              'Monitor Gateway',
  'cs-panel':           'Painel CS',
  tickets:              'Suporte',
  calculator:           'Calculadora',
  comunicados:          'Comunicados',
  leads:                'Leads',
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = getRole(user?.email);
  const [activeTab, setActiveTab] = useState(role === 'suporte' ? 'tickets' : 'overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const handleLogout = async () => { await logout(); navigate('/'); };

  const toggleSection = (section: string) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(section) ? next.delete(section) : next.add(section);
      return next;
    });

  const visibleGroups = NAV
    .filter(g => g.roles.includes(role))
    .map(g => ({ ...g, items: g.items.filter(i => i.roles.includes(role)) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-200 bg-black',
        'md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        {/* Logo */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[var(--sidebar-border)] shrink-0">
          <Logo variant="white" />
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin badge */}
        <div className="px-5 py-4 border-b border-[var(--sidebar-border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest">Central Tovia</p>
              <p className="text-[10px] text-white/50 truncate max-w-[140px]">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {visibleGroups.map((group, gi) => {
            const isCollapsed = collapsed.has(group.section);
            return (
              <div key={group.section}>
                <button
                  onClick={() => toggleSection(group.section)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors',
                    gi === 0 ? 'mt-0' : 'mt-3',
                    'text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white/60',
                  )}
                >
                  {group.section}
                  <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', isCollapsed && '-rotate-90')} />
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5 mt-0.5">
                    {group.items.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                          className={cn('sidebar-nav-item', isActive && 'active')}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-[var(--sidebar-border)]">
          <button
            onClick={handleLogout}
            className="sidebar-nav-item text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-20 bg-background border-b border-border h-14 flex items-center px-4 gap-3">
          <button onClick={() => setMobileOpen(true)} className="text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-black text-sm text-foreground">Central Tovia</span>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {TAB_TITLES[activeTab] ?? activeTab}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Central Tovia</p>
          </div>

          {activeTab === 'overview'           && <AdminOverviewTab />}
          {activeTab === 'relatorios'         && <AdminFinancialTab />}
          {activeTab === 'billing-key'        && <AdminBillingKeyTab />}
          {activeTab === 'knowledge-base'     && <AdminKnowledgeBaseTab readOnly={role === 'suporte'} />}
          {activeTab === 'clientes'           && <AdminClientesTab />}
          {activeTab === 'gateway'            && <AdminGatewayTab />}
          {activeTab === 'cs-panel'           && <AdminCSPanelTab />}
          {activeTab === 'tickets'            && <AdminTicketsTab />}
          {activeTab === 'calculator'         && <AdminCalculatorTab />}
          {activeTab === 'comunicados'        && <AdminComunicadosTab />}
          {activeTab === 'leads'              && <AdminLeadsTab />}
        </main>
      </div>
    </div>
  );
}
