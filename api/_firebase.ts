import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializa o Firebase Admin SDK uma única vez
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64 || '', 'base64').toString('utf8')
  );
  initializeApp({ credential: cert(serviceAccount) });
}

export const db = getFirestore('ai-studio-5b5d834d-8788-4cb4-90df-ca1c7e43a048');
