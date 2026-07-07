// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db, verifyAuth } from './_firebase.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'Tovia <noreply@toviaapp.com.br>';
const APP_URL = 'https://tovia-gestao-de-eventos.vercel.app';

const PRIMARY = '#1a7a45';
const MUTED = '#6b7280';
const TEXT = '#1a1a1a';

function emailWrap(content: string) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f6f3;margin:0;padding:0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f3;padding:40px 16px;">
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'Dados incompletos.' });

  try {
    await verifyAuth(req.headers.authorization, userId);
  } catch (e: any) {
    return res.status(e.status ?? 401).json({ error: e.message });
  }

  try {
    const userRecord = await getAuth(getApp()).getUser(userId);
    const email = userRecord.email;
    const nome = userRecord.displayName || 'organizador';

    if (!email) return res.status(400).json({ error: 'Usuário sem e-mail.' });

    if (userRecord.emailVerified) {
      return res.json({ ok: true, alreadyVerified: true });
    }

    const link = await getAuth(getApp()).generateEmailVerificationLink(email, {
      url: `${APP_URL}/verificar-email`,
    });

    const html = emailWrap(`
      <h1 style="font-size:24px;font-weight:900;color:${TEXT};margin:0 0 12px;">Confirme seu e-mail ✉️</h1>
      <p style="font-size:15px;color:${MUTED};line-height:1.7;margin:0 0 20px;">
        Olá, <strong>${nome}</strong>! Estamos quase lá.<br/>
        Clique no botão abaixo para confirmar seu endereço de e-mail e liberar o acesso ao Tovia.
      </p>
      <a href="${link}" style="display:inline-block;background:${PRIMARY};color:#fff;font-weight:800;font-size:15px;padding:16px 36px;border-radius:12px;text-decoration:none;">
        Confirmar meu e-mail
      </a>
      <p style="font-size:13px;color:${MUTED};margin:28px 0 0;line-height:1.6;">
        Se você não criou uma conta no Tovia, pode ignorar este e-mail com segurança.<br/>
        O link expira em <strong>24 horas</strong>.
      </p>
    `);

    await resend.emails.send({
      from: FROM,
      to: [email],
      subject: 'Confirme seu e-mail — Tovia ✉️',
      html,
    });

    return res.json({ ok: true });
  } catch (err: any) {
    console.error('enviarVerificacaoEmail error:', err.message);
    return res.status(500).json({ error: 'Não foi possível enviar o e-mail. Tente novamente.' });
  }
}
