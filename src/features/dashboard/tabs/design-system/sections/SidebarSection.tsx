import React from 'react';
import { House, User, Calendar, BarChart3, Settings, Plus } from 'lucide-react';
import { Section, SubLabel } from '../shared';

const NAV_ITEMS: Array<[icon: React.ComponentType<{ className?: string }>, label: string, active: boolean]> = [
  [House, 'Início', true],
  [User, 'Meu Perfil', false],
  [Calendar, 'Agenda', false],
  [BarChart3, 'Relatórios', false],
  [Settings, 'Configurações', false],
];

const TOKENS: Array<[token: string, value: string, desc: string]> = [
  ['--sidebar', '#2D1470', 'Fundo'],
  ['--sidebar-foreground', '#F5F0E8', 'Texto'],
  ['--sidebar-muted', 'rgba(245,240,232,0.55)', 'Item inativo'],
  ['--sidebar-active-bg', 'rgba(245,240,232,0.13)', 'Item ativo'],
  ['--sidebar-hover-bg', 'rgba(245,240,232,0.07)', 'Hover'],
  ['--sidebar-border', 'rgba(245,240,232,0.08)', 'Divisor'],
];

export function SidebarSection() {
  return (
    <Section title="13. Navegação — Sidebar" subtitle="Padrão de navegação lateral escura">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="bg-[#2D1470] rounded-2xl p-4 w-full md:w-56 space-y-0.5 shrink-0">
          <div className="px-3 pb-4 mb-2 border-b border-white/10">
            <div className="font-black text-3xl text-white tracking-tight">tovia</div>
          </div>
          {NAV_ITEMS.map(([Icon, label, active]) => (
            <div
              key={label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active ? 'bg-white/12 text-white' : 'text-white/55 hover:bg-white/7 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </div>
          ))}
          <div className="pt-4 mt-2 border-t border-white/10">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-primary/90 text-white">
              <Plus className="w-4 h-4" />
              <span>Criar Evento</span>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-card border border-border rounded-2xl p-6 flex flex-col justify-center">
          <SubLabel>Tokens da Sidebar</SubLabel>
          <div className="space-y-2 text-sm font-mono mt-2">
            {TOKENS.map(([token, value, desc]) => (
              <div key={token} className="flex items-center gap-3">
                <code className="text-[11px] text-primary bg-primary/5 px-2 py-0.5 rounded flex-1">{token}</code>
                <span className="text-[11px] text-muted-foreground w-52">{value}</span>
                <span className="text-[11px] text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
