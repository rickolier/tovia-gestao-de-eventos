import axios from 'axios';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string, keyHex: string): string {
  const key = Buffer.from(keyHex.trim(), 'hex');
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(data: string, keyHex: string): string {
  const [ivHex, authTagHex, encrypted] = data.split(':');
  const key = Buffer.from(keyHex.trim(), 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function genToken(): string {
  return randomBytes(32).toString('hex');
}

function asaasHeaders(apiKey: string) {
  return { access_token: apiKey, 'Content-Type': 'application/json' };
}

export function asaasBaseUrl(sandbox: boolean) {
  return sandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/api/v3';
}

export async function testAsaasApiKey(apiKey: string, sandbox: boolean): Promise<boolean> {
  try {
    // GET /customers?limit=1 is a lightweight endpoint available in all Asaas plans
    const res = await axios.get(`${asaasBaseUrl(sandbox)}/customers`, {
      params: { limit: 1 },
      headers: asaasHeaders(apiKey),
      timeout: 10000,
    });
    return res.status === 200;
  } catch (e: any) {
    const status = e?.response?.status;
    const data = JSON.stringify(e?.response?.data ?? e?.message ?? 'unknown');
    console.error(`[testAsaasApiKey] sandbox=${sandbox} status=${status} error=${data}`);
    return false;
  }
}

export async function registerAsaasWebhook(
  apiKey: string,
  sandbox: boolean,
  webhookUrl: string,
  authToken: string,
): Promise<void> {
  await axios.post(
    `${asaasBaseUrl(sandbox)}/webhooks`,
    {
      url: webhookUrl,
      interrupted: false,
      enabled: true,
      apiVersion: 3,
      authToken,
      sendType: 'SEQUENTIALLY',
      events: [
        'PAYMENT_CONFIRMED',
        'PAYMENT_RECEIVED',
        'PAYMENT_OVERDUE',
        'PAYMENT_DELETED',
        'PAYMENT_REFUNDED',
      ],
    },
    { headers: asaasHeaders(apiKey), timeout: 8000 },
  );
}

export async function createOrFindAsaasCustomer(
  apiKey: string,
  sandbox: boolean,
  name: string,
  email: string,
  externalRef: string,
  cpfCnpj?: string,
): Promise<string> {
  const base = asaasBaseUrl(sandbox);
  const headers = asaasHeaders(apiKey);

  // Try to find existing customer by externalReference
  const search = await axios.get(`${base}/customers`, {
    params: { externalReference: externalRef },
    headers,
    timeout: 8000,
  });
  if (search.data.totalCount > 0) {
    return search.data.data[0].id as string;
  }

  const payload: Record<string, string> = { name, email, externalReference: externalRef };
  if (cpfCnpj) {
    payload.cpfCnpj = cpfCnpj.replace(/\D/g, ''); // remove pontuação
  }

  const create = await axios.post(`${base}/customers`, payload, { headers, timeout: 8000 });
  return create.data.id as string;
}

export type AsaasBillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';

export interface AsaasChargeResult {
  id: string;
  invoiceUrl: string;
  bankSlipUrl?: string;
  identificationField?: string;
  pixQrCode?: { encodedImage: string; payload: string; expirationDate: string };
  status: string;
}

export async function createAsaasCharge(
  apiKey: string,
  sandbox: boolean,
  opts: {
    customerId: string;
    value: number;
    dueDate: string;
    description: string;
    billingType: AsaasBillingType;
    installmentCount?: number;
    externalReference: string;
    creditCard?: {
      holderName: string;
      number: string;
      expiryMonth: string;
      expiryYear: string;
      ccv: string;
    };
    creditCardHolderInfo?: {
      name: string;
      email: string;
      cpfCnpj: string;
      phone?: string;
      postalCode?: string;
      addressNumber?: string;
    };
  },
): Promise<AsaasChargeResult> {
  const base = asaasBaseUrl(sandbox);
  const headers = asaasHeaders(apiKey);

  const body: Record<string, unknown> = {
    customer: opts.customerId,
    billingType: opts.billingType,
    value: opts.value,
    dueDate: opts.dueDate,
    description: opts.description,
    externalReference: opts.externalReference,
  };

  if (opts.billingType === 'CREDIT_CARD') {
    if (opts.creditCard) body.creditCard = opts.creditCard;
    if (opts.creditCardHolderInfo) body.creditCardHolderInfo = opts.creditCardHolderInfo;
    if (opts.installmentCount && opts.installmentCount > 1) {
      body.installmentCount = opts.installmentCount;
      body.installmentValue = parseFloat((opts.value / opts.installmentCount).toFixed(2));
    }
  }

  const res = await axios.post(`${base}/payments`, body, { headers, timeout: 15000 });
  const p = res.data;

  const result: AsaasChargeResult = {
    id: p.id,
    invoiceUrl: p.invoiceUrl,
    bankSlipUrl: p.bankSlipUrl,
    identificationField: p.identificationField,
    status: p.status,
  };

  if (opts.billingType === 'PIX') {
    try {
      const pixRes = await axios.get(`${base}/payments/${p.id}/pixQrCode`, {
        headers,
        timeout: 8000,
      });
      result.pixQrCode = {
        encodedImage: pixRes.data.encodedImage,
        payload: pixRes.data.payload,
        expirationDate: pixRes.data.expirationDate,
      };
    } catch {
      // QR code may take a moment; client can poll or use invoiceUrl
    }
  }

  return result;
}

export function mapBillingType(method: string): AsaasBillingType {
  const map: Record<string, AsaasBillingType> = {
    pix: 'PIX',
    boleto: 'BOLETO',
    credito: 'CREDIT_CARD',
    cartao: 'CREDIT_CARD',
  };
  return map[method] ?? 'UNDEFINED';
}
