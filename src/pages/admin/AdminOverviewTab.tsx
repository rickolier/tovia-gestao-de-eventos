import React, { useEffect, useState } from 'react';
import { listDocuments } from '../../lib/firebase-utils';
import { UserProfile } from '../../types';
import { Users, CreditCard, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PLAN_PRICES: Record<string, number> = { start: 0, essencial: 39.90, pro: 99.00 };
const PLAN_LABELS: Record<string, string> = { start: 'Start', essencial: 'Essencial', pro: 'Pro' };
const PLAN_COLORS: Record<string, string> = {
  start: 'bg-gray-100 text-gray-600',
  essencial: 'bg-blue-100 text-blue-700',
  pro: 'bg-primary/10 text-primary',
};

export default function AdminOverviewTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDocuments<UserProfile>('users').then(data => {
      setUsers(data.filter(u => !u.isDemo));
      setLoading(false);
    });
  }, []);

  const totalUsers = users.length;
  const byPlan = { start: 0, essencial: 0, pro: 0, none: 0 };
  let mrr = 0;
  let pending = 0;

  users.forEach(u => {
    if (u.planoPendente) { pending++; return; }
    if (u.plano && byPlan[u.plano] !== undefined) {
      byPlan[u.plano as keyof typeof byPlan]++;
      mrr += PLAN_PRICES[u.plano] || 0;
    } else {
      byPlan.none++;
    }
  });

  const paying = byPlan.essencial + byPlan.pro;

  const statCards = [
    {
      label: 'Total de usuários',
      value: totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      sub: `${paying} assinantes pagos`,
    },
    {
      label: 'MRR estimado',
      value: mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10',
      sub: `${byPlan.essencial} Essencial · ${byPlan.pro} Pro`,
    },
    {
      label: 'Pagamentos pendentes',
      value: pending,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      sub: 'Aguardando confirmação',
    },
    {
      label: 'Plano Start (grátis)',
      value: byPlan.start,
      icon: CheckCircle2,
      color: 'text-gray-500',
      bg: 'bg-gray-100',
      sub: 'Potencial de conversão',
    },
  ];

  if (loading) return <LoadingCards />;

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-none shadow-sm rounded-3xl bg-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{card.label}</p>
                    <p className="text-3xl font-black text-foreground mt-2">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${card.bg}`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Distribuição por plano */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border-none shadow-sm rounded-3xl bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Distribuição por Plano
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-3">
            {(['pro', 'essencial', 'start'] as const).map(plan => {
              const count = byPlan[plan];
              const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PLAN_COLORS[plan]}`}>
                        {PLAN_LABELS[plan]}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{count} <span className="text-muted-foreground font-normal text-xs">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%`, opacity: plan === 'pro' ? 1 : plan === 'essencial' ? 0.6 : 0.3 }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" /> Status de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            {[
              { label: 'Ativos (pagos)', value: paying, color: 'text-green-600', dot: 'bg-green-500' },
              { label: 'Plano gratuito', value: byPlan.start, color: 'text-gray-500', dot: 'bg-gray-400' },
              { label: 'Pendente pagamento', value: pending, color: 'text-yellow-600', dot: 'bg-yellow-400' },
              { label: 'Sem plano', value: byPlan.none, color: 'text-red-500', dot: 'bg-red-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.dot}`} />
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-32 rounded-3xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}
