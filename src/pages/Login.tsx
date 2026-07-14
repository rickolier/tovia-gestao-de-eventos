import React, { useState } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '~/services/firebase';
import { Email } from '~/services/email';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import Logo from '~/components/Logo';
import { useAuth } from '~/context/AuthContext';
import { isAdminEmail } from '~/utils/admin-config';

export default function Login() {
  const { user, isAuthReady, processEquipeJoin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const eventoIdParam = searchParams.get('eventoId');
  const inviteEmailParam = searchParams.get('inviteEmail') || '';
  const redirectParam = searchParams.get('redirect');

  // Usuário já logado acessando o link de equipe: processa o join diretamente
  React.useEffect(() => {
    if (!isAuthReady || !user) return;
    if (eventoIdParam && !isAdminEmail(user.email)) {
      processEquipeJoin(eventoIdParam)
        .catch((err: any) => toast.error('Erro ao entrar na equipe: ' + err.message))
        .finally(() => navigate(redirectParam || '/desenvolvimento/dashboard'));
    } else {
      navigate(isAdminEmail(user.email) ? '/desenvolvimento/admin' : (redirectParam || '/desenvolvimento/dashboard'));
    }
  }, [user, isAuthReady]);

  const [isRegistering, setIsRegistering] = useState(searchParams.get('cadastro') === 'true');

  const [email, setEmail] = useState(inviteEmailParam);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'fraca' | 'média' | 'forte' | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [resetSent, setResetSent] = useState(false);

  function calcStrength(pwd: string): 'fraca' | 'média' | 'forte' | null {
    if (!pwd) return null;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    if (pwd.length < 8) return 'fraca';
    if (hasSpecial || (hasUpper && hasNum)) return 'forte';
    return 'média';
  }

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (eventoIdParam && !isAdminEmail(result.user.email)) {
        try {
          await processEquipeJoin(eventoIdParam);
        } catch (joinErr: any) {
          toast.error('Erro ao entrar na equipe: ' + joinErr.message);
        }
      }
      navigate(redirectParam || '/desenvolvimento/dashboard');
    } catch (error: any) {
      toast.error('Erro ao entrar com Google: ' + error.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast.error('Digite seu e-mail para recuperar a senha.');
      return;
    }
    try {
      await fetch('/api/enviarRedefinicaoSenha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error: any) {
      toast.error('Erro ao enviar e-mail: ' + error.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        if (password.length < 8) {
          toast.error('A senha deve ter no mínimo 8 caracteres.');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        if (eventoIdParam) {
          try {
            await processEquipeJoin(eventoIdParam);
          } catch (joinErr: any) {
            toast.error('Erro ao entrar na equipe: ' + joinErr.message);
          }
        }
        const idToken = await userCredential.user.getIdToken();
        const otpRes = await fetch('/api/enviarCodigoVerificacao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ userId: userCredential.user.uid }),
        });
        const codeSent = otpRes.ok;
        Email.boasVindas(email, name);
        Email.boasVindasPlano(email, name, 'chinam');
        toast.success('Conta criada! Verifique seu e-mail para ativar a conta.');
        navigate(eventoIdParam ? '/dashboard' : '/verificar-email', { state: { codeSent } });
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (eventoIdParam && !isAdminEmail(cred.user.email)) {
          try {
            await processEquipeJoin(eventoIdParam);
          } catch (joinErr: any) {
            toast.error('Erro ao entrar na equipe: ' + joinErr.message);
          }
        }
        setLoginAttempts(0);
        setResetSent(false);
        toast.success('Bem-vindo de volta!');
        navigate(isAdminEmail(cred.user.email) ? '/desenvolvimento/admin' : (redirectParam || '/desenvolvimento/dashboard'));
      }
    } catch (error: any) {
      if (!isRegistering) {
        const next = loginAttempts + 1;
        setLoginAttempts(next);
        if (next >= 3) {
          try {
            await fetch('/api/enviarRedefinicaoSenha', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });
            setResetSent(true);
            toast.error('Muitas tentativas. Enviamos um link de redefinição de senha para seu e-mail.');
          } catch {
            toast.error('Senha incorreta. Clique em "Esqueceu sua senha?" para redefinir.');
          }
        } else {
          const remaining = 3 - next;
          toast.error(`Senha incorreta. Mais ${remaining} tentativa${remaining > 1 ? 's' : ''} antes do envio automático de redefinição.`);
        }
      } else {
        toast.error('Erro ao criar conta: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--sidebar)] via-[var(--sidebar)] to-[hsl(var(--primary)/0.8)] flex flex-col items-center justify-center p-6">
      <div className="fixed top-0 left-0 p-4">
        <Link to="/desenvolvimento" className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm font-semibold">
          <ArrowRight className="w-4 h-4 rotate-180" /> Voltar
        </Link>
      </div>
      <div className="w-full max-w-sm">
        {/* Logo + headline */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <Logo variant="white" />
          <div className="text-center mt-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {inviteEmailParam ? 'Você foi convidado!' : isRegistering ? 'Criar conta' : 'Bem-vindo de volta!'}
            </h1>
            <p className="text-white/60 text-sm mt-1">
              {inviteEmailParam
                ? `Crie sua conta com o e-mail ${inviteEmailParam} para entrar na equipe.`
                : isRegistering ? 'Preencha seus dados para começar.' : 'Gestão de eventos simplificada e profissional.'}
            </p>
          </div>
        </div>

        {/* Invite banner */}
        {inviteEmailParam && (
          <div className="bg-amber-400/20 border border-amber-400/40 rounded-2xl p-4 mb-4 text-center">
            <p className="text-amber-200 text-xs font-bold leading-relaxed">
              Use obrigatoriamente o e-mail <span className="text-white">{inviteEmailParam}</span> para que o acesso ao evento seja ativado automaticamente.
            </p>
          </div>
        )}

        {/* Card */}
        <div className="bg-white/10 border-2 border-white/20 rounded-3xl p-7 backdrop-blur-sm space-y-5">

          {/* Email form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-white/70">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl h-12 focus-visible:ring-white/40"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-white/70">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={e => { if (!inviteEmailParam) { setEmail(e.target.value); setLoginAttempts(0); setResetSent(false); } }}
                  readOnly={!!inviteEmailParam}
                  placeholder="seu@email.com"
                  className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl h-12 focus-visible:ring-white/40 ${inviteEmailParam ? 'opacity-80 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-white/70">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (isRegistering) setPasswordStrength(calcStrength(e.target.value)); }}
                  placeholder="••••••••"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl h-12 focus-visible:ring-white/40"
                />
              </div>
              {isRegistering && password && (
                <div className="space-y-1.5 pt-0.5">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={cn(
                      'h-full rounded-full transition-all duration-300',
                      passwordStrength === 'forte' ? 'w-full bg-emerald-400' :
                      passwordStrength === 'média' ? 'w-2/3 bg-yellow-400' :
                      'w-1/3 bg-red-400'
                    )} />
                  </div>
                  <p className="text-[10px] text-white/50">
                    Força: <span className={cn(
                      'font-semibold',
                      passwordStrength === 'forte' ? 'text-emerald-400' :
                      passwordStrength === 'média' ? 'text-yellow-400' :
                      'text-red-400'
                    )}>{passwordStrength}</span> · mínimo 8 caracteres, use letras maiúsculas, números e símbolos
                  </p>
                </div>
              )}
              {!isRegistering && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-[11px] text-white/60 hover:text-white transition-colors underline underline-offset-2"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              )}
            </div>

            {isRegistering && (
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lgpdConsent}
                  onChange={e => setLgpdConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary shrink-0"
                />
                <span className="text-[11px] text-white/60 leading-relaxed">
                  Li e aceito a{' '}
                  <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2 hover:text-white/80">
                    Política de Privacidade
                  </a>{' '}
                  e os{' '}
                  <a href="/termos-de-uso" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2 hover:text-white/80">
                    Termos de Uso
                  </a>
                  {' '}da Tovia.
                </span>
              </label>
            )}

            {resetSent && (
              <div className="rounded-2xl bg-amber-400/20 border border-amber-400/40 px-4 py-3 text-center">
                <p className="text-amber-200 text-xs font-bold leading-relaxed">
                  Enviamos um link de redefinição para <span className="text-white">{email}</span>. Verifique sua caixa de entrada e spam.
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || (isRegistering && !lgpdConsent)}
              className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-sm bg-white text-primary hover:bg-white/90 disabled:opacity-40 shadow-xl transition-all mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Aguarde...</>
              ) : (
                <>{isRegistering ? 'Criar conta' : 'Entrar'} <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/15" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-[10px] uppercase font-semibold tracking-widest text-white/30 bg-transparent">ou</span>
            </div>
          </div>

          {/* Google */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-all"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Entrar com Google
          </Button>

          {/* Toggle register/login */}
          <p className="text-center text-xs text-white/50">
            {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem conta?'}{' '}
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-white font-semibold underline underline-offset-2 hover:text-white/80 transition-colors"
            >
              {isRegistering ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
        </div>

        <p className="text-center text-white/20 text-xs mt-8">
          Tovia Eventos © 2026
        </p>
      </div>
    </div>
  );
}
