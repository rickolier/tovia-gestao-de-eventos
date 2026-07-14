import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, inMemoryPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyDu6uRQ2f9RJEOtjH_HW8Rkh52IZ-HvLKg',
  authDomain: 'ai-studio-applet-webapp-84f64.firebaseapp.com',
  projectId: 'ai-studio-applet-webapp-84f64',
  storageBucket: 'ai-studio-applet-webapp-84f64.firebasestorage.app',
  messagingSenderId: '963351262851',
  appId: '1:963351262851:web:0ee155f4e5f3d2e1710db6',
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);

// Web: browserLocalPersistence (sobrevive a reloads)
// Native: inMemoryPersistence (AsyncStorage pode ser adicionado depois)
const persistence = Platform.OS === 'web' ? browserLocalPersistence : inMemoryPersistence;

export const auth = getApps().length > 1
  ? getAuth(app)
  : initializeAuth(app, { persistence });

export const db = getFirestore(app, 'ai-studio-5b5d834d-8788-4cb4-90df-ca1c7e43a048');

export default app;
