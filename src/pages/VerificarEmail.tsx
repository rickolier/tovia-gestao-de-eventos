import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '~/context/AuthContext';
import Logo from '~/components/Logo';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function VerificarEmail() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  // Countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Redirect if already verified or not logged in
  useEffect(() => {
    if (!user) { navigate('/desenvolvimento/login', { replace: true }); return; }
    if (user.emailVerified) { doRedirect(); }
  }, [user]);

  // Auto-send code on mount if NOT coming from registration (which already sent it)
  const didAutoSend = useRef(false);
  useEffect(() => {
    if (!user || user.emailVerified || didAutoSend.current) return;
    const codeSentFromRegistration = location.state?.codeSent === true;
    if (codeSentFromRegistration) {
      // Registration already sent the code — just start the cooldown
      setResendCooldown(60);
    } else {
      // Arrived via redirect (PrivateRoute) — send code now
      didAutoSend.current = true;
      sendCode();
    }
  }, [user]);

  function doRedirect() {
    if (profileRef.current?.planoPendente) {
      navigate('/desenvolvimento/planos/aguardando', { replace: true });
    } else {
      navigate('/desenvolvimento/onboarding', { replace: true });
    }
  }

  const sendCode = async () => {
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
        toast.error(data.error || 'Erro ao enviar o código.');
        return;
      }
      setDigits(['', '', '', '', '', '']);
      setError('');
      setResendCooldown(60);
      inputRefs.current[0]?.focus();
    } catch {
      toast.error('Não foi possível enviar o código. Verifique sua conexão e tente novamente.');
    } finally {
      setResending(false);
    }
  };

  const handleResend = () => {
    if (!user) {
      toast.error('Sessão expirada. Faça login novamente.');
      navigate('/desenvolvimento/login', { replace: true });
      return;
    }
    if (resendCooldown > 0) return;
    toast.promise(sendCode(), {
      loading: 'Enviando código...',
      success: 'Novo código enviado! Verifique sua caixa de entrada.',
      error: (e) => e?.message || 'Erro ao enviar o código.',
    });
  };

  const handleDigit = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async () => {
    const fullCode = digits.join('');
    if (fullCode.length !== 6) { setError('Digite os 6 dígitos do código.'); return; }
    if (!user) { toast.error('Sessão expirada.'); navigate('/desenvolvimento/login', { replace: true }); return; }
    setVerifying(true);
    setError('');
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/confirmarCodigoVerificacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ userId: user.uid, code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Código inválido.'); return; }
      setSuccess(true);
      await user.reload();
      await refreshProfile?.();
      setTimeout(() => doRedirect(), 1200);
    } catch (err: any) {
      setError(err.message || 'Erro ao verificar. Tente novamente.');
    } finally {
      setVerifying(false);
    }
  };

  const codeComplete = digits.every(d => d !== '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--sidebar)] via-[var(--sidebar)] to-[hsl(var(--primary)/0.8)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <Logo variant="white" />

        <div className="bg-white/10 border-2 border-white/20 rounded-3xl p-10 backdrop-blur-sm space-y-7">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white">E-mail confirmado!</h1>
              <p className="text-white/60 text-sm">Redirecionando...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  {resending
                    ? <RefreshCw className="w-8 h-8 text-white animate-spin" />
                    : <Mail className="w-8 h-8 text-white" />}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white">Confirme seu e-mail</h1>
                  <p className="text-white/60 text-sm mt-1 leading-relaxed">
                    {resending
                      ? 'Enviando código...'
                      : <>Enviamos um código de 6 dígitos para<br /><span className="text-white font-semibold">{user?.email}</span></>}
                  </p>
                </div>
              </div>

              {/* OTP inputs */}
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigit(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={cn(
                      'w-12 h-14 text-center text-2xl font-black rounded-2xl border-2 bg-white/10 text-white outline-none transition-all',
                      error ? 'border-red-400' : digit ? 'border-white' : 'border-white/30',
                      'focus:border-white focus:bg-white/20',
                    )}
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-300 text-sm font-medium -mt-2">{error}</p>
              )}

              <Button
                onClick={handleVerify}
                disabled={!codeComplete || verifying}
                className="w-full h-12 rounded-2xl bg-white text-primary hover:bg-white/90 font-black uppercase tracking-widest text-sm disabled:opacity-40"
              >
                {verifying
                  ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Verificando...</>
                  : <><CheckCircle2 className="w-4 h-4 mr-2" /> Confirmar</>}
              </Button>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={handleResend}
                  disabled={resending || resendCooldown > 0}
                  className="text-white/50 hover:text-white text-sm transition-colors disabled:cursor-not-allowed disabled:hover:text-white/50"
                >
                  {resending
                    ? 'Enviando...'
                    : resendCooldown > 0
                    ? `Reenviar em ${resendCooldown}s`
                    : 'Não recebi o código — reenviar'}
                </button>
                <button
                  onClick={() => navigate('/desenvolvimento/onboarding', { replace: true })}
                  className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center justify-center gap-1"
                >
                  Voltar à escolha de plano <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-white/30 text-xs">
          Não encontrou? Verifique a pasta de spam.
        </p>
      </div>
    </div>
  );
}
