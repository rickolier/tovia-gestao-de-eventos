import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { db, verifyAuth } from './_firebase.js';
import type { AuthError } from './_types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let decoded;
  try {
    decoded = await verifyAuth(req.headers.authorization);
  } catch (e: unknown) {
    const authErr = e as AuthError;
    return res.status(authErr.status ?? 401).json({ error: authErr.message });
  }

  // Admin check
  const callerEmail = decoded.email;
  const isToviaMaster =
    callerEmail === 'admin@tovia.app' ||
    callerEmail === 'admin@toviaapp.com.br';
  if (!isToviaMaster) {
    const adminDoc = await db.collection('admins').doc(decoded.uid).get();
    if (!adminDoc.exists) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
  }

  try {
    const configDoc = await db.collection('config').doc('billing').get();
    if (!configDoc.exists) {
      return res.status(404).json({ error: 'Nenhuma chave configurada.' });
    }

    const { asaas_api_key: apiKey, sandbox } = configDoc.data() as {
      asaas_api_key: string;
      sandbox: boolean;
    };

    if (!apiKey) {
      return res.status(404).json({ error: 'Chave API não definida.' });
    }

    const baseUrl = sandbox
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/v3';

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

    await db.collection('config').doc('billing').update({
      is_valid: valid,
      last_validated_at: new Date().toISOString(),
    });

    return res.json({ valid, sandbox: !!sandbox, baseUrl, debugInfo });
  } catch (err: unknown) {
    console.error('[validateBillingKey]', err);
    return res.status(500).json({ error: 'Erro ao validar chave.' });
  }
}
