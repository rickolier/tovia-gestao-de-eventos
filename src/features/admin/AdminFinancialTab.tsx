import React, { useEffect, useState, useMemo } from 'react';
import { collectionGroup, getDocs, limit } from 'firebase/firestore';
import { db } from '~/services/firebase';
import { listDocuments } from '~/services/firestore';
import { UserProfile, Evento, Inscricao } from '~/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign, TrendingUp, Users, Percent, CalendarDays,
  TicketCheck, AlertTriangle, RefreshCw, Trophy,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

const PLAN_PRICES: Record<string, number> = { chinam: 0, petach: 49, koach: 129, chalem: 299, start: 0, essencial: 49, pro: 129, personalizado: 299 };
const PLAN_LABELS: Record<string, string> = { chinam: 'Plano 1 - Chinám', petach: 'Plano 2 - Pétach', koach: 'Plano 3 - Koách', chalem: 'Plano 4 - Chalém', start: 'Plano 1 - Chinám', essencial: 'Plano 2 - Pétach', pro: 'Plano 3 - Koách', personalizado: 'Plano 4 - Chalém' };
const PLAN_COLORS_HEX: Record<string, string> = { chinam: '#9ca3af', petach: '#3b82f6', koach: '#7c3aed', chalem: '#16a34a', start: '#9ca3af', essencial: '#3b82f6', pro: '#7c3aed' };

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtShort(v: number) {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return fmt(v);
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function periodLabel(p: '7d' | '30d' | '90d') {
  return { '7d': 'últimos 7 dias', '30d': 'últimos 30 dias', '90d': 'últimos 90 dias' }[p];
}

// Build weekly buckets for a period
function buildWeekBuckets(days: number, items: string[]): { label: string; count: number }[] {
  const now = new Date();
  const buckets: { start: Date; end: Date; label: string }[] = [];
  const weeks = Math.ceil(days / 7);
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    buckets.push({
      start,
      end,
      label: `${start.getDate()}/${start.getMonth() + 1}`,
    });
  }
  return buckets.map(b => ({
    label: b.label,
    count: items.filter(d => {
      const date = new Date(d);
      return date >= b.start && date < b.end;
    }).length,
  }));
}

type Period = '7d' | '30d' | '90d';

export default function AdminFinancialTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, eventosData] = await Promise.all([
        listDocuments<UserProfile>('users', [limit(200)]),
        listDocuments<Evento>('eventos', [limit(500)]),
      ]);

      // Collection group query for inscricoes across all events
      const inscSnap = await getDocs(collectionGroup(db, 'inscricoes'));
      const inscData = inscSnap.docs.map(d => ({ id: d.id, ...d.data() } as Inscricao));

      setUsers(usersData.filter(u => !u.isDemo));
      setEventos(eventosData);
      setInscricoes(inscData);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Derived metrics ─────────────────────────────────────────────────────────

  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const cutoff = daysAgo(periodDays);

  const activeUsers = useMemo(() => users.filter(u => !u.desativado), [users]);
  const deactivated = useMemo(() => users.filter(u => u.desativado), [users]);
  const pendingCheckout = useMemo(() => users.filter(u => u.planoPendente && !u.desativado), [users]);

  const planStats = useMemo(() => (['chinam', 'petach', 'koach', 'chalem'] as const).map(plan => {
    const count = activeUsers.filter(u => u.plano === plan).length;
    return { plan, count, revenue: count * PLAN_PRICES[plan] };
  }), [activeUsers]);

  const mrr = useMemo(() => planStats.reduce((s, p) => s + p.revenue, 0), [planStats]);
  const arr = mrr * 12;
  const payingUsers = useMemo(() => planStats.reduce((s, p) => s + p.count, 0), [planStats]);
  const upgradedUsers = useMemo(() => planStats.filter(p => p.plan !== 'chinam').reduce((s, p) => s + p.count, 0), [planStats]);
  const conversionRate = payingUsers > 0 ? ((upgradedUsers / payingUsers) * 100).toFixed(1) : '0';

  // Events in period (by data_inicio as proxy)
  const eventosInPeriod = useMemo(
    () => eventos.filter(e => new Date(e.data_inicio) >= cutoff),
    [eventos, cutoff]
  );
  const activeEventos = useMemo(() => eventos.filter(e => e.ativo), [eventos]);

  // Inscriptions in period
  const inscricoesInPeriod = useMemo(
    () => inscricoes.filter(i => i.data_inscricao && new Date(i.data_inscricao) >= cutoff),
    [inscricoes, cutoff]
  );
  const paidInPeriod = useMemo(
    () => inscricoesInPeriod.filter(i => i.status === 'pago'),
    [inscricoesInPeriod]
  );

  // Weekly chart data for inscricoes
  const inscricoesChartData = useMemo(() => {
    const dates = inscricoesInPeriod.map(i => i.data_inscricao!);
    return buildWeekBuckets(periodDays, dates);
  }, [inscricoesInPeriod, periodDays]);

  // Top 10 organizers by events + inscriptions
  const top10 = useMemo(() => {
    const byUser: Record<string, { user: UserProfile; eventCount: number; inscricaoCount: number }> = {};
    eventos.forEach(e => {
      const uid = e.criado_por;
      if (!uid) return;
      if (!byUser[uid]) {
        const u = activeUsers.find(u => u.uid === uid);
        if (!u) return;
        byUser[uid] = { user: u, eventCount: 0, inscricaoCount: 0 };
      }
      byUser[uid].eventCount += 1;
    });
    inscricoes.forEach(i => {
      const eventoId = (i as any).eventoId;
      if (!eventoId) return;
      const evento = eventos.find(e => e.id === eventoId);
      if (!evento) return;
      const uid = evento.criado_por;
      if (byUser[uid]) byUser[uid].inscricaoCount += 1;
    });
    return Object.values(byUser)
      .sort((a, b) => (b.eventCount * 3 + b.inscricaoCount) - (a.eventCount * 3 + a.inscricaoCount))
      .slice(0, 10);
  }, [eventos, inscricoes, activeUsers]);

  // Plan distribution for PieChart
  const pieData = planStats.map(p => ({
    name: PLAN_LABELS[p.plan],
    value: p.count,
    color: PLAN_COLORS_HEX[p.plan],
  })).filter(p => p.value > 0);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 rounded-3xl bg-muted animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[1,2].map(i => <div key={i} className="h-64 rounded-3xl bg-muted animate-pulse" />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="rounded-3xl bg-red-50 border border-red-100 p-8 text-center space-y-3">
      <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
      <p className="text-sm text-red-600 font-medium">{error}</p>
      <button onClick={load} className="text-xs text-red-500 underline">Tentar novamente</button>
    </div>
  );

  return (
    <div className="space-y-8">

      {/* Header com refresh + period toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground">Financeiro & Métricas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Visão geral da plataforma Tovia</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border overflow-hidden text-xs font-semibold">
            {(['7d', '30d', '90d'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 transition-colors',
                  period === p ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          {
            label: 'MRR',
            value: fmt(mrr),
            sub: 'Receita mensal recorrente',
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'ARR projetado',
            value: fmtShort(arr),
            sub: 'Projeção anual (MRR × 12)',
            icon: TrendingUp,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Assinantes pagos',
            value: payingUsers,
            sub: 'Start + Essencial + Pro ativos',
            icon: Users,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
          },
          {
            label: 'Conversão',
            value: `${conversionRate}%`,
            sub: 'Start → Essencial/Pro',
            icon: Percent,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
          },
          {
            label: `Inscrições (${period})`,
            value: inscricoesInPeriod.length,
            sub: `${paidInPeriod.length} confirmadas`,
            icon: TicketCheck,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: `Eventos (${period})`,
            value: eventosInPeriod.length,
            sub: `${activeEventos.length} ativos no total`,
            icon: CalendarDays,
            color: 'text-sky-600',
            bg: 'bg-sky-50',
          },
        ].map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-none shadow-sm rounded-3xl bg-card">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">{card.label}</p>
                    <p className="text-2xl font-black text-foreground mt-1.5 leading-none">{card.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{card.sub}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${card.bg}`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Gráfico de inscrições + distribuição de planos ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Inscrições por semana */}
        <Card className="border-none shadow-sm rounded-3xl bg-card lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground">
              Inscrições — {periodLabel(period)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {inscricoesChartData.every(d => d.count === 0) ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                Nenhuma inscrição no período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={inscricoesChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inscGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
                    formatter={(v: number) => [v, 'Inscrições']}
                  />
                  <Area type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} fill="url(#inscGradient)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de planos */}
        <Card className="border-none shadow-sm rounded-3xl bg-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground">Distribuição de planos</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {pieData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
                      formatter={(v: number, name: string) => [v, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-1">
                  {planStats.map(({ plan, count }) => (
                    <div key={plan} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLAN_COLORS_HEX[plan] }} />
                        <span className="text-foreground font-medium">{PLAN_LABELS[plan]}</span>
                      </div>
                      <span className="font-bold text-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Receita por plano (tabela) ─────────────────────────────────────────── */}
      <Card className="border-none shadow-sm rounded-3xl bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-foreground">Receita por plano</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="space-y-3">
            {planStats.map(({ plan, count, revenue }) => {
              const pct = mrr > 0 ? (revenue / mrr) * 100 : 0;
              return (
                <div key={plan} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{PLAN_LABELS[plan]} · {count} usuários</span>
                    <span className="font-bold text-foreground">{fmt(revenue)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: PLAN_COLORS_HEX[plan] }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right">
                    {mrr > 0 ? `${pct.toFixed(1)}% do MRR` : '—'}
                  </p>
                </div>
              );
            })}
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-sm font-black text-foreground">MRR Total</span>
              <span className="text-lg font-black text-emerald-600">{fmt(mrr)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Top 10 perfis mais ativos ──────────────────────────────────────────── */}
      <Card className="border-none shadow-sm rounded-3xl bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <CardTitle className="text-sm font-bold text-foreground">Top 10 perfis mais ativos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-4">
          {top10.length === 0 ? (
            <p className="px-6 text-sm text-muted-foreground">Nenhum dado disponível.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">#</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Organizador</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Plano</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Eventos</th>
                    <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Inscrições</th>
                  </tr>
                </thead>
                <tbody>
                  {top10.map(({ user: u, eventCount, inscricaoCount }, i) => (
                    <tr key={u.uid} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3">
                        <span className={cn(
                          'text-xs font-black w-6 h-6 flex items-center justify-center rounded-full',
                          i === 0 ? 'bg-amber-100 text-amber-600' :
                          i === 1 ? 'bg-gray-100 text-gray-600' :
                          i === 2 ? 'bg-orange-100 text-orange-600' :
                          'text-muted-foreground'
                        )}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground text-xs">{u.nome || '—'}</p>
                        <p className="text-[10px] text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full',
                          (u.plano === 'chalem') ? 'bg-primary/10 text-primary' :
                          (u.plano === 'koach' || u.plano === 'pro') ? 'bg-violet-100 text-violet-700' :
                          (u.plano === 'petach' || u.plano === 'essencial') ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        )}>
                          {u.plano ? PLAN_LABELS[u.plano] : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground text-xs">{eventCount}</td>
                      <td className="px-6 py-3 text-right font-bold text-foreground text-xs">{inscricaoCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Alertas operacionais ───────────────────────────────────────────────── */}
      {(pendingCheckout.length > 0 || deactivated.length > 0) && (
        <Card className="border-none shadow-sm rounded-3xl bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <CardTitle className="text-sm font-bold text-foreground">Alertas operacionais</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pendingCheckout.length > 0 && (
              <div className="rounded-2xl bg-yellow-50 border border-yellow-100 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-700">Checkout abandonado</p>
                <p className="text-2xl font-black text-yellow-700 mt-1">{pendingCheckout.length}</p>
                <p className="text-xs text-yellow-600 mt-0.5">
                  {pendingCheckout.map(u => u.nome || u.email).join(', ')}
                </p>
              </div>
            )}
            {deactivated.length > 0 && (
              <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-widest text-red-600">Contas desativadas</p>
                <p className="text-2xl font-black text-red-600 mt-1">{deactivated.length}</p>
                <p className="text-xs text-red-500 mt-0.5">
                  {deactivated.map(u => u.nome || u.email).join(', ')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Nota sobre dados */}
      <p className="text-[11px] text-muted-foreground text-center pb-2">
        Valores de MRR calculados com base nos planos registrados no Firestore · Inscrições e eventos em tempo real
      </p>
    </div>
  );
}
