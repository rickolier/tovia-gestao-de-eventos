import * as functions from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";

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
        description: `Ekko - Plano ${planLevel.charAt(0).toUpperCase() + planLevel.slice(1)}`,
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
