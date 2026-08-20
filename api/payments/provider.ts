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
} from './types.js';

export interface PaymentProvider {
  createCustomer(input: CreateCustomerInput): Promise<Customer>;
  createCharge(input: CreateChargeInput): Promise<ChargeResult>;
  createSubscription(input: CreateSubscriptionInput): Promise<SubscriptionResult>;
  validateCredentials(): Promise<ValidateCredentialsResult>;
  registerWebhook(url: string, authToken: string): Promise<void>;
  parseWebhookEvent(headers: Record<string, string>, body: unknown): WebhookEvent | null;
  supportedMethods(): PaymentMethod[];
}
