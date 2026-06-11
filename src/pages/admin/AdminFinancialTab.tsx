import React, { useEffect, useState } from 'react';
import { listDocuments } from '../../lib/firebase-utils';
import { UserProfile } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, Percent } from 'lucide-react';

const PLAN_PRICES: Record<string, number> = { start: 0, essencial: 39.90, pro: 99.00 };
const PLAN_LABELS: Record<string, string> = { start: 'Start (Grátis)', essencial: 'Essencial', pro: 'Pro' };
const PLAN_COLORS: Record<string, string> = {
  start: 'bg-gray-100 text-gray-600',
  essencial: 'bg-blue-100 text-blue-700',
  pro: 'bg-primary/10 text-primary',
};

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AdminFinancialTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDocuments<UserProfile>('users').then(data => {
      setUsers(data.filter(u => !u.isDemo));
      setLoading(false);
    });
  }, []);

  const planStats = (['start', 'essencial', 'pro'] as const).map(plan => {
    const count = users.filter(u => u.plano === plan && !u.planoPendente).length;
    const revenue = count * PLAN_PRICES[plan];
    return { plan, count, revenue };
  });

  const totalUsers = users.filter(u => !u.planoPendente).length;
  const mrr = planStats.reduce((s, p) => s + p.revenue, 0);
  const arr = mrr * 12;
  const payingUsers = planStats.filter(p => p.plan !== 'start').reduce((s, p) => s + p.count, 0);
  const conversionRate = totalUsers > 0 ? ((payingUsers / totalUsers) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-3xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { label: 'MRR', value: fmt(mrr), sub: 'Receita mensal recorrente', icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'ARR', value: fmt(arr), sub: 'Projeção anual', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Assinantes pagos', value: payingUsers, sub: 'Essencial + Pro', icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Taxa de conversão', value: `${conversionRate}%`, sub: 'Free → Pago', icon: Percent, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-none shadow-sm rounded-3xl bg-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-black text-foreground mt-2">{card.value}</p>
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

      {/* Receita por plano */}
      <Card className="border-none shadow-sm rounded-3xl bg-card">
        <CardHeader>
          <CardTitle className="text-base font-bold text-foreground">Receita por Plano</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Plano</th>
                  <th className="text-right py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Preço/mês</th>
                  <th className="text-right py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Assinantes</th>
                  <th className="text-right py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Receita/mês</th>
                  <th className="text-right py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">% do MRR</th>
                </tr>
              </thead>
              <tbody>
                {planStats.map(({ plan, count, revenue }) => (
                  <tr key={plan} className="border-b border-border/50">
                    <td className="py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${PLAN_COLORS[plan]}`}>
                        {PLAN_LABELS[plan]}
                      </span>
                    </td>
                    <td className="text-right py-4 font-semibold text-foreground">
                      {PLAN_PRICES[plan] === 0 ? 'Grátis' : fmt(PLAN_PRICES[plan])}
                    </td>
                    <td className="text-right py-4 font-semibold text-foreground">{count}</td>
                    <td className="text-right py-4 font-bold text-foreground">{fmt(revenue)}</td>
                    <td className="text-right py-4 text-muted-foreground">
                      {mrr > 0 ? ((revenue / mrr) * 100).toFixed(1) + '%' : '—'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/30">
                  <td colSpan={3} className="py-4 px-2 font-black text-foreground text-sm">Total MRR</td>
                  <td className="text-right py-4 font-black text-primary text-base">{fmt(mrr)}</td>
                  <td className="text-right py-4 font-bold text-muted-foreground">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Aviso sandbox */}
      <div className="rounded-2xl bg-yellow-50 border border-yellow-200 px-5 py-4 text-sm text-yellow-800">
        <strong>Modo sandbox:</strong> Os valores acima são calculados com base nos planos salvos no Firestore. Em produção, os valores serão confirmados diretamente pelo Asaas.
      </div>
    </div>
  );
}
