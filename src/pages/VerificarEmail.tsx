import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '~/services/firebase';
import { useAuth } from '~/context/AuthContext';
import Logo from '~/components/Logo';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function VerificarEmail() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const hasPendingPayment = !!profile?.planoPendente;

  // Ref sempre atualizado para leitura dentro do setInterval
  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }

    if (auth.currentUser?.emailVerified) {
      doRedirect();
      return;
    }

    const interval = setInterval(async () => {
      try {
        await user.reload();
        if (auth.currentUser?.emailVerified) {
          clearInterval(interval);
          await refreshProfile?.();
          doRedirect();
        }
      } catch { /* ignore */ }
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function doRedirect() {
    if (profileRef.current?.planoPendente) {
      navigate('/planos/aguardando', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }

  const handleResend = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setResending(true);
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/enviarVerificacaoEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ userId: currentUser.uid }),
      });
      if (!res.ok) throw new Error();
      setResent(true);
      toast.success('E-mail reenviado! Verifique sua caixa de entrada.');
    } catch {
      toast.error('Não foi possível reenviar. Aguarde alguns minutos e tente de novo.');
    } finally {
      setResending(false);
    }
  };

  const handleUseFree = () => {
    navigate('/planos/aguardando', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--sidebar)] via-[var(--sidebar)] to-[hsl(var(--primary)/0.8)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <Logo variant="white" />

        <div className="bg-white/10 border-2 border-white/20 rounded-3xl p-10 backdrop-blur-sm space-y-6">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto">
            <Mail className="w-10 h-10 text-white animate-pulse" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white">Confirme seu e-mail</h1>
            <p className="text-white/60 text-sm mt-2 leading-relaxed">
              Enviamos um link de confirmação para{' '}
              <span className="text-white font-semibold">{user?.email}</span>.
              <br />
              Clique no link para liberar o acesso.
            </p>
          </div>

          {hasPendingPayment && (
            <div className="flex items-start gap-3 bg-white/5 rounded-2xl px-4 py-3 text-left">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0 mt-1.5" />
              <p className="text-white/70 text-xs font-medium">
                Seu pagamento também está sendo processado. Assim que confirmarmos, seu plano será ativado automaticamente.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
            <p className="text-white/70 text-xs font-medium">
              Verificando automaticamente...
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {resent ? (
              <div className="flex items-center justify-center gap-2 text-white/60 text-sm py-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                E-mail reenviado! Verifique sua caixa de entrada.
              </div>
            ) : (
              <Button
                onClick={handleResend}
                disabled={resending}
                className="w-full h-12 rounded-2xl bg-white text-primary hover:bg-white/90 font-black uppercase tracking-widest text-sm"
              >
                {resending
                  ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Reenviando...</>
                  : <><Mail className="w-4 h-4 mr-2" /> Reenviar e-mail</>}
              </Button>
            )}

            {!hasPendingPayment && (
              <Button
                variant="ghost"
                onClick={() => navigate('/onboarding', { replace: true })}
                className="text-white/50 hover:text-white hover:bg-white/10 rounded-2xl text-sm"
              >
                Voltar à escolha de plano
              </Button>
            )}

            {hasPendingPayment && (
              <Button
                variant="ghost"
                onClick={handleUseFree}
                className="text-white/50 hover:text-white hover:bg-white/10 rounded-2xl text-sm"
              >
                Acompanhar pagamento <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-white/30 text-xs">
          Não encontrou o e-mail? Verifique a pasta de spam.
        </p>
      </div>
    </div>
  );
}
