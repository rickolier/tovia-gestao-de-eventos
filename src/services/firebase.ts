import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import firebaseConfig from '../../firebase-applet-config.json';

// getApps()[0] ?? init evita re-inicialização no HMR do Vite
const app = getApps()[0] ?? initializeApp(firebaseConfig);

// App Check — protege Firestore/Functions contra acesso direto via apiKey pública.
// Em dev/localhost, reCAPTCHA v3 falha; o debug token contorna isso.
// O token gerado aparece no console — adicione-o em Firebase Console → App Check → Debug tokens.
if (import.meta.env.DEV) {
  (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = '49a1cd31-033d-4466-a285-eb97b7986f70';
}

if (getApps().length === 1) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LfPHD0tAAAAAAx1WB9Zy1zACXwKVXoALgx15SOA'),
    isTokenAutoRefreshEnabled: true,
  });
}

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
