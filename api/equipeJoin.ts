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

  let uid: string;
  let email: string;
  let name: string;

  try {
    const decoded = await getAuth(getApp()).verifyIdToken(idToken);
    uid = decoded.uid;
    email = decoded.email || '';
    name = decoded.name || decoded.email || '';
  } catch (e: any) {
    return res.status(401).json({ error: 'Token inválido.', detail: e?.message });
  }

  if (!email || email === 'admin@tovia.app') {
    return res.status(403).json({ error: 'Operação não permitida.' });
  }

  try {
    const db = getDb();
    const eventoRef = db.collection('eventos').doc(eventoId);
    const eventoSnap = await eventoRef.get();

    if (!eventoSnap.exists) {
      return res.status(404).json({ error: 'Evento não encontrado.', eventoId });
    }

    const evento = eventoSnap.data() || {};
    const equipeAtual: any[] = evento.equipe || [];

    if (equipeAtual.some((m: any) => m.userId === uid)) {
      return res.json({ ok: true, alreadyMember: true });
    }

    const membro = {
      userId: uid,
      email: email.toLowerCase(),
      nome: name,
      permissoes: ['registrations', 'management', 'rooms', 'tasks'],
      adicionadoEm: new Date().toISOString(),
    };

    await eventoRef.update({
      equipe: FieldValue.arrayUnion(membro),
      equipeIds: FieldValue.arrayUnion(uid),
    });

    return res.json({ ok: true });
  } catch (e: any) {
    console.error('[equipeJoin] Firestore error:', e?.message, e?.code);
    return res.status(500).json({ error: e?.message || 'Erro interno.', code: e?.code });
  }
}
