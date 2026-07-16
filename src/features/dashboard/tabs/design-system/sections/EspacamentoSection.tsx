import { Section, SubLabel } from '../shared';

const RADII = [
  { label: 'sm', cls: 'rounded-sm', px: '2px' },
  { label: 'md', cls: 'rounded-md', px: '6px' },
  { label: 'lg / default', cls: 'rounded-lg', px: '12px' },
  { label: 'xl', cls: 'rounded-xl', px: '16px' },
  { label: '2xl', cls: 'rounded-2xl', px: '24px' },
  { label: 'full', cls: 'rounded-full', px: '9999px' },
];

const SHADOWS = [
  { label: 'flat', cls: 'shadow-sm', desc: '0 1px 3px' },
  { label: 'raised', cls: 'shadow-md', desc: '0 4px 16px' },
  { label: 'floating', cls: 'shadow-lg', desc: '0 8px 32px' },
];

export function EspacamentoSection() {
  return (
    <Section title="05. Raios & Sombras" subtitle="Radius base 12px · sombras levemente tingidas de roxo — não puro cinza/preto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <SubLabel>Border Radius</SubLabel>
          <div className="flex flex-wrap gap-4 items-end mt-2">
            {RADII.map(({ label, cls, px }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 bg-primary/20 border-2 border-primary/40 ${cls}`} />
                <p className="text-[9px] font-bold text-muted-foreground text-center">{label}<br /><span className="font-mono text-[9px]">{px}</span></p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <SubLabel>Sombras — 3 níveis de elevação</SubLabel>
          <div className="flex flex-wrap gap-6 items-end mt-2">
            {SHADOWS.map(({ label, cls, desc }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className={`w-14 h-14 bg-card border border-border rounded-xl ${cls}`} />
                <p className="text-[9px] font-bold text-muted-foreground font-mono text-center">{label}<br /><span className="font-normal">{desc}</span></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
