import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, verifyAuth } from './_firebase.js';
import type { AuthError } from './_types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let decoded;
  try {
    decoded = await verifyAuth(req.headers.authorization);
  } catch (e: unknown) {
    const authErr = e as AuthError;
    return res.status(authErr.status ?? 401).json({ error: authErr.message });
  }

  // Admin check
  const callerEmail = decoded.email;
  const isToviaMaster = callerEmail === 'admin@tovia.app';
  if (!isToviaMaster) {
    const adminDoc = await db.collection('admins').doc(decoded.uid).get();
    if (!adminDoc.exists) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
  }

  const { userId } = req.body as { userId?: string };
  if (!userId) {
    return res.status(400).json({ error: 'userId é obrigatório.' });
  }

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    await db.collection('users').doc(userId).update({
      desativado: true,
      plano: null,
      planoPendente: null,
    });

    return res.json({ success: true });
  } catch (err: unknown) {
    console.error('[suspendUser]', err);
    return res.status(500).json({ error: 'Erro ao suspender usuário.' });
  }
}
