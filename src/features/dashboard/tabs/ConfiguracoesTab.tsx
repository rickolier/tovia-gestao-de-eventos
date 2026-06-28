import React, { useState } from 'react';
import { useAuth } from '~/context/AuthContext';
import { getPlanConfig } from '~/utils/plan-limits';
import { cn } from '@/lib/utils';
import { CreditCard, Plug } from 'lucide-react';
import BillingTab from './BillingTab';
import GatewayTab from './GatewayTab';

export default function ConfiguracoesTab() {
  const { profile } = useAuth();
  const plan = getPlanConfig(profile?.plano);
  const [sub, setSub] = useState('faturamento');

  const tabs = [
    { id: 'faturamento', label: 'Faturamento', icon: CreditCard },
    ...(plan.modules.autoPayments ? [{ id: 'gateway', label: 'Gateway de Pagamentos', icon: Plug }] : []),
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-black tracking-tight text-foreground">Configurações</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie seu plano, faturamento e integrações de pagamento.</p>
      </div>

      <div className="border-b border-border flex gap-1 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors',
              sub === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'faturamento' && <BillingTab />}
      {sub === 'gateway' && <GatewayTab />}
    </div>
  );
}
