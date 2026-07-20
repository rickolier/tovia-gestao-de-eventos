import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '~/context/AuthContext';
import Logo from '~/components/Logo';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConfirmarEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setErrorMsg('Link inválido.'); return; }

    fetch(`/api/confirmarCodigoVerificacao?token=${token}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus('success');
          if (user) {
            await user.reload();
            await refreshProfile?.();
          }
          setTimeout(() => navigate('/onboarding', { replace: true }), 2000);
        } else {
          setStatus('error');
          setErrorMsg(data.error || 'Erro ao confirmar e-mail.');
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('Erro de conexão. Tente novamente.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sidebar via-sidebar to-primary/80 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <Logo variant="white" />
        <div className="bg-white/10 border-2 border-white/20 rounded-3xl p-10 backdrop-blur-sm space-y-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <h1 className="text-xl font-black text-white">Confirmando seu e-mail...</h1>
            </div>
          )}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white">E-mail confirmado!</h1>
              <p className="text-white/60 text-sm">Redirecionando para o Tovia...</p>
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-300" />
              </div>
              <h1 className="text-xl font-black text-white">{errorMsg}</h1>
              <Button
                onClick={() => navigate('/verificar-email', { replace: true })}
                className="bg-white text-primary hover:bg-white/90 font-bold rounded-2xl px-8"
              >
                Solicitar novo link
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
