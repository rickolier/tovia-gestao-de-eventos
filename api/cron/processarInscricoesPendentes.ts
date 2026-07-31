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

function emailLembrete(nome: string, eventoNome: string, tipo: 'primeiro' | 'final', paymentUrl?: string): string {
  const urgencia = tipo === 'final'
    ? '⚠️ Último aviso: sua inscrição será cancelada em breve.'
    : 'Sua inscrição ainda está pendente de pagamento.';
  const cta = paymentUrl
    ? `<a href="${paymentUrl}" style="display:inline-block;margin-top:20px;padding:14px 28px;background:#22c55e;color:#fff;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">Concluir pagamento</a>`
    : `<p style="margin-top:16px;color:#6b7280;font-size:14px;">Acesse o link que recebeu no momento da inscrição para concluir o pagamento.</p>`;
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#111827">
      <h2 style="color:#22c55e;margin-bottom:4px">Tovia</h2>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
      <p style="font-size:16px">Olá, <strong>${nome}</strong>!</p>
      <p style="font-size:15px;color:#374151">${urgencia}</p>
      <p style="font-size:15px;color:#374151">
        Você se inscreveu em <strong>${eventoNome}</strong> mas o pagamento ainda não foi confirmado.
        ${tipo === 'final' ? 'Após 10 dias sem confirmação, a inscrição é <strong>cancelada automaticamente</strong>.' : 'Você ainda tem alguns dias para concluir.'}
      </p>
      ${cta}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/>
      <p style="font-size:12px;color:#9ca3af">Este é um e-mail automático do Tovia. Caso já tenha pago, aguarde até 3 dias úteis para a confirmação aparecer.</p>
    </div>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();

  const snapshot = await db
    .collectionGroup('inscricoes')
    .where('status', 'in', ['pendente', 'pagamento_iniciado'])
    .get();

  if (snapshot.empty) {
    return res.json({ processed: 0 });
  }

  const eventoIds = new Set<string>();
  snapshot.docs.forEach(doc => {
    const eventoId = doc.ref.parent.parent?.id;
    if (eventoId) eventoIds.add(eventoId);
  });

  const eventoNomes: Record<string, string> = {};
  await Promise.all(Array.from(eventoIds).map(async (id) => {
    const snap = await db.collection('eventos').doc(id).get();
    eventoNomes[id] = snap.data()?.nome ?? 'Evento';
  }));

  const emailPromises: Promise<void>[] = [];
  const chunks: FirebaseFirestore.DocumentSnapshot[][] = [];
  for (let i = 0; i < snapshot.docs.length; i += 499) {
    chunks.push(snapshot.docs.slice(i, i + 499));
  }

  for (const chunk of chunks) {
    const batch = db.batch();

    for (const doc of chunk) {
      const data = doc.data() as Record<string, any>;
      const dataInscricao = data.data_inscricao ? new Date(data.data_inscricao) : null;
      if (!dataInscricao) continue;

      const diffDays = Math.floor((now.getTime() - dataInscricao.getTime()) / (1000 * 60 * 60 * 24));

      const eventoId = doc.ref.parent.parent?.id ?? '';
      const eventoNome = eventoNomes[eventoId] ?? 'Evento';
      const email: string = data.email ?? '';
      const nome: string = data.nome ?? 'Participante';
      const paymentUrl: string | undefined = data.gateway_payment_url;

      if (diffDays >= 10) {
        batch.update(doc.ref, { status: 'cancelada', cancelada_automaticamente: true, cancelada_em: now.toISOString() });
      } else if (diffDays >= 7 && !data.lembrete_7d_enviado) {
        batch.update(doc.ref, { lembrete_7d_enviado: true });
        if (email) {
          emailPromises.push(
            sendEmailResend(email, `⚠️ Último aviso — inscrição em ${eventoNome}`, emailLembrete(nome, eventoNome, 'final', paymentUrl))
              .catch(e => console.error('[email] lembrete_7d falhou:', e))
          );
        }
      } else if (diffDays >= 4 && !data.lembrete_4d_enviado) {
        batch.update(doc.ref, { lembrete_4d_enviado: true });
        if (email) {
          emailPromises.push(
            sendEmailResend(email, `Lembrete — sua inscrição em ${eventoNome} está pendente`, emailLembrete(nome, eventoNome, 'primeiro', paymentUrl))
              .catch(e => console.error('[email] lembrete_4d falhou:', e))
          );
        }
      }
    }

    await batch.commit();
  }

  await Promise.allSettled(emailPromises);
  console.log(`[processarInscricoesPendentes] processadas ${snapshot.size} inscrições.`);
  return res.json({ processed: snapshot.size });
}
