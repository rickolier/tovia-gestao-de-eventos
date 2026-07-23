import type { DecodedIdToken } from 'firebase-admin/auth';

// ── Firestore document shapes (API-side) ─────────────────────────────────────

export interface FirestoreDoc {
  exists: boolean;
  data: () => Record<string, any> | undefined;
  id: string;
  ref: { path: string; delete: () => Promise<void> };
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthError extends Error {
  status: number;
}

export type DecodedToken = DecodedIdToken;

// ── Rate limit ───────────────────────────────────────────────────────────────

export interface RateLimitDoc {
  requests: number[];
}

// ── Asaas webhook payloads ───────────────────────────────────────────────────

export interface AsaasPayment {
  id: string;
  value: number;
  billingType: string;
  paymentDate?: string;
  dueDate?: string;
  externalReference?: string;
  status?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  creditCard?: {
    creditCardBrand: string;
    creditCardNumber: string;
  };
}

export interface AsaasWebhookEvent {
  event: string;
  payment?: AsaasPayment;
}

// ── Checkout request ─────────────────────────────────────────────────────────

export interface CheckoutRequest {
  planLevel: string;
  period?: 'monthly' | 'annual';
  paymentMethod?: string;
  userId: string;
  userName?: string;
  userEmail: string;
  userCpfCnpj?: string;
  userPhone?: string;
  userCep?: string;
  userEndereco?: string;
  userNumero?: string;
  userComplemento?: string;
  userBairro?: string;
}

// ── Billing config ───────────────────────────────────────────────────────────

export interface BillingConfig {
  asaas_api_key?: string;
  sandbox?: boolean;
}

// ── Inscricao (API-side minimal) ─────────────────────────────────────────────

export interface InscricaoData {
  nome?: string;
  email?: string;
  status?: string;
  valor_total?: number;
  valor_pago?: number;
  forma_pagamento?: string;
  ticket_nome?: string;
  data_inscricao?: string;
  presenca?: boolean;
  doadorNome?: string;
  formaPagamento?: string;
}

// ── Evento (API-side minimal) ─────────────────────────────────────────────────

export interface EventoData {
  nome?: string;
  criado_por?: string;
  data_inicio?: string;
  data_fim?: string;
  local?: string;
  config_comunicacao?: {
    email_confirmacao?: {
      ativo?: boolean;
      assunto?: string;
      corpo?: string;
    };
  };
  equipe?: Array<{ userId: string; email: string; nome: string; permissoes: string[] }>;
  equipeIds?: string[];
}

// ── User (API-side minimal) ──────────────────────────────────────────────────

export interface UserData {
  email?: string;
  nome?: string;
  plano?: string | null;
  planoPendente?: string | null;
  asaasSubscriptionId?: string | null;
  asaasCustomerId?: string | null;
  subscriptionPeriod?: string;
  subscriptionExpiresAt?: string;
}

// ── Verification token ───────────────────────────────────────────────────────

export interface VerificationTokenData {
  userId: string;
  expiresAt: number;
}

// ── Inscricao code (OTP) ─────────────────────────────────────────────────────

export interface InscricaoCodeData {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}
