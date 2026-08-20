import axios from 'axios';
import type { PaymentProvider } from '../provider.js';
import type {
  CreateCustomerInput,
  Customer,
  CreateChargeInput,
  ChargeResult,
  CreateSubscriptionInput,
  SubscriptionResult,
  ValidateCredentialsResult,
  WebhookEvent,
  PaymentMethod,
  WebhookEventType,
} from '../types.js';
import {
  createOrFindAsaasCustomer,
  createAsaasCharge,
  createAsaasSubscription,
  registerAsaasWebhook,
  asaasBaseUrl,
  type AsaasBillingType,
} from '../../_gateway-utils.js';

const PAYMENT_METHOD_TO_BILLING: Record<string, AsaasBillingType> = {
  pix: 'PIX',
  debit_card: 'DEBIT_CARD',
  boleto: 'BOLETO',
  boleto_installment: 'BOLETO',
  credit_card: 'CREDIT_CARD',
  credit_card_installment: 'CREDIT_CARD',
  credit_card_subscription: 'CREDIT_CARD',
};

const BILLING_TO_PAYMENT_METHOD: Record<string, PaymentMethod> = {
  PIX: 'pix',
  BOLETO: 'boleto',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
};

const ASAAS_EVENT_MAP: Record<string, WebhookEventType> = {
  PAYMENT_CONFIRMED: 'payment_confirmed',
  PAYMENT_RECEIVED: 'payment_confirmed',
  PAYMENT_REFUNDED: 'payment_refunded',
  PAYMENT_OVERDUE: 'payment_overdue',
  PAYMENT_DELETED: 'payment_deleted',
};

export class AsaasAdapter implements PaymentProvider {
  constructor(
    private readonly apiKey: string,
    private readonly sandbox: boolean,
  ) {}

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    const id = await createOrFindAsaasCustomer(
      this.apiKey,
      this.sandbox,
      input.name,
      input.email,
      input.externalRef,
      input.document,
    );
    return { id };
  }

  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    const billingType = PAYMENT_METHOD_TO_BILLING[input.paymentMethod] ?? 'UNDEFINED';

    const result = await createAsaasCharge(this.apiKey, this.sandbox, {
      customerId: input.customerId,
      value: input.value,
      dueDate: input.dueDate,
      description: input.description,
      billingType: billingType as AsaasBillingType,
      installmentCount: input.installments,
      externalReference: input.externalRef,
      creditCard: input.creditCard,
      creditCardHolderInfo: input.cardHolder,
    });

    return {
      id: result.id,
      invoiceUrl: result.invoiceUrl,
      status: result.status,
      pixQrCode: result.pixQrCode
        ? {
            image: result.pixQrCode.encodedImage,
            payload: result.pixQrCode.payload,
            expiration: result.pixQrCode.expirationDate,
          }
        : undefined,
      bankSlipUrl: result.bankSlipUrl,
      bankSlipBarcode: result.identificationField,
    };
  }

  async createSubscription(input: CreateSubscriptionInput): Promise<SubscriptionResult> {
    return createAsaasSubscription(this.apiKey, this.sandbox, {
      customerId: input.customerId,
      installmentValue: input.installmentValue,
      nextDueDate: input.nextDueDate,
      description: input.description,
      maxPayments: input.maxPayments,
      externalReference: input.externalRef,
      creditCard: input.creditCard,
      creditCardHolderInfo: input.cardHolder,
    });
  }

  async validateCredentials(): Promise<ValidateCredentialsResult> {
    const base = asaasBaseUrl(this.sandbox);
    try {
      await axios.get(`${base}/customers`, {
        params: { limit: 1 },
        headers: { access_token: this.apiKey, 'Content-Type': 'application/json' },
        timeout: 8000,
      });

      let accountName: string | undefined;
      let document: string | undefined;
      try {
        const info = await axios.get(`${base}/myAccount/commercialInfo`, {
          headers: { access_token: this.apiKey, 'Content-Type': 'application/json' },
          timeout: 8000,
        });
        accountName = info.data.companyName || info.data.name;
        document = info.data.cpfCnpj;
      } catch {
        // commercialInfo may not be available on all accounts
      }

      return { valid: true, accountName, document };
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        return { valid: false };
      }
      throw err;
    }
  }

  async registerWebhook(url: string, authToken: string): Promise<void> {
    await registerAsaasWebhook(this.apiKey, this.sandbox, url, authToken);
  }

  parseWebhookEvent(
    headers: Record<string, string>,
    body: unknown,
  ): WebhookEvent | null {
    const payload = body as Record<string, unknown>;
    const eventName = payload?.event as string | undefined;
    if (!eventName) return null;

    const type = ASAAS_EVENT_MAP[eventName];
    if (!type) return null;

    const payment = payload.payment as Record<string, unknown> | undefined;
    if (!payment) return null;

    const billingType = (payment.billingType as string) ?? '';
    const paymentMethod = BILLING_TO_PAYMENT_METHOD[billingType] ?? 'pix';

    return {
      type,
      paymentId: (payment.id as string) ?? '',
      externalRef: (payment.externalReference as string) ?? '',
      value: (payment.value as number) ?? 0,
      paymentMethod,
      paymentDate: payment.paymentDate
        ? new Date(payment.paymentDate as string).toISOString()
        : undefined,
    };
  }

  supportedMethods(): PaymentMethod[] {
    return [
      'pix',
      'debit_card',
      'boleto',
      'boleto_installment',
      'credit_card',
      'credit_card_installment',
      'credit_card_subscription',
    ];
  }
}
