// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_firebase';
import { FieldValue } from 'firebase-admin/firestore';

const RATE_LIMIT_MAX = 10;      // max requests
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `buscar_${ip.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const ref = db.collection('_rate_limits').doc(key);
  const now = Date.now();

  try {
    const allowed = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        tx.set(ref, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
      }
      const data = snap.data()!;
      if (now > data.resetAt) {
        tx.set(ref, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
      }
      if (data.count >= RATE_LIMIT_MAX) return false;
      tx.update(ref, { count: FieldValue.increment(1) });
      return true;
    });
    return allowed;
  } catch {
    return true; // fail open if Firestore unavailable
  }
}

function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(d[10]);
}

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  pagamento_iniciado: 'Pagamento em andamento',
  pago: 'Confirmada',
  ajuda_solicitada: 'Ajuda solicitada',
  analise: 'Em análise',
  cancelada: 'Cancelada',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  // Rate limit by IP — max 10 requests per 5 minutes
  const ip = String(
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return res.status(429).json({ error: 'Muitas consultas. Aguarde alguns minutos e tente novamente.' });
  }

  const { cpf, dataNascimento } = req.body as { cpf?: string; dataNascimento?: string };
  if (!cpf) return res.status(400).json({ error: 'CPF é obrigatório.' });
  if (!dataNascimento) return res.status(400).json({ error: 'Data de nascimento é obrigatória.' });

  const cpfDigits = String(cpf).replace(/\D/g, '');
  if (!validateCPF(cpfDigits)) {
    return res.status(400).json({ error: 'CPF inválido.' });
  }

  // Normalize date to YYYY-MM-DD
  const dataNasc = String(dataNascimento).replace(/[^0-9\-]/g, '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataNasc)) {
    return res.status(400).json({ error: 'Data de nascimento inválida.' });
  }

  try {
    // Query inscricoes directly by cpf field (stored as digits)
    const inscSnap = await db.collectionGroup('inscricoes')
      .where('cpf', '==', cpfDigits)
      .limit(20)
      .get();

    if (inscSnap.empty) {
      return res.json({ inscricoes: [] });
    }

    const eventoCache: Record<string, any> = {};

    const allResults = await Promise.all(
      inscSnap.docs.map(async (inscDoc) => {
        const insc = inscDoc.data();
        const pathParts = inscDoc.ref.path.split('/');
        const eventoId = pathParts[1];

        // Cache evento lookups
        if (!eventoCache[eventoId]) {
          const eventoDoc = await db.collection('eventos').doc(eventoId).get();
          eventoCache[eventoId] = eventoDoc.exists
            ? eventoDoc.data()
            : { nome: 'Evento', data_inicio: '', local: '' };
        }
        const evento = eventoCache[eventoId];

        const valorTotal: number = insc.valor_total ?? 0;
        const valorPago: number = insc.valor_pago ?? 0;
        const status: string = insc.status ?? 'pendente';

        // Validate data_nascimento when available in the record
        const storedDate: string = insc.data_nascimento ?? '';
        if (storedDate) {
          const normalized = storedDate.slice(0, 10);
          if (normalized !== dataNasc) return null; // mismatch — exclude
        }

        return {
          inscricaoId: inscDoc.id,
          eventoId,
          eventoNome: evento.nome ?? 'Evento',
          eventoData: evento.data_inicio ?? '',
          eventoLocal: evento.local ?? '',
          ticketNome: insc.ticket_nome ?? '',
          status,
          statusLabel: STATUS_LABELS[status] ?? status,
          valorTotal,
          valorPago,
          formaPagamento: insc.forma_pagamento ?? '',
          nome: insc.nome ?? '',
          dataInscricao: insc.data_inscricao ?? '',
        };
      })
    );

    const results = allResults.filter(Boolean);

    // Sort: most recent first
    results.sort((a, b) =>
      new Date(b!.dataInscricao).getTime() - new Date(a!.dataInscricao).getTime()
    );

    return res.json({ inscricoes: results });
  } catch (err: any) {
    console.error('[buscarInscricao]', err?.message);
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
}
