import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, verifyAuth } from './_firebase.js';
import type { AuthError } from './types.js';
import { sendEmailSchema } from './schemas.js';
import { validateBody } from './validate.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'Tovia <noreply@toviaapp.com.br>';
const ADMIN_EMAILS = ['admin@toviaapp.com.br', 'suporte@toviaapp.com.br'];

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 10;

async function checkRateLimit(uid: string): Promise<boolean> {
  const key = `sendemail_${uid}`;
  const ref = db.collection('_rate_limits').doc(key);
  const snap = await ref.get();
  const now = Date.now();
  if (snap.exists) {
    const data = snap.data()!;
    const requests: number[] = ((data.requests || []) as number[]).filter((t: number) => now - t < RATE_WINDOW_MS);
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

  let decoded: Awaited<ReturnType<typeof verifyAuth>>;
  try {
    decoded = await verifyAuth(req.headers.authorization);
  } catch (e: unknown) {
    const authErr = e as AuthError;
    return res.status(authErr.status ?? 401).json({ error: authErr.message });
  }

  const allowed = await checkRateLimit(decoded.uid);
  if (!allowed) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
  }

  const data = validateBody(req.body, res, sendEmailSchema);
  if (!data) return;
  const { to, subject, html } = data;

  const isAdmin = ADMIN_EMAILS.includes(decoded.email ?? '');
  const toList: string[] = Array.isArray(to) ? to : [to];

  // Não-admins só podem enviar para o próprio email autenticado
  if (!isAdmin) {
    const selfEmail = decoded.email?.toLowerCase();
    const allToSelf = toList.every(addr => addr.toLowerCase() === selfEmail);
    if (!allToSelf) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
  }

  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada — e-mail não enviado.');
    return res.json({ ok: true, skipped: true });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: toList, subject, html }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Falha ao enviar e-mail.', detail: err });
    }

    const data = await response.json() as { id?: string };
    return res.json({ ok: true, id: data.id });
  } catch (err: unknown) {
    console.error('sendEmail error:', (err as Error).message);
    return res.status(500).json({ error: 'Erro interno ao enviar e-mail.' });
  }
}
