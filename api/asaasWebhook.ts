// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Validar token de segurança
  const token = req.headers['asaas-access-token'];
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expectedToken || token !== expectedToken) {
    return res.status(401).send('Unauthorized');
  }

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

    if (paidEvents.includes(eventType)) {
      if (!planLevel) {
        console.warn('Webhook pago sem planLevel no externalReference:', externalRef);
        return res.status(200).send('ok');
      }
      await db.collection('users').doc(userId).set(
        { plano: planLevel, planoPendente: null },
        { merge: true }
      );
      console.log(`Plano ${planLevel} ativado para usuário ${userId}`);
    }

    if (canceledEvents.includes(eventType)) {
      await db.collection('users').doc(userId).set(
        { plano: null, asaasSubscriptionId: null, planoPendente: null },
        { merge: true }
      );
      console.log(`Plano cancelado para usuário ${userId}`);
    }

    return res.status(200).send('ok');
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return res.status(500).send('error');
  }
}
