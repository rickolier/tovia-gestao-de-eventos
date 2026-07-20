// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db } from './_firebase.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'Tovia <noreply@toviaapp.com.br>';

const PRIMARY = '#FF6B1A';
const MUTED = '#6b7280';
const TEXT = '#1a1a1a';

function emailWrap(content: string) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>:root{color-scheme:light only;}body{margin:0!important;padding:0!important;background-color:#f5f3f0!important;}</style>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f3f0;margin:0;padding:0;" bgcolor="#f5f3f0">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f3f0" style="background-color:#f5f3f0;padding:40px 16px;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td bgcolor="${PRIMARY}" style="background-color:${PRIMARY}!important;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
<span style="font-size:28px;font-weight:900;color:#ffffff!important;letter-spacing:-1px;">tovia</span>
<span style="font-size:11px;font-weight:600;color:#FFB380!important;display:block;letter-spacing:3px;margin-top:4px;">GESTÃO DE EVENTOS</span>
</td></tr>
<tr><td bgcolor="#ffffff" style="background-color:#ffffff!important;padding:40px;border-radius:0 0 16px 16px;">${content}</td></tr>
<tr><td style="padding:24px 40px;text-align:center;">
<p style="font-size:12px;color:${MUTED};margin:0;">© ${new Date().getFullYear()} Tovia Gestão de Eventos</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

async function sendWelcomeEmail(email: string, nome: string) {
  if (!RESEND_API_KEY) return;
  const html = emailWrap(`
    <h1 style="font-size:24px;font-weight:900;color:${TEXT};margin:0 0 12px;">Bem-vindo ao Tovia! 🌱</h1>
    <p style="font-size:15px;color:${MUTED};line-height:1.7;margin:0 0 24px;">
      Olá, <strong>${nome}</strong>! Seu e-mail foi confirmado e sua conta está ativa no plano <strong>Chinám</strong> (gratuito).
    </p>
    <p style="font-size:15px;color:${MUTED};line-height:1.7;margin:0 0 28px;">
      Agora você pode criar seu primeiro evento, montar sua equipe e começar a organizar com o Tovia.
    </p>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="https://toviaapp.com.br/dashboard" style="display:inline-block;background:${PRIMARY};color:#ffffff;font-size:14px;font-weight:900;text-decoration:none;padding:14px 40px;border-radius:16px;letter-spacing:1px;text-transform:uppercase;">
        Acessar meu painel
      </a>
    </div>
    <p style="font-size:12px;color:${MUTED};margin:0;line-height:1.6;">
      Precisa de ajuda? Responda este e-mail ou acesse nossa base de conhecimento.
    </p>
  `);
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [email], subject: 'Bem-vindo ao Tovia! 🌱', html }),
    });
  } catch (e) {
    console.warn('Welcome email failed:', e);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = (req.query.token || req.body?.token) as string;
  if (!token) return res.status(400).json({ error: 'Token ausente.' });

  try {
    const docRef = db.collection('verification_tokens').doc(token);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(400).json({ error: 'Link inválido ou já utilizado.' });
    }

    const data = snap.data()!;

    if (Date.now() > data.expiresAt) {
      await docRef.delete();
      return res.status(400).json({ error: 'Link expirado. Solicite um novo.' });
    }

    const userRecord = await getAuth(getApp()).getUser(data.userId);
    await getAuth(getApp()).updateUser(data.userId, { emailVerified: true });
    await docRef.delete();

    sendWelcomeEmail(userRecord.email!, userRecord.displayName || 'organizador');

    return res.json({ ok: true, userId: data.userId });
  } catch (err: any) {
    console.error('confirmarCodigoVerificacao error:', err.message);
    return res.status(500).json({ error: 'Erro ao verificar. Tente novamente.' });
  }
}
