import React, { useEffect, useState } from 'react';
import { collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { listDocuments } from '../../lib/firebase-utils';
import { UserProfile } from '../../types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Wifi, WifiOff, CheckCircle2, Clock, XCircle, AlertTriangle,
  CreditCard, TrendingUp, RefreshCw, Building2, FlaskConical,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const GATEWAY_METHODS = ['pix', 'boleto', 'credito', 'recorrente'];
const METHOD_LABELS: Record<string, string> = {
  pix: 'PIX', boleto: 'Boleto', credito: 'Crédito', recorrente: 'Recorrente',
};
const METHOD_COLORS: Record<string, string> = {
  pix: '#16a34a', boleto: '#f59e0b', credito: '#3b82f6', recorrente: '#8b5cf6',
};

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface GatewayCharge {
  status: string;
  forma_pagamento?: string;
  formaPagamento?: string;
  gateway_charge_id?: string;
  gateway_subscription_id?: string;
  valor_total?: number;
  valor?: number;
  data_inscricao?: string;
  data?: string;
  isDonation: boolean;
}

interface OrgStat {
  uid: string;
  nome: string;
  email: string;
  instituicao?: string;
  sandbox: boolean;
  connected_at: string;
  chargeCount: number;
  paidCount: number;
  pendingCount: number;
  errorCount: number;
  totalValue: number;
}

export default function AdminGatewayTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [charges, setCharges] = useState<GatewayCharge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [allUsers, inscSnap, doacSnap] = await Promise.all([
        listDocuments<UserProfile>('users'),
        getDocs(collectionGroup(db, 'inscricoes')),
        getDocs(collectionGroup(db, 'doacoes')),
      ]);

      setUsers(allUsers.filter(u => !u.isDemo));

      const gatewayCharges: GatewayCharge[] = [];

      inscSnap.docs.forEach(doc => {
        const d = doc.data();
        const method = d.forma_pagamento || '';
        if (GATEWAY_METHODS.includes(method) || d.gateway_charge_id || d.gateway_subscription_id) {
          gatewayCharges.push({ ...d, isDonation: false } as GatewayCharge);
        }
      });

      doacSnap.docs.forEach(doc => {
        const d = doc.data();
        const method = d.formaPagamento || '';
        if (GATEWAY_METHODS.includes(method) || d.gateway_charge_id || d.gateway_subscription_id) {
          gatewayCharges.push({ ...d, isDonation: true } as GatewayCharge);
        }
      });

      setCharges(gatewayCharges);
      setLoading(false);
    }
    load();
  }, []);

  const connectedOrgs = users.filter(u => u.gateway_connected);
  const prodOrgs = connectedOrgs.filter(u => !u.gateway?.sandbox);
  const sandboxOrgs = connectedOrgs.filter(u => u.gateway?.sandbox);
  const lastConnected = connectedOrgs
    .map(u => u.gateway?.connected_at || '')
    .filter(Boolean)
    .sort()
    .at(-1);

  // Charge breakdown
  const paid = charges.filter(c => c.status === 'pago' || c.status === 'aprovada');
  const pending = charges.filter(c => c.status === 'pagamento_iniciado' || (c.isDonation && c.status === 'pendente' && (c.gateway_charge_id || c.gateway_subscription_id)));
  const canceled = charges.filter(c => c.status === 'cancelada');

  const successRate = charges.length > 0 ? Math.round((paid.length / charges.length) * 100) : 0;

  // Pendentes há mais de 24h = possível erro
  const now = Date.now();
  const stale = pending.filter(c => {
    const dateStr = c.data_inscricao || c.data || '';
    if (!dateStr) return false;
    return now - new Date(dateStr).getTime() > 24 * 60 * 60 * 1000;
  });

  // By method
  const byMethod = GATEWAY_METHODS.map(m => ({
    name: METHOD_LABELS[m],
    value: charges.filter(c => (c.forma_pagamento || c.formaPagamento) === m).length,
    color: METHOD_COLORS[m],
  })).filter(m => m.value > 0);

  // Total volume (paid)
  const totalVolume = paid.reduce((s, c) => s + (c.valor_total || c.valor || 0), 0);

  // Per-org stats
  const orgStats: OrgStat[] = connectedOrgs.map(u => {
    const orgCharges = charges; // sem filtro por org (não temos eventoId → userId aqui)
    return {
      uid: u.uid,
      nome: u.nome,
      email: u.email,
      instituicao: u.instituicao,
      sandbox: u.gateway?.sandbox ?? true,
      connected_at: u.gateway?.connected_at || '',
      chargeCount: orgCharges.length,
      paidCount: paid.length,
      pendingCount: pending.length,
      errorCount: stale.length,
      totalValue: totalVolume,
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm font-bold text-muted-foreground">Carregando dados do gateway...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight">Monitor de Gateway</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Volume de uso do Asaas BYOG, erros e status das cobranças no Tovia.
        </p>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Gateways ativos',
            value: connectedOrgs.length,
            sub: `${prodOrgs.length} produção · ${sandboxOrgs.length} sandbox`,
            icon: Wifi,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Total de cobranças',
            value: charges.length,
            sub: `${paid.length} pagas · ${pending.length} pendentes`,
            icon: CreditCard,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Volume pago',
            value: fmt(totalVolume),
            sub: `Taxa de sucesso ${successRate}%`,
            icon: TrendingUp,
            color: 'text-primary',
            bg: 'bg-primary/10',
          },
          {
            label: 'Erros / pendências',
            value: stale.length,
            sub: stale.length === 0 ? 'Nenhuma pendência crítica' : 'Abertas há mais de 24h',
            icon: stale.length > 0 ? AlertTriangle : CheckCircle2,
            color: stale.length > 0 ? 'text-red-500' : 'text-gray-400',
            bg: stale.length > 0 ? 'bg-red-50' : 'bg-gray-50',
          },
        ].map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border border-border shadow-sm rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                      {card.label}
                    </p>
                    <p className="text-2xl font-black text-foreground truncate">{card.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 font-medium">{card.sub}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.bg}`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status das cobranças */}
        <Card className="border border-border shadow-sm rounded-2xl">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black">Status das Cobranças</h3>
          </div>
          <CardContent className="p-5 space-y-3">
            {[
              { label: 'Pagas / Aprovadas', count: paid.length, icon: CheckCircle2, color: 'text-emerald-600', bar: 'bg-emerald-500' },
              { label: 'Pendentes (aguardando)', count: pending.length, icon: Clock, color: 'text-amber-600', bar: 'bg-amber-400' },
              { label: 'Canceladas / Recusadas', count: canceled.length, icon: XCircle, color: 'text-red-500', bar: 'bg-red-400' },
              { label: 'Com atraso > 24h', count: stale.length, icon: AlertTriangle, color: 'text-orange-500', bar: 'bg-orange-400' },
            ].map(row => {
              const Icon = row.icon;
              const pct = charges.length > 0 ? Math.round((row.count / charges.length) * 100) : 0;
              return (
                <div key={row.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${row.color}`} />
                      <span className="font-medium text-foreground">{row.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-foreground">{row.count}</span>
                      <span className="text-xs text-muted-foreground">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${row.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}

            {charges.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma cobrança via gateway registrada ainda.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Distribuição por método */}
        <Card className="border border-border shadow-sm rounded-2xl">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black">Volume por Método de Pagamento</h3>
          </div>
          <CardContent className="p-5">
            {byMethod.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={byMethod}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {byMethod.map(entry => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`${v} cobranças`, '']}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                  />
                  <Legend
                    formatter={(v) => <span className="text-xs font-bold text-foreground">{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <CreditCard className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Sem dados de método ainda.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Erros críticos */}
      {stale.length > 0 && (
        <Card className="border border-red-200 bg-red-50/50 shadow-sm rounded-2xl">
          <div className="px-5 py-4 border-b border-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-black text-red-700">
              Cobranças abertas há mais de 24h ({stale.length})
            </h3>
          </div>
          <CardContent className="p-5">
            <p className="text-xs text-red-600 mb-4 font-medium">
              Essas cobranças foram iniciadas mas ainda não foram confirmadas ou canceladas. Podem indicar
              falha de webhook, abandono do participante, ou erro na integração Asaas.
            </p>
            <div className="space-y-2">
              {stale.slice(0, 10).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-white rounded-xl px-4 py-3 border border-red-100">
                  <div className="flex items-center gap-3">
                    <Clock className="w-3.5 h-3.5 text-red-400" />
                    <span className="font-bold text-foreground">
                      {c.isDonation ? 'Doação' : 'Inscrição'}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-black px-2 rounded-full">
                      {METHOD_LABELS[c.forma_pagamento || c.formaPagamento || ''] || (c.forma_pagamento || c.formaPagamento || '—')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{fmt(c.valor_total || c.valor || 0)}</span>
                    <span>{fmtDate(c.data_inscricao || c.data || '')}</span>
                  </div>
                </div>
              ))}
              {stale.length > 10 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  + {stale.length - 10} pendências adicionais
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizadores com gateway */}
      <Card className="border border-border shadow-sm rounded-2xl">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black">Organizadores com Gateway Ativo</h3>
          </div>
          <Badge className="text-[10px] font-black px-3 rounded-full bg-primary/10 text-primary">
            {connectedOrgs.length} conectados
          </Badge>
        </div>
        <CardContent className="p-0">
          {connectedOrgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <WifiOff className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhum organizador com gateway conectado.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {connectedOrgs
                .sort((a, b) => (b.gateway?.connected_at || '').localeCompare(a.gateway?.connected_at || ''))
                .map(org => (
                  <div key={org.uid} className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-primary">
                          {(org.instituicao || org.nome || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-foreground truncate">
                          {org.instituicao || org.nome}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{org.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        className={`text-[10px] font-black px-3 rounded-full flex items-center gap-1 ${
                          org.gateway?.sandbox
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {org.gateway?.sandbox
                          ? <><FlaskConical className="w-3 h-3" /> Sandbox</>
                          : <><Wifi className="w-3 h-3" /> Produção</>}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground hidden sm:inline">
                        {org.gateway?.connected_at ? fmtDate(org.gateway.connected_at) : '—'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Último gateway conectado */}
      {lastConnected && (
        <p className="text-xs text-muted-foreground text-center">
          Último gateway conectado em {fmtDate(lastConnected)}
        </p>
      )}
    </div>
  );
}
