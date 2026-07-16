import { Zap } from 'lucide-react';
import { Section, SubLabel } from '../shared';

/* Glassmorphism iOS: backdrop-filter blur(20px). Usar com moderação —
   hero, cards flutuantes, stat cards. */
export function GlassSection() {
  return (
    <Section title="08. Glass (efeito iOS)" subtitle="Glassmorphism com backdrop-blur — dois contextos: fundo claro (creme) e fundo escuro (roxo)">
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Zap className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Glass sobre fundo claro precisa de opacidade maior (≥15%) para ter contraste. Glass sobre fundo escuro funciona bem a partir de 6–8%.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sobre fundo creme */}
        <div>
          <SubLabel>Sobre Fundo Creme</SubLabel>
          <div className="bg-[#FFF4EE] rounded-2xl p-8 flex items-center justify-center">
            <div
              className="rounded-2xl p-5 min-w-[220px] backdrop-blur-xl border"
              style={{ background: 'rgba(255,107,26,0.06)', borderColor: 'rgba(255,107,26,0.2)' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1.5">Inscrições</p>
              <p className="text-3xl font-black text-foreground tracking-tight">142</p>
              <p className="text-[11px] font-bold text-primary mt-0.5">↑ +18 hoje</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono mt-2 text-center">rgba(255,107,26,.06) · blur(20px) · border rgba(255,107,26,.2)</p>
        </div>

        {/* Sobre fundo roxo */}
        <div>
          <SubLabel>Sobre Fundo Roxo (hero)</SubLabel>
          <div className="rounded-2xl p-8 flex items-center justify-center gap-4 flex-wrap" style={{ background: 'linear-gradient(135deg,#1E0B4B,#2D1470)' }}>
            <div
              className="rounded-2xl p-5 min-w-[160px] backdrop-blur-xl border"
              style={{ background: 'rgba(245,240,232,0.07)', borderColor: 'rgba(245,240,232,0.14)' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(196,184,232,0.75)' }}>Inscrições</p>
              <p className="text-3xl font-black tracking-tight text-[#F5F0E8]">142</p>
              <p className="text-[11px] font-bold text-primary mt-0.5">↑ +18 hoje</p>
            </div>
            <div
              className="rounded-2xl p-5 min-w-[160px] backdrop-blur-xl border"
              style={{ background: 'rgba(245,240,232,0.07)', borderColor: 'rgba(245,240,232,0.14)' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(196,184,232,0.75)' }}>Doações</p>
              <p className="text-3xl font-black tracking-tight text-[#F5F0E8]">R$4.320</p>
              <p className="text-[11px] font-bold text-accent mt-0.5">↑ mês atual</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono mt-2 text-center">rgba(245,240,232,.07) · blur(20px) · border rgba(245,240,232,.14)</p>
        </div>
      </div>
    </Section>
  );
}
