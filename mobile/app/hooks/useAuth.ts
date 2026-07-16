import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

type UserProfile = {
  uid: string;
  email: string;
  name: string;
  nome: string;
  plan: 'chinam' | 'petach' | 'koach' | 'chalem';
  isAdmin: boolean;
  instituicao?: string;
  bio?: string;
  codigo?: string;
  imagem_url?: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            name: data.nome ?? data.name ?? '',
            nome: data.nome ?? data.name ?? '',
            plan: data.plano ?? data.plan ?? 'chinam',
            isAdmin: data.isAdmin ?? false,
            instituicao: data.instituicao,
            bio: data.bio,
            codigo: data.codigo,
            imagem_url: data.imagem_url,
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  return { user, profile, loading };
}
