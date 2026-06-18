import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';
import { getDocument, createDocument, listDocuments, updateDocument, removeDocument } from './firebase-utils';
import { UserProfile, PlanLevel, ConvitePendente, EquipeMembro, Evento } from '../types';
import { where, arrayUnion } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  loginAsDemo: () => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  processEquipeJoin: (eventoId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
  loginAsDemo: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
  processEquipeJoin: async () => {},
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
    const updated = await getDocument<UserProfile>('users', user.uid);
    if (updated) setProfile(updated);
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
  const processEquipeJoin = async (eventoId: string) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser?.email || firebaseUser.email === 'admin@tovia.app') return;
    const email = firebaseUser.email.toLowerCase();
    try {
      const evento = await getDocument<Evento>('eventos', eventoId);
      if (evento && !(evento.equipe || []).some(m => m.userId === firebaseUser.uid)) {
        const membro: EquipeMembro = {
          userId: firebaseUser.uid,
          email,
          nome: firebaseUser.displayName || email,
          permissoes: ['registrations', 'management', 'rooms', 'tasks'],
          adicionadoEm: new Date().toISOString(),
        };
        await updateDocument('eventos', eventoId, {
          equipe: [...(evento.equipe || []), membro],
          equipeIds: arrayUnion(firebaseUser.uid),
        } as any);
      }
    } catch (e) { console.warn('Erro ao processar link de equipe:', e); }
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
        const evento = await getDocument<Evento>('eventos', convite.eventoId);
        if (evento && !(evento.equipe || []).some(m => m.userId === firebaseUser.uid)) {
          const membro: EquipeMembro = {
            userId: firebaseUser.uid,
            email,
            nome: firebaseUser.displayName || email,
            permissoes: convite.permissoes,
            adicionadoEm: new Date().toISOString(),
          };
          await updateDocument('eventos', convite.eventoId, {
            equipe: [...(evento.equipe || []), membro],
            equipeIds: arrayUnion(firebaseUser.uid),
          } as any);
          try {
            await fetch('/api/sendEmail', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: firebaseUser.email,
                subject: `Você entrou na equipe de ${convite.eventoNome}! 🎯`,
                html: (await import('./email-templates')).emailConfirmacaoVinculo(
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

            // Novo cadastro via link de equipe
            const pendingEventoId = sessionStorage.getItem('pendingEquipeEventoId');
            if (pendingEventoId) {
              sessionStorage.removeItem('pendingEquipeEventoId');
              await processEquipeJoin(pendingEventoId);
            }
          }

          await processarConvites(firebaseUser);

          setProfile(userProfile);
        } else {
          setUser(null);
          setProfile(null);
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
