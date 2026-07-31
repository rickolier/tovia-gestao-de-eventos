import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '~/context/AuthContext';
import { auth } from '~/services/firebase';
import { updateDocument } from '~/services/firestore';
import Logo from '~/components/Logo';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, RefreshCw } from 'lucide-react';

export default function AguardandoPagamento() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const pollingDone = attempts >= 12;

  const syncAndRefresh = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken && user) {
        await fetch('/api/admin?action=getBillingInfo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ userId: user.uid }),
        });
      }
    } catch { /* ignora erro de sync — refreshProfile abaixo ainda roda */ }
    await refreshProfile?.();
  };

  // Verifica automaticamente a cada 5s (até 12 tentativas = 1 min)
  useEffect(() => {
    if (!profile?.planoPendente || attempts >= 12) return;
    const timer = setTimeout(async () => {
      await syncAndRefresh();
      setAttempts(a => a + 1);
    }, 5000);
    return () => clearTimeout(timer);
  }, [profile, attempts]);

  // Pagamento confirmado → redireciona
  useEffect(() => {
    if (profile?.plano && !profile?.planoPendente) {
      if (user) updateDocument('users', user.uid, { onboardingComplete: true }).catch(() => {});
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  const handleCheckManual = async () => {
    setChecking(true);
    await syncAndRefresh();
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sidebar via-sidebar to-primary/80 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-8">
        <Logo variant="white" />

        <div className="bg-white/10 border-2 border-white/20 rounded-3xl p-10 backdrop-blur-sm space-y-6">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10 text-white animate-pulse" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white">Aguardando pagamento</h1>
            <p className="text-white/60 text-sm mt-2">
              Complete o pagamento na página que abrimos. Assim que confirmarmos,
              seu plano será ativado automaticamente.
            </p>
          </div>

          {!pollingDone ? (
            <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0" />
              <p className="text-white/70 text-xs font-medium">
                Verificando pagamento automaticamente...
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-white/30 shrink-0" />
              <p className="text-white/60 text-xs font-medium">
                O pagamento pode levar alguns minutos. Fique nesta tela ou volte mais tarde.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleCheckManual}
              disabled={checking}
              className="w-full h-12 rounded-2xl bg-white text-primary hover:bg-white/90 font-black uppercase tracking-widest text-sm"
            >
              {checking ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Verificando...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Já paguei, verificar agora</>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate('/planos')}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-2xl text-sm"
            >
              Voltar e trocar de plano
            </Button>
            <p className="text-white/40 text-xs text-center">
              Você também receberá um e-mail assim que o pagamento for confirmado.
            </p>
          </div>
        </div>

        <p className="text-white/30 text-xs">
          Dúvidas? Entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
}
