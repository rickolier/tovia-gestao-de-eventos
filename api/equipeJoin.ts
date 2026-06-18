// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { idToken, eventoId } = req.body || {};
  if (!idToken || !eventoId) {
    return res.status(400).json({ error: 'idToken e eventoId são obrigatórios.' });
  }

  // Diagnóstico: verifica se o env var está presente
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) {
    console.error('[equipeJoin] FIREBASE_SERVICE_ACCOUNT_B64 não configurada');
    return res.status(500).json({ error: 'FIREBASE_SERVICE_ACCOUNT_B64 não configurada no servidor.' });
  }

  try {
    // Importação dinâmica para capturar erros de inicialização no try-catch
    const { getApp } = require('firebase-admin/app');
    const { getAuth } = require('firebase-admin/auth');
    const { getDb } = require('./_firebase');
    const { FieldValue } = require('firebase-admin/firestore');

    // Verifica o token do usuário
    let uid: string, email: string, name: string;
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

    console.log('[equipeJoin] sucesso uid:', uid, 'eventoId:', eventoId);
    return res.json({ ok: true });

  } catch (e: any) {
    console.error('[equipeJoin] erro:', e?.message, e?.code, e?.stack?.split('\n')[0]);
    return res.status(500).json({ error: e?.message || 'Erro interno.', code: e?.code });
  }
}
