import React, { useState } from 'react';
import { useAuth } from '~/context/AuthContext';
import { auth } from '~/services/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  PlugZap,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { updateDocument } from '~/services/firestore';

const GATEWAY_LABELS: Record<string, string> = {
  asaas: 'Asaas',
  stripe: 'Stripe',
  mercadopago: 'Mercado Pago',
  pagarme: 'Pagar.me',
};

export default function GatewayTab() {
  const { profile, user, refreshProfile } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [sandbox, setSandbox] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [accountInfo, setAccountInfo] = useState<Record<string, string> | null>(null);
  const [localConnected, setLocalConnected] = useState<boolean | null>(null);
  const [localSandbox, setLocalSandbox] = useState<boolean | null>(null);
  const [localConnectedAt, setLocalConnectedAt] = useState<string | null>(null);

  const isConnected = localConnected !== null ? localConnected : (profile?.gateway_connected === true);
  const gatewayType = profile?.gateway?.type ?? 'asaas';
  const isSandbox = localSandbox !== null ? localSandbox : profile?.gateway?.sandbox;
  const connectedAt = (localConnectedAt ?? profile?.gateway?.connected_at)
    ? new Date((localConnectedAt ?? profile?.gateway?.connected_at)!).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const handleValidate = async () => {
    if (!apiKey.trim()) { toast.error('Insira a chave de API.'); return; }
    setLoading(true);
    setAccountInfo(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const gwRes = await fetch('/api/saveGatewayConfig?step=validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({ gatewayType: 'asaas', apiKey: apiKey.trim(), sandbox }),
      });
      const gwData = await gwRes.json();
      if (!gwRes.ok) throw new Error(gwData.error || 'Erro ao validar a chave.');
      if (gwData.accountInfo && gwData.accountInfo.name) {
        setAccountInfo(gwData.accountInfo);
        setConfirming(true);
      } else {
        setConfirming(true);
        setAccountInfo(null);
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao validar a chave.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const gwRes = await fetch('/api/saveGatewayConfig?step=confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({ gatewayType: 'asaas', apiKey: apiKey.trim(), sandbox }),
      });
      const gwData = await gwRes.json();
      if (!gwRes.ok) throw new Error(gwData.error || 'Erro ao conectar o gateway.');
      setLocalConnected(true);
      setLocalSandbox(sandbox);
      setLocalConnectedAt(new Date().toISOString());
      setConfirming(false);
      setAccountInfo(null);
      refreshProfile();
      toast.success('Gateway conectado! Pagamentos automáticos habilitados.');
      setApiKey('');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao conectar o gateway.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirm = () => {
    setConfirming(false);
    setAccountInfo(null);
  };

  const handleDisconnect = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDocument('users', user.uid, {
        gateway_connected: false,
        gateway: null,
      } as any);
      await updateDocument('organizer_public', user.uid, { gateway_connected: false } as any);
      setLocalConnected(false);
      setLocalSandbox(null);
      setLocalConnectedAt(null);
      refreshProfile();
      toast.success('Gateway desconectado.');
    } catch {
      toast.error('Erro ao desconectar.');
    } finally {
      setLoading(false);
    }
  };

  const howItWorks = (
    <Card className="p-6 rounded-3xl border-none bg-muted/20 h-fit">
      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
        Como funciona
      </h3>
      <div className="space-y-4">
        {[
          {
            icon: <CheckCircle2 className="w-4 h-4 text-primary" />,
            title: 'Participante escolhe como pagar',
            desc: 'PIX, boleto bancário ou cartão de crédito — configurado por ingresso.',
          },
          {
            icon: <CheckCircle2 className="w-4 h-4 text-primary" />,
            title: `Tovia cria a cobrança na sua conta ${GATEWAY_LABELS[gatewayType] ?? gatewayType}`,
            desc: 'Usando sua chave, geramos a cobrança automaticamente no momento da inscrição.',
          },
          {
            icon: <CheckCircle2 className="w-4 h-4 text-primary" />,
            title: `Pagamento confirmado pelo ${GATEWAY_LABELS[gatewayType] ?? gatewayType}`,
            desc: 'O gateway nos notifica via webhook e a inscrição é marcada como paga.',
          },
          {
            icon: <CheckCircle2 className="w-4 h-4 text-primary" />,
            title: 'Dinheiro cai direto na sua conta',
            desc: `O Tovia nunca toca no dinheiro. Tudo vai para a sua conta ${GATEWAY_LABELS[gatewayType] ?? gatewayType} conforme as regras do gateway.`,
          },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div>
              <p className="text-sm font-bold">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-foreground">Gateway de Pagamento</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Conecte seu próprio gateway para cobrar inscrições com PIX, boleto e cartão. Os valores vão direto para a sua conta.
        </p>
      </div>

      {isConnected ? (
        /* ── Conectado: status em cima + como funciona ao lado ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          <div className="space-y-4">
            <Card className="p-6 border-green-200 bg-green-50 rounded-3xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center shrink-0">
                    <PlugZap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-green-900">
                        {GATEWAY_LABELS[gatewayType] ?? gatewayType} conectado
                      </p>
                      <Badge className="bg-green-500 text-white text-[10px] font-black">ATIVO</Badge>
                      {isSandbox && (
                        <Badge className="bg-amber-400 text-white text-[10px] font-black">SANDBOX</Badge>
                      )}
                    </div>
                    <p className="text-sm text-green-700 mt-0.5">
                      Pagamentos automáticos habilitados para todos os seus eventos.
                    </p>
                    {connectedAt && (
                      <p className="text-xs text-green-600 mt-1">Conectado em {connectedAt}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="border-red-200 text-red-600 hover:bg-red-50 rounded-2xl shrink-0"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Desconectar'}
                </Button>
              </div>
            </Card>
          </div>
          {howItWorks}
        </div>
      ) : (
        /* ── Não conectado: alerta + form à esquerda, como funciona à direita ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          <div className="space-y-4">
            <Card className="p-5 border-amber-200 bg-amber-50 rounded-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-black text-amber-900 text-sm">Nenhum gateway conectado</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Inscrições pagas ficam em modo manual. Conecte seu gateway para automatizar.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 rounded-3xl border-none shadow-xl">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-black text-sm">Conectar Gateway</p>
                    <p className="text-[11px] text-muted-foreground">
                      Sua chave é criptografada com AES-256 antes de ser armazenada. Nunca fica em texto puro.
                    </p>
                  </div>
                </div>

                {/* Sandbox toggle */}
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-muted/40">
                  <button
                    onClick={() => setSandbox(false)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                      !sandbox ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Produção
                  </button>
                  <button
                    onClick={() => setSandbox(true)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                      sandbox ? 'bg-amber-500 text-white shadow' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sandbox
                  </button>
                  {sandbox && (
                    <Badge className="bg-amber-100 text-amber-700 text-[10px] font-black ml-1">
                      MODO TESTE
                    </Badge>
                  )}
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Chave de API {sandbox ? 'Sandbox' : 'Produção'}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder="$aact_..."
                      className="h-12 rounded-2xl border-none bg-muted/40 pr-12 font-mono text-sm"
                      onKeyDown={e => e.key === 'Enter' && handleValidate()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(v => !v)}
                      className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground px-1">
                    Encontre em <strong>Minha Conta → Integrações → Chave de API</strong> no painel Asaas.
                  </p>
                </div>

                <Button
                  onClick={handleValidate}
                  disabled={loading || confirming || !apiKey.trim()}
                  className="w-full h-12 rounded-2xl font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  {loading && !confirming ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Validando chave…</>
                  ) : (
                    <>Validar chave <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </Card>

            {confirming && (
              <Card className="p-6 rounded-3xl border-2 border-primary/30 bg-primary/5 shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-foreground">Chave válida! Confirme a conta</p>
                      <p className="text-[11px] text-muted-foreground">
                        Verifique se os dados abaixo correspondem à sua conta no gateway.
                      </p>
                    </div>
                  </div>

                  {accountInfo ? (
                    <div className="rounded-2xl bg-card border border-border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Titular</span>
                        <span className="text-sm font-black text-foreground">{accountInfo.name}</span>
                      </div>
                      {accountInfo.tradingName && accountInfo.tradingName !== accountInfo.name && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Nome fantasia</span>
                          <span className="text-sm font-semibold text-foreground">{accountInfo.tradingName}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                          {accountInfo.personType === 'JURIDICA' ? 'CNPJ' : 'CPF'}
                        </span>
                        <span className="text-sm font-mono font-semibold text-foreground">{accountInfo.cpfCnpjMasked}</span>
                      </div>
                      {accountInfo.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">E-mail</span>
                          <span className="text-sm text-foreground">{accountInfo.email}</span>
                        </div>
                      )}
                      {accountInfo.city && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Cidade</span>
                          <span className="text-sm text-foreground">{accountInfo.city}{accountInfo.state ? ` — ${accountInfo.state}` : ''}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                      <p className="text-xs text-amber-700">
                        Não foi possível recuperar os dados da conta. Você pode continuar, mas confirme que a chave pertence à sua conta no gateway.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="flex-1 h-11 rounded-2xl font-black bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 transition-all active:scale-95"
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Conectando…</>
                      ) : (
                        <>Confirmar e conectar</>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancelConfirm}
                      disabled={loading}
                      variant="outline"
                      className="h-11 rounded-2xl font-bold"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {howItWorks}
        </div>
      )}
    </div>
  );
}
