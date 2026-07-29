import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '~/context/AuthContext';
import { updateDocument } from '~/services/firestore';
import { PlanLevel } from '~/types';
import { PLAN_CONFIGS, PLAN_ORDER } from '~/utils/plan-limits';
import Logo from '~/components/Logo';
import { Button } from '@/components/ui/button';
import {
  TicketIcon, DollarSign, Wallet, ArrowRight,
  CreditCard, QrCode, Zap, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MODULE_ICONS = [TicketIcon, DollarSign, Wallet];
const MODULE_LABELS = ['Inscrições', 'Financeiro', 'Gestão do Evento'];
const MODULE_DESCRIPTIONS = [
  'Ingressos, páginas de venda e participantes',
  'Pagamentos, doações e configuração financeira',
  'Recursos, grupos e tarefas',
];

type Period = 'monthly' | 'annual';
type PaymentMethod = 'credit_card' | 'pix';

export default function Onboarding() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<PlanLevel>('koach');
  const [period, setPeriod] = useState<Period>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const handleConfirm = () => {
    if (!user) return;
    if (selected === 'chinam') {
      updateDocument('users', user.uid, { onboardingComplete: true }).catch(() => {});
      navigate('/dashboard');
      return;
    }
    navigate('/checkout-plano', {
      state: {
        planLevel: selected,
        period,
        paymentMethod: period === 'monthly' ? 'credit_card' : paymentMethod,
      },
    });
  };

  const displayPrice = (level: PlanLevel) =>
    period === 'monthly'
      ? PLAN_CONFIGS[level].price.monthlyLabel
      : PLAN_CONFIGS[level].price.annualMonthLabel;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sidebar via-sidebar to-primary/80 flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-7xl">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Logo variant="white" />
          <div className="text-center mt-2">
            <h1 className="text-3xl font-black text-white">
              Olá{profile?.nome ? `, ${profile.nome.split(' ')[0]}` : ''}! 👋
            </h1>
            <p className="text-white/70 mt-2 text-base">
              Antes de começar, escolha como você quer usar o Tovia.
            </p>
          </div>
        </div>

        {/* Period toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 rounded-2xl p-1 flex gap-1">
            <button
              onClick={() => setPeriod('monthly')}
              className={cn(
                'px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
                period === 'monthly' ? 'bg-white text-primary shadow' : 'text-white/70 hover:text-white',
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setPeriod('annual')}
              className={cn(
                'px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2',
                period === 'annual' ? 'bg-white text-primary shadow' : 'text-white/70 hover:text-white',
              )}
            >
              Anual
              <span className={cn(
                'text-[10px] font-black px-2 py-0.5 rounded-full',
                period === 'annual' ? 'bg-primary text-white' : 'bg-white/20 text-white',
              )}>
                2 meses grátis
              </span>
            </button>
          </div>
        </div>

        {/* Cards — always fully expanded */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {PLAN_ORDER.map((level) => {
            const config = PLAN_CONFIGS[level];
            const isSelected = selected === level;
            const moduleCount = config.modulesCount;

            return (
              <div
                key={level}
                onClick={() => setSelected(level)}
                className={cn(
                  'relative rounded-3xl border-2 cursor-pointer transition-all duration-200 overflow-hidden flex flex-col',
                  isSelected
                    ? 'bg-white border-white shadow-2xl scale-[1.02]'
                    : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/40',
                )}
              >
                {/* Chalém auto-payments banner */}
                {level === 'chalem' && (
                  <div className={cn(
                    'flex items-center gap-1.5 px-4 py-2 text-xs font-bold',
                    isSelected ? 'bg-primary text-white' : 'bg-white/20 text-white',
                  )}>
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    Único com pagamentos automáticos
                  </div>
                )}

                <div className="p-6 flex flex-col gap-5 flex-1">
                  {/* Plan badge + check */}
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full',
                      isSelected ? 'bg-primary text-white' : 'bg-white/20 text-white',
                    )}>
                      {config.name}
                    </span>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Plan name + description */}
                  <div>
                    <h3 className={cn('text-xl font-black leading-tight', isSelected ? 'text-foreground' : 'text-white')}>
                      {config.label}
                    </h3>
                    <p className={cn('text-sm mt-1.5 leading-relaxed', isSelected ? 'text-muted-foreground' : 'text-white/60')}>
                      {config.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div>
                    <span className={cn('text-2xl font-black', isSelected ? 'text-primary' : 'text-white')}>
                      {displayPrice(level)}
                    </span>
                    {period === 'annual' && level !== 'chinam' && (
                      <p className={cn('text-xs mt-0.5', isSelected ? 'text-muted-foreground' : 'text-white/50')}>
                        {config.price.annualTotalLabel} · 2 meses grátis
                      </p>
                    )}
                  </div>

                  {/* Modules */}
                  <div className="flex flex-col gap-3 flex-1">
                    {MODULE_LABELS.map((mod, i) => {
                      const Icon = MODULE_ICONS[i];
                      const active = i < moduleCount;
                      return (
                        <div key={mod} className={cn('flex items-start gap-3', !active && 'opacity-30')}>
                          <div className={cn(
                            'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                            active ? isSelected ? 'bg-primary/10' : 'bg-white/15' : 'bg-white/5',
                          )}>
                            <Icon className={cn('w-4 h-4', active ? isSelected ? 'text-primary' : 'text-white' : 'text-white/40')} />
                          </div>
                          <div>
                            <p className={cn(
                              'text-sm font-bold',
                              !active && 'line-through',
                              isSelected ? 'text-foreground' : 'text-white',
                            )}>
                              {mod}
                            </p>
                            <p className={cn('text-xs', isSelected ? 'text-muted-foreground' : 'text-white/50')}>
                              {MODULE_DESCRIPTIONS[i]}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Annual payment method — inside selected paid card */}
                  {period === 'annual' && level !== 'chinam' && isSelected && (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-semibold text-muted-foreground">Forma de pagamento:</p>
                      <div className="flex gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); setPaymentMethod('credit_card'); }}
                          className={cn(
                            'flex-1 flex items-center gap-2 p-3 rounded-xl border transition-all text-left',
                            paymentMethod === 'credit_card' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300',
                          )}
                        >
                          <CreditCard className={cn('w-4 h-4 shrink-0', paymentMethod === 'credit_card' ? 'text-primary' : 'text-muted-foreground')} />
                          <div>
                            <p className="text-xs font-bold text-foreground">Cartão</p>
                            <p className="text-[10px] text-muted-foreground">12x sem juros</p>
                          </div>
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setPaymentMethod('pix'); }}
                          className={cn(
                            'flex-1 flex items-center gap-2 p-3 rounded-xl border transition-all text-left',
                            paymentMethod === 'pix' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300',
                          )}
                        >
                          <QrCode className={cn('w-4 h-4 shrink-0', paymentMethod === 'pix' ? 'text-primary' : 'text-muted-foreground')} />
                          <div>
                            <p className="text-xs font-bold text-foreground">PIX</p>
                            <p className="text-[10px] text-muted-foreground">À vista</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 pb-10">
          <Button
            onClick={handleConfirm}
            className="h-14 px-14 rounded-2xl font-black uppercase tracking-widest text-sm bg-white text-primary hover:bg-white/90 shadow-xl transition-all"
          >
            {selected === 'chinam'
              ? <>Começar grátis <ArrowRight className="w-5 h-5 ml-2" /></>
              : <>Ir para o pagamento <ArrowRight className="w-5 h-5 ml-2" /></>}
          </Button>
          <p className="text-white/40 text-xs">Você pode alterar o plano a qualquer momento.</p>
        </div>

      </div>
    </div>
  );
}
