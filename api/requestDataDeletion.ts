import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';
import { FieldValue } from 'firebase-admin/firestore';
import { db, verifyAuth } from './_firebase.js';
import type { AuthError } from './_types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let decoded;
  try {
    decoded = await verifyAuth(req.headers.authorization);
  } catch (e: unknown) {
    const authErr = e as AuthError;
    return res.status(authErr.status ?? 401).json({ error: authErr.message });
  }

  const uid = decoded.uid;

  try {
    // Anonymize personal data
    await db.collection('users').doc(uid).update({
      nome: '[Conta Excluída]',
      email: '[excluído]',
      whatsapp: FieldValue.delete(),
      bio: FieldValue.delete(),
      descricao: FieldValue.delete(),
      imagem_url: FieldValue.delete(),
      contato_email: FieldValue.delete(),
      telefone: FieldValue.delete(),
      site: FieldValue.delete(),
      redes_social: FieldValue.delete(),
      cnpj: FieldValue.delete(),
      cep: FieldValue.delete(),
      endereco: FieldValue.delete(),
      gateway: FieldValue.delete(),
      gateway_connected: false,
      deletion_requested_at: new Date().toISOString(),
      deletion_status: 'pending',
    });

    // Remove public organizer data
    await db.collection('organizer_public').doc(uid).delete();

    // Disable Firebase Auth account
    await getAuth(getApp()).updateUser(uid, { disabled: true });

    return res.json({ success: true });
  } catch (err: unknown) {
    console.error('[requestDataDeletion]', err);
    return res.status(500).json({ error: 'Erro ao processar solicitação de exclusão.' });
  }
}
