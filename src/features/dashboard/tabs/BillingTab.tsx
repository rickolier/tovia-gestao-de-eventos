import React, { useEffect, useState } from 'react';
import { useAuth } from '~/context/AuthContext';
import { updateDocument, removeDocument } from '~/services/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, Calendar, CheckCircle2, Clock, AlertCircle,
  ExternalLink, RefreshCw, ArrowUpCircle, User, Receipt, AlertTriangle, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLAN_CONFIGS } from '~/utils/plan-limits';
import { PlanLevel } from '~/types';
import { toast } from 'sonner';
import { auth } from '~/services/firebase';
import { deleteUser } from 'firebase/auth';

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
  const [cancelLoading, setCancelLoading] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  const zonaDePerigo = (
    <>
      <Card className="border border-destructive/30 rounded-3xl shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black text-destructive flex items-center gap-2 uppercase tracking-widest">
            <AlertTriangle className="w-4 h-4" />
            Zona de Perigo
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Excluir minha conta</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
                Remove permanentemente seu perfil e acesso à plataforma. Seus eventos e inscrições de participantes são preservados.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive hover:text-white rounded-xl font-bold text-sm shrink-0 transition-all"
              onClick={() => { setDeleteConfirmText(''); setDeleteAccountDialogOpen(true); }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir conta
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-8 bg-card">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-black text-destructive flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-2xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              Excluir conta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Esta ação é <span className="font-black text-foreground">irreversível</span>. Será removido:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
              <li>Seu perfil e dados pessoais (LGPD Art. 18)</li>
              <li>Seu acesso à plataforma</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Eventos criados e inscrições de participantes são mantidos por obrigação fiscal.
            </p>
            <div className="pt-2 space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Digite <span className="text-destructive">EXCLUIR</span> para confirmar
              </Label>
              <Input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="EXCLUIR"
                className="rounded-xl border-destructive/30 focus:border-destructive font-mono tracking-widest"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteAccountDialogOpen(false)}
              className="rounded-2xl h-12 px-6 font-black text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button
              disabled={deleteConfirmText !== 'EXCLUIR' || deleteAccountLoading}
              onClick={async () => {
                if (!user) return;
                setDeleteAccountLoading(true);
                try {
                  await removeDocument('users', user.uid);
                  await deleteUser(auth.currentUser!);
                  toast.success('Conta excluída. Até logo!');
                  navigate('/');
                } catch (err: any) {
                  if (err?.code === 'auth/requires-recent-login') {
                    toast.error('Por segurança, faça login novamente antes de excluir a conta.');
                  } else {
                    toast.error('Erro ao excluir conta. Tente novamente.');
                  }
                } finally {
                  setDeleteAccountLoading(false);
                }
              }}
              className="bg-destructive hover:bg-destructive/90 text-white rounded-2xl h-12 px-8 font-black shadow-xl shadow-destructive/20 disabled:opacity-40 active:scale-95 transition-all"
            >
              {deleteAccountLoading ? 'Excluindo...' : 'Excluir minha conta'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/getBillingInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
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
      {zonaDePerigo}
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
              <Button
                variant="ghost"
                disabled={cancelLoading}
                className="text-destructive hover:bg-destructive/5 hover:text-destructive rounded-xl font-semibold text-sm flex items-center gap-2"
                onClick={async () => {
                  if (!user) return;
                  const confirmed = window.confirm('Tem certeza que deseja cancelar seu plano? Você voltará para a tela de seleção de planos.');
                  if (!confirmed) return;
                  setCancelLoading(true);
                  try {
                    await updateDocument('users', user.uid, { plano: null });
                    toast.success('Plano cancelado. Escolha um novo plano para continuar.');
                    navigate('/onboarding');
                  } catch {
                    toast.error('Erro ao cancelar plano. Tente novamente.');
                  } finally {
                    setCancelLoading(false);
                  }
                }}
              >
                <AlertTriangle className="w-4 h-4" />
                {cancelLoading ? 'Cancelando...' : 'Cancelar plano'}
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

      {zonaDePerigo}
    </div>
  );
}
