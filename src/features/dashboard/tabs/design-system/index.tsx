import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToviaLogo } from '../../../../components/ToviaLogo';
import { LogoSection } from './sections/LogoSection';
import { CoresSection } from './sections/CoresSection';
import { TipografiaSection } from './sections/TipografiaSection';
import { TokensSection } from './sections/TokensSection';
import { EspacamentoSection } from './sections/EspacamentoSection';
import { BotoesSection } from './sections/BotoesSection';
import { CardsSection } from './sections/CardsSection';
import { GlassSection } from './sections/GlassSection';
import { BadgesSection } from './sections/BadgesSection';
import { InputsSection } from './sections/InputsSection';
import { FeedbackSection } from './sections/FeedbackSection';
import { IconesSection } from './sections/IconesSection';
import { SidebarSection } from './sections/SidebarSection';
import { PlanosSection } from './sections/PlanosSection';
import { MobileSection } from './sections/MobileSection';

export default function DesignSystemTab() {
  return (
    <div className="space-y-2">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-10 flex-wrap gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Design System</h1>
          <p className="text-sm text-muted-foreground mt-1">Identidade visual e biblioteca de componentes do Tovia — paleta v2 roxo + laranja + creme</p>
        </div>
        <Button onClick={() => window.print()} className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl">
          <Download className="w-4 h-4" /> Exportar PDF
        </Button>
      </div>

      {/* Print-only header */}
      <div className="hidden print:flex items-center justify-between mb-10 border-b-2 border-primary pb-6">
        <div>
          <ToviaLogo className="h-10 w-auto text-primary" />
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">Gestão de Eventos</div>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-foreground">Design System</p>
          <p className="text-xs text-muted-foreground">Identidade Visual & Componentes</p>
        </div>
      </div>

      {/* Fundação */}
      <LogoSection />
      <CoresSection />
      <TipografiaSection />
      <TokensSection />
      <EspacamentoSection />

      {/* Componentes */}
      <BotoesSection />
      <CardsSection />
      <GlassSection />
      <BadgesSection />
      <InputsSection />
      <FeedbackSection />
      <IconesSection />
      <SidebarSection />

      {/* Produto */}
      <PlanosSection />
      <MobileSection />

      {/* Footer */}
      <div className="border-t border-border pt-8 text-center print:pt-6">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Tovia Design System</strong> · versão 2.0 · {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">Uso interno — Gestão de Eventos para igrejas, conferências e ministérios</p>
      </div>
    </div>
  );
}
