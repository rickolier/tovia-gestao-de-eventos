// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_firebase.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Rate limiting: 3 magic links per email per 10 minutes
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 3;

async function checkRateLimit(email: string): Promise<boolean> {
  const key = `magic_${email.replace(/[^a-z0-9]/gi, '_')}`;
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { email } = req.body as { email?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'E-mail inválido.' });
  }

  const emailNorm = email.trim().toLowerCase();

  // Verify that at least one inscription exists for this email
  const snap = await db.collectionGroup('inscricoes')
    .where('email', '==', emailNorm)
    .limit(1)
    .get();

  if (snap.empty) {
    // Return 200 to avoid email enumeration — client shows generic success
    return res.json({ ok: true });
  }

  // Rate limit
  const allowed = await checkRateLimit(emailNorm);
  if (!allowed) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
  }

  // Generate token and store in Firestore (1-hour TTL)
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const expiresAt = Date.now() + 60 * 60 * 1000;
  await db.collection('email_tokens').doc(token).set({ email: emailNorm, expiresAt });

  // Build magic link — works on both Vercel and Firebase Hosting
  const baseUrl = req.headers.origin || 'https://tovia-gestao-de-eventos.vercel.app';
  const acessoUrl = `${baseUrl}/consultar?email=${encodeURIComponent(emailNorm)}&token=${token}`;

  // Send email via Resend
  await resend.emails.send({
    from: 'Tovia <noreply@toviaapp.com.br>',
    to: emailNorm,
    subject: 'Seu link de acesso às inscrições — Tovia',
    html: buildEmailHtml(acessoUrl),
  });

  return res.json({ ok: true });
}

function buildEmailHtml(acessoUrl: string): string {
  const PRIMARY = '#1a7a45';
  const MUTED = '#6b7280';
  const TEXT = '#1a1a1a';
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<div style="display:none;max-height:0;overflow:hidden;">Seu link de acesso às inscrições</div>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f6f3;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f3;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:${PRIMARY};border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <span style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;">tovia</span>
          <span style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.5);display:block;letter-spacing:3px;margin-top:2px;">GESTÃO DE EVENTOS</span>
        </td></tr>
        <tr><td style="background:#fff;padding:40px;border-radius:0 0 16px 16px;">
          <h1 style="font-size:26px;font-weight:900;color:${TEXT};margin:0 0 12px;line-height:1.2;">Acesse suas inscrições 🎟️</h1>
          <p style="font-size:15px;color:${MUTED};line-height:1.7;margin:0 0 12px;">Você solicitou um link de acesso às suas inscrições. Clique no botão abaixo — ele é válido por <strong>1 hora</strong>:</p>
          <a href="${acessoUrl}" style="display:inline-block;background:${PRIMARY};color:#fff;font-weight:800;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;margin-top:24px;letter-spacing:0.5px;">Acessar minhas inscrições</a>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;"/>
          <p style="font-size:15px;color:${MUTED};line-height:1.7;margin:0 0 12px;">Se você não solicitou este e-mail, pode ignorá-lo com segurança.</p>
        </td></tr>
        <tr><td style="padding:24px 40px;text-align:center;">
          <p style="font-size:12px;color:${MUTED};margin:0;">© ${new Date().getFullYear()} Tovia Gestão de Eventos · Todos os direitos reservados</p>
          <p style="font-size:12px;color:${MUTED};margin:4px 0 0;">Você recebeu este e-mail porque tem inscrições na plataforma Tovia.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
