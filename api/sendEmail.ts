import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, verifyAuth } from './_firebase.js';
import type { AuthError } from './_types.js';
import { sendEmailSchema } from './_schemas.js';
import { validateBody } from './_validate.js';
import { sendEmail } from './_email/send.js';
import { getPlanConfig } from '../src/utils/plan-limits.js';
import type { PlanLevel } from '../src/types/user.js';

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
  const { type = 'direct', to, subject, html, eventoId } = data;

  // Fluxo de comunicado: organizador → inscritos do evento
  if (type === 'comunicado') {
    if (!eventoId) return res.status(400).json({ error: 'eventoId obrigatório para comunicado.' });

    const eventoSnap = await db.collection('eventos').doc(eventoId).get();
    if (!eventoSnap.exists) return res.status(404).json({ error: 'Evento não encontrado.' });
    const evento = eventoSnap.data()!;

    if (evento.criado_por !== decoded.uid && !(evento.equipeIds || []).includes(decoded.uid)) {
      return res.status(403).json({ error: 'Sem permissão para este evento.' });
    }

    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userPlano = (userDoc.data()?.plano || 'chinam') as PlanLevel;
    const planConfig = getPlanConfig(userPlano);

    const comunicadosSnap = await db.collection('eventos').doc(eventoId).collection('comunicados').get();
    if (comunicadosSnap.size >= planConfig.maxComunicadosPerEvent) {
      return res.status(403).json({
        error: `Limite de ${planConfig.maxComunicadosPerEvent} comunicado(s) por evento atingido.`,
        limiteAtual: comunicadosSnap.size,
        limiteMax: planConfig.maxComunicadosPerEvent,
      });
    }

    const inscricoesSnap = await db.collection('eventos').doc(eventoId).collection('inscricoes').get();
    const emails = inscricoesSnap.docs
      .map(d => d.data()?.email as string | undefined)
      .filter((e): e is string => !!e);

    if (emails.length === 0) {
      return res.status(400).json({ error: 'Nenhum inscrito com e-mail neste evento.' });
    }

    try {
      const result = await sendEmail({ to: emails, subject, html });

      await db.collection('eventos').doc(eventoId).collection('comunicados').add({
        assunto: subject,
        corpo: html,
        enviadoPor: decoded.uid,
        destinatarios: emails.length,
        enviadoEm: new Date().toISOString(),
        emailResultId: result.id,
      });

      return res.json({ ok: true, destinatarios: emails.length, id: result.id });
    } catch (err: unknown) {
      console.error('Comunicado sendEmail error:', (err as Error).message);
      return res.status(500).json({ error: 'Falha ao enviar comunicado.' });
    }
  }

  // Fluxo direto (original)
  if (!to) return res.status(400).json({ error: 'Campo "to" obrigatório para envio direto.' });
  const isAdmin = ADMIN_EMAILS.includes(decoded.email ?? '');
  const toList: string[] = Array.isArray(to) ? to : [to];

  if (!isAdmin) {
    const selfEmail = decoded.email?.toLowerCase();
    const allToSelf = toList.every(addr => addr.toLowerCase() === selfEmail);
    if (!allToSelf) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
  }

  try {
    const result = await sendEmail({ to: toList, subject, html });
    return res.json({ ok: true, id: result.id });
  } catch (err: unknown) {
    console.error('sendEmail error:', (err as Error).message);
    return res.status(500).json({ error: 'Falha ao enviar e-mail.' });
  }
}
