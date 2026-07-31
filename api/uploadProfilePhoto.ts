import type { VercelRequest, VercelResponse } from '@vercel/node';
import sharp from 'sharp';
import { getStorage } from 'firebase-admin/storage';
import { db, verifyAuth } from './_firebase.js';
import type { AuthError } from './_types.js';

const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
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
  const { imageBase64, contentType } = req.body as {
    imageBase64?: string;
    contentType?: string;
  };

  if (!imageBase64 || !contentType) {
    return res.status(400).json({ error: 'imageBase64 e contentType são obrigatórios.' });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(contentType)) {
    return res.status(400).json({ error: 'Tipo inválido. Use JPEG, PNG ou WebP.' });
  }

  if (imageBase64.length > 7 * 1024 * 1024) {
    return res.status(400).json({ error: 'Imagem muito grande. Máximo 5MB.' });
  }

  const buffer = Buffer.from(imageBase64, 'base64');

  // Validate magic bytes
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isWebp = buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';
  if (!isJpeg && !isPng && !isWebp) {
    return res.status(400).json({ error: 'O arquivo enviado não é uma imagem válida.' });
  }

  const allowed = await checkRateLimit(uid);
  if (!allowed) {
    return res.status(429).json({ error: 'Muitos uploads. Tente novamente mais tarde.' });
  }

  try {
    const resized = await sharp(buffer)
      .resize(300, 300, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 85 })
      .toBuffer();

    const path = `profiles/${uid}/foto`;
    const bucket = getStorage().bucket('ai-studio-applet-webapp-84f64.firebasestorage.app');
    const file = bucket.file(path);
    await file.save(resized, { contentType: 'image/jpeg', resumable: false });
    await file.makePublic();

    const downloadUrl = `https://storage.googleapis.com/ai-studio-applet-webapp-84f64.firebasestorage.app/${path}?t=${Date.now()}`;

    await db.collection('users').doc(uid).update({ imagem_url: downloadUrl });

    console.log(`[uploadProfilePhoto] uid=${uid}`);
    return res.json({ downloadUrl });
  } catch (err: unknown) {
    console.error('[uploadProfilePhoto]', err);
    return res.status(500).json({ error: 'Erro ao processar imagem.' });
  }
}
