import { z } from 'zod';

// ── Shared ───────────────────────────────────────────────────────────────────

const email = z.string().email('E-mail inválido.');
const cpf = z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos.');

// ── createCheckout ───────────────────────────────────────────────────────────

export const checkoutSchema = z.object({
  planLevel: z.enum(['petach', 'koach', 'chalem'], { message: 'Plano inválido.' }),
  period: z.enum(['monthly', 'annual']).default('monthly'),
  paymentMethod: z.string().default('credit_card'),
  userId: z.string().min(1, 'userId obrigatório.'),
  userName: z.string().optional(),
  userEmail: email,
  userCpfCnpj: z.string().optional(),
  userPhone: z.string().optional(),
  userCep: z.string().optional(),
  userEndereco: z.string().optional(),
  userNumero: z.string().optional(),
  userComplemento: z.string().optional(),
  userBairro: z.string().optional(),
});

// ── sendEmail ────────────────────────────────────────────────────────────────

export const sendEmailSchema = z.object({
  to: z.union([email, z.array(email)]),
  subject: z.string().min(1, 'Assunto obrigatório.'),
  html: z.string().min(1, 'Corpo do e-mail obrigatório.'),
});

// ── getBillingInfo ───────────────────────────────────────────────────────────

export const getBillingInfoSchema = z.object({
  userId: z.string().min(1, 'userId obrigatório.'),
});

// ── equipeJoin ───────────────────────────────────────────────────────────────

export const equipeJoinSchema = z.object({
  eventoId: z.string().min(1, 'eventoId é obrigatório.'),
});

// ── enviarCodigoVerificacao ──────────────────────────────────────────────────

export const enviarCodigoVerificacaoSchema = z.object({
  userId: z.string().min(1, 'userId obrigatório.'),
});

// ── confirmarCodigoVerificacao ───────────────────────────────────────────────

export const confirmarCodigoVerificacaoSchema = z.object({
  token: z.string().min(1, 'Token ausente.'),
});

// ── enviarRedefinicaoSenha ───────────────────────────────────────────────────

export const enviarRedefinicaoSenhaSchema = z.object({
  email: email,
});

// ── enviarCodigoInscricao ────────────────────────────────────────────────────

export const enviarCodigoInscricaoSchema = z.object({
  email: email,
});

// ── confirmarCodigoInscricao ─────────────────────────────────────────────────

export const confirmarCodigoInscricaoSchema = z.object({
  email: email,
  code: z.string().min(1, 'Código obrigatório.'),
});

// ── saveGatewayConfig ───────────────────────────────────────────────────────

export const saveGatewayConfigSchema = z.object({
  gatewayType: z.literal('asaas', { message: 'Gateway inválido.' }),
  apiKey: z.string().min(1, 'Chave de API obrigatória.'),
  sandbox: z.boolean({ message: 'Campo sandbox obrigatório.' }),
  step: z.enum(['validate', 'confirm']).optional(),
});

// ── createEventCharge ───────────────────────────────────────────────────────

export const createEventChargeSchema = z.object({
  eventoId: z.string().min(1, 'eventoId obrigatório.'),
  inscricaoId: z.string().min(1, 'inscricaoId obrigatório.'),
  isDonation: z.boolean().optional(),
  paymentMethod: z.string().min(1, 'paymentMethod obrigatório.'),
  installments: z.number().int().min(1).optional(),
  attendeeName: z.string().min(1, 'attendeeName obrigatório.'),
  attendeeEmail: email,
  attendeeCpf: z.string().optional(),
  attendeePhone: z.string().optional(),
  creditCard: z.object({
    holderName: z.string().min(1),
    number: z.string().min(1),
    expiryMonth: z.string().min(1),
    expiryYear: z.string().min(1),
    ccv: z.string().min(1),
  }).optional(),
  valor: z.number().positive('Valor deve ser positivo.'),
});
