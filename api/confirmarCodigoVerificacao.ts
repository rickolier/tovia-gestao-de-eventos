// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db } from './_firebase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = (req.query.token || req.body?.token) as string;
  if (!token) return res.status(400).json({ error: 'Token ausente.' });

  try {
    const docRef = db.collection('verification_tokens').doc(token);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(400).json({ error: 'Link inválido ou já utilizado.' });
    }

    const data = snap.data()!;

    if (Date.now() > data.expiresAt) {
      await docRef.delete();
      return res.status(400).json({ error: 'Link expirado. Solicite um novo.' });
    }

    await getAuth(getApp()).updateUser(data.userId, { emailVerified: true });
    await docRef.delete();

    return res.json({ ok: true, userId: data.userId });
  } catch (err: any) {
    console.error('confirmarCodigoVerificacao error:', err.message);
    return res.status(500).json({ error: 'Erro ao verificar. Tente novamente.' });
  }
}
