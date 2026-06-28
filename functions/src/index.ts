import * as functions from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import axios from "axios";
import { createHash } from "crypto";
import {
  encrypt,
  decrypt,
  genToken,
  testAsaasApiKey,
  registerAsaasWebhook,
  createOrFindAsaasCustomer,
  createAsaasCharge,
  createAsaasSubscription,
  mapBillingType,
} from "./gateway-utils";

admin.initializeApp();
const db = getFirestore(admin.app(), 'ai-studio-5b5d834d-8788-4cb4-90df-ca1c7e43a048');

const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL ?? "https://sandbox.asaas.com/api/v3";

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Bloqueia abuso de Cloud Functions (billing attack, brute-force).
// Janela deslizante de 1 hora por uid+ação.
async function checkRateLimit(uid: string, action: string, maxPerHour = 20): Promise<void> {
  const ref = db.collection("_rate_limits").doc(`${uid}_${action}`);
  const windowMs = 60 * 60 * 1000;
  const now = Date.now();

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const data = doc.data();

    if (!data || now - data.windowStart > windowMs) {
      tx.set(ref, { count: 1, windowStart: now });
    } else if (data.count >= maxPerHour) {
      throw new functions.HttpsError(
        "resource-exhausted",
        "Muitas requisições. Tente novamente em 1 hora."
      );
    } else {
      tx.update(ref, { count: data.count + 1 });
    }
  });
}

const PLAN_PRICES: Record<string, number> = {
  essencial: 39.90,
  pro: 99.00,
};

// ─── Criar checkout de assinatura ─────────────────────────────────────────────
export const createCheckout = functions.onCall(
  { secrets: ["ASAAS_API_KEY"], region: "us-central1" },
  async (request) => {
    const { planLevel, userId, userName, userEmail } = request.data as {
      planLevel: string;
      userId: string;
      userName: string;
      userEmail: string;
    };

    if (!planLevel || !userId || !userEmail) {
      throw new functions.HttpsError("invalid-argument", "Dados incompletos.");
    }

    if (request.auth) await checkRateLimit(request.auth.uid, "createCheckout", 10);

    if (planLevel === "start") {
      await db.collection("users").doc(userId).update({ plano: "start", asaasSubscriptionId: null });
      return { success: true, free: true };
    }

    const price = PLAN_PRICES[planLevel];
    if (!price) throw new functions.HttpsError("invalid-argument", "Plano inválido.");

    const apiKey = process.env.ASAAS_API_KEY!;
    const headers = { access_token: apiKey, "Content-Type": "application/json" };

    // 1. Buscar ou criar cliente no Asaas
    let customerId: string;
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() || {};

    if (userData.asaasCustomerId) {
      customerId = userData.asaasCustomerId;
    } else {
      const customerRes = await axios.post(
        `${ASAAS_BASE_URL}/customers`,
        { name: userName || userEmail, email: userEmail, externalReference: userId },
        { headers }
      );
      customerId = customerRes.data.id;
      await db.collection("users").doc(userId).update({ asaasCustomerId: customerId });
    }

    // 2. Criar assinatura recorrente mensal
    const subscriptionRes = await axios.post(
      `${ASAAS_BASE_URL}/subscriptions`,
      {
        customer: customerId,
        billingType: "UNDEFINED",       // Permite cartão, boleto ou pix
        value: price,
        nextDueDate: new Date().toISOString().split("T")[0],
        cycle: "MONTHLY",
        description: `Tovia - Plano ${planLevel.charAt(0).toUpperCase() + planLevel.slice(1)}`,
        externalReference: `${userId}:${planLevel}`,
      },
      { headers }
    );

    const subscriptionId = subscriptionRes.data.id;

    // 3. Buscar link de pagamento da primeira cobrança
    const paymentsRes = await axios.get(
      `${ASAAS_BASE_URL}/subscriptions/${subscriptionId}/payments`,
      { headers }
    );
    const firstPayment = paymentsRes.data.data?.[0];
    const paymentUrl = firstPayment?.invoiceUrl || firstPayment?.bankSlipUrl;

    if (!paymentUrl) {
      throw new functions.HttpsError("internal", "Não foi possível gerar o link de pagamento.");
    }

    // 4. Salvar subscriptionId pendente no Firestore
    await db.collection("users").doc(userId).update({
      asaasSubscriptionId: subscriptionId,
      planoPendente: planLevel,
    });

    return { paymentUrl, subscriptionId };
  }
);

// ─── Suspender usuário (admin) ────────────────────────────────────────────────
export const suspendUser = functions.onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new functions.HttpsError("unauthenticated", "Não autenticado.");
    }

    const callerEmail = request.auth.token.email;
    const isToviaMaster = callerEmail === "admin@tovia.app";
    if (!isToviaMaster) {
      const adminDoc = await db.collection("admins").doc(request.auth.uid).get();
      if (!adminDoc.exists) {
        throw new functions.HttpsError("permission-denied", "Acesso negado.");
      }
    }

    const { userId } = request.data as { userId: string };
    if (!userId) {
      throw new functions.HttpsError("invalid-argument", "userId é obrigatório.");
    }

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.HttpsError("not-found", "Usuário não encontrado.");
    }

    // Bloqueia acesso e remove plano no Firestore
    await db.collection("users").doc(userId).update({
      desativado: true,
      plano: null,
      planoPendente: null,
    });

    return { success: true };
  }
);

// ─── Webhook do Asaas ──────────────────────────────────────────────────────────
export const asaasWebhook = functions.onRequest(
  { region: "us-central1", secrets: ["ASAAS_WEBHOOK_TOKEN"] },
  async (req, res) => {
    // Verifica token de segurança no header
    const token = req.headers["asaas-access-token"];
    if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
      res.status(401).send("Unauthorized");
      return;
    }

    const event = req.body;
    const eventType: string = event?.event;
    const payment = event?.payment;

    if (!payment) {
      res.status(200).send("ok");
      return;
    }

    // Processar apenas pagamentos confirmados
    const paidEvents = [
      "PAYMENT_CONFIRMED",
      "PAYMENT_RECEIVED",
    ];

    const canceledEvents = [
      "PAYMENT_OVERDUE",
      "SUBSCRIPTION_INACTIVATED",
    ];

    if (paidEvents.includes(eventType)) {
      const externalRef: string = payment.externalReference || "";
      const [userId, planLevel] = externalRef.split(":");

      if (userId && planLevel) {
        await db.collection("users").doc(userId).update({
          plano: planLevel,
          planoPendente: null,
        });
      }
    }

    if (canceledEvents.includes(eventType)) {
      const externalRef: string = payment.externalReference || "";
      const [userId] = externalRef.split(":");
      if (userId) {
        await db.collection("users").doc(userId).update({
          plano: null,
          asaasSubscriptionId: null,
          planoPendente: null,
        });
      }
    }

    res.status(200).send("ok");
  }
);

// ─── Salvar configuração de gateway (BYOG) ───────────────────────────────────
export const saveGatewayConfig = functions.onCall(
  { secrets: ["GATEWAY_ENCRYPTION_KEY"], region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new functions.HttpsError("unauthenticated", "Não autenticado.");
    }

    const { gatewayType, apiKey, sandbox } = request.data as {
      gatewayType: "asaas";
      apiKey: string;
      sandbox: boolean;
    };

    if (!apiKey || !gatewayType) {
      throw new functions.HttpsError("invalid-argument", "Dados incompletos.");
    }

    await checkRateLimit(request.auth.uid, "saveGatewayConfig", 10);

    const encKey = process.env.GATEWAY_ENCRYPTION_KEY!;
    const userId = request.auth.uid;

    // Valida a chave chamando endpoint leve do Asaas
    const isValid = await testAsaasApiKey(apiKey, sandbox);
    if (!isValid) {
      throw new functions.HttpsError(
        "invalid-argument",
        "Chave de API inválida. Verifique e tente novamente."
      );
    }

    const encryptedKey = encrypt(apiKey, encKey);
    const webhookToken = genToken();
    const encryptedWebhookToken = encrypt(webhookToken, encKey);

    // Registra o webhook na conta Asaas do organizador (best-effort)
    const webhookUrl = "https://tovia.app/api/event-payment-webhook";
    try {
      await registerAsaasWebhook(apiKey, sandbox, webhookUrl, webhookToken);
    } catch (e) {
      console.warn("Webhook registration failed (non-fatal):", e);
    }

    await db.collection("users").doc(userId).set({
      gateway_connected: true,
      gateway: {
        type: gatewayType,
        encrypted_api_key: encryptedKey,
        sandbox: !!sandbox,
        connected_at: new Date().toISOString(),
        encrypted_webhook_token: encryptedWebhookToken,
      },
    }, { merge: true });

    const webhookTokenHash = createHash("sha256").update(webhookToken).digest("hex");
    await db.collection("organizer_public").doc(userId).set({
      gateway_connected: true,
      webhook_token_hash: webhookTokenHash,
    }, { merge: true });

    return { success: true };
  }
);

// ─── Criar cobrança de evento (BYOG) ─────────────────────────────────────────
export const createEventCharge = functions.onCall(
  { secrets: ["GATEWAY_ENCRYPTION_KEY"], region: "us-central1" },
  async (request) => {
    const {
      eventoId,
      inscricaoId,
      isDonation,
      paymentMethod,
      installments,
      attendeeName,
      attendeeEmail,
      attendeeCpf,
      attendeePhone,
      creditCard,
      valor,
    } = request.data as {
      eventoId: string;
      inscricaoId: string;
      isDonation?: boolean;
      paymentMethod: string;
      installments?: number;
      attendeeName: string;
      attendeeEmail: string;
      attendeeCpf?: string;
      attendeePhone?: string;
      creditCard?: {
        holderName: string;
        number: string;
        expiryMonth: string;
        expiryYear: string;
        ccv: string;
      };
      valor: number;
    };

    if (!eventoId || !inscricaoId || !paymentMethod || !attendeeName || !attendeeEmail || !valor) {
      throw new functions.HttpsError("invalid-argument", "Dados incompletos.");
    }

    // Rate limit por IP aproximado (uid anônimo ou autenticado)
    const rateLimitUid = request.auth?.uid ?? `anon_${attendeeEmail}`;
    await checkRateLimit(rateLimitUid, "createEventCharge", 15);

    const encKey = process.env.GATEWAY_ENCRYPTION_KEY!;

    // Busca o evento para descobrir o organizador
    const eventoDoc = await db.collection("eventos").doc(eventoId).get();
    if (!eventoDoc.exists) {
      throw new functions.HttpsError("not-found", "Evento não encontrado.");
    }
    const evento = eventoDoc.data()!;
    const organizerId: string = evento.criado_por;

    // Busca o gateway do organizador
    const orgDoc = await db.collection("users").doc(organizerId).get();
    if (!orgDoc.exists) {
      throw new functions.HttpsError("not-found", "Organizador não encontrado.");
    }
    const orgData = orgDoc.data()!;

    if (!orgData.gateway?.encrypted_api_key) {
      throw new functions.HttpsError(
        "failed-precondition",
        "Organizador não tem gateway configurado."
      );
    }

    const apiKey = decrypt(orgData.gateway.encrypted_api_key, encKey);
    const sandbox: boolean = orgData.gateway.sandbox ?? false;

    // Cria ou reutiliza cliente Asaas do participante
    let customerId: string;
    try {
      customerId = await createOrFindAsaasCustomer(
        apiKey,
        sandbox,
        attendeeName,
        attendeeEmail,
        `attendee:${inscricaoId}`,
        attendeeCpf,
      );
    } catch (e: any) {
      const body = JSON.stringify(e?.response?.data ?? e?.message);
      console.error("[createEventCharge] createCustomer failed:", body);
      throw new functions.HttpsError("internal", `Erro ao criar cliente Asaas: ${body}`);
    }

    // Data de vencimento: 3 dias a partir de hoje
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const dueDateStr = dueDate.toISOString().split("T")[0];

    const holderInfo = creditCard ? {
      name: attendeeName,
      email: attendeeEmail,
      cpfCnpj: (attendeeCpf || '').replace(/\D/g, ''),
      phone: (attendeePhone || '').replace(/\D/g, ''),
    } : undefined;

    // ── Cobrança recorrente (assinatura mensal com maxPayments) ──────────────
    if (paymentMethod === 'recorrente') {
      if (!creditCard) {
        throw new functions.HttpsError("invalid-argument", "Dados do cartão são obrigatórios para cobrança recorrente.");
      }
      const totalInstallments = Math.max(2, installments ?? 2);
      const installmentValue = parseFloat((valor / totalInstallments).toFixed(2));

      let subscription: { id: string; status: string };
      try {
        subscription = await createAsaasSubscription(apiKey, sandbox, {
          customerId,
          installmentValue,
          nextDueDate: dueDateStr,
          description: `Inscrição — ${evento.nome} (${totalInstallments}x recorrente)`,
          maxPayments: totalInstallments,
          externalReference: `event:${eventoId}:${inscricaoId}`,
          creditCard,
          creditCardHolderInfo: holderInfo!,
        });
      } catch (e: any) {
        const body = JSON.stringify(e?.response?.data ?? e?.message);
        console.error("[createEventCharge] createSubscription failed:", body);
        throw new functions.HttpsError("internal", `Erro ao criar cobrança recorrente: ${body}`);
      }

      const subColl = isDonation ? 'doacoes' : 'inscricoes';
      await db.collection(`eventos/${eventoId}/${subColl}`).doc(inscricaoId).update({
        ...(isDonation ? { formaPagamento: 'recorrente' } : { status: 'pagamento_iniciado', forma_pagamento: 'recorrente' }),
        gateway_subscription_id: subscription.id,
        installments: totalInstallments,
        installment_value: installmentValue,
      });

      return {
        paymentUrl: null,
        pixQrCode: null,
        bankSlipUrl: null,
        identificationField: null,
        chargeId: subscription.id,
        installmentValue,
        installmentCount: totalInstallments,
      };
    }

    // ── Cobrança única / crédito parcelado ────────────────────────────────────
    let charge: Awaited<ReturnType<typeof createAsaasCharge>>;
    try {
      charge = await createAsaasCharge(apiKey, sandbox, {
        customerId,
        value: valor,
        dueDate: dueDateStr,
        description: `Inscrição — ${evento.nome}`,
        billingType: mapBillingType(paymentMethod),
        installmentCount: installments,
        externalReference: `event:${eventoId}:${inscricaoId}`,
        creditCard,
        creditCardHolderInfo: holderInfo,
      });
    } catch (e: any) {
      const body = JSON.stringify(e?.response?.data ?? e?.message);
      console.error("[createEventCharge] createCharge failed:", body);
      throw new functions.HttpsError("internal", `Erro ao criar cobrança Asaas: ${body}`);
    }

    const chargeColl = isDonation ? 'doacoes' : 'inscricoes';
    await db
      .collection(`eventos/${eventoId}/${chargeColl}`)
      .doc(inscricaoId)
      .update({
        ...(isDonation
          ? { formaPagamento: paymentMethod }
          : { status: 'pagamento_iniciado', forma_pagamento: paymentMethod }),
        gateway_charge_id: charge.id,
        gateway_payment_url: charge.invoiceUrl,
      });

    return {
      paymentUrl: charge.invoiceUrl,
      pixQrCode: charge.pixQrCode ?? null,
      bankSlipUrl: charge.bankSlipUrl ?? null,
      identificationField: charge.identificationField ?? null,
      chargeId: charge.id,
      installmentValue: null,
      installmentCount: null,
    };
  }
);

// ─── LGPD Art. 18 — Solicitação de exclusão de dados pessoais ────────────────
// Anonimiza os dados imediatamente e marca a conta para exclusão completa.
// A deleção definitiva das subcoleções ocorre de forma assíncrona (batch).
export const requestDataDeletion = functions.onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new functions.HttpsError("unauthenticated", "Não autenticado.");
    }

    const uid = request.auth.uid;

    // Anonimiza dados pessoais no documento do usuário
    await db.collection("users").doc(uid).update({
      nome: "[Conta Excluída]",
      email: "[excluído]",
      whatsapp: admin.firestore.FieldValue.delete(),
      bio: admin.firestore.FieldValue.delete(),
      descricao: admin.firestore.FieldValue.delete(),
      imagem_url: admin.firestore.FieldValue.delete(),
      contato_email: admin.firestore.FieldValue.delete(),
      telefone: admin.firestore.FieldValue.delete(),
      site: admin.firestore.FieldValue.delete(),
      redes_social: admin.firestore.FieldValue.delete(),
      cnpj: admin.firestore.FieldValue.delete(),
      cep: admin.firestore.FieldValue.delete(),
      endereco: admin.firestore.FieldValue.delete(),
      gateway: admin.firestore.FieldValue.delete(),
      gateway_connected: false,
      deletion_requested_at: new Date().toISOString(),
      deletion_status: "pending",
    });

    // Remove dados públicos do organizador
    await db.collection("organizer_public").doc(uid).delete();

    // Desativa a conta no Firebase Auth (impede login imediato)
    await admin.auth().updateUser(uid, { disabled: true });

    return { success: true };
  }
);
