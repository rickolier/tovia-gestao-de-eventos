import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db, verifyAuth } from './_firebase.js';
import { randomBytes } from 'crypto';
import type { AuthError } from './_types.js';
import { enviarCodigoVerificacaoSchema } from './_schemas.js';
import { validateBody } from './_validate.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'Tovia <noreply@toviaapp.com.br>';
const BASE_URL = process.env.BASE_URL || 'https://toviaapp.com.br';

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 3;
const TOKEN_TTL_MS = 30 * 60 * 1000;

const PRIMARY = '#FF6B1A';
const MUTED = '#6b7280';
const TEXT = '#1a1a1a';

function emailWrap(content: string) {
  return `<!DOCTYPE html><html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta name="color-scheme" content="light"/>
<meta name="supported-color-schemes" content="light"/>
<meta name="x-apple-disable-message-reformatting"/>
<style>:root{color-scheme:light only;}body{margin:0!important;padding:0!important;background-color:#f5f3f0!important;}</style>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f3f0;margin:0;padding:0;" bgcolor="#f5f3f0">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f3f0" style="background-color:#f5f3f0;padding:40px 16px;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td bgcolor="${PRIMARY}" style="background-color:${PRIMARY}!important;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
<span style="font-size:28px;font-weight:900;color:#ffffff!important;-webkit-text-fill-color:#ffffff;letter-spacing:-1px;">tovia</span>
<span style="font-size:11px;font-weight:600;color:#FFB380!important;-webkit-text-fill-color:#FFB380;display:block;letter-spacing:3px;margin-top:4px;">GESTÃO DE EVENTOS</span>
</td></tr>
<tr><td bgcolor="#ffffff" style="background-color:#ffffff!important;padding:40px;border-radius:0 0 16px 16px;">${content}</td></tr>
<tr><td style="padding:24px 40px;text-align:center;">
<p style="font-size:12px;color:${MUTED};margin:0;">© ${new Date().getFullYear()} Tovia Gestão de Eventos</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `verify_${userId}`;
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const body = validateBody(req.body, res, enviarCodigoVerificacaoSchema);
  if (!body) return;
  const { userId } = body;

  try {
    await verifyAuth(req.headers.authorization, userId);
  } catch (e: unknown) {
    const authErr = e as AuthError;
    return res.status(authErr.status ?? 401).json({ error: authErr.message });
  }

  try {
    const userRecord = await getAuth(getApp()).getUser(userId);
    if (userRecord.emailVerified) return res.json({ ok: true, alreadyVerified: true });

    const allowed = await checkRateLimit(userId);
    if (!allowed) return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });

    const token = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + TOKEN_TTL_MS;

    await db.collection('verification_tokens').doc(token).set({ userId, expiresAt });

    const verifyUrl = `${BASE_URL}/confirmar-email?token=${token}`;
    const nome = userRecord.displayName || 'organizador';

    const html = emailWrap(`
      <h1 style="font-size:24px;font-weight:900;color:${TEXT};margin:0 0 12px;">Confirme seu e-mail ✉️</h1>
      <p style="font-size:15px;color:${MUTED};line-height:1.7;margin:0 0 28px;">
        Olá, <strong>${nome}</strong>! Clique no botão abaixo para confirmar seu e-mail e liberar o acesso ao Tovia.
      </p>
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${verifyUrl}" style="display:inline-block;background:${PRIMARY};color:#ffffff;font-size:16px;font-weight:900;text-decoration:none;padding:16px 48px;border-radius:16px;letter-spacing:1px;text-transform:uppercase;">
          Confirmar meu e-mail
        </a>
      </div>
      <p style="font-size:12px;color:${MUTED};margin:0 0 16px;line-height:1.6;">
        Ou copie e cole este link no navegador:
      </p>
      <p style="font-size:11px;color:${PRIMARY};word-break:break-all;margin:0 0 24px;">
        ${verifyUrl}
      </p>
      <p style="font-size:12px;color:${MUTED};margin:0;line-height:1.6;">
        Este link é válido por <strong>30 minutos</strong>. Se você não criou uma conta no Tovia, pode ignorar este e-mail.
      </p>
    `);

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY não configurada — link não enviado.');
      return res.status(500).json({ error: 'Serviço de e-mail não configurado.' });
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [userRecord.email!], subject: 'Confirme seu e-mail — Tovia', html }),
    });
    if (!emailRes.ok) {
      const errBody = await emailRes.json().catch(() => ({}));
      console.error('Resend error ao enviar link:', JSON.stringify(errBody));
      return res.status(500).json({ error: 'Não foi possível enviar o e-mail. Tente novamente.' });
    }

    return res.json({ ok: true });
  } catch (err: unknown) {
    console.error('enviarCodigoVerificacao error:', (err as Error).message);
    return res.status(500).json({ error: 'Não foi possível enviar o e-mail. Tente novamente.' });
  }
}
