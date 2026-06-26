import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { updateDocument } from '../lib/firebase-utils';
import { PlanLevel } from '../types';
import { PLAN_CONFIGS } from '../lib/plan-limits';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, TicketIcon, DollarSign, Wallet, ArrowLeft, Loader2, CheckCircle2, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MODULE_ICONS = [TicketIcon, DollarSign, Wallet];
const MODULE_LABELS = ['Inscrições', 'Financeiro', 'Gestão do Evento'];
const MODULE_DESCRIPTIONS = [
  'Ingressos, páginas de venda e participantes',
  'Pagamentos, doações e configuração financeira',
  'Recursos, grupos e tarefas',
];

const PLAN_ORDER: PlanLevel[] = ['start', 'essencial', 'pro', 'personalizado'];
const PLAN_MODULES_COUNT: Record<PlanLevel, number> = { start: 1, essencial: 2, pro: 3, personalizado: 4 };
const PLAN_PRICES: Record<PlanLevel, string> = { start: 'Grátis', essencial: 'R$ 69/mês', pro: 'R$ 129/mês', personalizado: 'R$ 299/mês + 0,8%' };
const PLAN_RANK: Record<PlanLevel, number> = { start: 0, essencial: 1, pro: 2, personalizado: 3 };

export default function Plans() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<PlanLevel | null>(null);
  const [saving, setSaving] = useState(false);

  const currentPlan = profile?.plano;
  const activeSelection = selected ?? currentPlan ?? null;
  const [showDowngradeWarning, setShowDowngradeWarning] = useState(false);

  const executePlanChange = async () => {
    if (!selected || !user) return;
    setShowDowngradeWarning(false);
    setSaving(true);
    try {
      if (selected === 'start') {
        await updateDocument('users', user.uid, { plano: 'start', asaasSubscriptionId: null, planoPendente: null });
        toast.success('Plano Start ativado!');
        navigate('/dashboard');
        return;
      }
      const response = await fetch('/api/createCheckout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planLevel: selected,
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
      console.error(err);
      toast.error(err?.message || 'Erro ao processar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!selected || !user || selected === currentPlan) return;
    if (currentPlan && PLAN_RANK[selected] < PLAN_RANK[currentPlan]) {
      setShowDowngradeWarning(true);
      return;
    }
    await executePlanChange();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--sidebar)] via-[var(--sidebar)] to-[hsl(var(--primary)/0.8)] flex flex-col items-center justify-start p-6">
      <div className="w-full max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-10 pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <Logo variant="white" />
          <div className="w-16" />
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-black text-white tracking-tight">Escolha seu plano</h1>
          <p className="text-white/60 text-sm mt-2">
            Selecione os módulos que melhor se encaixam na sua necessidade.
            {currentPlan && (
              <span className="ml-1 text-white/40">
                (Plano atual: <span className="text-white/70 font-semibold">{PLAN_CONFIGS[currentPlan].name}</span>)
              </span>
            )}
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {PLAN_ORDER.map((level) => {
            const config = PLAN_CONFIGS[level];
            const moduleCount = PLAN_MODULES_COUNT[level];
            const isCurrent = level === currentPlan;
            const isSelected = level === activeSelection;

            return (
              <button
                key={level}
                onClick={() => setSelected(level)}
                className={cn(
                  'relative flex flex-col gap-5 p-7 rounded-3xl text-left transition-all duration-200 border-2',
                  isSelected
                    ? 'bg-white border-white shadow-2xl scale-[1.02]'
                    : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40'
                )}
              >
                {/* Badges */}
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full',
                    isSelected ? 'bg-primary text-white' : 'bg-white/20 text-white'
                  )}>
                    {config.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <span className={cn(
                        'text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full',
                        isSelected ? 'bg-primary/10 text-primary' : 'bg-white/20 text-white/70'
                      )}>
                        Atual
                      </span>
                    )}
                    {selected === level && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Label + description */}
                <div>
                  <h3 className={cn(
                    'text-xl font-black leading-tight',
                    isSelected ? 'text-foreground' : 'text-white'
                  )}>
                    {config.label}
                  </h3>
                  <p className={cn(
                    'text-sm mt-1',
                    isSelected ? 'text-muted-foreground' : 'text-white/60'
                  )}>
                    {config.description}
                  </p>
                </div>

                {/* Price */}
                <div>
                  <span className={cn(
                    'text-2xl font-black',
                    isSelected ? 'text-primary' : 'text-white'
                  )}>
                    {PLAN_PRICES[level]}
                  </span>
                </div>

                {/* Modules */}
                <div className="flex flex-col gap-3">
                  {MODULE_LABELS.slice(0, moduleCount).map((mod, i) => {
                    const Icon = MODULE_ICONS[i];
                    return (
                      <div key={mod} className="flex items-start gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                          isSelected ? 'bg-primary/10' : 'bg-white/10'
                        )}>
                          <Icon className={cn('w-4 h-4', isSelected ? 'text-primary' : 'text-white')} />
                        </div>
                        <div>
                          <p className={cn('text-sm font-bold', isSelected ? 'text-foreground' : 'text-white')}>
                            {mod}
                          </p>
                          <p className={cn('text-xs', isSelected ? 'text-muted-foreground' : 'text-white/50')}>
                            {MODULE_DESCRIPTIONS[i]}
                          </p>
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

        {/* Dialog de aviso de downgrade */}
        <Dialog open={showDowngradeWarning} onOpenChange={setShowDowngradeWarning}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-2">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <DialogTitle className="text-lg font-black text-foreground">Atenção: mudança de plano</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-1">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ao mudar para o plano <strong className="text-foreground">{selected ? PLAN_PRICES[selected].split('/')[0] : ''} ({selected && selected.charAt(0).toUpperCase() + selected.slice(1)})</strong>, você perderá acesso aos módulos que não fazem parte do novo plano.
              </p>
              <p className="text-sm text-muted-foreground">
                Seus dados e eventos já criados permanecem salvos.
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowDowngradeWarning(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-primary text-white font-bold"
                  onClick={executePlanChange}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar mudança'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 pb-10">
          <Button
            onClick={handleConfirm}
            disabled={!selected || selected === currentPlan || saving}
            className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest text-sm bg-white text-primary hover:bg-white/90 disabled:opacity-40 shadow-xl transition-all"
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Aguarde...</>
            ) : selected === currentPlan ? (
              <><CheckCircle2 className="w-5 h-5 mr-2" /> Plano atual</>
            ) : selected === 'start' ? (
              <>Ativar gratuitamente</>
            ) : (
              <><ExternalLink className="w-5 h-5 mr-2" /> Ir para o pagamento</>
            )}
          </Button>
          <p className="text-white/40 text-xs">Você pode alterar o plano a qualquer momento.</p>
        </div>
      </div>
    </div>
  );
}
