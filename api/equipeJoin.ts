// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Firebase client API key (public — already exposed in frontend bundle)
const FIREBASE_API_KEY = require('../firebase-applet-config.json').apiKey;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { idToken, eventoId } = req.body || {};
  if (!idToken || !eventoId) {
    return res.status(400).json({ error: 'idToken e eventoId são obrigatórios.' });
  }

  try {
    // Verificação via Firebase Auth REST API — sem dependência de jose/jwks-rsa
    const verifyResp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    const verifyData = await verifyResp.json();
    if (!verifyResp.ok || !verifyData.users?.length) {
      return res.status(401).json({ error: 'Token inválido.', detail: verifyData });
    }

    const firebaseUser = verifyData.users[0];
    const uid: string = firebaseUser.localId;
    const email: string = firebaseUser.email || '';
    const name: string = firebaseUser.displayName || email;

    if (!email || email === 'admin@tovia.app') {
      return res.status(403).json({ error: 'Operação não permitida.' });
    }

    // Escrita no Firestore via Admin SDK (não usa jose)
    const { getDb } = require('./_firebase');
    const { FieldValue } = require('firebase-admin/firestore');

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

    // Notificar o dono do evento sobre o novo membro
    if (evento.criado_por) {
      const notifId = `eq_${eventoId}_${uid}`;
      const notifRef = db.collection('notificacoes').doc(notifId);
      const notifSnap = await notifRef.get();
      if (!notifSnap.exists) {
        await notifRef.set({
          id: notifId,
          userId: evento.criado_por,
          eventoId,
          tipo: 'equipe_novo_membro',
          titulo: 'Novo membro entrou na equipe',
          mensagem: `${name} entrou na equipe do evento "${evento.nome || eventoId}" via link de convite.`,
          data: new Date().toISOString(),
          lida: false,
          acao_requirida: false,
          dados_acao: { membroEmail: email, membroNome: name, membroId: uid },
        });
      }
    }

    console.log('[equipeJoin] sucesso');
    return res.json({ ok: true });

  } catch (e: any) {
    console.error('[equipeJoin] erro:', e?.message, e?.code);
    return res.status(500).json({ error: e?.message || 'Erro interno.', code: e?.code });
  }
}
