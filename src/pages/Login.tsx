import React, { useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import Logo from '../components/Logo';

import { useAuth } from '../lib/AuthContext';

export default function Login() {
  const { user, isAuthReady, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthReady && user) {
      navigate('/dashboard');
    }
  }, [user, isAuthReady, navigate]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Erro ao entrar com Google: ' + error.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        toast.success('Conta criada com sucesso!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Bem-vindo de volta!');
      }
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error('Erro na autenticação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      await loginAsDemo();
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao acessar demonstração');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-2xl bg-card rounded-[2.5rem] overflow-hidden">
          <div className="h-2 bg-primary" />
          <CardHeader className="text-center pt-8 pb-4">
            <div className="flex justify-center mb-6">
              <Logo className="scale-125" />
            </div>
            <CardTitle className="text-2xl font-black text-foreground tracking-tight">Bem-vindo de volta!</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Gestão de eventos simplificada e profissional
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8 pb-10">
            <div className="space-y-6">
              <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 text-center mb-6">
                <p className="text-sm text-primary font-bold mb-4 italic">Acesso rápido habilitado para demonstração</p>
                <Button 
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full bg-primary hover:bg-primary/90 text-white h-14 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 font-black text-lg shadow-xl shadow-primary/20"
                >
                  <LogIn className="w-6 h-6" />
                  Acessar painel
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                  <span className="bg-card px-2 text-muted-foreground/60">Outras opções</span>
                </div>
              </div>

              <Button 
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                className="w-full border-border hover:bg-muted h-12 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Entrar com Google
              </Button>

              <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20">
                <p className="text-[10px] text-center text-muted-foreground font-medium">
                  Ekko Eventos © 2026 - Todos os direitos reservados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
