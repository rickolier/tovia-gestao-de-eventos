import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lê a service account — ajuste o caminho se necessário
const serviceAccountPath = process.argv[2];
if (!serviceAccountPath) {
  console.error('Uso: node scripts/setup-users.mjs <caminho-para-serviceAccount.json>');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(resolve(serviceAccountPath), 'utf8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(undefined, 'ai-studio-5b5d834d-8788-4cb4-90df-ca1c7e43a048');

const ADMIN_UID  = 'stOwcocGw4frP67QGQCc90BZx6g2';
const TESTE_UID  = 'NNIxZV91ySTJI8ZYlhKZ0X088Af1';

async function setup() {
  // 1. Documento do admin
  await db.collection('users').doc(ADMIN_UID).set({
    uid: ADMIN_UID,
    nome: 'Admin Tovia',
    email: 'admin@tovia.app',
    plano: 'pro',
  });
  console.log('✓ users/admin criado');

  // 2. Entrada na coleção admins (para isAdmin() nas regras do Firestore)
  await db.collection('admins').doc(ADMIN_UID).set({ admin: 'true' });
  console.log('✓ admins/admin criado');

  // 3. Documento do usuário teste PRO
  await db.collection('users').doc(TESTE_UID).set({
    uid: TESTE_UID,
    nome: 'Usuário Teste',
    email: 'teste@tovia.app',
    plano: 'pro',
  });
  console.log('✓ users/teste PRO criado');

  console.log('\nSetup concluído!');
}

setup().catch(err => { console.error(err); process.exit(1); });
