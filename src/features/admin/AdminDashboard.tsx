import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '~/context/AuthContext';
import Logo from '~/components/Logo';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, TrendingUp, LogOut, ShieldCheck,
  Menu, X, Palette, BookOpen, Calculator, Wifi, Headphones, LifeBuoy, Megaphone,
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
import DesignSystemTab from '~/features/dashboard/tabs/DesignSystemTab';

type AdminRole = 'criador' | 'suporte';

function getRole(email: string | null | undefined): AdminRole {
  return email === 'suporte@toviaapp.com.br' ? 'suporte' : 'criador';
}

interface NavSection {
  type: 'section';
  label: string;
  roles: AdminRole[];
}
interface NavItem {
  type: 'item';
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AdminRole[];
}
type NavEntry = NavSection | NavItem;

const NAV: NavEntry[] = [
  { type: 'section', label: 'Geral',      roles: ['criador'] },
  { type: 'item', id: 'overview',      label: 'Visão Geral',          icon: LayoutDashboard, roles: ['criador'] },
  { type: 'item', id: 'relatorios',    label: 'Relatórios',            icon: TrendingUp,      roles: ['criador'] },

  { type: 'section', label: 'Clientes',   roles: ['criador'] },
  { type: 'item', id: 'clientes',      label: 'Clientes',              icon: Users,           roles: ['criador'] },

  { type: 'section', label: 'Suporte',    roles: ['criador', 'suporte'] },
  { type: 'item', id: 'tickets',       label: 'Tickets',               icon: LifeBuoy,        roles: ['criador', 'suporte'] },
  { type: 'item', id: 'cs-panel',      label: 'Painel CS',             icon: Headphones,      roles: ['criador', 'suporte'] },
  // Base de Conhecimento (leitura) — visível apenas para suporte nesta seção
  { type: 'item', id: 'knowledge-base', label: 'Base de Conhecimento', icon: BookOpen,        roles: ['suporte'] },

  { type: 'section', label: 'Tecnologia', roles: ['criador'] },
  { type: 'item', id: 'gateway',       label: 'Monitor Gateway',        icon: Wifi,            roles: ['criador'] },

  { type: 'section', label: 'Marketing',  roles: ['criador'] },
  // Base de Conhecimento (CRUD) — visível para criador nesta seção
  { type: 'item', id: 'knowledge-base', label: 'Base de Conhecimento', icon: BookOpen,        roles: ['criador'] },
  { type: 'item', id: 'design-system', label: 'Design System',          icon: Palette,         roles: ['criador'] },
  { type: 'item', id: 'calculator',    label: 'Calculadora',            icon: Calculator,      roles: ['criador'] },
  { type: 'item', id: 'comunicados',   label: 'Comunicados',            icon: Megaphone,       roles: ['criador'] },
];

const TAB_TITLES: Record<string, string> = {
  overview:        'Visão Geral',
  relatorios:      'Relatórios',
  clientes:        'Clientes',
  tickets:         'Tickets',
  'cs-panel':      'Painel CS',
  'knowledge-base': 'Base de Conhecimento',
  gateway:         'Monitor Gateway',
  'design-system': 'Design System',
  calculator:      'Calculadora',
  comunicados:     'Comunicados',
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = getRole(user?.email);
  const [activeTab, setActiveTab] = useState(role === 'suporte' ? 'tickets' : 'overview');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/'); };

  // Deduplicate nav entries — same id can appear in multiple sections
  // but we show each section+item pair; active highlight applies to the id
  const visibleNav = NAV.filter(e => e.roles.includes(role));

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-200 bg-black',
        'md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        {/* Logo */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <Logo variant="white" />
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin badge */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest">Central Tovia</p>
              <p className="text-[10px] text-white/40 truncate max-w-[140px]">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNav.map((entry, i) => {
            if (entry.type === 'section') {
              return (
                <p key={`s-${i}`} className="px-3 pt-4 pb-1 text-[9px] font-black uppercase tracking-widest text-white/30 first:pt-0">
                  {entry.label}
                </p>
              );
            }
            const Icon = entry.icon;
            const isActive = activeTab === entry.id;
            return (
              <button
                key={`${entry.id}-${i}`}
                onClick={() => { setActiveTab(entry.id); setMobileOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {entry.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
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

          {activeTab === 'overview'        && <AdminOverviewTab />}
          {activeTab === 'relatorios'      && <AdminFinancialTab />}
          {activeTab === 'clientes'        && <AdminClientesTab />}
          {activeTab === 'tickets'         && <AdminTicketsTab />}
          {activeTab === 'cs-panel'        && <AdminCSPanelTab />}
          {activeTab === 'knowledge-base'  && <AdminKnowledgeBaseTab readOnly={role === 'suporte'} />}
          {activeTab === 'gateway'         && <AdminGatewayTab />}
          {activeTab === 'design-system'   && <DesignSystemTab />}
          {activeTab === 'calculator'      && <AdminCalculatorTab />}
          {activeTab === 'comunicados'     && <AdminComunicadosTab />}
        </main>
      </div>
    </div>
  );
}
