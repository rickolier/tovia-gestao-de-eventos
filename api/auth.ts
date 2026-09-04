import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db, verifyAuth } from './_firebase.js';
import { randomBytes } from 'crypto';
import type { AuthError } from './_types.js';
import {
  enviarCodigoVerificacaoSchema,
  confirmarCodigoVerificacaoSchema,
  enviarRedefinicaoSenhaSchema,
  enviarCodigoInscricaoSchema,
  confirmarCodigoInscricaoSchema,
} from './_schemas.js';
import { validateBody } from './_validate.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'Tovia <noreply@toviaapp.com.br>';
const BASE_URL = process.env.BASE_URL || 'https://toviaapp.com.br';
const APP_URL = 'https://tovia-gestao-de-eventos.vercel.app';

const PRIMARY = '#FF6B1A';
const MUTED = '#6b7280';
const TEXT = '#1a1a1a';

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 3;
const TOKEN_TTL_MS = 30 * 60 * 1000;
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

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

async function checkRateLimit(key: string): Promise<boolean> {
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

// ── enviarCodigoVerificacao ──
async function handleEnviarCodigoVerificacao(req: VercelRequest, res: VercelResponse) {
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

    const allowed = await checkRateLimit(`verify_${userId}`);
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

// ── confirmarCodigoVerificacao ──
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

async function handleConfirmarCodigoVerificacao(req: VercelRequest, res: VercelResponse) {
  const parsed = validateBody({ token: req.query.token || req.body?.token }, res, confirmarCodigoVerificacaoSchema);
  if (!parsed) return;
  const { token } = parsed;

  try {
    const docRef = db.collection('verification_tokens').doc(token);
    const snap = await docRef.get();

    if (!snap.exists) return res.status(400).json({ error: 'Link inválido ou já utilizado.' });

    const data = snap.data()!;
    if (Date.now() > data.expiresAt) {
      await docRef.delete();
      return res.status(400).json({ error: 'Link expirado. Solicite um novo.' });
    }

    const userRecord = await getAuth(getApp()).getUser(data.userId);
    await getAuth(getApp()).updateUser(data.userId, { emailVerified: true });
    await db.collection('users').doc(data.userId).update({ email_verificado: true });
    await docRef.delete();

    void sendWelcomeEmail(userRecord.email!, userRecord.displayName || 'organizador');

    return res.json({ ok: true, userId: data.userId });
  } catch (err: unknown) {
    console.error('confirmarCodigoVerificacao error:', (err as Error).message);
    return res.status(500).json({ error: 'Erro ao verificar. Tente novamente.' });
  }
}

// ── enviarRedefinicaoSenha ──
async function handleEnviarRedefinicaoSenha(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const body = validateBody(req.body, res, enviarRedefinicaoSenhaSchema);
  if (!body) return;

  const emailNorm = body.email.trim().toLowerCase();

  const allowed = await checkRateLimit(`reset_${emailNorm.replace(/[^a-z0-9]/gi, '_')}`);
  if (!allowed) return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });

  try {
    let nome = 'organizador';
    try {
      const userRecord = await getAuth(getApp()).getUserByEmail(emailNorm);
      nome = userRecord.displayName || 'organizador';
    } catch {
      return res.json({ ok: true });
    }

    const link = await getAuth(getApp()).generatePasswordResetLink(emailNorm, { url: `${APP_URL}/login` });

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

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [emailNorm], subject: 'Redefinição de senha — Tovia 🔑', html }),
    });
    if (!emailRes.ok) console.error('Resend error:', await emailRes.text().catch(() => ''));

    return res.json({ ok: true });
  } catch (err: unknown) {
    console.error('enviarRedefinicaoSenha error:', (err as Error).message);
    return res.status(500).json({ error: 'Não foi possível enviar o e-mail. Tente novamente.' });
  }
}

// ── enviarCodigoInscricao ──
function buildInscricaoEmailHtml(code: string): string {
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

async function handleEnviarCodigoInscricao(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const body = validateBody(req.body, res, enviarCodigoInscricaoSchema);
  if (!body) return;

  const emailNorm = body.email.trim().toLowerCase();

  const allowed = await checkRateLimit(`inscricao_otp_${emailNorm.replace(/[^a-z0-9]/gi, '_')}`);
  if (!allowed) return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + CODE_TTL_MS;

  await db.collection('inscricao_codes').doc(docKey(emailNorm)).set({
    email: emailNorm, code, expiresAt, attempts: 0,
  });

  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada');
    return res.status(500).json({ error: 'Serviço de e-mail não configurado.' });
  }

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM, to: [emailNorm],
      subject: `${code} é seu código para consultar inscrição — Tovia`,
      html: buildInscricaoEmailHtml(code),
    }),
  });

  if (!emailRes.ok) {
    console.error('Resend error:', await emailRes.text().catch(() => ''));
    return res.status(500).json({ error: 'Não foi possível enviar o código. Tente novamente.' });
  }

  return res.json({ ok: true });
}

// ── confirmarCodigoInscricao ──
const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  pagamento_iniciado: 'Pagamento em andamento',
  pago: 'Confirmada',
  ajuda_solicitada: 'Ajuda solicitada',
  analise: 'Em análise',
  cancelada: 'Cancelada',
};

async function buildResult(inscDoc: FirebaseFirestore.QueryDocumentSnapshot, eventoCache: Record<string, Record<string, string> | undefined>) {
  const insc = inscDoc.data();
  const pathParts = inscDoc.ref.path.split('/');
  const eventoId = pathParts[1];

  if (!eventoCache[eventoId]) {
    const eventoDoc = await db.collection('eventos').doc(eventoId).get();
    const d = eventoDoc.exists ? eventoDoc.data() : undefined;
    eventoCache[eventoId] = (d as Record<string, string> | undefined) ?? { nome: 'Evento', data_inicio: '', local: '' };
  }
  const evento = eventoCache[eventoId] ?? { nome: 'Evento', data_inicio: '', local: '' };
  const status: string = insc.status ?? 'pendente';

  return {
    inscricaoId: inscDoc.id,
    eventoId,
    eventoNome: evento.nome ?? 'Evento',
    eventoData: evento.data_inicio ?? '',
    eventoDataFim: evento.data_fim ?? '',
    eventoLocal: evento.local ?? '',
    ticketNome: insc.ticket_nome ?? '',
    status,
    statusLabel: STATUS_LABELS[status] ?? status,
    valorTotal: insc.valor_total ?? 0,
    valorPago: insc.valor_pago ?? 0,
    formaPagamento: insc.forma_pagamento ?? '',
    nome: insc.nome ?? '',
    dataInscricao: insc.data_inscricao ?? '',
    presenca: insc.presenca ?? false,
  };
}

async function handleConfirmarCodigoInscricao(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const body = validateBody(req.body, res, confirmarCodigoInscricaoSchema);
  if (!body) return;
  const { email, code } = body;

  const emailNorm = email.trim().toLowerCase();
  const codeNorm = String(code).replace(/\D/g, '').trim();

  const docRef = db.collection('inscricao_codes').doc(docKey(emailNorm));

  try {
    const snap = await docRef.get();
    if (!snap.exists) return res.status(400).json({ error: 'Nenhum código encontrado. Solicite um novo.' });

    const data = snap.data()!;
    if (data.email !== emailNorm) return res.status(400).json({ error: 'Código inválido.' });

    if (Date.now() > data.expiresAt) {
      await docRef.delete();
      return res.status(400).json({ error: 'Código expirado. Solicite um novo.' });
    }

    if (data.attempts >= MAX_ATTEMPTS) {
      await docRef.delete();
      return res.status(400).json({ error: 'Muitas tentativas incorretas. Solicite um novo código.' });
    }

    if (data.code !== codeNorm) {
      await docRef.set({ ...data, attempts: data.attempts + 1 }, { merge: true });
      const remaining = MAX_ATTEMPTS - (data.attempts + 1);
      return res.status(400).json({
        error: remaining > 0
          ? `Código incorreto. Ainda ${remaining} tentativa${remaining !== 1 ? 's' : ''}.`
          : 'Código incorreto. Solicite um novo.',
      });
    }

    await docRef.delete();

    const eventoCache: Record<string, any> = {};
    const inscSnap = await db.collectionGroup('inscricoes')
      .where('email', '==', emailNorm)
      .limit(50)
      .get();

    const results = inscSnap.empty
      ? []
      : await Promise.all(inscSnap.docs.map(d => buildResult(d, eventoCache)));

    results.sort((a, b) => new Date(b.dataInscricao).getTime() - new Date(a.dataInscricao).getTime());

    return res.json({ inscricoes: results });
  } catch (err: unknown) {
    console.error('[confirmarCodigoInscricao]', (err as Error)?.message);
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
}

// ── Router ──
const handlers: Record<string, (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse | void>> = {
  enviarCodigoVerificacao: handleEnviarCodigoVerificacao,
  confirmarCodigoVerificacao: handleConfirmarCodigoVerificacao,
  enviarRedefinicaoSenha: handleEnviarRedefinicaoSenha,
  enviarCodigoInscricao: handleEnviarCodigoInscricao,
  confirmarCodigoInscricao: handleConfirmarCodigoInscricao,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = (req.query.action as string) || req.body?.action;
  const fn = action ? handlers[action] : undefined;
  if (!fn) return res.status(400).json({ error: `Ação inválida: ${action}. Use ?action=<nome>` });
  return fn(req, res);
}
