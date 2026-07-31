import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStorage } from 'firebase-admin/storage';
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
  const { eventoId, imageBase64, contentType } = req.body as {
    eventoId?: string;
    imageBase64?: string;
    contentType?: string;
  };

  if (!eventoId || !imageBase64 || !contentType) {
    return res.status(400).json({ error: 'eventoId, imageBase64 e contentType são obrigatórios.' });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(contentType)) {
    return res.status(400).json({ error: 'Tipo de imagem inválido. Use JPEG, PNG ou WebP.' });
  }

  // Max 5MB (base64 ~7MB string)
  if (imageBase64.length > 7 * 1024 * 1024) {
    return res.status(400).json({ error: 'Imagem muito grande. Máximo 5MB.' });
  }

  try {
    // Verify ownership
    const eventoSnap = await db.collection('eventos').doc(eventoId).get();
    if (!eventoSnap.exists) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }
    const criado_por: string = eventoSnap.data()!.criado_por ?? '';
    if (criado_por !== uid) {
      return res.status(403).json({ error: 'Você não tem permissão para alterar este evento.' });
    }

    const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
    const path = `eventos/${eventoId}/capa.${ext}`;
    const buffer = Buffer.from(imageBase64, 'base64');

    const bucket = getStorage().bucket('ai-studio-applet-webapp-84f64.firebasestorage.app');
    const file = bucket.file(path);
    await file.save(buffer, { contentType, resumable: false });
    await file.makePublic();

    const downloadUrl = `https://storage.googleapis.com/ai-studio-applet-webapp-84f64.firebasestorage.app/${path}?t=${Date.now()}`;

    await db.collection('eventos').doc(eventoId).update({ imagem_url: downloadUrl });

    console.log(`[uploadEventCover] uid=${uid} evento=${eventoId} path=${path}`);
    return res.json({ downloadUrl });
  } catch (err: unknown) {
    console.error('[uploadEventCover]', err);
    return res.status(500).json({ error: 'Erro ao fazer upload da capa.' });
  }
}
