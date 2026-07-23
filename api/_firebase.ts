import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { AuthError } from './types.js';

let _initError: Error | null = null;

if (!getApps().length) {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) {
    _initError = new Error('FIREBASE_SERVICE_ACCOUNT_B64 não configurada.');
  } else {
    try {
      const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      initializeApp({ credential: cert(serviceAccount) });
    } catch (e: unknown) {
      _initError = e instanceof Error ? e : new Error(String(e));
    }
  }
}

let _db: Firestore | null = null;
export function getDb(): Firestore {
  if (_initError) throw _initError;
  if (!_db) _db = getFirestore(getApp(), 'ai-studio-5b5d834d-8788-4cb4-90df-ca1c7e43a048');
  return _db;
}

export const db = new Proxy({} as Firestore, {
  get(_target, prop: string) {
    return (getDb() as unknown as Record<string, unknown>)[prop];
  },
});

export async function verifyAuth(authHeader: string | undefined, expectedUid?: string) {
  if (_initError) {
    const err = new Error('Serviço indisponível: ' + _initError.message) as AuthError;
    err.status = 503;
    throw err;
  }
  if (!authHeader?.startsWith('Bearer ')) {
    const err = new Error('Não autenticado.') as AuthError;
    err.status = 401;
    throw err;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = await getAuth(getApp()).verifyIdToken(token);
    if (expectedUid && decoded.uid !== expectedUid) {
      const err = new Error('Acesso negado.') as AuthError;
      err.status = 403;
      throw err;
    }
    return decoded;
  } catch (e) {
    if ((e as AuthError).status) throw e;
    const err = new Error('Token inválido ou expirado.') as AuthError;
    err.status = 401;
    throw err;
  }
}
