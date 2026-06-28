import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '~/context/AuthContext';
import Logo from '~/components/Logo';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, CreditCard, TrendingUp, LogOut,
  ShieldCheck, Menu, X, Palette, BookOpen, Calculator, Wifi,
} from 'lucide-react';
import AdminOverviewTab from './AdminOverviewTab';
import AdminSubscriptionsTab from './AdminSubscriptionsTab';
import AdminUsersTab from './AdminUsersTab';
import AdminFinancialTab from './AdminFinancialTab';
import AdminKnowledgeBaseTab from './AdminKnowledgeBaseTab';
import AdminCalculatorTab from './AdminCalculatorTab';
import AdminGatewayTab from './AdminGatewayTab';
import DesignSystemTab from '~/features/dashboard/tabs/DesignSystemTab';

const TABS = [
  { id: 'overview',        label: 'Visão Geral',        icon: LayoutDashboard },
  { id: 'subscriptions',   label: 'Assinaturas',         icon: CreditCard },
  { id: 'financial',       label: 'Financeiro',           icon: TrendingUp },
  { id: 'users',           label: 'Usuários',             icon: Users },
  { id: 'gateway',          label: 'Monitor Gateway',       icon: Wifi },
  { id: 'knowledge-base',  label: 'Base de Conhecimento', icon: BookOpen },
  { id: 'calculator',      label: 'Calculadora',          icon: Calculator },
  { id: 'design-system',   label: 'Design System',        icon: Palette },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-200',
        'bg-black',
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
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMobileOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
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
        {/* Top bar mobile */}
        <header className="md:hidden sticky top-0 z-20 bg-background border-b border-border h-14 flex items-center px-4 gap-3">
          <button onClick={() => setMobileOpen(true)} className="text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-black text-sm text-foreground">Central Tovia</span>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {/* Page title */}
          <div className="mb-8">
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Central Tovia
            </p>
          </div>

          {activeTab === 'overview'       && <AdminOverviewTab />}
          {activeTab === 'subscriptions'  && <AdminSubscriptionsTab />}
          {activeTab === 'financial'      && <AdminFinancialTab />}
          {activeTab === 'users'          && <AdminUsersTab />}
          {activeTab === 'gateway'        && <AdminGatewayTab />}
          {activeTab === 'knowledge-base' && <AdminKnowledgeBaseTab />}
          {activeTab === 'calculator'     && <AdminCalculatorTab />}
          {activeTab === 'design-system'  && <DesignSystemTab />}
        </main>
      </div>
    </div>
  );
}
