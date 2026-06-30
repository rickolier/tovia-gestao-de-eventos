// @ts-nocheck
/* eslint-disable */
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 não configurada.');
  const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  initializeApp({ credential: cert(serviceAccount) });
}

let _db: any = null;
export function getDb() {
  if (!_db) _db = getFirestore(getApp(), 'ai-studio-5b5d834d-8788-4cb4-90df-ca1c7e43a048');
  return _db;
}

export const db = new Proxy({} as any, {
  get(_target, prop) {
    return getDb()[prop];
  },
});

/** Verifica Firebase ID Token do header Authorization: Bearer <token>.
 *  Retorna o DecodedIdToken ou lança erro com status 401/403. */
export async function verifyAuth(authHeader: string | undefined, expectedUid?: string) {
  if (!authHeader?.startsWith('Bearer ')) {
    const err: any = new Error('Não autenticado.');
    err.status = 401;
    throw err;
  }
  const token = authHeader.slice(7);
  let decoded: any;
  try {
    decoded = await getAuth(getApp()).verifyIdToken(token);
  } catch {
    const err: any = new Error('Token inválido ou expirado.');
    err.status = 401;
    throw err;
  }
  if (expectedUid && decoded.uid !== expectedUid) {
    const err: any = new Error('Acesso negado.');
    err.status = 403;
    throw err;
  }
  return decoded;
}
