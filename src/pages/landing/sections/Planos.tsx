import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Planos() {
  const [billing, setBilling] = useState<'mensal' | 'anual'>('mensal');

  return (
    <section id="planos" className="py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Planos</span>
          <h2 className="text-4xl font-black text-foreground tracking-tight mt-3">
            Escolha o plano ideal<br />para o seu evento
          </h2>
          <p className="text-muted-foreground mt-3 text-sm">Do gratuito ao completo — escolha o plano certo para o seu evento.</p>
          <div className="inline-flex items-center gap-1 bg-muted rounded-2xl p-1 mt-6">
            <button
              onClick={() => setBilling('mensal')}
              className={cn('px-5 py-2 rounded-xl text-sm font-bold transition-all', billing === 'mensal' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >Mensal</button>
            <button
              onClick={() => setBilling('anual')}
              className={cn('px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2', billing === 'anual' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              Anual
              <span className="text-[10px] font-black bg-primary text-white px-2 py-0.5 rounded-full">2 meses grátis</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">

          {/* Chinám */}
          <div className="rounded-3xl border border-border bg-card p-7 flex flex-col gap-5">
            <div>
              <p className="text-3xl font-black text-foreground tracking-tight">Chinám</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">Plano 1 · חינם</p>
              <p className="text-sm text-muted-foreground mt-2">Gratuito e permanente. Comece a organizar sem custo.</p>
              <div className="mt-3 h-px bg-border w-full" />
            </div>
            <div className="rounded-2xl bg-muted px-5 py-4">
              <span className="text-3xl font-black text-foreground">Gratuito</span>
              <p className="text-xs text-muted-foreground mt-1">Para sempre</p>
            </div>
            <ul className="flex-1 space-y-2.5 text-sm">
              {['1 evento ativo', 'Até 100 vagas por evento', '1 Ingresso cadastrado', 'Página de inscrição pública', 'Relatórios básicos'].map((label, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-emerald-600" /></span>
                  <span className="text-foreground">{label}</span>
                </li>
              ))}
            </ul>
            <Link to="/desenvolvimento/login?cadastro=true" className="block text-center text-sm font-black uppercase tracking-widest py-3.5 rounded-2xl bg-muted hover:bg-muted/70 text-foreground transition-all">
              Começar grátis
            </Link>
          </div>

          {/* Pétach */}
          <div className="rounded-3xl border border-border bg-card p-7 flex flex-col gap-5">
            <div>
              <p className="text-3xl font-black text-foreground tracking-tight">Pétach</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">Plano 2 · פֶּתַח</p>
              <p className="text-sm text-muted-foreground mt-2">A porta de entrada para eventos com cobrança.</p>
              <div className="mt-3 h-px bg-border w-full" />
            </div>
            <div className="rounded-2xl bg-muted px-5 py-4">
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-foreground">{billing === 'mensal' ? 'R$49' : 'R$40,83'}</span>
                <span className="text-muted-foreground text-sm mb-0.5">/mês</span>
              </div>
              {billing === 'anual' && <p className="text-xs text-muted-foreground mt-1"><span className="line-through">R$588</span>{' → '}<span className="font-bold text-foreground">R$490/ano</span></p>}
            </div>
            <ul className="flex-1 space-y-2.5 text-sm">
              {['3 eventos ativos', 'Até 200 vagas por evento', '3 Ingressos cadastrados', 'Financeiro manual', 'Painel de Doações'].map((label, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-emerald-600" /></span>
                  <span className="text-foreground">{label}</span>
                </li>
              ))}
            </ul>
            <Link to="/desenvolvimento/login?cadastro=true" className="block text-center text-sm font-black uppercase tracking-widest py-3.5 rounded-2xl bg-muted hover:bg-muted/70 text-foreground transition-all">
              Assinar Pétach
            </Link>
          </div>

          {/* Koách */}
          <div className="rounded-3xl border-2 border-primary bg-card p-7 flex flex-col gap-5 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                <Star className="w-3 h-3 fill-white" /> Mais escolhido
              </span>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground tracking-tight">Koách</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">Plano 3 · כֹּחַ</p>
              <p className="text-sm text-muted-foreground mt-2">Gestão completa: recursos, grupos, tarefas e equipe.</p>
              <div className="mt-3 h-px bg-primary/20 w-full" />
            </div>
            <div className="rounded-2xl bg-primary/8 border border-primary/15 px-5 py-4">
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-primary">{billing === 'mensal' ? 'R$129' : 'R$107,50'}</span>
                <span className="text-muted-foreground text-sm mb-0.5">/mês</span>
              </div>
              {billing === 'anual' && <p className="text-xs text-muted-foreground mt-1"><span className="line-through">R$1.548</span>{' → '}<span className="font-bold text-primary">R$1.290/ano</span></p>}
            </div>
            <ul className="flex-1 space-y-1.5 text-sm">
              {(['5 eventos ativos', 'Até 500 vagas por evento', '5 membros de equipe'] as string[]).map((label, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-emerald-600" /></span>
                  <span className="text-foreground">{label}</span>
                </li>
              ))}
              {[
                { mod: 'Inscrições', items: ['5 Ingressos cadastrados', 'Múltiplas páginas de inscrição'] },
                { mod: 'Financeiro', items: ['Financeiro manual', 'Painel de Doações'] },
                { mod: 'Gestão', items: ['Grupos, quartos e mesas', 'Tarefas e equipe integrada'] },
              ].map(({ mod, items }) => (
                <li key={mod}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2 mb-1">{mod}</p>
                  <ul className="space-y-1">
                    {items.map(item => (
                      <li key={item} className="flex items-center gap-2.5 pl-1">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><Check className="w-2.5 h-2.5 text-emerald-600" /></span>
                        <span className="text-foreground text-xs">{item}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <Link to="/desenvolvimento/login?cadastro=true" className="block text-center text-sm font-black uppercase tracking-widest py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white transition-all shadow-md shadow-primary/20">
              Assinar Koách
            </Link>
          </div>

          {/* Chalém */}
          <div className="rounded-3xl bg-primary p-7 flex flex-col gap-5 shadow-2xl shadow-primary/30 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
            <div className="relative">
              <p className="text-3xl font-black text-white tracking-tight">Chalém</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60 mt-1">Plano 4 · שָׁלֵם</p>
              <p className="text-sm text-white/70 mt-2">Pagamentos automáticos. Inscritos ilimitados.</p>
              <div className="mt-3 h-px bg-white/20 w-full" />
            </div>
            <div className="relative rounded-2xl bg-white/15 border border-white/20 px-5 py-4">
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-white">{billing === 'mensal' ? 'R$299' : 'R$249,17'}</span>
                <span className="text-white/70 text-sm mb-0.5">/mês</span>
              </div>
              {billing === 'anual' && <p className="text-xs text-white/60 mt-1"><span className="line-through">R$3.588</span>{' → '}<span className="font-bold text-white">R$2.990/ano</span></p>}
            </div>
            <ul className="relative flex-1 space-y-1.5 text-sm">
              {(['10 eventos ativos', 'Inscritos ilimitados', '10 membros de equipe'] as string[]).map((label, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white" /></span>
                  <span className="text-white">{label}</span>
                </li>
              ))}
              {[
                { mod: 'Inscrições', items: ['10 Ingressos cadastrados', 'Múltiplas páginas de inscrição'] },
                { mod: 'Financeiro', items: ['PIX, Boleto e Cartão automáticos', 'BYOG — seu próprio gateway'] },
                { mod: 'Gestão', items: ['Grupos, quartos e mesas', 'Tarefas e equipe integrada'] },
              ].map(({ mod, items }) => (
                <li key={mod}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-2 mb-1">{mod}</p>
                  <ul className="space-y-1">
                    {items.map(item => (
                      <li key={item} className="flex items-center gap-2.5 pl-1">
                        <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Check className="w-2.5 h-2.5 text-white" /></span>
                        <span className="text-white text-xs">{item}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <Link to="/desenvolvimento/login?cadastro=true" className="relative block text-center text-sm font-black uppercase tracking-widest py-3.5 rounded-2xl bg-white text-primary hover:bg-white/90 transition-all shadow-lg">
              Assinar Chalém
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-[var(--sidebar)] px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <p className="text-lg font-black text-white">🏢 Precisa de algo além do Chalém?</p>
            <p className="text-sm text-white/70 mt-1.5 max-w-lg">
              Grandes conferências, múltiplas organizações, integrações específicas ou volume acima do padrão — se o Chalém não for suficiente para o seu contexto, a gente conversa e monta algo sob medida para você.
            </p>
          </div>
          <a href="mailto:suporte@toviaapp.com.br" className="shrink-0 bg-white hover:bg-white/90 text-primary text-sm font-black uppercase tracking-widest px-7 py-3.5 rounded-xl transition-all shadow-md whitespace-nowrap">
            Fale com a gente →
          </a>
        </div>
      </div>
    </section>
  );
}
