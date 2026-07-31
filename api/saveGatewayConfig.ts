import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import { db, verifyAuth } from './_firebase.js';
import type { AuthError } from './_types.js';
import { saveGatewayConfigSchema } from './_schemas.js';
import { validateBody } from './_validate.js';
import { encrypt, genToken, registerAsaasWebhook } from './_gateway-utils.js';
import axios from 'axios';

// ── Rate limit: 10 requests per hour ────────────────────────────────────────
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 10;

async function checkRateLimit(uid: string): Promise<boolean> {
  const key = `saveGatewayConfig_${uid}`;
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

// ── Error map for Asaas validation ──────────────────────────────────────────
const ERROR_MAP: Record<number, string> = {
  401: 'ERRO TV001 — Chave de API não autorizada. Verifique se está correta e ativa.',
  403: 'ERRO TV002 — Sua chave não tem permissão de acesso. Verifique no painel Asaas.',
  404: 'ERRO TV003 — Ambiente incorreto. Confira se selecionou Sandbox ou Produção.',
  429: 'ERRO TV004 — Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  500: 'ERRO TV005 — Erro temporário no gateway. Tente novamente em alguns minutos.',
  503: 'ERRO TV006 — Gateway temporariamente indisponível. Tente mais tarde.',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth
  let decoded;
  try {
    decoded = await verifyAuth(req.headers.authorization);
  } catch (e: unknown) {
    const authErr = e as AuthError;
    return res.status(authErr.status ?? 401).json({ error: authErr.message });
  }

  // Validate body
  const data = validateBody(req.body, res, saveGatewayConfigSchema);
  if (!data) return;

  const { gatewayType, apiKey, sandbox } = data;
  const userId = decoded.uid;

  // Rate limit
  const allowed = await checkRateLimit(userId);
  if (!allowed) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
  }

  // Validate API key against Asaas
  const baseUrl = sandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';
  try {
    const validateRes = await axios.get(`${baseUrl}/customers`, {
      params: { limit: 1 },
      headers: { access_token: apiKey, 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    if (validateRes.status !== 200) {
      return res.status(400).json({ error: `GW-ERR-${validateRes.status}: Resposta inesperada do gateway.` });
    }
  } catch (e: any) {
    const status = e?.response?.status;
    const msg = status && ERROR_MAP[status]
      ? ERROR_MAP[status]
      : 'ERRO TV007 — Falha de conexão. Verifique sua internet e tente novamente.';
    return res.status(400).json({ error: msg });
  }

  // Encrypt key and generate webhook token
  const encKey = process.env.GATEWAY_ENCRYPTION_KEY!;
  const encryptedKey = encrypt(apiKey, encKey);
  const webhookToken = genToken();
  const encryptedWebhookToken = encrypt(webhookToken, encKey);

  // Register webhook at Asaas (best-effort, non-fatal)
  const webhookUrl = 'https://tovia.app/api/event-payment-webhook';
  try {
    await registerAsaasWebhook(apiKey, sandbox, webhookUrl, webhookToken);
  } catch (e) {
    console.warn('Webhook registration failed (non-fatal):', e);
  }

  // Save encrypted config to Firestore
  await db.collection('users').doc(userId).set({
    gateway_connected: true,
    gateway: {
      type: gatewayType,
      encrypted_api_key: encryptedKey,
      sandbox: !!sandbox,
      connected_at: new Date().toISOString(),
      encrypted_webhook_token: encryptedWebhookToken,
    },
  }, { merge: true });

  // Save webhook token hash to organizer_public
  const webhookTokenHash = createHash('sha256').update(webhookToken).digest('hex');
  await db.collection('organizer_public').doc(userId).set({
    gateway_connected: true,
    webhook_token_hash: webhookTokenHash,
  }, { merge: true });

  return res.json({ success: true });
}
