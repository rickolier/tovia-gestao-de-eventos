import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { db } from '../_firebase.js';

async function sendEmailResend(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.warn('[email] RESEND_API_KEY não configurada — e-mail ignorado.'); return; }
  const from = process.env.EMAIL_FROM || 'Tovia <noreply@toviaapp.com.br>';
  await axios.post(
    'https://api.resend.com/emails',
    { from, to, subject, html },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } },
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();

  const eventosSnap = await db
    .collection('eventos')
    .where('config_comunicacao.lembrete_evento.ativo', '==', true)
    .get();

  if (eventosSnap.empty) {
    return res.json({ processed: 0 });
  }

  const emailPromises: Promise<void>[] = [];

  for (const eventoDoc of eventosSnap.docs) {
    const ev = eventoDoc.data() as Record<string, any>;
    const cfg = ev.config_comunicacao?.lembrete_evento as {
      dias_antes: number;
      assunto: string;
      corpo: string;
      ativo: boolean;
    } | undefined;
    if (!cfg?.ativo || !cfg.corpo) continue;

    const dataInicio = ev.data_inicio ? new Date(ev.data_inicio) : null;
    if (!dataInicio) continue;

    const daysUntil = Math.round((dataInicio.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil !== cfg.dias_antes) continue;

    const jaEnviado: string | undefined = ev.lembrete_evento_enviado_em;
    if (jaEnviado && jaEnviado.startsWith(now.toISOString().split('T')[0])) continue;

    await eventoDoc.ref.update({ lembrete_evento_enviado_em: now.toISOString() });

    const inscritos = await db
      .collection(`eventos/${eventoDoc.id}/inscricoes`)
      .where('status', 'in', ['pago'])
      .get();

    for (const inscDoc of inscritos.docs) {
      const insc = inscDoc.data() as Record<string, any>;
      const emailTo: string = insc.email ?? '';
      if (!emailTo) continue;

      const vars: Record<string, string> = {
        nome: insc.nome ?? 'Participante',
        evento: ev.nome ?? 'Evento',
        data: dataInicio.toLocaleDateString('pt-BR'),
        local: ev.local ?? '',
      };

      const subject = cfg.assunto
        ? cfg.assunto.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`)
        : `Lembrete: ${ev.nome} em ${cfg.dias_antes} dia(s)`;
      const corpo = cfg.corpo.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);

      const corpoHtml = corpo
        .split('\n')
        .map((l: string) => l.trim() ? `<p style="font-size:15px;color:#374151;margin:0 0 14px">${l}</p>` : '')
        .join('');
      const bodyHtml = `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#22c55e">Tovia</h2><hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        ${corpoHtml}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/>
        <p style="font-size:12px;color:#9ca3af">Este é um e-mail automático do Tovia.</p>
      </div>`;

      emailPromises.push(
        sendEmailResend(emailTo, subject, bodyHtml)
          .catch(e => console.error('[lembreteEvento] falhou:', e))
      );
    }
  }

  await Promise.allSettled(emailPromises);
  console.log(`[lembreteEvento] processados ${eventosSnap.size} eventos.`);
  return res.json({ processed: eventosSnap.size });
}
