import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';
import { getDocument, createDocument } from './firebase-utils';
import { UserProfile, PlanLevel } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  loginAsDemo: () => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
  loginAsDemo: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
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
        email: "teste@ekko.com",
        plano,
        isDemo: true
      };

      // Ensure profile exists in Firestore for isAdmin/isOwner checks
      await createDocument('users', firebaseUser.uid, demoProfile);
      
      setUser(firebaseUser);
      setProfile(demoProfile);
      try {
        localStorage.setItem('ekko_demo_plan', plano);
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
      localStorage.removeItem('ekko_demo_plan');
    } catch (e) {
      console.warn('LocalStorage removeItem denied:', e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          let userProfile = await getDocument<UserProfile>('users', firebaseUser.uid);

          if (!userProfile) {
            const isAdmin = firebaseUser.email === 'admin@ekko.app';
            userProfile = {
              uid: firebaseUser.uid,
              nome: firebaseUser.displayName || (isAdmin ? 'Admin' : ''),
              email: firebaseUser.email || '',
              plano: isAdmin ? null : 'start',
            };
            await createDocument('users', firebaseUser.uid, userProfile);
          }
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
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady, loginAsDemo, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
