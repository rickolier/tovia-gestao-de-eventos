import { Section } from '../shared';

export function PlanosSection() {
  return (
    <Section title="14. Planos & Pricing" subtitle="Identidade visual dos planos Tovia">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Plano 1 - Chinám */}
        <div className="rounded-2xl border-2 border-border bg-muted/40 p-5 flex flex-col gap-2">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-border bg-muted text-muted-foreground self-start">Plano 1 - Chinám</span>
          <p className="text-2xl font-black text-foreground mt-1">Gratuito</p>
          <p className="text-xs text-muted-foreground">Gratuito e permanente. Comece a organizar seu primeiro evento sem custo.</p>
          <p className="text-[11px] text-muted-foreground/70 mt-auto pt-2 border-t border-border">1 evento · até 100 vagas · 1 ingresso</p>
        </div>

        {/* Plano 2 - Pétach */}
        <div className="rounded-2xl border-2 border-border bg-muted/40 p-5 flex flex-col gap-2">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-border bg-muted text-muted-foreground self-start">Plano 2 - Pétach</span>
          <p className="text-2xl font-black text-foreground mt-1">R$49<span className="text-sm font-semibold text-muted-foreground">/mês</span></p>
          <p className="text-xs text-muted-foreground">Inscrições + controle financeiro manual. A porta de entrada para eventos com cobrança.</p>
          <p className="text-[11px] text-muted-foreground/70 mt-auto pt-2 border-t border-border">3 eventos · até 200 vagas · 3 ingressos</p>
        </div>

        {/* Plano 3 - Koách */}
        <div className="rounded-2xl border-2 border-primary bg-primary p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 bg-white/15 text-white self-start">Plano 3 - Koách</span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white text-primary">Mais escolhido</span>
          </div>
          <p className="text-2xl font-black text-white mt-1">R$129<span className="text-sm font-semibold text-white/70">/mês</span></p>
          <p className="text-xs text-white/80">Gestão completa: recursos, grupos, tarefas e equipe.</p>
          <p className="text-[11px] text-white/60 mt-auto pt-2 border-t border-white/20">5 eventos · até 500 vagas · 5 membros</p>
        </div>

        {/* Plano 4 - Chalém */}
        <div className="rounded-2xl border-2 border-transparent bg-[#2D1470] p-5 flex flex-col gap-2">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 bg-white/10 text-white/80 self-start">Plano 4 - Chalém</span>
          <p className="text-2xl font-black text-white mt-1">R$299<span className="text-sm font-semibold text-white/70">/mês</span></p>
          <p className="text-xs text-white/60">Pagamentos automáticos via PIX, boleto e cartão. Inscritos ilimitados.</p>
          <p className="text-[11px] text-white/50 mt-auto pt-2 border-t border-white/10">10 eventos · inscritos ilimitados · 10 membros</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        <span className="font-semibold text-foreground">Cobrança anual (2 meses grátis):</span>{' '}
        Pétach R$40,83/mês · Koách R$107,50/mês · Chalém R$249,17/mês
      </p>
    </Section>
  );
}
