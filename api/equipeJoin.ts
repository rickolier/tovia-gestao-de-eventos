// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDb } from './_firebase';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { idToken, eventoId } = req.body || {};
  if (!idToken || !eventoId) {
    return res.status(400).json({ error: 'idToken e eventoId são obrigatórios.' });
  }

  let decodedToken;
  try {
    decodedToken = await getAuth(getApp()).verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: 'Token inválido.' });
  }

  const { uid, email, name } = decodedToken;
  if (!email || email === 'admin@tovia.app') {
    return res.status(403).json({ error: 'Operação não permitida.' });
  }

  const db = getDb();
  const eventoRef = db.collection('eventos').doc(eventoId);
  const eventoSnap = await eventoRef.get();

  if (!eventoSnap.exists) {
    return res.status(404).json({ error: 'Evento não encontrado.' });
  }

  const evento = eventoSnap.data();
  const equipeAtual: any[] = evento.equipe || [];

  if (equipeAtual.some((m: any) => m.userId === uid)) {
    return res.json({ ok: true, alreadyMember: true });
  }

  const membro = {
    userId: uid,
    email: email.toLowerCase(),
    nome: name || email.toLowerCase(),
    permissoes: ['registrations', 'management', 'rooms', 'tasks'],
    adicionadoEm: new Date().toISOString(),
  };

  await eventoRef.update({
    equipe: FieldValue.arrayUnion(membro),
    equipeIds: FieldValue.arrayUnion(uid),
  });

  return res.json({ ok: true });
}
