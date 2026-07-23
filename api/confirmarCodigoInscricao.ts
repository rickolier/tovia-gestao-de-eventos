import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_firebase.js';

const MAX_ATTEMPTS = 5;

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  pagamento_iniciado: 'Pagamento em andamento',
  pago: 'Confirmada',
  ajuda_solicitada: 'Ajuda solicitada',
  analise: 'Em análise',
  cancelada: 'Cancelada',
};

function docKey(email: string) {
  return Buffer.from(email).toString('base64').replace(/[/+=]/g, '_');
}

async function buildResult(inscDoc: FirebaseFirestore.QueryDocumentSnapshot, eventoCache: Record<string, Record<string, string> | undefined>) {
  const insc = inscDoc.data();
  const pathParts = inscDoc.ref.path.split('/');
  const eventoId = pathParts[1];

  if (!eventoCache[eventoId]) {
    const eventoDoc = await db.collection('eventos').doc(eventoId).get();
    const d = eventoDoc.exists ? eventoDoc.data() : undefined;
    eventoCache[eventoId] = (d as Record<string, string> | undefined) ?? { nome: 'Evento', data_inicio: '', local: '' };
  }
  const evento = eventoCache[eventoId] ?? { nome: 'Evento', data_inicio: '', local: '' };
  const status: string = insc.status ?? 'pendente';

  return {
    inscricaoId: inscDoc.id,
    eventoId,
    eventoNome: evento.nome ?? 'Evento',
    eventoData: evento.data_inicio ?? '',
    eventoDataFim: evento.data_fim ?? '',
    eventoLocal: evento.local ?? '',
    ticketNome: insc.ticket_nome ?? '',
    status,
    statusLabel: STATUS_LABELS[status] ?? status,
    valorTotal: insc.valor_total ?? 0,
    valorPago: insc.valor_pago ?? 0,
    formaPagamento: insc.forma_pagamento ?? '',
    nome: insc.nome ?? '',
    dataInscricao: insc.data_inscricao ?? '',
    presenca: insc.presenca ?? false,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { email, code } = req.body as { email?: string; code?: string };
  if (!email || !code) return res.status(400).json({ error: 'E-mail e código são obrigatórios.' });

  const emailNorm = email.trim().toLowerCase();
  const codeNorm = String(code).replace(/\D/g, '').trim();

  const docRef = db.collection('inscricao_codes').doc(docKey(emailNorm));

  try {
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(400).json({ error: 'Nenhum código encontrado. Solicite um novo.' });
    }

    const data = snap.data()!;

    if (data.email !== emailNorm) {
      return res.status(400).json({ error: 'Código inválido.' });
    }

    if (Date.now() > data.expiresAt) {
      await docRef.delete();
      return res.status(400).json({ error: 'Código expirado. Solicite um novo.' });
    }

    if (data.attempts >= MAX_ATTEMPTS) {
      await docRef.delete();
      return res.status(400).json({ error: 'Muitas tentativas incorretas. Solicite um novo código.' });
    }

    if (data.code !== codeNorm) {
      await docRef.set({ ...data, attempts: data.attempts + 1 }, { merge: true });
      const remaining = MAX_ATTEMPTS - (data.attempts + 1);
      return res.status(400).json({
        error: remaining > 0
          ? `Código incorreto. Ainda ${remaining} tentativa${remaining !== 1 ? 's' : ''}.`
          : 'Código incorreto. Solicite um novo.',
      });
    }

    // Código válido — deleta imediatamente (uso único)
    await docRef.delete();

    const eventoCache: Record<string, any> = {};
    const inscSnap = await db.collectionGroup('inscricoes')
      .where('email', '==', emailNorm)
      .limit(50)
      .get();

    const results = inscSnap.empty
      ? []
      : await Promise.all(inscSnap.docs.map(d => buildResult(d, eventoCache)));

    results.sort((a, b) => new Date(b.dataInscricao).getTime() - new Date(a.dataInscricao).getTime());

    return res.json({ inscricoes: results });
  } catch (err: unknown) {
    console.error('[confirmarCodigoInscricao]', (err as Error)?.message);
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
}
