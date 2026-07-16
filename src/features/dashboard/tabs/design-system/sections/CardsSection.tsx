import { Calendar, Info } from 'lucide-react';
import { Section, Label } from '../shared';

export function CardsSection() {
  return (
    <Section title="07. Cards & Superfícies" subtitle="Três níveis de elevação — background var(--card) + border var(--border)">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground">card-flat</p>
            <p className="text-xs text-muted-foreground mt-1">Listas e tabelas.</p>
          </div>
          <Label>shadow-sm (flat)</Label>
        </div>
        <div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-md">
            <p className="text-sm font-semibold text-foreground">card-raised</p>
            <p className="text-xs text-muted-foreground mt-1">Painéis e conteúdo principal.</p>
          </div>
          <Label>shadow-md (raised)</Label>
        </div>
        <div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
            <p className="text-sm font-semibold text-foreground">card-floating</p>
            <p className="text-xs text-muted-foreground mt-1">Modais e popovers.</p>
          </div>
          <Label>shadow-lg (floating)</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat card */}
        <div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">24</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total de eventos</p>
            </div>
          </div>
          <Label>Stat Card</Label>
        </div>

        {/* Event card */}
        <div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="h-2 w-full bg-primary" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">#EV001</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Ativo</span>
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-3">Conferência de Líderes 2025</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>10 Set 2025</span>
              </div>
            </div>
          </div>
          <Label>Event Card</Label>
        </div>

        {/* Info card */}
        <div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Dica importante</p>
                <p className="text-xs text-muted-foreground mt-1">Complete seu perfil para liberar todos os recursos do plano.</p>
              </div>
            </div>
          </div>
          <Label>Info Card</Label>
        </div>
      </div>
    </Section>
  );
}
