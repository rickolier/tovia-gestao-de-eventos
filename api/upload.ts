import type { VercelRequest, VercelResponse } from '@vercel/node';
import sharp from 'sharp';
import { getStorage } from 'firebase-admin/storage';
import { db, verifyAuth } from './_firebase.js';
import type { AuthError } from './_types.js';

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 10;

async function checkRateLimit(uid: string): Promise<boolean> {
  const key = `uploadProfilePhoto_${uid}`;
  const ref = db.collection('_rate_limits').doc(key);
  const snap = await ref.get();
  const now = Date.now();
  if (snap.exists) {
    const data = snap.data()!;
    const requests: number[] = (data.requests || []).filter((t: number) => now - t < RATE_WINDOW_MS);
    if (requests.length >= RATE_LIMIT) return false;
    requests.push(now);
    await ref.set({ requests });
  } else {
    await ref.set({ requests: [now] });
  }
  return true;
}

const BUCKET = 'ai-studio-applet-webapp-84f64.firebasestorage.app';

// ── uploadProfilePhoto ──
async function handleUploadProfilePhoto(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let decoded;
  try {
    decoded = await verifyAuth(req.headers.authorization);
  } catch (e: unknown) {
    const authErr = e as AuthError;
    return res.status(authErr.status ?? 401).json({ error: authErr.message });
  }

  const uid = decoded.uid;
  const { imageBase64, contentType } = req.body as { imageBase64?: string; contentType?: string };

  if (!imageBase64 || !contentType) return res.status(400).json({ error: 'imageBase64 e contentType são obrigatórios.' });

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(contentType)) return res.status(400).json({ error: 'Tipo inválido. Use JPEG, PNG ou WebP.' });
  if (imageBase64.length > 7 * 1024 * 1024) return res.status(400).json({ error: 'Imagem muito grande. Máximo 5MB.' });

  const buffer = Buffer.from(imageBase64, 'base64');

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isWebp = buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';
  if (!isJpeg && !isPng && !isWebp) return res.status(400).json({ error: 'O arquivo enviado não é uma imagem válida.' });

  const allowed = await checkRateLimit(uid);
  if (!allowed) return res.status(429).json({ error: 'Muitos uploads. Tente novamente mais tarde.' });

  try {
    const resized = await sharp(buffer)
      .resize(300, 300, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 85 })
      .toBuffer();

    const path = `profiles/${uid}/foto`;
    const bucket = getStorage().bucket(BUCKET);
    const file = bucket.file(path);
    await file.save(resized, { contentType: 'image/jpeg', resumable: false });
    await file.makePublic();

    const downloadUrl = `https://storage.googleapis.com/${BUCKET}/${path}?t=${Date.now()}`;
    await db.collection('users').doc(uid).update({ imagem_url: downloadUrl });

    console.log(`[uploadProfilePhoto] uid=${uid}`);
    return res.json({ downloadUrl });
  } catch (err: unknown) {
    console.error('[uploadProfilePhoto]', err);
    return res.status(500).json({ error: 'Erro ao processar imagem.' });
  }
}

// ── uploadEventCover ──
async function handleUploadEventCover(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let decoded;
  try {
    decoded = await verifyAuth(req.headers.authorization);
  } catch (e: unknown) {
    const authErr = e as AuthError;
    return res.status(authErr.status ?? 401).json({ error: authErr.message });
  }

  const uid = decoded.uid;
  const { eventoId, imageBase64, contentType } = req.body as { eventoId?: string; imageBase64?: string; contentType?: string };

  if (!eventoId || !imageBase64 || !contentType) return res.status(400).json({ error: 'eventoId, imageBase64 e contentType são obrigatórios.' });

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(contentType)) return res.status(400).json({ error: 'Tipo de imagem inválido. Use JPEG, PNG ou WebP.' });
  if (imageBase64.length > 7 * 1024 * 1024) return res.status(400).json({ error: 'Imagem muito grande. Máximo 5MB.' });

  try {
    const eventoSnap = await db.collection('eventos').doc(eventoId).get();
    if (!eventoSnap.exists) return res.status(404).json({ error: 'Evento não encontrado.' });
    const criado_por: string = eventoSnap.data()!.criado_por ?? '';
    if (criado_por !== uid) return res.status(403).json({ error: 'Você não tem permissão para alterar este evento.' });

    const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
    const path = `eventos/${eventoId}/capa.${ext}`;
    const buffer = Buffer.from(imageBase64, 'base64');

    const bucket = getStorage().bucket(BUCKET);
    const file = bucket.file(path);
    await file.save(buffer, { contentType, resumable: false });
    await file.makePublic();

    const downloadUrl = `https://storage.googleapis.com/${BUCKET}/${path}?t=${Date.now()}`;
    await db.collection('eventos').doc(eventoId).update({ imagem_url: downloadUrl });

    console.log(`[uploadEventCover] uid=${uid} evento=${eventoId} path=${path}`);
    return res.json({ downloadUrl });
  } catch (err: unknown) {
    console.error('[uploadEventCover]', err);
    return res.status(500).json({ error: 'Erro ao fazer upload da capa.' });
  }
}

// ── Router ──
const handlers: Record<string, (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse | void>> = {
  uploadProfilePhoto: handleUploadProfilePhoto,
  uploadEventCover: handleUploadEventCover,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = (req.query.action as string) || req.body?.action;
  const fn = action ? handlers[action] : undefined;
  if (!fn) return res.status(400).json({ error: `Ação inválida: ${action}. Use ?action=<nome>` });
  return fn(req, res);
}
