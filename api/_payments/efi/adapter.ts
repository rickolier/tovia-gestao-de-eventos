import https from 'https';
import type { PaymentProvider } from '../provider.js';
import type {
  CreateCustomerInput,
  Customer,
  CreateChargeInput,
  ChargeResult,
  CreateSubscriptionInput,
  SubscriptionResult,
  CreatePixAutomaticoInput,
  PixAutomaticoResult,
  ValidateCredentialsResult,
  WebhookEvent,
  PaymentMethod,
  WebhookEventType,
  RefundResult,
} from '../types.js';

function cobrancasBaseUrl(sandbox: boolean) {
  return sandbox
    ? 'https://cobrancas-h.api.efipay.com.br'
    : 'https://cobrancas.api.efipay.com.br';
}

function pixBaseUrl(sandbox: boolean) {
  return sandbox
    ? 'https://pix-h.api.efipay.com.br'
    : 'https://pix.api.efipay.com.br';
}

interface EfiCredentials {
  clientId: string;
  clientSecret: string;
}

function parseCredentials(apiKey: string): EfiCredentials {
  try {
    const parsed = JSON.parse(apiKey);
    return { clientId: parsed.clientId, clientSecret: parsed.clientSecret };
  } catch {
    throw new Error('Credenciais EFí inválidas. Esperado JSON com clientId e clientSecret.');
  }
}

async function fetchJson(url: string, opts: RequestInit & { agent?: https.Agent } = {}): Promise<any> {
  const { agent, ...fetchOpts } = opts;
  const res = await fetch(url, {
    ...fetchOpts,
    // @ts-expect-error Node fetch supports agent
    agent,
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const err: any = new Error(typeof data === 'object' ? (data.mensagem || data.error_description || JSON.stringify(data)) : text);
    err.status = res.status;
    err.response = { status: res.status, data };
    throw err;
  }
  return data;
}

export class EfiAdapter implements PaymentProvider {
  private cobrancasToken: string | null = null;
  private cobrancasTokenExpiry = 0;
  private pixToken: string | null = null;
  private pixTokenExpiry = 0;
  private readonly creds: EfiCredentials;
  private readonly pixAgent: https.Agent | null;

  constructor(
    private readonly apiKey: string,
    private readonly sandbox: boolean,
    certificate?: Buffer,
  ) {
    this.creds = parseCredentials(apiKey);
    this.pixAgent = certificate
      ? new https.Agent({ pfx: certificate, passphrase: '' })
      : null;
  }

  private basicAuth(): string {
    return Buffer.from(`${this.creds.clientId}:${this.creds.clientSecret}`).toString('base64');
  }

  private async getCobrancasToken(): Promise<string> {
    if (this.cobrancasToken && Date.now() < this.cobrancasTokenExpiry) {
      return this.cobrancasToken;
    }
    const base = cobrancasBaseUrl(this.sandbox);
    const data = await fetchJson(`${base}/v1/authorize`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${this.basicAuth()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grant_type: 'client_credentials' }),
    });
    this.cobrancasToken = data.access_token;
    this.cobrancasTokenExpiry = Date.now() + (data.expires_in - 30) * 1000;
    return data.access_token;
  }

  private async getPixToken(): Promise<string> {
    if (!this.pixAgent) throw new Error('Certificado .p12 necessário para operações PIX na EFí.');
    if (this.pixToken && Date.now() < this.pixTokenExpiry) {
      return this.pixToken;
    }
    const base = pixBaseUrl(this.sandbox);
    const data = await fetchJson(`${base}/oauth/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${this.basicAuth()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grant_type: 'client_credentials' }),
      agent: this.pixAgent,
    });
    this.pixToken = data.access_token;
    this.pixTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return data.access_token;
  }

  private async cobrancasFetch(path: string, opts: RequestInit = {}): Promise<any> {
    const token = await this.getCobrancasToken();
    const base = cobrancasBaseUrl(this.sandbox);
    return fetchJson(`${base}${path}`, {
      ...opts,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
    });
  }

  private async pixFetch(path: string, opts: RequestInit = {}): Promise<any> {
    const token = await this.getPixToken();
    const base = pixBaseUrl(this.sandbox);
    return fetchJson(`${base}${path}`, {
      ...opts,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
      agent: this.pixAgent!,
    } as any);
  }

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    // EFí doesn't require pre-creating customers — inline in charges.
    // We store a synthetic ID based on the external ref.
    return { id: `efi_${input.externalRef}` };
  }

  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    if (input.paymentMethod === 'pix') {
      return this.createPixCharge(input);
    }
    return this.createCobrancasCharge(input);
  }

  private async createPixCharge(input: CreateChargeInput): Promise<ChargeResult> {
    const txid = input.externalRef.replace(/[^a-zA-Z0-9]/g, '').slice(0, 35);
    const data = await this.pixFetch(`/v2/cob/${txid}`, {
      method: 'PUT',
      body: JSON.stringify({
        calendario: { expiracao: 3600 },
        valor: { original: input.value.toFixed(2) },
        chave: '', // Uses account's default PIX key
        infoAdicionais: [{ nome: 'Descricao', valor: input.description.slice(0, 200) }],
      }),
    });

    // Get QR code for the charge
    const loc = data.loc?.id;
    let encodedImage = '';
    let payload = '';
    if (loc) {
      try {
        const qr = await this.pixFetch(`/v2/loc/${loc}/qrcode`);
        encodedImage = qr.imagemQrcode?.replace(/^data:image\/png;base64,/, '') ?? '';
        payload = qr.qrcode ?? '';
      } catch { /* QR may not be immediately available */ }
    }

    return {
      id: data.txid ?? txid,
      invoiceUrl: '',
      status: data.status ?? 'ATIVA',
      pixQrCode: encodedImage ? {
        image: encodedImage,
        payload,
        expiration: new Date(Date.now() + 3600 * 1000).toISOString(),
      } : undefined,
    };
  }

  private async createCobrancasCharge(input: CreateChargeInput): Promise<ChargeResult> {
    const isBoleto = input.paymentMethod === 'boleto' || input.paymentMethod === 'boleto_installment';
    const isCard = input.paymentMethod.startsWith('credit_card') || input.paymentMethod === 'debit_card';

    // Step 1: Create charge
    const chargeBody: any = {
      items: [{
        name: input.description.slice(0, 255),
        value: Math.round(input.value * 100),
        amount: 1,
      }],
    };

    const charge = await this.cobrancasFetch('/v1/charge/one-step', {
      method: 'POST',
      body: JSON.stringify({
        ...chargeBody,
        payment: isBoleto ? {
          banking_billet: {
            customer: {
              name: input.cardHolder?.name ?? 'Cliente',
              email: input.cardHolder?.email ?? '',
              cpf: input.cardHolder?.cpfCnpj?.replace(/\D/g, '') ?? '',
            },
            expire_at: input.dueDate,
            message: input.description.slice(0, 80),
          },
        } : isCard && input.creditCard ? {
          credit_card: {
            customer: {
              name: input.cardHolder?.name ?? input.creditCard.holderName,
              email: input.cardHolder?.email ?? '',
              cpf: input.cardHolder?.cpfCnpj?.replace(/\D/g, '') ?? '',
              birth: '1990-01-01', // EFí requires birth date; placeholder
              phone_number: input.cardHolder?.phone?.replace(/\D/g, '') ?? '',
            },
            installments: input.installments ?? 1,
            payment_token: '', // Would need tokenization step
            billing_address: {
              street: 'N/A',
              number: input.cardHolder?.addressNumber ?? '0',
              neighborhood: 'N/A',
              zipcode: input.cardHolder?.postalCode?.replace(/\D/g, '') ?? '00000000',
              city: 'N/A',
              state: 'SP',
            },
          },
        } : undefined,
      }),
    });

    return {
      id: String(charge.data?.charge_id ?? charge.charge_id ?? ''),
      invoiceUrl: charge.data?.link ?? '',
      status: charge.data?.status ?? charge.status ?? 'waiting',
      bankSlipUrl: charge.data?.pdf?.charge ?? undefined,
      bankSlipBarcode: charge.data?.barcode ?? undefined,
    };
  }

  async createSubscription(input: CreateSubscriptionInput): Promise<SubscriptionResult> {
    // Step 1: Create plan
    const plan = await this.cobrancasFetch('/v1/plan', {
      method: 'POST',
      body: JSON.stringify({
        name: input.description.slice(0, 255),
        interval: 1, // monthly
        repeats: input.maxPayments,
      }),
    });

    const planId = plan.data?.plan_id ?? plan.plan_id;

    // Step 2: Create subscription with payment
    const sub = await this.cobrancasFetch(`/v1/plan/${planId}/subscription/one-step`, {
      method: 'POST',
      body: JSON.stringify({
        items: [{
          name: input.description.slice(0, 255),
          value: Math.round(input.installmentValue * 100),
          amount: 1,
        }],
        payment: {
          credit_card: {
            customer: {
              name: input.cardHolder.name,
              email: input.cardHolder.email,
              cpf: input.cardHolder.cpfCnpj.replace(/\D/g, ''),
              birth: '1990-01-01',
              phone_number: input.cardHolder.phone?.replace(/\D/g, '') ?? '',
            },
            installments: 1,
            payment_token: '', // Would need tokenization
            billing_address: {
              street: 'N/A',
              number: '0',
              neighborhood: 'N/A',
              zipcode: input.cardHolder.postalCode?.replace(/\D/g, '') ?? '00000000',
              city: 'N/A',
              state: 'SP',
            },
          },
        },
      }),
    });

    return {
      id: String(sub.data?.subscription_id ?? sub.subscription_id ?? ''),
      status: sub.data?.status ?? 'active',
    };
  }

  async createPixAutomatico(input: CreatePixAutomaticoInput): Promise<PixAutomaticoResult> {
    const frequencyMap: Record<string, string> = {
      WEEKLY: 'SEMANAL',
      MONTHLY: 'MENSAL',
      QUARTERLY: 'TRIMESTRAL',
      SEMIANNUALLY: 'SEMESTRAL',
      ANNUALLY: 'ANUAL',
    };

    // Step 1: Create recurrence contract
    const rec = await this.pixFetch('/v2/rec', {
      method: 'POST',
      body: JSON.stringify({
        calendario: {
          dataInicial: input.startDate,
          frequencia: frequencyMap[input.frequency] ?? 'MENSAL',
        },
        valor: { original: input.value.toFixed(2) },
        chave: '', // Uses default PIX key
        devedor: { cpf: '', nome: '' }, // Will be filled by payer's bank
        descricao: input.description.slice(0, 140),
      }),
    });

    const idRec = rec.idRec;

    // Step 2: Create solicitation request (triggers QR code)
    const solic = await this.pixFetch('/v2/solicrec', {
      method: 'POST',
      body: JSON.stringify({ idRec }),
    });

    // Step 3: Get QR code from loc
    let encodedImage = '';
    let payload = '';
    const locId = solic.loc?.id ?? rec.loc?.id;
    if (locId) {
      try {
        const qr = await this.pixFetch(`/v2/locrec/${locId}/qrcode`);
        encodedImage = qr.imagemQrcode?.replace(/^data:image\/png;base64,/, '') ?? '';
        payload = qr.qrcode ?? '';
      } catch { /* QR may not be immediately available */ }
    }

    return {
      id: idRec ?? solic.idSolicRec ?? '',
      status: rec.status ?? 'CRIADA',
      encodedImage,
      payload,
    };
  }

  async validateCredentials(): Promise<ValidateCredentialsResult> {
    try {
      await this.getCobrancasToken();
      return { valid: true, accountName: 'Efí Bank' };
    } catch {
      return { valid: false };
    }
  }

  async registerWebhook(_url: string, _authToken: string): Promise<void> {
    // EFí webhooks for Cobranças are set per-charge via notification_url.
    // PIX webhooks are registered via PUT /v2/webhook/:chave.
    // No global registration needed at connect time.
  }

  parseWebhookEvent(
    _headers: Record<string, string>,
    body: unknown,
  ): WebhookEvent | null {
    // EFí Cobranças webhook: sends POST with { notification } token only.
    // The caller must GET /v1/notification/:token to get actual status.
    // We handle both formats: Cobranças notification token and PIX webhook.
    const payload = body as Record<string, unknown>;

    // PIX webhook format
    if (payload?.pix && Array.isArray(payload.pix)) {
      const pixArr = payload.pix as any[];
      if (pixArr.length === 0) return null;
      const pix = pixArr[0];
      const txid: string = pix.txid ?? '';
      if (!txid) return null;

      return {
        type: 'payment_confirmed',
        paymentId: pix.endToEndId ?? txid,
        externalRef: txid,
        value: parseFloat(pix.valor) || 0,
        paymentMethod: 'pix',
        paymentDate: pix.horario ? new Date(pix.horario).toISOString() : new Date().toISOString(),
      };
    }

    // Cobranças notification format: { notification: "token_string" }
    // The event webhook handler will need to fetch GET /v1/notification/:token
    // We return a minimal event that signals it needs resolution.
    const notificationToken = payload?.notification as string | undefined;
    if (notificationToken) {
      return {
        type: 'payment_confirmed' as WebhookEventType,
        paymentId: notificationToken,
        externalRef: '',
        value: 0,
        paymentMethod: 'credit_card',
      };
    }

    return null;
  }

  async resolveNotification(notificationToken: string): Promise<WebhookEvent | null> {
    const data = await this.cobrancasFetch(`/v1/notification/${notificationToken}`);
    const history = data.data as any[];
    if (!history || history.length === 0) return null;

    const latest = history[history.length - 1];
    const statusMap: Record<string, WebhookEventType> = {
      paid: 'payment_confirmed',
      refunded: 'payment_refunded',
      canceled: 'payment_deleted',
      unpaid: 'payment_overdue',
      expired: 'payment_overdue',
    };

    const type = statusMap[latest.status?.current] ?? null;
    if (!type) return null;

    return {
      type,
      paymentId: String(latest.identifiers?.charge_id ?? ''),
      externalRef: latest.custom_id ?? '',
      value: (latest.value ?? 0) / 100,
      paymentMethod: 'credit_card',
      paymentDate: latest.received_by_bank_at
        ? new Date(latest.received_by_bank_at).toISOString()
        : undefined,
    };
  }

  async refundCharge(chargeId: string, value?: number): Promise<RefundResult> {
    const refundValue = value ? Math.round(value * 100) : undefined;
    const data = await this.cobrancasFetch(`/v1/charge/${chargeId}/cancel`, {
      method: 'PUT',
      ...(refundValue ? { body: JSON.stringify({ value: refundValue }) } : {}),
    });

    return {
      id: chargeId,
      status: 'refunded',
      value: value ?? (data.value ? data.value / 100 : 0),
    };
  }

  supportedMethods(): PaymentMethod[] {
    return [
      'pix',
      'boleto',
      'credit_card',
      'credit_card_installment',
    ];
  }
}
