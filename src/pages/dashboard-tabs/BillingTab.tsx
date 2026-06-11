import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, Calendar, CheckCircle2, Clock, AlertCircle,
  ExternalLink, RefreshCw, ArrowUpCircle, User, Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLAN_CONFIGS } from '../../lib/plan-limits';
import { PlanLevel } from '../../types';

const BILLING_TYPE_LABELS: Record<string, string> = {
  CREDIT_CARD: 'Cartão de crédito',
  BOLETO: 'Boleto bancário',
  PIX: 'Pix',
  UNDEFINED: 'Não definido',
};

const CARD_BRANDS: Record<string, string> = {
  VISA: '💳 Visa',
  MASTERCARD: '💳 Mastercard',
  AMEX: '💳 American Express',
  ELO: '💳 Elo',
  HIPERCARD: '💳 Hipercard',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  RECEIVED:  { label: 'Pago',      color: 'text-green-600 bg-green-50',  icon: <CheckCircle2 className="w-3 h-3" /> },
  CONFIRMED: { label: 'Confirmado', color: 'text-green-600 bg-green-50', icon: <CheckCircle2 className="w-3 h-3" /> },
  PENDING:   { label: 'Pendente',  color: 'text-yellow-600 bg-yellow-50', icon: <Clock className="w-3 h-3" /> },
  OVERDUE:   { label: 'Vencido',   color: 'text-red-600 bg-red-50',      icon: <AlertCircle className="w-3 h-3" /> },
};

function fmt(v: number) {
  return v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
}

interface BillingData {
  hasSubscription: boolean;
  plano: string | null;
  subscription?: {
    id: string; status: string; value: number; cycle: string;
    nextDueDate: string; billingType: string; description: string;
  };
  customer?: { name: string; email: string; cpfCnpj: string };
  creditCard?: { creditCardBrand: string; creditCardNumber: string } | null;
  payments?: Array<{
    id: string; status: string; value: number; dueDate: string;
    paymentDate: string | null; invoiceUrl: string | null; billingType: string;
  }>;
}

export default function BillingTab() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/getBillingInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const text = await res.text();
      if (!text) throw new Error(`Servidor retornou resposta vazia (${res.status}).`);
      const json = JSON.parse(text);
      if (!res.ok) throw new Error(json.error || `Erro ${res.status}`);
      setData(json);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const planConfig = profile?.plano ? PLAN_CONFIGS[profile.plano as PlanLevel] : null;

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-36 rounded-3xl bg-muted animate-pulse" />)}
    </div>
  );

  // ── Erro ─────────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-3xl bg-red-50 border border-red-100 p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
        <p className="text-sm text-red-600 font-medium">{error}</p>
        <Button variant="outline" onClick={load} className="rounded-xl gap-2">
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </Button>
      </div>
    </div>
  );

  // ── Sem assinatura (plano gratuito) ──────────────────────────────────────────
  if (!data?.hasSubscription) return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black tracking-tight text-foreground">Faturamento</h2>
        <p className="text-sm text-muted-foreground">Gerencie sua assinatura e histórico de pagamentos.</p>
      </div>
      <Card className="border-none shadow-sm rounded-3xl bg-card">
        <CardContent className="p-10 flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-black text-foreground">Você está no plano gratuito</p>
            <p className="text-sm text-muted-foreground mt-1">
              Faça upgrade para um plano pago e acesse mais recursos.
            </p>
          </div>
          <Button
            onClick={() => navigate('/planos')}
            className="bg-primary text-white rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-sm gap-2"
          >
            <ArrowUpCircle className="w-5 h-5" /> Ver planos
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const { subscription, customer, creditCard, payments = [] } = data;
  const paidCount = payments.filter(p => p.status === 'RECEIVED' || p.status === 'CONFIRMED').length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-foreground">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black tracking-tight text-foreground">Faturamento</h2>
          <p className="text-sm text-muted-foreground">Gerencie sua assinatura e histórico de pagamentos.</p>
        </div>
        <button onClick={load} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-muted">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Assinatura ativa */}
      <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <CreditCard className="w-5 h-5 text-primary" /> Assinatura Ativa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Plano</p>
                <p className="text-2xl font-black text-foreground mt-1">
                  {planConfig?.name ?? subscription?.description ?? profile?.plano}
                </p>
                <p className="text-sm text-muted-foreground">{planConfig?.label}</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Valor mensal</p>
                  <p className="text-lg font-black text-primary">{fmt(subscription?.value ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Próxima cobrança</p>
                  <p className="text-lg font-bold text-foreground flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {fmtDate(subscription?.nextDueDate ?? '')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Mensalidades pagas</p>
                  <p className="text-lg font-bold text-foreground flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {paidCount}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/planos')}
                className="border-primary text-primary hover:bg-primary/5 rounded-xl font-semibold text-sm"
              >
                Trocar de plano
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Método de pagamento */}
      <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <CreditCard className="w-5 h-5 text-primary" /> Método de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {creditCard ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-xl">
                💳
              </div>
              <div>
                <p className="font-bold text-foreground">
                  {CARD_BRANDS[creditCard.creditCardBrand] || creditCard.creditCardBrand}
                </p>
                <p className="text-sm text-muted-foreground">
                  •••• •••• •••• {creditCard.creditCardNumber}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <Receipt className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground">
                  {BILLING_TYPE_LABELS[subscription?.billingType ?? ''] ?? 'Não identificado'}
                </p>
                <p className="text-xs text-muted-foreground">Método registrado no Asaas</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dados fiscais */}
      {customer && (
        <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <User className="w-5 h-5 text-primary" /> Dados Fiscais
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Nome', value: customer.name },
              { label: 'E-mail', value: customer.email },
              { label: 'CPF / CNPJ', value: customer.cpfCnpj || '—' },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{item.label}</p>
                <p className="font-bold text-foreground mt-1">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Histórico de pagamentos */}
      <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Receipt className="w-5 h-5 text-primary" /> Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground p-8">Nenhum pagamento encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Vencimento</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Pagamento</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Valor</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => {
                    const st = STATUS_CONFIG[p.status] ?? { label: p.status, color: 'text-muted-foreground bg-muted', icon: null };
                    return (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{fmtDate(p.dueDate)}</td>
                        <td className="px-4 py-4 text-muted-foreground">{p.paymentDate ? fmtDate(p.paymentDate) : '—'}</td>
                        <td className="px-4 py-4 font-bold text-foreground">{fmt(p.value)}</td>
                        <td className="px-4 py-4">
                          <span className={cn('flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full w-fit', st.color)}>
                            {st.icon} {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {p.invoiceUrl && (
                            <a href={p.invoiceUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                              Ver fatura <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
