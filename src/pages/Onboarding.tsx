import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { updateDocument } from '../lib/firebase-utils';
import { PlanLevel } from '../types';
import { PLAN_CONFIGS } from '../lib/plan-limits';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Check, TicketIcon, DollarSign, Wallet, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MODULE_ICONS = [TicketIcon, DollarSign, Wallet];
const MODULE_LABELS = ['Inscrições', 'Financeiro', 'Gestão do Evento'];
const MODULE_DESCRIPTIONS = [
  'Ingressos, páginas de venda e participantes',
  'Pagamentos, doações e configuração financeira',
  'Recursos, grupos e tarefas',
];

const PLAN_ORDER: PlanLevel[] = ['start', 'essencial', 'pro'];
const PLAN_MODULES_COUNT: Record<PlanLevel, number> = { start: 1, essencial: 2, pro: 3 };

export default function Onboarding() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<PlanLevel | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected || !user) return;
    setSaving(true);
    try {
      await updateDocument('users', user.uid, { plano: selected });
      toast.success('Plano selecionado! Bem-vindo ao Ekko.');
      navigate('/dashboard');
    } catch {
      toast.error('Erro ao salvar o plano. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--sidebar)] via-[var(--sidebar)] to-[hsl(var(--primary)/0.8)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-12">
          <Logo variant="white" />
          <div className="text-center">
            <h1 className="text-3xl font-black text-white mt-4">
              Olá{profile?.nome ? `, ${profile.nome.split(' ')[0]}` : ''}! 👋
            </h1>
            <p className="text-white/70 mt-2 text-lg">
              Selecione o plano que melhor se encaixa na sua necessidade.
            </p>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {PLAN_ORDER.map((level) => {
            const config = PLAN_CONFIGS[level];
            const moduleCount = PLAN_MODULES_COUNT[level];
            const isSelected = selected === level;

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
                {/* Plan badge */}
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full',
                    isSelected ? 'bg-primary text-white' : 'bg-white/20 text-white'
                  )}>
                    {config.name}
                  </span>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Plan label */}
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

                {/* Modules list */}
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
                  {/* Locked modules */}
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

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <Button
            onClick={handleConfirm}
            disabled={!selected || saving}
            className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest text-sm bg-white text-primary hover:bg-white/90 disabled:opacity-40 shadow-xl transition-all"
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Salvando...</>
            ) : (
              <>Confirmar e entrar <ArrowRight className="w-5 h-5 ml-2" /></>
            )}
          </Button>
          <p className="text-white/40 text-xs">Você poderá alterar o plano depois nas configurações.</p>
        </div>
      </div>
    </div>
  );
}
