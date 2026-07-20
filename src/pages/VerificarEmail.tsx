import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '~/context/AuthContext';
import Logo from '~/components/Logo';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VerificarEmail() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
    if (user.emailVerified) { doRedirect(); }
  }, [user]);

  // Poll for verification every 5s
  useEffect(() => {
    if (!user || user.emailVerified) return;
    const interval = setInterval(async () => {
      await user.reload();
      if (user.emailVerified) {
        clearInterval(interval);
        doRedirect();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  function doRedirect() {
    if (profileRef.current?.planoPendente) {
      navigate('/planos/aguardando', { replace: true });
    } else {
      navigate('/onboarding', { replace: true });
    }
  }

  const sendLink = async () => {
    if (!user || resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/enviarCodigoVerificacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao enviar o link.');
        return;
      }
      if (data.alreadyVerified) {
        toast.success('E-mail já verificado!');
        await user.reload();
        doRedirect();
        return;
      }
      setResendCooldown(60);
      toast.success('Link enviado! Verifique sua caixa de entrada.');
    } catch {
      toast.error('Não foi possível enviar o link. Verifique sua conexão.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sidebar via-sidebar to-primary/80 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <Logo variant="white" />

        <div className="bg-white/10 border-2 border-white/20 rounded-3xl p-10 backdrop-blur-sm space-y-7">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              {resending
                ? <RefreshCw className="w-8 h-8 text-white animate-spin" />
                : <Mail className="w-8 h-8 text-white" />}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Confirme seu e-mail</h1>
              <p className="text-white/60 text-sm mt-2 leading-relaxed">
                Enviamos um link de confirmação para<br />
                <span className="text-white font-semibold">{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3 text-left">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <p className="text-white/70 text-sm">Abra seu e-mail e clique no botão <strong className="text-white">Confirmar meu e-mail</strong></p>
            </div>
            <div className="flex items-center gap-3 text-left">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <p className="text-white/70 text-sm">Após confirmar, esta página atualizará automaticamente</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <button
              onClick={sendLink}
              disabled={resending || resendCooldown > 0}
              className="text-white/50 hover:text-white text-sm transition-colors disabled:cursor-not-allowed disabled:hover:text-white/50"
            >
              {resending
                ? 'Enviando...'
                : resendCooldown > 0
                ? `Reenviar em ${resendCooldown}s`
                : 'Não recebi o link — reenviar'}
            </button>
          </div>
        </div>

        <p className="text-white/30 text-xs">
          Não encontrou? Verifique a pasta de spam.
        </p>
      </div>
    </div>
  );
}
