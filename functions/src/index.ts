import * as functions from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
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
  mapBillingType,
} from "./gateway-utils";

admin.initializeApp();
const db = admin.firestore();

const ASAAS_BASE_URL = "https://sandbox.asaas.com/api/v3";

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

    const ADMIN_EMAIL = "olierprado@gmail.com";
    const callerEmail = request.auth.token.email;
    if (callerEmail !== ADMIN_EMAIL) {
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
      paymentMethod,
      installments,
      attendeeName,
      attendeeEmail,
      valor,
    } = request.data as {
      eventoId: string;
      inscricaoId: string;
      paymentMethod: string;
      installments?: number;
      attendeeName: string;
      attendeeEmail: string;
      valor: number;
    };

    if (!eventoId || !inscricaoId || !paymentMethod || !attendeeName || !attendeeEmail || !valor) {
      throw new functions.HttpsError("invalid-argument", "Dados incompletos.");
    }

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
    const customerId = await createOrFindAsaasCustomer(
      apiKey,
      sandbox,
      attendeeName,
      attendeeEmail,
      `attendee:${inscricaoId}`
    );

    // Data de vencimento: 3 dias a partir de hoje
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const dueDateStr = dueDate.toISOString().split("T")[0];

    const charge = await createAsaasCharge(apiKey, sandbox, {
      customerId,
      value: valor,
      dueDate: dueDateStr,
      description: `Inscrição — ${evento.nome}`,
      billingType: mapBillingType(paymentMethod),
      installmentCount: installments,
      externalReference: `event:${eventoId}:${inscricaoId}`,
    });

    // Atualiza a inscrição com dados da cobrança
    await db
      .collection(`eventos/${eventoId}/inscricoes`)
      .doc(inscricaoId)
      .update({
        status: "pagamento_iniciado",
        gateway_charge_id: charge.id,
        gateway_payment_url: charge.invoiceUrl,
        forma_pagamento: paymentMethod,
      });

    return {
      paymentUrl: charge.invoiceUrl,
      pixQrCode: charge.pixQrCode ?? null,
      bankSlipUrl: charge.bankSlipUrl ?? null,
      chargeId: charge.id,
    };
  }
);
