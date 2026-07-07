// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_firebase.js';

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  pagamento_iniciado: 'Pagamento em andamento',
  pago: 'Confirmada',
  ajuda_solicitada: 'Ajuda solicitada',
  analise: 'Em análise',
  cancelada: 'Cancelada',
};

async function buildResult(inscDoc: any, eventoCache: Record<string, any>) {
  const insc = inscDoc.data();
  const pathParts = inscDoc.ref.path.split('/');
  const eventoId = pathParts[1];

  if (!eventoCache[eventoId]) {
    const eventoDoc = await db.collection('eventos').doc(eventoId).get();
    eventoCache[eventoId] = eventoDoc.exists
      ? eventoDoc.data()
      : { nome: 'Evento', data_inicio: '', local: '' };
  }
  const evento = eventoCache[eventoId];
  const status: string = insc.status ?? 'pendente';

  return {
    inscricaoId: inscDoc.id,
    eventoId,
    eventoNome: evento.nome ?? 'Evento',
    eventoData: evento.data_inicio ?? '',
    eventoLocal: evento.local ?? '',
    ticketNome: insc.ticket_nome ?? '',
    status,
    statusLabel: STATUS_LABELS[status] ?? status,
    valorTotal: insc.valor_total ?? 0,
    valorPago: insc.valor_pago ?? 0,
    formaPagamento: insc.forma_pagamento ?? '',
    nome: insc.nome ?? '',
    dataInscricao: insc.data_inscricao ?? '',
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { email, token } = req.body as { email?: string; token?: string };
  if (!email || !token) return res.status(400).json({ error: 'email e token são obrigatórios.' });

  const emailNorm = String(email).trim().toLowerCase();
  const eventoCache: Record<string, any> = {};

  try {
    // 1. Tenta magic token (acesso a todas as inscrições do email)
    const magicRef = db.collection('email_tokens').doc(token);
    const magicSnap = await magicRef.get();

    if (magicSnap.exists) {
      const magic = magicSnap.data()!;
      if (magic.email !== emailNorm) return res.status(403).json({ error: 'Token inválido.' });
      if (Date.now() > magic.expiresAt) {
        await magicRef.delete();
        return res.status(403).json({ error: 'Link expirado. Solicite um novo.' });
      }
      // Busca todas as inscrições para esse email
      const snap = await db.collectionGroup('inscricoes')
        .where('email', '==', emailNorm)
        .limit(50)
        .get();
      const results = await Promise.all(snap.docs.map(d => buildResult(d, eventoCache)));
      results.sort((a, b) => new Date(b.dataInscricao).getTime() - new Date(a.dataInscricao).getTime());
      // Invalida o magic token após uso
      await magicRef.delete();
      return res.json({ inscricoes: results });
    }

    // 2. Tenta token de inscrição específica
    const snap = await db.collectionGroup('inscricoes')
      .where('email', '==', emailNorm)
      .where('token', '==', token)
      .limit(5)
      .get();

    if (snap.empty) return res.status(403).json({ error: 'Token inválido ou link expirado.' });

    const results = await Promise.all(snap.docs.map(d => buildResult(d, eventoCache)));
    results.sort((a, b) => new Date(b.dataInscricao).getTime() - new Date(a.dataInscricao).getTime());
    return res.json({ inscricoes: results });

  } catch (err: any) {
    console.error('[buscarPorToken]', err?.message);
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
}
