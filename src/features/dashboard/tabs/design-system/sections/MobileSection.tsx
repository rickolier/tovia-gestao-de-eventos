import { House, DollarSign, CheckCircle2, Layers, MessageCircle, Bell } from 'lucide-react';
import { ToviaLogo } from '../../../../../components/ToviaLogo';
import { Section, Label, SubLabel, Swatch, InfoNote, Code } from '../shared';

const TABS = [
  { Icon: House, label: 'Início', active: true },
  { Icon: DollarSign, label: 'Financeiro', active: false },
  { Icon: CheckCircle2, label: 'Check-in', active: false },
  { Icon: Layers, label: 'Tarefas', active: false },
  { Icon: MessageCircle, label: 'Suporte', active: false },
];

const SHARED_TOKENS: Array<[label: string, hex: string, token: string]> = [
  ['Primary', '#FF6B1A', 'colors.primary'],
  ['Accent / Violet', '#9B5FFF', 'colors.accent'],
  ['Sidebar', '#2D1470', 'colors.sidebar / sidebar web'],
  ['Danger', '#ef4444', 'colors.danger / destructive'],
  ['Sucesso', '#10b981', 'emerald-500 / colors.success'],
  ['Aviso', '#f59e0b', 'amber-400 / colors.warning'],
];

export function MobileSection() {
  return (
    <Section title="15. Tovia Mobile" subtitle="Identidade, paleta e padrões do app React Native">
      {/* Logo Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-border rounded-2xl p-8 flex flex-col items-center gap-3">
          <ToviaLogo variant="mobile" className="h-8 w-auto text-[#1d1d1b]" />
          <Label>Logo — Fundo Claro</Label>
        </div>
        <div className="bg-[#1E0B4B] border border-border rounded-2xl p-8 flex flex-col items-center gap-3">
          <ToviaLogo variant="mobile" className="h-8 w-auto text-white" />
          <Label>Logo — Fundo Escuro</Label>
        </div>
        <div className="bg-[#2D1470] border border-border rounded-2xl p-8 flex flex-col items-center gap-3">
          <ToviaLogo variant="mobile" className="h-8 w-auto text-white" />
          <Label>Logo — Header do App</Label>
        </div>
      </div>

      <div className="mb-6">
        <InfoNote>
          <strong className="text-foreground">Lockup "tovia mobile":</strong> Wordmark original + sufixo "mobile" em laranja, mesmo SVG. Implementado via <Code>{'<ToviaLogo variant="mobile" />'}</Code>. O "tovia" segue <Code>currentColor</Code>; o "mobile" é laranja fixo (<Code>#FF6B1A</Code>), sobrescritível via prop <Code>mobileColor</Code>.
        </InfoNote>
      </div>

      {/* Paleta Mobile */}
      <SubLabel>Paleta de Cores — Mobile</SubLabel>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Swatch color="bg-[#FF6B1A]" label="Primary" hex="#FF6B1A" />
        <Swatch color="bg-[#9B5FFF]" label="Accent / Violet" hex="#9B5FFF" />
        <Swatch color="bg-[#2D1470]" label="Header / Sidebar" hex="#2D1470" />
        <Swatch color="bg-[#1E0B4B]" label="Background Dark" hex="#1E0B4B" />
      </div>
      <div className="mb-6">
        <InfoNote>
          <strong className="text-foreground">Paleta unificada web + mobile:</strong> Primary <Code>#FF6B1A</Code>, Sidebar <Code>#2D1470</Code> e Accent <Code>#9B5FFF</Code> são idênticos entre plataformas. Não existe primary verde — o verde é reservado exclusivamente para status de sucesso/pagamento.
        </InfoNote>
      </div>

      {/* Bottom Tab Bar */}
      <SubLabel>Bottom Tab Bar</SubLabel>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 bg-[#1E0B4B] rounded-2xl p-4 overflow-hidden">
          <div className="flex items-end justify-around border-t border-white/10 pt-3">
            {TABS.map(({ Icon, label, active }) => (
              <div key={label} className="flex flex-col items-center gap-1 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-[#FF6B1A]/15' : ''}`}>
                  <Icon className={`w-5 h-5 ${active ? 'text-[#FF6B1A]' : 'text-white/40'}`} />
                </div>
                <span className={`text-[9px] font-semibold text-center whitespace-nowrap ${active ? 'text-[#FF6B1A]' : 'text-white/40'}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-card border border-border rounded-2xl p-5 flex flex-col justify-center">
          <SubLabel>Abas — ícones (Lucide RN)</SubLabel>
          <div className="space-y-1.5 text-[11px] font-mono mt-1">
            {[
              ['Início', 'House'],
              ['Financeiro', 'DollarSign'],
              ['Check-in', 'CheckSquare (FAB)'],
              ['Tarefas', 'List'],
              ['Suporte', 'HelpCircle'],
            ].map(([tab, icon]) => (
              <div key={tab} className="flex items-center gap-2">
                <span className="text-primary bg-primary/5 px-2 py-0.5 rounded w-24 text-center">{tab}</span>
                <span className="text-muted-foreground">{icon}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Bar / Header */}
      <SubLabel>Top Bar — Header</SubLabel>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 bg-[#2D1470] rounded-2xl p-4">
          <div className="flex items-center justify-between px-1">
            <ToviaLogo variant="mobile" className="h-6 w-auto text-white" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-white/70" />
              </div>
              <div className="w-8 h-8 rounded-full bg-[#FF6B1A] flex items-center justify-center">
                <span className="text-white text-xs font-bold">OR</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-card border border-border rounded-2xl p-5 flex flex-col justify-center">
          <SubLabel>Elementos</SubLabel>
          <ul className="text-xs text-muted-foreground space-y-1 mt-1">
            <li><span className="text-foreground font-semibold">Esquerda:</span> Logo toviamobile (fundo sidebar)</li>
            <li><span className="text-foreground font-semibold">Direita:</span> Ícone de notificação + avatar circular com iniciais</li>
            <li><span className="text-foreground font-semibold">Tap no avatar:</span> Abre bottom sheet com perfil e plano</li>
          </ul>
        </div>
      </div>

      {/* Tokens compartilhados */}
      <SubLabel>Tokens Compartilhados — Web &amp; Mobile</SubLabel>
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] font-mono">
          {SHARED_TOKENS.map(([label, hex, token]) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-md shrink-0 border border-border" style={{ background: hex }} />
              <span className="text-foreground w-24">{label}</span>
              <span className="text-muted-foreground">{token}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
