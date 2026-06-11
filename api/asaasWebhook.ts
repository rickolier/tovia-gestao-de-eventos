import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Validar token de segurança
  const token = req.headers['asaas-access-token'];
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).send('Unauthorized');
  }

  const event = req.body;
  const eventType: string = event?.event;
  const payment = event?.payment;

  if (!payment) return res.status(200).send('ok');

  const paidEvents = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'];
  const canceledEvents = ['PAYMENT_OVERDUE', 'SUBSCRIPTION_INACTIVATED'];

  try {
    if (paidEvents.includes(eventType)) {
      const [userId, planLevel] = (payment.externalReference || '').split(':');
      if (userId && planLevel) {
        await db.collection('users').doc(userId).update({
          plano: planLevel,
          planoPendente: null,
        });
      }
    }

    if (canceledEvents.includes(eventType)) {
      const [userId] = (payment.externalReference || '').split(':');
      if (userId) {
        await db.collection('users').doc(userId).update({
          plano: null,
          asaasSubscriptionId: null,
          planoPendente: null,
        });
      }
    }

    return res.status(200).send('ok');
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return res.status(500).send('error');
  }
}
