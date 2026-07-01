import * as Sentry from '@sentry/react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { auth } from '~/services/firebase';
import { getDocument, createDocument, listDocuments, removeDocument } from '~/services/firestore';
import { notifIfReadOrMissing } from '~/utils/notifications';
import { UserProfile, PlanLevel, ConvitePendente } from '../types';
import { where, doc, getDocFromServer } from 'firebase/firestore';
import { db } from '~/services/firebase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  loginAsDemo: () => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  processEquipeJoin: (eventoId: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
  loginAsDemo: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
  processEquipeJoin: async () => null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const loginAsDemo = async (plano: PlanLevel = 'pro') => {
    setLoading(true);
    try {
      // Sign in anonymously to get a real Firebase Auth session for rules
      const userCredential = await signInAnonymously(auth);
      const firebaseUser = userCredential.user;

      const demoProfile: UserProfile = {
        uid: firebaseUser.uid,
        nome: `Usuário Teste ${plano.toUpperCase()}`,
        email: "teste@tovia.com",
        plano,
        isDemo: true
      };

      // Ensure profile exists in Firestore for isAdmin/isOwner checks
      await createDocument('users', firebaseUser.uid, demoProfile);
      
      setUser(firebaseUser);
      setProfile(demoProfile);
      try {
        localStorage.setItem('tovia_demo_plan', plano);
      } catch (e) {
        console.warn('LocalStorage setItem denied:', e);
      }
    } catch (error: any) {
      console.error('Demo login error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('O Login Anônimo não está ativado no console do Firebase. Por favor, ative-o em Authentication > Sign-in method.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const snap = await getDocFromServer(doc(db, 'users', user.uid));
      if (snap.exists()) setProfile(snap.data() as UserProfile);
    } catch {
      const updated = await getDocument<UserProfile>('users', user.uid);
      if (updated) setProfile(updated);
    }
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
    setProfile(null);
    try {
      localStorage.removeItem('tovia_demo_plan');
    } catch (e) {
      console.warn('LocalStorage removeItem denied:', e);
    }
  };

  // Adiciona o usuário logado a um evento via eventoId (chamado pelo link de equipe)
  // Usa API route server-side (admin SDK) para contornar regras do Firestore
  const processEquipeJoin = async (eventoId: string): Promise<string | null> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser?.email || firebaseUser.email === 'admin@tovia.app') return null;
    const idToken = await firebaseUser.getIdToken(true);
    const res = await fetch('/api/equipeJoin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, eventoId }),
    });
    const body = await res.json().catch(() => ({}));
    console.log('[equipeJoin] response:', res.status, body);
    if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
    return body;
  };

  // Processa convites pendentes por e-mail — roda uma vez por sessão após login/cadastro
  const processarConvites = async (firebaseUser: User) => {
    if (!firebaseUser.email || firebaseUser.email === 'admin@tovia.app') return;
    if (sessionStorage.getItem('convitesProcessed')) return;
    sessionStorage.setItem('convitesProcessed', '1');

    const email = firebaseUser.email.toLowerCase();
    try {
      const convites = await listDocuments<ConvitePendente>('convites', [
        where('email', '==', email),
      ]);
      for (const convite of convites) {
        const idToken = await firebaseUser.getIdToken();
        const joinRes = await fetch('/api/equipeJoin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken, eventoId: convite.eventoId }),
        });
        if (joinRes.ok) {
          try {
            await fetch('/api/sendEmail', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: firebaseUser.email,
                subject: `Você entrou na equipe de ${convite.eventoNome}! 🎯`,
                html: (await import('~/services/email-templates')).emailConfirmacaoVinculo(
                  firebaseUser.displayName || firebaseUser.email,
                  convite.eventoNome
                ),
              }),
            });
          } catch (e) { console.warn('Email vínculo falhou:', e); }
        }
        await removeDocument('convites', convite.id);
      }
    } catch (e) { console.warn('Erro ao processar convites pendentes:', e); }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          let userProfile = await getDocument<UserProfile>('users', firebaseUser.uid);

          if (!userProfile) {
            const isAdmin = firebaseUser.email === 'admin@tovia.app';
            userProfile = {
              uid: firebaseUser.uid,
              nome: firebaseUser.displayName || (isAdmin ? 'Admin' : ''),
              email: firebaseUser.email || '',
              plano: isAdmin ? null : 'start',
            };
            await createDocument('users', firebaseUser.uid, userProfile);
          }

          await processarConvites(firebaseUser);

          if (!userProfile.isDemo) {
            const isComplete = !!(userProfile.nome?.trim() && userProfile.whatsapp?.trim() && userProfile.instituicao?.trim());
            if (!isComplete) {
              notifIfReadOrMissing(`perf_${firebaseUser.uid}`, {
                userId: firebaseUser.uid,
                tipo: 'perfil_incompleto',
                titulo: 'Complete seu perfil',
                mensagem: 'Adicione WhatsApp e instituição ao seu perfil para uma melhor experiência.',
                data: new Date().toISOString(),
                lida: false,
                acao_requirida: false,
              }).catch(() => {});
            }
          }

          setProfile(userProfile);
          Sentry.setUser({ id: firebaseUser.uid, email: firebaseUser.email ?? undefined });
        } else {
          setUser(null);
          setProfile(null);
          Sentry.setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsAuthReady(true);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady, loginAsDemo, logout, refreshProfile, processEquipeJoin }}>
      {children}
    </AuthContext.Provider>
  );
};
