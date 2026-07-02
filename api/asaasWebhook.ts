// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_firebase';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'Tovia <noreply@toviaapp.com.br>';

const PLAN_NAMES: Record<string, string> = {
  essencial: 'Essencial',
  pro: 'Pro',
};
const PLAN_VALUES: Record<string, string> = {
  essencial: 'R$ 39,90',
  pro: 'R$ 99,00',
};

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
  } catch (e) {
    console.warn('Email send failed:', e);
  }
}

function fmtDate(iso: string) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers['asaas-access-token'];
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expectedToken || token !== expectedToken) return res.status(401).send('Unauthorized');

  const event = req.body;
  const eventType: string = event?.event;
  const payment = event?.payment;

  if (!payment) return res.status(200).send('ok');

  const paidEvents = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'];
  const canceledEvents = ['PAYMENT_OVERDUE', 'SUBSCRIPTION_INACTIVATED'];

  try {
    const externalRef: string = payment.externalReference || '';
    const parts = externalRef.split(':');
    const userId = parts[0];
    const planLevel = parts[1];

    if (!userId) {
      console.warn('Webhook sem userId no externalReference:', externalRef);
      return res.status(200).send('ok');
    }

    // Buscar dados do usuário para o e-mail
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const userEmail = userData?.email;
    const userName = userData?.nome || 'organizador';

    if (paidEvents.includes(eventType)) {
      if (!planLevel) {
        console.warn('Webhook pago sem planLevel:', externalRef);
        return res.status(200).send('ok');
      }
      await db.collection('users').doc(userId).set(
        { plano: planLevel, planoPendente: null },
        { merge: true }
      );
      console.log('Plano ativado com sucesso.');

      const planNotifId = `plan_${userId}`;
      await db.collection('notificacoes').doc(planNotifId).set({
        id: planNotifId,
        userId,
        tipo: 'plano_atualizado',
        titulo: 'Plano atualizado com sucesso!',
        mensagem: `Seu plano foi atualizado para ${PLAN_NAMES[planLevel] || planLevel}. Boas-vindas ao novo plano!`,
        data: new Date().toISOString(),
        lida: false,
        acao_requirida: false,
      });

      // E-mail: confirmação de pagamento
      if (userEmail) {
        const { emailPagamentoConfirmado } = await import('../src/lib/email-templates.js');
        const proxVencimento = fmtDate(payment.dueDate
          ? new Date(new Date(payment.dueDate).setMonth(new Date(payment.dueDate).getMonth() + 1)).toISOString().split('T')[0]
          : '');
        await sendEmail(
          userEmail,
          'Pagamento confirmado — Tovia 💳',
          emailPagamentoConfirmado(userName, PLAN_NAMES[planLevel] || planLevel, PLAN_VALUES[planLevel] || '', proxVencimento),
        );
      }
    }

    if (canceledEvents.includes(eventType)) {
      await db.collection('users').doc(userId).set(
        { plano: null, asaasSubscriptionId: null, planoPendente: null },
        { merge: true }
      );
      console.log('Plano cancelado.');

      // E-mail: pagamento não realizado
      if (userEmail && planLevel) {
        const { emailPagamentoNaoRealizado } = await import('../src/lib/email-templates.js');
        await sendEmail(
          userEmail,
          'Atenção: pagamento pendente na sua conta Tovia ⚠️',
          emailPagamentoNaoRealizado(userName, PLAN_NAMES[planLevel] || planLevel, fmtDate(payment.dueDate)),
        );
      }
    }

    return res.status(200).send('ok');
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return res.status(500).send('error');
  }
}
