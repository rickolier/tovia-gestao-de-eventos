// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthError extends Error {
  status: number;
}

// ── Asaas ────────────────────────────────────────────────────────────────────

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
