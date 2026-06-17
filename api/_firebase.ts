// @ts-nocheck
/* eslint-disable */
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 não configurada.');
  const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseId: 'ai-studio-5b5d834d-8788-4cb4-90df-ca1c7e43a048',
  });
}

// Singleton com databaseId configurado via initializeApp (mais confiável que settings())
let _db: any = null;
export function getDb() {
  if (!_db) {
    _db = admin.firestore();
  }
  return _db;
}

// Lazy getter — não executa no import, só quando primeiro usado
export const db = new Proxy({} as any, {
  get(_target, prop) {
    return getDb()[prop];
  },
});
