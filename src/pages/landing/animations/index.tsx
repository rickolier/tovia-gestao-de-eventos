import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function ToviaMockupHeader({ sub }: { sub: string }) {
  return (
    <div className="bg-primary px-3 py-2 flex items-center gap-2 shrink-0">
      <span className="font-logo font-bold text-white text-sm leading-none tracking-tight">tovia</span>
      <span className="text-white/40 text-[10px]">/</span>
      <span className="text-white/70 text-[10px] font-semibold">{sub}</span>
    </div>
  );
}

export function AnimConta() {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => setP(n => (n + 1) % 6), 850);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="w-44 bg-white rounded-t-2xl shadow-2xl overflow-hidden border border-white/20 flex flex-col">
      <ToviaMockupHeader sub="criar conta" />
      {p >= 5 ? (
        <div className="p-4 flex flex-col items-center gap-1.5 py-5">
          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-primary" />
          </div>
          <p className="text-[11px] font-black text-primary">Conta criada!</p>
          <p className="text-[9px] text-muted-foreground">Bem-vindo ao Tovia</p>
        </div>
      ) : (
        <div className="p-3 space-y-2">
          <div className={cn('h-7 rounded-lg border px-2.5 flex items-center text-[11px] transition-all duration-500',
            p >= 1 ? 'border-primary/30 bg-primary/5 text-foreground' : 'border-gray-200 text-gray-300 bg-gray-50'
          )}>
            {p >= 1 ? 'João Silva' : 'Seu nome'}
            {p === 1 && <span className="inline-block w-0.5 h-3 bg-primary ml-0.5" />}
          </div>
          <div className={cn('h-7 rounded-lg border px-2.5 flex items-center text-[11px] transition-all duration-500',
            p >= 3 ? 'border-primary/30 bg-primary/5 text-foreground' : 'border-gray-200 text-gray-300 bg-gray-50'
          )}>
            {p >= 3 ? 'joao@email.com' : 'E-mail'}
            {p === 3 && <span className="inline-block w-0.5 h-3 bg-primary ml-0.5" />}
          </div>
          <div className={cn('h-7 rounded-lg flex items-center justify-center text-[11px] font-black transition-all duration-300',
            p >= 4 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
          )}>
            Criar conta →
          </div>
        </div>
      )}
    </div>
  );
}

export function AnimEvento() {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => setP(n => (n + 1) % 5), 950);
    return () => clearInterval(id);
  }, []);
  const vagas = [0, 50, 120, 180, 200][p] ?? 0;
  return (
    <div className="w-44 bg-white rounded-t-2xl shadow-2xl overflow-hidden border border-white/20 flex flex-col">
      <ToviaMockupHeader sub="novo evento" />
      <div className="p-3 space-y-2">
        <div className={cn('h-7 rounded-lg border px-2.5 flex items-center text-[11px] transition-all duration-500',
          p >= 1 ? 'border-primary/30 bg-primary/5 text-foreground font-semibold' : 'border-gray-200 text-gray-300 bg-gray-50'
        )}>
          {p >= 1 ? 'Acampamento Jovem' : 'Nome do evento'}
          {p === 1 && <span className="inline-block w-0.5 h-3 bg-primary ml-0.5" />}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wide">Vagas</span>
          <span className="text-sm font-black text-primary transition-all">{vagas} / 200</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${(vagas / 200) * 100}%` }} />
        </div>
        <div className={cn('flex gap-1.5 transition-all duration-500', p >= 4 ? 'opacity-100' : 'opacity-0')}>
          <span className="text-[9px] bg-orange-50 text-primary font-bold px-2 py-0.5 rounded-md">Gratuito ✓</span>
          <span className="text-[9px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md">R$ 50</span>
        </div>
        <div className={cn('h-7 rounded-lg flex items-center justify-center text-[11px] font-black transition-all duration-300',
          p >= 3 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
        )}>
          Criar evento →
        </div>
      </div>
    </div>
  );
}

export function AnimCompartilhar() {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => setP(n => (n + 1) % 6), 900);
    return () => clearInterval(id);
  }, []);
  const avatarColors = ['bg-orange-100', 'bg-violet-200', 'bg-blue-200'];
  const avatarInits  = ['JO', 'AM', 'CE'];
  const vis = p >= 3 ? Math.min(p - 2, 3) : 0;
  return (
    <div className="w-44 bg-white rounded-t-2xl shadow-2xl overflow-hidden border border-white/20 flex flex-col">
      <ToviaMockupHeader sub="compartilhar" />
      <div className="p-3 space-y-2">
        <div className="h-7 rounded-lg bg-gray-50 border border-gray-200 px-2.5 flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-[9px] font-mono text-muted-foreground truncate">tovia.app/e/acampamento</span>
        </div>
        <div className={cn('h-7 rounded-lg flex items-center justify-center text-[11px] font-black transition-all duration-300',
          p >= 2 ? 'bg-orange-500 text-white' : 'bg-primary text-white'
        )}>
          {p >= 2 ? '✓ Copiado!' : 'Copiar link'}
        </div>
        <div className="h-8 flex items-center">
          {vis > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {avatarColors.slice(0, vis).map((cls, i) => (
                  <div key={i} className={cn('w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-gray-700', cls)}>
                    {avatarInits[i]}
                  </div>
                ))}
              </div>
              <span className="text-[9px] font-bold text-primary">+{vis} inscritos!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AnimDashboard() {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => setP(n => (n + 1) % 5), 800);
    return () => clearInterval(id);
  }, []);
  const counts  = [38, 72, 105, 127, 142];
  const amounts = [1200, 2640, 3800, 4020, 4320];
  const count  = counts[p] ?? 38;
  const amount = amounts[p] ?? 1200;
  return (
    <div className="w-52 bg-white rounded-t-2xl shadow-2xl overflow-hidden border border-white/20 flex">
      <div className="w-11 bg-sidebar flex flex-col items-center pt-2.5 gap-2.5 shrink-0">
        <span className="font-logo font-bold text-white text-[13px] leading-none">t</span>
        <div className="w-5 h-px bg-white/15 mt-1" />
        {[0, 1, 2].map(i => (
          <div key={i} className={cn('w-5 h-1 rounded-sm', i === 0 ? 'bg-white/60' : 'bg-white/20')} />
        ))}
      </div>
      <div className="flex-1 p-2.5 space-y-2">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Dashboard</p>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-gray-50 rounded-lg p-1.5">
            <p className="text-[8px] text-muted-foreground">Inscrições</p>
            <p className="text-lg font-black text-foreground leading-tight transition-all">{count}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-1.5">
            <p className="text-[8px] text-muted-foreground">Arrecadado</p>
            <p className="text-[11px] font-black text-primary leading-tight">
              R${amount >= 1000 ? (amount / 1000).toFixed(1) + 'k' : amount}
            </p>
          </div>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.round((count / 200) * 100)}%` }} />
        </div>
        <div className={cn('flex items-center gap-1 bg-orange-50 rounded-lg px-1.5 py-1 transition-all duration-500', p % 2 === 0 ? 'opacity-100' : 'opacity-30')}>
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
          <span className="text-[8px] text-primary font-semibold">Nova inscrição!</span>
        </div>
      </div>
    </div>
  );
}
