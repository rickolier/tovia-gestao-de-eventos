// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db, verifyAuth } from './_firebase.js';

const MAX_ATTEMPTS = 5;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { userId, code } = req.body || {};
  if (!userId || !code) return res.status(400).json({ error: 'Dados incompletos.' });

  try {
    await verifyAuth(req.headers.authorization, userId);
  } catch (e: any) {
    return res.status(e.status ?? 401).json({ error: e.message });
  }

  try {
    const docRef = db.collection('verification_codes').doc(userId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(400).json({ error: 'Nenhum código encontrado. Solicite um novo.' });
    }

    const data = snap.data()!;

    if (Date.now() > data.expiresAt) {
      await docRef.delete();
      return res.status(400).json({ error: 'Código expirado. Solicite um novo.' });
    }

    if (data.attempts >= MAX_ATTEMPTS) {
      await docRef.delete();
      return res.status(400).json({ error: 'Muitas tentativas incorretas. Solicite um novo código.' });
    }

    if (data.code !== String(code)) {
      await docRef.set({ ...data, attempts: data.attempts + 1 }, { merge: true });
      const remaining = MAX_ATTEMPTS - (data.attempts + 1);
      return res.status(400).json({
        error: remaining > 0
          ? `Código incorreto. Ainda ${remaining} tentativa${remaining !== 1 ? 's' : ''}.`
          : 'Código incorreto. Solicite um novo.',
      });
    }

    await getAuth(getApp()).updateUser(userId, { emailVerified: true });
    await docRef.delete();

    return res.json({ ok: true });
  } catch (err: any) {
    console.error('confirmarCodigoVerificacao error:', err.message);
    return res.status(500).json({ error: 'Erro ao verificar. Tente novamente.' });
  }
}
