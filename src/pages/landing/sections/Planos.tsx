import { Check, Crown, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Chinám',
    sub: 'חינם · Gratuito',
    price: 'R$0',
    period: 'para sempre',
    desc: 'Comece a organizar sem custo.',
    highlight: false,
    features: [
      '2 eventos ativos',
      'Até 100 vagas por evento',
      'Todas as funcionalidades',
      'Página de inscrição pública',
      'Relatórios e check-in',
      '2.000 e-mails/mês',
      '1 comunicado por evento',
    ],
  },
  {
    name: 'Pétach',
    sub: 'פֶּתַח · R$119/mês',
    price: 'R$119',
    period: '/mês ou R$1.190/ano',
    desc: 'Para quem precisa receber pagamentos automaticamente.',
    highlight: true,
    features: [
      '5 eventos ativos',
      'Até 300 vagas por evento',
      'Pagamentos automáticos (BYOG)',
      'PIX, boleto, cartão e recorrente',
      '10 membros de equipe',
      '5.000 e-mails/mês',
      '5 comunicados por evento',
      'Crédito avulso R$199/evento',
    ],
  },
  {
    name: 'Chalém',
    sub: 'שָׁלֵם · R$299/mês',
    price: 'R$299',
    period: '/mês ou R$2.990/ano',
    desc: 'Para organizações com múltiplos eventos simultâneos.',
    highlight: false,
    features: [
      '15 eventos ativos',
      'Até 600 vagas por evento',
      'Pagamentos automáticos (BYOG)',
      'PIX, boleto, cartão e recorrente',
      '30 membros de equipe',
      '10.000 e-mails/mês',
      '15 comunicados por evento',
      'Crédito avulso R$199/evento',
    ],
  },
];

export function Planos() {
  return (
    <section id="planos" className="py-20 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Planos</span>
          <h2 className="text-4xl font-black text-foreground tracking-tight mt-3">
            Do gratuito ao completo
          </h2>
          <p className="text-muted-foreground mt-3 text-sm max-w-lg mx-auto">
            Três planos para acompanhar o crescimento do seu evento. Todas as funcionalidades liberadas — o que muda é o volume.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
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
                <div className="mt-3 flex items-baseline gap-1">
                  <span className={`text-3xl font-black ${plan.highlight ? 'text-white' : 'text-foreground'}`}>{plan.price}</span>
                  <span className={`text-xs ${plan.highlight ? 'text-white/60' : 'text-muted-foreground'}`}>{plan.period}</span>
                </div>
                <p className={`text-sm mt-2 ${plan.highlight ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {plan.desc}
                </p>
                <div className={`mt-3 h-px w-full ${plan.highlight ? 'bg-white/20' : 'bg-border'}`} />
              </div>

              <ul className={`flex-1 space-y-2.5 text-sm ${plan.highlight ? 'relative' : ''}`}>
                {plan.features.map((label, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-white/20' : 'bg-violet-50'}`}>
                      {label.includes('Crédito avulso') ? (
                        <Zap className={`w-3 h-3 ${plan.highlight ? 'text-white' : 'text-primary'}`} />
                      ) : (
                        <Check className={`w-3 h-3 ${plan.highlight ? 'text-white' : 'text-primary'}`} />
                      )}
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
