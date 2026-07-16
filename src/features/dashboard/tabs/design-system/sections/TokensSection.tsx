import { Section } from '../shared';

const TOKENS: Array<[token: string, light: string, dark: string, uso: string]> = [
  ['--background', '#F5F0E8', '#0C0720', 'Fundo da página'],
  ['--foreground', '#1E0B4B', '#F5F0E8', 'Texto principal'],
  ['--card', '#ffffff', '#160A38', 'Superfície de card'],
  ['--primary', '#FF6B1A', '#FF8C47', 'Cor de ação principal (laranja)'],
  ['--primary-dark', '#E55A08', '#E07035', 'Hover do botão primary'],
  ['--primary-light', '#FFF4EE', '#3D1506', 'Fundo de destaque laranja'],
  ['--accent', '#9B5FFF', '#B07FFF', 'Violeta — destaque secundário'],
  ['--accent-light', '#F0E8FF', '#1E0B4B', 'Fundo de destaque violeta'],
  ['--secondary', '#EDE8DE', '#1E1050', 'Fundo secundário / hover'],
  ['--muted-foreground', '#6b5fa0', '#A899CC', 'Texto secundário'],
  ['--border', '#E0D8CC', '#2A1660', 'Bordas e divisores'],
  ['--destructive', '#ef4444', '#7f1d1d', 'Erros, exclusão'],
  ['--sidebar', '#2D1470', '#1A0B40', 'Sidebar / superfícies escuras'],
  ['--ring', '#FF6B1A', '#FF8C47', 'Focus ring'],
];

function Dot({ hex }: { hex: string }) {
  return <span className="inline-block w-3 h-3 rounded-full border border-border align-middle mr-1.5" style={{ background: hex }} />;
}

export function TokensSection() {
  return (
    <Section title="04. Tokens CSS" subtitle="Variáveis definidas em src/index.css — coluna Dark mostra os valores para dark mode">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground px-4 py-3">Token</th>
                <th className="text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground px-4 py-3">Light</th>
                <th className="text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground px-4 py-3">Dark</th>
                <th className="text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground px-4 py-3">Uso</th>
              </tr>
            </thead>
            <tbody>
              {TOKENS.map(([token, light, dark, uso]) => (
                <tr key={token} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-2.5"><code className="text-primary bg-primary/5 px-1.5 py-0.5 rounded text-[11px]">{token}</code></td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground whitespace-nowrap"><Dot hex={light} />{light}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground whitespace-nowrap"><Dot hex={dark} />{dark}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{uso}</td>
                </tr>
              ))}
              <tr>
                <td className="px-4 py-2.5"><code className="text-primary bg-primary/5 px-1.5 py-0.5 rounded text-[11px]">--radius</code></td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground" colSpan={2}>0.75rem (12px)</td>
                <td className="px-4 py-2.5 text-muted-foreground">Raio base dos componentes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}
