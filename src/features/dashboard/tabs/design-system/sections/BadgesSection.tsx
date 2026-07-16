import { Section, SubLabel } from '../shared';

const STATUS = [
  { label: 'Ativo', cls: 'bg-emerald-100 text-emerald-700 border border-emerald-300' },
  { label: 'Inativo', cls: 'bg-muted text-muted-foreground border border-border' },
  { label: 'Bloqueado', cls: 'bg-red-50 text-red-600 border border-red-200' },
  { label: 'Pendente', cls: 'bg-amber-50 text-amber-600 border border-amber-200' },
  { label: 'Em andamento', cls: 'bg-blue-50 text-blue-600 border border-blue-200' },
  { label: 'Destaque', cls: 'bg-primary/10 text-primary border border-primary/20' },
  { label: 'Premium', cls: 'bg-accent/10 text-accent border border-accent/20' },
  { label: 'Novo', cls: 'bg-primary text-white' },
];

const PLANOS = [
  { label: 'Chinám', cls: 'bg-muted text-muted-foreground border border-border' },
  { label: 'Pétach', cls: 'bg-blue-50 text-blue-600 border border-blue-200' },
  { label: 'Koách', cls: 'bg-primary/10 text-primary border border-primary/20' },
  { label: 'Chalém', cls: 'bg-accent/10 text-accent border border-accent/20' },
];

export function BadgesSection() {
  return (
    <Section title="09. Badges & Status" subtitle="Pill shape (rounded-full) · 10–11px · bold — Koách usa laranja (plano principal), Chalém usa violeta (top)">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div>
          <SubLabel>Status Semânticos</SubLabel>
          <div className="flex flex-wrap gap-3 mt-2">
            {STATUS.map(({ label, cls }) => (
              <span key={label} className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
            ))}
          </div>
        </div>
        <div>
          <SubLabel>Planos</SubLabel>
          <div className="flex flex-wrap gap-3 mt-2">
            {PLANOS.map(({ label, cls }) => (
              <span key={label} className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
