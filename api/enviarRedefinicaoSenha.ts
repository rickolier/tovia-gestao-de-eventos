import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db } from './_firebase.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'Tovia <noreply@toviaapp.com.br>';
const APP_URL = 'https://tovia-gestao-de-eventos.vercel.app';

const PRIMARY = '#FF6B1A';
const MUTED = '#6b7280';
const TEXT = '#1a1a1a';

function emailWrap(content: string) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f3f0;margin:0;padding:0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3f0;padding:40px 16px;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:${PRIMARY};border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
<span style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;">tovia</span>
</td></tr>
<tr><td style="background:#fff;padding:40px;border-radius:0 0 16px 16px;">${content}</td></tr>
<tr><td style="padding:24px 40px;text-align:center;">
<p style="font-size:12px;color:${MUTED};margin:0;">© ${new Date().getFullYear()} Tovia Gestão de Eventos</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

// Rate limit: 3 tentativas por e-mail por 10 minutos
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 3;

async function checkRateLimit(email: string): Promise<boolean> {
  const key = `reset_${email.replace(/[^a-z0-9]/gi, '_')}`;
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

  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'E-mail inválido.' });
  }

  const emailNorm = email.trim().toLowerCase();

  const allowed = await checkRateLimit(emailNorm);
  if (!allowed) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
  }

  try {
    // Verifica se o usuário existe — mas retorna sucesso mesmo se não existir (segurança)
    let nome = 'organizador';
    try {
      const userRecord = await getAuth(getApp()).getUserByEmail(emailNorm);
      nome = userRecord.displayName || 'organizador';
    } catch {
      // Usuário não encontrado — retorna ok para não vazar informação
      return res.json({ ok: true });
    }

    const link = await getAuth(getApp()).generatePasswordResetLink(emailNorm, {
      url: `${APP_URL}/login`,
    });

    const html = emailWrap(`
      <h1 style="font-size:24px;font-weight:900;color:${TEXT};margin:0 0 12px;">Redefinir senha 🔑</h1>
      <p style="font-size:15px;color:${MUTED};line-height:1.7;margin:0 0 20px;">
        Olá, <strong>${nome}</strong>! Recebemos uma solicitação para redefinir a senha da sua conta Tovia.<br/>
        Clique no botão abaixo para criar uma nova senha.
      </p>
      <a href="${link}" style="display:inline-block;background:${PRIMARY};color:#fff;font-weight:800;font-size:15px;padding:16px 36px;border-radius:12px;text-decoration:none;">
        Redefinir minha senha
      </a>
      <p style="font-size:13px;color:${MUTED};margin:28px 0 0;line-height:1.6;">
        Se você não solicitou a redefinição de senha, pode ignorar este e-mail com segurança.<br/>
        O link expira em <strong>1 hora</strong>.
      </p>
    `);

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY não configurada');
      return res.json({ ok: true });
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [emailNorm], subject: 'Redefinição de senha — Tovia 🔑', html }),
    });

    return res.json({ ok: true });
  } catch (err: unknown) {
    console.error('enviarRedefinicaoSenha error:', (err as Error).message);
    return res.status(500).json({ error: 'Não foi possível enviar o e-mail. Tente novamente.' });
  }
}
