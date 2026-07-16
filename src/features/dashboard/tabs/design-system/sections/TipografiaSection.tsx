import { Section, SubLabel } from '../shared';

const HIERARCHY = [
  { label: 'Display / Hero', className: 'text-4xl font-black tracking-tight', sample: 'Organize seus eventos', spec: '36px · Black 900 · tracking-tight' },
  { label: 'H1 — Título de Página', className: 'text-3xl font-black tracking-tight', sample: 'Gestão de Eventos', spec: '30px · Black 900' },
  { label: 'H2 — Título de Seção', className: 'text-xl font-black', sample: 'Agenda de Eventos', spec: '20px · Black 900' },
  { label: 'H3 — Subtítulo', className: 'text-base font-semibold', sample: 'Próximos Eventos', spec: '16px · Semibold 600' },
  { label: 'Body — Texto Principal', className: 'text-sm font-normal', sample: 'O Tovia ajuda você a gerenciar inscrições, pagamentos e equipes em um só lugar.', spec: '14px · Regular 400' },
  { label: 'Small — Suporte', className: 'text-xs font-medium', sample: 'Última atualização há 2 minutos', spec: '12px · Medium 500' },
  { label: 'Caption / Label', className: 'text-[10px] font-bold uppercase tracking-widest', sample: 'TOTAL DE EVENTOS', spec: '10px · Bold 700 · uppercase' },
];

export function TipografiaSection() {
  return (
    <Section title="03. Tipografia" subtitle="Uma família tipográfica: Inter — usada em toda a interface (web e mobile)">
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6">
        <div className="pb-5 border-b border-border">
          <SubLabel>Família</SubLabel>
          <div className="flex flex-wrap items-baseline gap-6">
            <div>
              <p className="text-3xl font-normal text-foreground">Inter</p>
              <p className="text-xs text-muted-foreground mt-1">Única família — interface web e mobile · pesos 400 · 600 · 700 · 800 · 900</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            O logo manuscrito é um arquivo SVG (<code className="bg-muted px-1 rounded text-[11px]">logo-tovia-meow.svg</code>) — não uma fonte. Ver seção Logo &amp; Marca.
          </p>
        </div>

        <div>
          <SubLabel>Hierarquia</SubLabel>
          <div className="space-y-5 mt-2">
            {HIERARCHY.map(({ label, className, sample, spec }) => (
              <div key={label} className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                <div className="shrink-0 w-48">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{spec}</p>
                </div>
                <p className={`${className} text-foreground`}>{sample}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
