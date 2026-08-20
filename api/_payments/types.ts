export type GatewayType = 'asaas' | 'stripe' | 'mercadopago' | 'pagarme';

export type PaymentMethod =
  | 'pix'
  | 'debit_card'
  | 'boleto'
  | 'boleto_installment'
  | 'credit_card'
  | 'credit_card_installment'
  | 'credit_card_subscription';

export interface CreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface CardHolderData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  postalCode?: string;
  addressNumber?: string;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  externalRef: string;
  document?: string;
}

export interface Customer {
  id: string;
}

export interface CreateChargeInput {
  customerId: string;
  value: number;
  dueDate: string;
  description: string;
  paymentMethod: PaymentMethod;
  installments?: number;
  externalRef: string;
  creditCard?: CreditCardData;
  cardHolder?: CardHolderData;
}

export interface ChargeResult {
  id: string;
  invoiceUrl: string;
  status: string;
  pixQrCode?: { image: string; payload: string; expiration: string };
  bankSlipUrl?: string;
  bankSlipBarcode?: string;
}

export type WebhookEventType =
  | 'payment_confirmed'
  | 'payment_refunded'
  | 'payment_overdue'
  | 'payment_deleted';

export interface WebhookEvent {
  type: WebhookEventType;
  paymentId: string;
  externalRef: string;
  value: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
}

export interface CreateSubscriptionInput {
  customerId: string;
  installmentValue: number;
  nextDueDate: string;
  description: string;
  maxPayments: number;
  externalRef: string;
  creditCard: CreditCardData;
  cardHolder: CardHolderData;
}

export interface SubscriptionResult {
  id: string;
  status: string;
}

export interface ValidateCredentialsResult {
  valid: boolean;
  accountName?: string;
  document?: string;
}
