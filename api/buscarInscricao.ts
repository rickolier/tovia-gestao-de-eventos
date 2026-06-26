// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_firebase';

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

  const { cpf } = req.body as { cpf?: string };
  if (!cpf) return res.status(400).json({ error: 'CPF é obrigatório.' });

  const cpfDigits = String(cpf).replace(/\D/g, '');
  if (!validateCPF(cpfDigits)) {
    return res.status(400).json({ error: 'CPF inválido.' });
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

    const results = await Promise.all(
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

    // Sort: most recent first
    results.sort((a, b) =>
      new Date(b.dataInscricao).getTime() - new Date(a.dataInscricao).getTime()
    );

    return res.json({ inscricoes: results });
  } catch (err: any) {
    console.error('[buscarInscricao]', err?.message);
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
}
