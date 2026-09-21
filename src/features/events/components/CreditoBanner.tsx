import React, { useState } from 'react';
import { AlertTriangle, TrendingUp, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '~/context/AuthContext';
import { getPlanConfig } from '~/utils/plan-limits';
import { calcularAlertaInscricoes, type NivelAlerta } from '~/utils/plan-gating';
import type { PlanLevel } from '~/types/user';

interface CreditoBannerProps {
  eventoId: string;
  eventoNome: string;
  inscricoesAtuais: number;
  vagasTotais: number;
  limiteOverride?: number;
}

const ALERTA_CONFIG: Record<NivelAlerta, { cor: string; bg: string; border: string; icone: React.ElementType; titulo: string }> = {
  80: {
    cor: 'text-amber-800 dark:text-amber-200',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    icone: TrendingUp,
    titulo: 'Vagas quase esgotadas',
  },
  90: {
    cor: 'text-orange-800 dark:text-orange-200',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-800',
    icone: AlertTriangle,
    titulo: 'Vagas quase no limite',
  },
  100: {
    cor: 'text-red-800 dark:text-red-200',
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-200 dark:border-red-800',
    icone: AlertTriangle,
    titulo: 'Limite de vagas atingido',
  },
  105: {
    cor: 'text-red-900 dark:text-red-100',
    bg: 'bg-red-100 dark:bg-red-950/60',
    border: 'border-red-300 dark:border-red-700',
    icone: AlertTriangle,
    titulo: 'Inscrições bloqueadas',
  },
};

export default function CreditoBanner({
  eventoId,
  eventoNome,
  inscricoesAtuais,
  vagasTotais,
  limiteOverride,
}: CreditoBannerProps) {
  const { profile } = useAuth();
  const [modalAberto, setModalAberto] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const plano = (profile?.plano || 'chinam') as PlanLevel;
  const planConfig = getPlanConfig(plano);
  const limiteBase = limiteOverride ?? planConfig.maxAttendeesPerEvent;
  const nivel = calcularAlertaInscricoes(inscricoesAtuais, limiteBase);

  if (!nivel || dismissed) return null;

  const config = ALERTA_CONFIG[nivel];
  const Icone = config.icone;
  const percentual = Math.round((inscricoesAtuais / limiteBase) * 100);
  const podeComprarCredito = planConfig.allowExtraCredits;

  return (
    <>
      <div className={`rounded-xl border ${config.border} ${config.bg} p-4 flex items-start gap-3`}>
        <Icone className={`w-5 h-5 mt-0.5 shrink-0 ${config.cor}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${config.cor}`}>{config.titulo}</p>
          <p className={`text-xs mt-1 ${config.cor} opacity-80`}>
            {inscricoesAtuais} de {limiteBase} vagas ocupadas ({percentual}%).
            {nivel >= 100 && ' Novas inscrições estão bloqueadas.'}
          </p>
          <div className="flex gap-2 mt-3">
            {podeComprarCredito && (
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setModalAberto(true)}
              >
                <Zap className="w-3.5 h-3.5" />
                Ampliar vagas — R$199
              </Button>
            )}
            {!podeComprarCredito && plano === 'chinam' && (
              <a href="/planos">
                <Button size="sm" variant="outline" className="text-xs">
                  Fazer upgrade
                </Button>
              </a>
            )}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className={`shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 ${config.cor} opacity-60`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {modalAberto && (
        <CreditoModal
          eventoId={eventoId}
          eventoNome={eventoNome}
          limiteAtual={limiteBase}
          onClose={() => setModalAberto(false)}
        />
      )}
    </>
  );
}

function CreditoModal({
  eventoId,
  eventoNome,
  limiteAtual,
  onClose,
}: {
  eventoId: string;
  eventoNome: string;
  limiteAtual: number;
  onClose: () => void;
}) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const novoLimite = Math.max(limiteAtual * 2, limiteAtual + 300);

  async function handleComprar() {
    if (!user) return;
    setLoading(true);
    setErro('');

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/createCheckout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'credit',
          eventoId,
          userId: user.uid,
          userEmail: user.email,
          userName: profile?.nome || user.displayName || '',
          userCpfCnpj: (profile as any)?.cpfCnpj || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Erro ao processar pagamento.');
        return;
      }

      if (data.paymentUrl) {
        window.open(data.paymentUrl, '_blank');
        onClose();
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-background rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-foreground">Ampliar vagas do evento</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="rounded-xl bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">{eventoNome}</p>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Limite atual</span>
            <span className="font-bold text-foreground">{limiteAtual} vagas</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Novo limite</span>
            <span className="font-bold text-primary">{novoLimite} vagas</span>
          </div>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">Crédito avulso</p>
              <p className="text-xs text-muted-foreground">Pagamento único via PIX</p>
            </div>
            <p className="text-2xl font-black text-primary">R$199</p>
          </div>
        </div>

        {erro && (
          <p className="text-xs text-destructive font-medium">{erro}</p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 gap-1.5"
            onClick={handleComprar}
            disabled={loading}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {loading ? 'Processando...' : 'Comprar crédito'}
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          Após o pagamento, o limite de vagas é ampliado automaticamente.
          O crédito é válido para este evento específico.
        </p>
      </div>
    </div>
  );
}
