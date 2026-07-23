import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_firebase.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = 'Tovia <noreply@toviaapp.com.br>';

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 3;
const CODE_TTL_MS = 10 * 60 * 1000;

const PRIMARY = '#FF6B1A';
const MUTED = '#6b7280';
const TEXT = '#1a1a1a';

async function checkRateLimit(email: string): Promise<boolean> {
  const key = `inscricao_otp_${email.replace(/[^a-z0-9]/gi, '_')}`;
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

function docKey(email: string) {
  return Buffer.from(email).toString('base64').replace(/[/+=]/g, '_');
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

  const allowed = await checkRateLimit(emailNorm);
  if (!allowed) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + CODE_TTL_MS;

  await db.collection('inscricao_codes').doc(docKey(emailNorm)).set({
    email: emailNorm,
    code,
    expiresAt,
    attempts: 0,
  });

  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada');
    return res.status(500).json({ error: 'Serviço de e-mail não configurado.' });
  }

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [emailNorm],
      subject: `${code} é seu código para consultar inscrição — Tovia`,
      html: buildEmailHtml(code),
    }),
  });

  if (!emailRes.ok) {
    console.error('Resend error:', await emailRes.text().catch(() => ''));
    return res.status(500).json({ error: 'Não foi possível enviar o código. Tente novamente.' });
  }

  // Sempre retorna ok — não revela se o email tem inscrições
  return res.json({ ok: true });
}

function buildEmailHtml(code: string): string {
  return `<!DOCTYPE html><html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta name="color-scheme" content="light"/><meta name="supported-color-schemes" content="light"/>
<style>:root{color-scheme:light only;}body{margin:0!important;padding:0!important;}</style>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f3f0;margin:0;padding:0;" bgcolor="#f5f3f0">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f3f0" style="background:#f5f3f0;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td bgcolor="${PRIMARY}" style="background:${PRIMARY}!important;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <span style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;">tovia</span>
          <span style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.6);display:block;letter-spacing:3px;margin-top:4px;">GESTÃO DE EVENTOS</span>
        </td></tr>
        <tr><td bgcolor="#ffffff" style="background:#fff!important;padding:40px;border-radius:0 0 16px 16px;">
          <h1 style="font-size:24px;font-weight:900;color:${TEXT};margin:0 0 12px;">Seu código de acesso 🎟️</h1>
          <p style="font-size:15px;color:${MUTED};line-height:1.7;margin:0 0 24px;">
            Use o código abaixo para consultar suas inscrições. Ele é válido por <strong>10 minutos</strong>.
          </p>
          <div style="background:#fff5ef;border:2px solid #FFD4B3;border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;">
            <p style="font-size:13px;color:${MUTED};margin:0 0 8px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Código de verificação</p>
            <p style="font-size:52px;font-weight:900;color:${PRIMARY};letter-spacing:14px;margin:0;font-variant-numeric:tabular-nums;">${code}</p>
            <p style="font-size:12px;color:${MUTED};margin:12px 0 0;">Válido por <strong>10 minutos</strong></p>
          </div>
          <p style="font-size:13px;color:${MUTED};margin:0;line-height:1.6;">
            Se você não solicitou este código, pode ignorar este e-mail com segurança.
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;text-align:center;">
          <p style="font-size:12px;color:${MUTED};margin:0;">© ${new Date().getFullYear()} Tovia Gestão de Eventos · Todos os direitos reservados</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
