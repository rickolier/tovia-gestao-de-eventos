import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '~/context/AuthContext';
import { PlanLevel } from '~/types';
import { PLAN_CONFIGS, PLAN_ORDER } from '~/utils/plan-limits';
import Logo from '~/components/Logo';
import { Button } from '@/components/ui/button';
import { Check, TicketIcon, DollarSign, Wallet, ArrowRight, Loader2, CreditCard, QrCode } from 'lucide-react';
import { toast } from 'sonner';
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
  const [saving, setSaving] = useState(false);
  const handleConfirm = async () => {
    if (!selected || !user || selected === 'chinam') return;
    setSaving(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/createCheckout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          planLevel: selected,
          period,
          paymentMethod: period === 'monthly' ? 'credit_card' : paymentMethod,
          userId: user.uid,
          userName: profile?.nome || user.displayName || '',
          userEmail: user.email || '',
          userCpfCnpj: profile?.cnpj || '',
          userPhone: profile?.telefone || '',
          userCep: profile?.cep || '',
          userEndereco: profile?.endereco || '',
          userNumero: profile?.numero || '',
          userComplemento: profile?.complemento || '',
          userBairro: profile?.bairro || '',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao processar.');
      if (data.paymentUrl) {
        toast.success('Redirecionando para o pagamento...');
        window.open(data.paymentUrl, '_blank');
        navigate('/planos/aguardando');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao processar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const displayPrice = (level: PlanLevel) =>
    period === 'monthly' ? PLAN_CONFIGS[level].price.monthlyLabel : PLAN_CONFIGS[level].price.annualMonthLabel;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--sidebar)] via-[var(--sidebar)] to-[hsl(var(--primary)/0.8)] flex flex-col items-center justify-start p-6 pt-12">
      <div className="w-full max-w-4xl">

        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <Logo variant="white" />
          <div className="text-center">
            <h1 className="text-3xl font-black text-white mt-4">
              Olá{profile?.nome ? `, ${profile.nome.split(' ')[0]}` : ''}! 👋
            </h1>
            <p className="text-white/70 mt-2">
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
                'px-5 py-2 rounded-xl text-sm font-bold transition-all',
                period === 'monthly' ? 'bg-white text-primary shadow' : 'text-white/70 hover:text-white',
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setPeriod('annual')}
              className={cn(
                'px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2',
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

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          {PLAN_ORDER.map((level) => {
            const config = PLAN_CONFIGS[level];
            const moduleCount = PLAN_CONFIGS[level].modulesCount;
            const isSelected = selected === level;

            return (
              <button
                key={level}
                onClick={() => setSelected(level)}
                className={cn(
                  'relative flex flex-col gap-5 p-7 rounded-3xl text-left transition-all duration-200 border-2',
                  isSelected
                    ? 'bg-white border-white shadow-2xl scale-[1.02]'
                    : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full',
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

                <div>
                  <h3 className={cn('text-xl font-black leading-tight', isSelected ? 'text-foreground' : 'text-white')}>
                    {config.label}
                  </h3>
                  <p className={cn('text-sm mt-1', isSelected ? 'text-muted-foreground' : 'text-white/60')}>
                    {config.description}
                  </p>
                </div>

                <div>
                  <span className={cn('text-2xl font-black', isSelected ? 'text-primary' : 'text-white')}>
                    {displayPrice(level)}
                  </span>
                  {period === 'annual' && level !== 'chinam' && (
                    <p className={cn('text-xs mt-1', isSelected ? 'text-muted-foreground' : 'text-white/50')}>
                      {PLAN_CONFIGS[level].price.annualTotalLabel} · 2 meses grátis
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {MODULE_LABELS.slice(0, moduleCount).map((mod, i) => {
                    const Icon = MODULE_ICONS[i];
                    return (
                      <div key={mod} className="flex items-start gap-3">
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', isSelected ? 'bg-primary/10' : 'bg-white/10')}>
                          <Icon className={cn('w-4 h-4', isSelected ? 'text-primary' : 'text-white')} />
                        </div>
                        <div>
                          <p className={cn('text-sm font-bold', isSelected ? 'text-foreground' : 'text-white')}>{mod}</p>
                          <p className={cn('text-xs', isSelected ? 'text-muted-foreground' : 'text-white/50')}>{MODULE_DESCRIPTIONS[i]}</p>
                        </div>
                      </div>
                    );
                  })}
                  {MODULE_LABELS.slice(moduleCount).map((mod, i) => (
                    <div key={mod} className="flex items-center gap-3 opacity-30">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        {React.createElement(MODULE_ICONS[moduleCount + i], { className: 'w-4 h-4 text-white' })}
                      </div>
                      <p className="text-sm text-white line-through">{mod}</p>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Annual payment method selector */}
        {period === 'annual' && selected !== 'personalizado' && (
          <div className="bg-white/10 rounded-2xl p-5 mb-6">
            <p className="text-white/70 text-sm font-semibold mb-3">Forma de pagamento para o plano anual:</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentMethod('credit_card')}
                className={cn(
                  'flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                  paymentMethod === 'credit_card' ? 'bg-white border-white' : 'border-white/20 hover:border-white/40',
                )}
              >
                <CreditCard className={cn('w-5 h-5 shrink-0', paymentMethod === 'credit_card' ? 'text-primary' : 'text-white')} />
                <div className="text-left">
                  <p className={cn('text-sm font-bold', paymentMethod === 'credit_card' ? 'text-foreground' : 'text-white')}>Cartão de crédito</p>
                  <p className={cn('text-xs', paymentMethod === 'credit_card' ? 'text-muted-foreground' : 'text-white/60')}>12x sem juros</p>
                </div>
              </button>
              <button
                onClick={() => setPaymentMethod('pix')}
                className={cn(
                  'flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                  paymentMethod === 'pix' ? 'bg-white border-white' : 'border-white/20 hover:border-white/40',
                )}
              >
                <QrCode className={cn('w-5 h-5 shrink-0', paymentMethod === 'pix' ? 'text-primary' : 'text-white')} />
                <div className="text-left">
                  <p className={cn('text-sm font-bold', paymentMethod === 'pix' ? 'text-foreground' : 'text-white')}>PIX</p>
                  <p className={cn('text-xs', paymentMethod === 'pix' ? 'text-muted-foreground' : 'text-white/60')}>À vista</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 pb-12">
          {selected === 'chinam' ? (
            <Button
              onClick={() => navigate('/dashboard')}
              className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest text-sm bg-white text-primary hover:bg-white/90 shadow-xl transition-all"
            >
              Começar grátis <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={saving}
              className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest text-sm bg-white text-primary hover:bg-white/90 disabled:opacity-40 shadow-xl transition-all"
            >
              {saving
                ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Aguarde...</>
                : <>Ir para o pagamento <ArrowRight className="w-5 h-5 ml-2" /></>}
            </Button>
          )}
          <p className="text-white/40 text-xs">Você pode alterar o plano a qualquer momento.</p>
        </div>
      </div>
    </div>
  );
}
