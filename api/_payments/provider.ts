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
  RefundResult,
} from './types.js';

export interface PaymentProvider {
  createCustomer(input: CreateCustomerInput): Promise<Customer>;
  createCharge(input: CreateChargeInput): Promise<ChargeResult>;
  createSubscription(input: CreateSubscriptionInput): Promise<SubscriptionResult>;
  createPixAutomatico(input: CreatePixAutomaticoInput): Promise<PixAutomaticoResult>;
  validateCredentials(): Promise<ValidateCredentialsResult>;
  registerWebhook(url: string, authToken: string): Promise<void>;
  parseWebhookEvent(headers: Record<string, string>, body: unknown): WebhookEvent | null;
  supportedMethods(): PaymentMethod[];
  refundCharge(chargeId: string, value?: number): Promise<RefundResult>;
  resolveNotification?(notificationToken: string): Promise<WebhookEvent | null>;
}
