// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './_firebase.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'Tovia <noreply@toviaapp.com.br>';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await verifyAuth(req.headers.authorization);
  } catch (e: any) {
    return res.status(e.status ?? 401).json({ error: e.message });
  }

  const { to, subject, html } = req.body || {};
  if (!to || !subject || !html) return res.status(400).json({ error: 'to, subject e html são obrigatórios.' });

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
      body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Falha ao enviar e-mail.', detail: err });
    }

    const data = await response.json();
    return res.json({ ok: true, id: data.id });
  } catch (err: any) {
    console.error('sendEmail error:', err.message);
    return res.status(500).json({ error: 'Erro interno ao enviar e-mail.' });
  }
}
