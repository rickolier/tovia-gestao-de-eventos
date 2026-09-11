import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApp } from './_firebase';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore(getApp());

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });

  const codigo = req.query.codigo as string;
  if (!codigo || typeof codigo !== 'string' || codigo.length > 50) {
    return res.status(400).json({ error: 'Código inválido.' });
  }

  try {
    const snap = await db.collection('eventos').where('codigo', '==', codigo).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: 'Evento não encontrado.' });
    return res.json({ eventoId: snap.docs[0].id });
  } catch (err: unknown) {
    console.error('resolveEventCode error:', (err as Error).message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}
