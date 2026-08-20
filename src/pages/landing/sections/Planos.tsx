import { Check, Crown } from 'lucide-react';

const plans = [
  {
    name: 'Chinám',
    sub: 'Plano 1 · חינם',
    desc: 'Gratuito e permanente. Comece a organizar sem custo.',
    highlight: false,
    features: [
      '1 evento ativo',
      'Até 100 vagas por evento',
      '1 Ingresso cadastrado',
      'Página de inscrição pública',
      'Relatórios básicos',
    ],
  },
  {
    name: 'Pétach',
    sub: 'Plano 2 · פֶּתַח',
    desc: 'A porta de entrada para eventos com cobrança.',
    highlight: false,
    features: [
      '3 eventos ativos',
      'Até 200 vagas por evento',
      '3 Ingressos cadastrados',
      'Financeiro manual',
      'Painel de Doações',
    ],
  },
  {
    name: 'Koách',
    sub: 'Plano 3 · כֹּחַ',
    desc: 'Gestão completa: recursos, grupos, tarefas e equipe.',
    highlight: false,
    features: [
      '5 eventos ativos',
      'Até 500 vagas por evento',
      '5 Ingressos cadastrados',
      '5 membros de equipe',
      'Grupos, quartos e mesas',
      'Tarefas e equipe integrada',
    ],
  },
  {
    name: 'Chalém',
    sub: 'Plano 4 · שָׁלֵם',
    desc: 'O plano completo: inscritos ilimitados e pagamentos automáticos via BYOG.',
    highlight: true,
    features: [
      '10 eventos ativos',
      'Inscritos ilimitados',
      '10 Ingressos cadastrados',
      '10 membros de equipe',
      'Pagamentos automáticos (BYOG)',
      'PIX, boleto, cartão e recorrente',
      'Tudo do Koách incluso',
    ],
  },
];

export function Planos() {
  return (
    <section id="planos" className="py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Planos</span>
          <h2 className="text-4xl font-black text-foreground tracking-tight mt-3">
            Do gratuito ao completo
          </h2>
          <p className="text-muted-foreground mt-3 text-sm max-w-lg mx-auto">
            Quatro planos para acompanhar o crescimento do seu evento. Comece grátis e evolua quando precisar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={
                plan.highlight
                  ? 'rounded-3xl bg-primary p-7 flex flex-col gap-5 shadow-xl shadow-primary/25 relative overflow-hidden'
                  : 'rounded-3xl border border-border bg-card p-7 flex flex-col gap-5'
              }
            >
              {plan.highlight && (
                <>
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
                  <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
                </>
              )}

              <div className={plan.highlight ? 'relative' : ''}>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-black tracking-tight ${plan.highlight ? 'text-white' : 'text-foreground'}`}>
                    {plan.name}
                  </p>
                  {plan.highlight && <Crown className="w-5 h-5 text-white/70" />}
                </div>
                <p className={`text-[10px] font-semibold uppercase tracking-widest mt-1 ${plan.highlight ? 'text-white/60' : 'text-muted-foreground'}`}>
                  {plan.sub}
                </p>
                <p className={`text-sm mt-2 ${plan.highlight ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {plan.desc}
                </p>
                <div className={`mt-3 h-px w-full ${plan.highlight ? 'bg-white/20' : 'bg-border'}`} />
              </div>

              <ul className={`flex-1 space-y-2.5 text-sm ${plan.highlight ? 'relative' : ''}`}>
                {plan.features.map((label, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-white/20' : 'bg-violet-50'}`}>
                      <Check className={`w-3 h-3 ${plan.highlight ? 'text-white' : 'text-primary'}`} />
                    </span>
                    <span className={plan.highlight ? 'text-white' : 'text-foreground'}>{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
