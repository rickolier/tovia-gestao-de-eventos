// @ts-nocheck
/* eslint-disable */
const admin = require('firebase-admin');

if (!admin.apps.length) {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 não configurada.');
  const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

// Firestore com banco de dados nomeado
let _db: any = null;
function getDb() {
  if (!_db) {
    _db = admin.firestore();
    _db.settings({ databaseId: 'ai-studio-5b5d834d-8788-4cb4-90df-ca1c7e43a048' });
  }
  return _db;
}

export const db = getDb();
