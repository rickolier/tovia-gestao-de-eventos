import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
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
import { updateDocument } from '../../lib/firebase-utils';
import app from '../../firebase';

export default function GatewayTab() {
  const { profile, user, refreshProfile } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [sandbox, setSandbox] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const isConnected = profile?.gateway_connected === true;
  const gatewayType = profile?.gateway?.type ?? 'asaas';
  const isSandbox = profile?.gateway?.sandbox;
  const connectedAt = profile?.gateway?.connected_at
    ? new Date(profile.gateway.connected_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      toast.error('Insira a chave de API.');
      return;
    }
    setLoading(true);
    try {
      const fns = getFunctions(app, 'us-central1');
      const saveGateway = httpsCallable(fns, 'saveGatewayConfig');
      await saveGateway({ gatewayType: 'asaas', apiKey: apiKey.trim(), sandbox });
      await refreshProfile();
      toast.success('Gateway conectado! Pagamentos automáticos habilitados.');
      setApiKey('');
    } catch (err: any) {
      const msg = err?.message ?? 'Erro ao conectar o gateway.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
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
      await refreshProfile();
      toast.success('Gateway desconectado.');
    } catch {
      toast.error('Erro ao desconectar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-foreground">Gateway de Pagamento</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Conecte seu próprio gateway para cobrar inscrições com PIX, boleto e cartão. Os valores vão direto para a sua conta.
        </p>
      </div>

      {/* Status card */}
      {isConnected ? (
        <Card className="p-6 border-green-200 bg-green-50 rounded-3xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center shrink-0">
                <PlugZap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-black text-green-900">
                    {gatewayType === 'asaas' ? 'Asaas' : gatewayType} conectado
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
      ) : (
        <Card className="p-5 border-amber-200 bg-amber-50 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-amber-900 text-sm">Nenhum gateway conectado</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Inscrições pagas ficam em modo manual. Conecte seu Asaas para automatizar.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Connection form */}
      {!isConnected && (
        <Card className="p-6 rounded-3xl border-none shadow-xl">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-black text-sm">Conectar Asaas</p>
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
                  onKeyDown={e => e.key === 'Enter' && handleConnect()}
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
              onClick={handleConnect}
              disabled={loading || !apiKey.trim()}
              className="w-full h-12 rounded-2xl font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Validando e conectando…</>
              ) : (
                <>Conectar e validar chave <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* How it works */}
      <Card className="p-6 rounded-3xl border-none bg-muted/20">
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
              title: 'Tovia cria a cobrança na sua conta Asaas',
              desc: 'Usando sua chave, geramos a cobrança automaticamente no momento da inscrição.',
            },
            {
              icon: <CheckCircle2 className="w-4 h-4 text-primary" />,
              title: 'Pagamento confirmado pelo Asaas',
              desc: 'O Asaas nos notifica via webhook e a inscrição é marcada como paga.',
            },
            {
              icon: <CheckCircle2 className="w-4 h-4 text-primary" />,
              title: 'Dinheiro cai direto na sua conta',
              desc: 'O Tovia nunca toca no dinheiro. Tudo vai para a sua conta Asaas conforme as regras do gateway.',
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
    </div>
  );
}
