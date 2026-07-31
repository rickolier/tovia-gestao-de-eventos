import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { db, verifyAuth } from './_firebase.js';
import type { AuthError, AsaasPayment } from './_types.js';
import { getBillingInfoSchema } from './_schemas.js';
import { validateBody } from './_validate.js';

const ASAAS_SANDBOX_URL    = 'https://sandbox.asaas.com/api/v3';
const ASAAS_PRODUCTION_URL = 'https://api.asaas.com/api/v3';

async function requireAdmin(req: VercelRequest, res: VercelResponse) {
  let decoded;
  try {
    decoded = await verifyAuth(req.headers.authorization);
  } catch (e: unknown) {
    const authErr = e as AuthError;
    res.status(authErr.status ?? 401).json({ error: authErr.message });
    return null;
  }

  const callerEmail = decoded.email;
  const isToviaMaster = callerEmail === 'admin@tovia.app' || callerEmail === 'admin@toviaapp.com.br';
  if (!isToviaMaster) {
    const adminDoc = await db.collection('admins').doc(decoded.uid).get();
    if (!adminDoc.exists) {
      res.status(403).json({ error: 'Acesso negado.' });
      return null;
    }
  }
  return decoded;
}

// ── suspendUser ──
async function handleSuspendUser(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = await requireAdmin(req, res);
  if (!decoded) return;

  const { userId } = req.body as { userId?: string };
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório.' });

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'Usuário não encontrado.' });

    await db.collection('users').doc(userId).update({
      desativado: true, plano: null, planoPendente: null,
    });

    return res.json({ success: true });
  } catch (err: unknown) {
    console.error('[suspendUser]', err);
    return res.status(500).json({ error: 'Erro ao suspender usuário.' });
  }
}

// ── validateBillingKey ──
async function handleValidateBillingKey(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = await requireAdmin(req, res);
  if (!decoded) return;

  try {
    const configDoc = await db.collection('config').doc('billing').get();
    if (!configDoc.exists) return res.status(404).json({ error: 'Nenhuma chave configurada.' });

    const { asaas_api_key: apiKey, sandbox } = configDoc.data() as { asaas_api_key: string; sandbox: boolean };
    if (!apiKey) return res.status(404).json({ error: 'Chave API não definida.' });

    const baseUrl = sandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';

    let valid = false;
    let debugInfo = '';
    try {
      const r = await axios.get(`${baseUrl}/customers`, {
        params: { limit: 1 },
        headers: { access_token: apiKey, 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      valid = r.status === 200;
      debugInfo = `status=${r.status}`;
    } catch (e: any) {
      const status = e?.response?.status;
      const body = JSON.stringify(e?.response?.data ?? e?.message ?? 'unknown');
      debugInfo = `status=${status} body=${body}`;
    }

    let accountInfo: Record<string, any> = {};
    if (valid) {
      try {
        const acctRes = await axios.get(`${baseUrl}/myAccount/commercialInfo`, {
          headers: { access_token: apiKey, 'Content-Type': 'application/json' },
          timeout: 10000,
        });
        const d = acctRes.data;
        const cpfCnpj = d.cpfCnpj || '';
        const masked = cpfCnpj.length === 11
          ? `***.***.${cpfCnpj.slice(6, 9)}-${cpfCnpj.slice(9)}`
          : cpfCnpj.length === 14
            ? `**.***.${cpfCnpj.slice(5, 8)}/${cpfCnpj.slice(8, 12)}-${cpfCnpj.slice(12)}`
            : cpfCnpj;
        accountInfo = {
          name: d.name || d.companyName || '',
          tradingName: d.tradingName || '',
          cpfCnpjMasked: masked,
          personType: d.personType || '',
          email: d.email || '',
          city: d.city?.name || '',
          state: d.city?.state || '',
          status: d.status || '',
        };
      } catch (e) {
        console.warn('Could not fetch account info (non-fatal):', e);
      }
    }

    await db.collection('config').doc('billing').update({
      is_valid: valid, last_validated_at: new Date().toISOString(),
    });

    return res.json({ valid, sandbox: !!sandbox, baseUrl, debugInfo, accountInfo });
  } catch (err: unknown) {
    console.error('[validateBillingKey]', err);
    return res.status(500).json({ error: 'Erro ao validar chave.' });
  }
}

// ── getBillingInfo ──
async function handleGetBillingInfo(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const data = validateBody(req.body, res, getBillingInfoSchema);
  if (!data) return;
  const { userId } = data;

  try {
    await verifyAuth(req.headers.authorization, userId);
  } catch (e: unknown) {
    const authErr = e as AuthError;
    return res.status(authErr.status ?? 401).json({ error: authErr.message });
  }

  let apiKey: string;
  let ASAAS_BASE_URL: string;
  try {
    const billingDoc = await db.collection('config').doc('billing').get();
    const billing = billingDoc.exists ? billingDoc.data() : null;
    apiKey = billing?.asaas_api_key?.trim() || process.env.ASAAS_API_KEY?.trim() || '';
    const isSandbox = billing ? billing.sandbox !== false : true;
    ASAAS_BASE_URL = isSandbox ? ASAAS_SANDBOX_URL : ASAAS_PRODUCTION_URL;
  } catch {
    apiKey = process.env.ASAAS_API_KEY?.trim() || '';
    ASAAS_BASE_URL = ASAAS_SANDBOX_URL;
  }

  if (!apiKey) return res.status(500).json({ error: 'Configuração de pagamento ausente.' });

  const headers = { access_token: apiKey, 'Content-Type': 'application/json' };

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const userData = userDoc.data();
    if (!userData) return res.status(404).json({ error: 'Dados do usuário ausentes.' });

    const { asaasSubscriptionId, asaasCustomerId, plano, planoPendente } = userData;

    if (!asaasSubscriptionId || !asaasCustomerId) {
      return res.json({ hasSubscription: false, plano: plano || null });
    }

    const [subscriptionRes, paymentsRes, customerRes] = await Promise.all([
      axios.get(`${ASAAS_BASE_URL}/subscriptions/${asaasSubscriptionId}`, { headers }),
      axios.get(`${ASAAS_BASE_URL}/subscriptions/${asaasSubscriptionId}/payments?limit=12`, { headers }),
      axios.get(`${ASAAS_BASE_URL}/customers/${asaasCustomerId}`, { headers }),
    ]);

    const subscription = subscriptionRes.data;
    const payments: AsaasPayment[] = paymentsRes.data.data || [];
    const customer = customerRes.data;

    const lastPaid = payments.find((p) => p.status === 'RECEIVED' || p.status === 'CONFIRMED');
    const creditCard = lastPaid?.creditCard || null;

    let activePlano = plano;
    if (planoPendente && lastPaid) {
      await db.collection('users').doc(userId).set(
        { plano: planoPendente, planoPendente: null },
        { merge: true }
      );
      activePlano = planoPendente;
      console.log(`getBillingInfo: plano ${planoPendente} ativado automaticamente para ${userId}`);
    }

    return res.json({
      hasSubscription: true,
      plano: activePlano,
      subscription: {
        id: subscription.id, status: subscription.status, value: subscription.value,
        cycle: subscription.cycle, nextDueDate: subscription.nextDueDate,
        billingType: subscription.billingType, description: subscription.description,
      },
      customer: { name: customer.name, email: customer.email, cpfCnpj: customer.cpfCnpj || null },
      creditCard,
      payments: payments.map((p) => ({
        id: p.id, status: p.status, value: p.value, dueDate: p.dueDate,
        paymentDate: p.paymentDate || null, invoiceUrl: p.invoiceUrl || null, billingType: p.billingType,
      })),
    });
  } catch (err: unknown) {
    const e = err as { response?: { data?: unknown }; message?: string };
    console.error('getBillingInfo error:', e.response?.data || e.message);
    return res.status(500).json({ error: 'Erro ao buscar dados de faturamento.' });
  }
}

// ── Router ──
const handlers: Record<string, (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse | void>> = {
  suspendUser: handleSuspendUser,
  validateBillingKey: handleValidateBillingKey,
  getBillingInfo: handleGetBillingInfo,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = (req.query.action as string) || req.body?.action;
  const fn = action ? handlers[action] : undefined;
  if (!fn) return res.status(400).json({ error: `Ação inválida: ${action}. Use ?action=<nome>` });
  return fn(req, res);
}
