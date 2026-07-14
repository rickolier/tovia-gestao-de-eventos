import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

type UserProfile = {
  uid: string;
  email: string;
  name: string;
  plan: 'chinam' | 'petach' | 'koach' | 'chalem';
  isAdmin: boolean;
  trialDaysLeft?: number;
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
            plan: data.plan ?? 'chinam',
            isAdmin: data.isAdmin ?? false,
            trialDaysLeft: data.trialDaysLeft,
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
