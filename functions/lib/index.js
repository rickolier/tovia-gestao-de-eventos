"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventCharge = exports.saveGatewayConfig = exports.asaasWebhook = exports.suspendUser = exports.createCheckout = void 0;
const functions = __importStar(require("firebase-functions/v2/https"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const gateway_utils_1 = require("./gateway-utils");
admin.initializeApp();
const db = (0, firestore_1.getFirestore)(admin.app(), 'ai-studio-5b5d834d-8788-4cb4-90df-ca1c7e43a048');
const ASAAS_BASE_URL = "https://sandbox.asaas.com/api/v3";
const PLAN_PRICES = {
    essencial: 39.90,
    pro: 99.00,
};
// ─── Criar checkout de assinatura ─────────────────────────────────────────────
exports.createCheckout = functions.onCall({ secrets: ["ASAAS_API_KEY"], region: "us-central1" }, async (request) => {
    var _a;
    const { planLevel, userId, userName, userEmail } = request.data;
    if (!planLevel || !userId || !userEmail) {
        throw new functions.HttpsError("invalid-argument", "Dados incompletos.");
    }
    if (planLevel === "start") {
        await db.collection("users").doc(userId).update({ plano: "start", asaasSubscriptionId: null });
        return { success: true, free: true };
    }
    const price = PLAN_PRICES[planLevel];
    if (!price)
        throw new functions.HttpsError("invalid-argument", "Plano inválido.");
    const apiKey = process.env.ASAAS_API_KEY;
    const headers = { access_token: apiKey, "Content-Type": "application/json" };
    // 1. Buscar ou criar cliente no Asaas
    let customerId;
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() || {};
    if (userData.asaasCustomerId) {
        customerId = userData.asaasCustomerId;
    }
    else {
        const customerRes = await axios_1.default.post(`${ASAAS_BASE_URL}/customers`, { name: userName || userEmail, email: userEmail, externalReference: userId }, { headers });
        customerId = customerRes.data.id;
        await db.collection("users").doc(userId).update({ asaasCustomerId: customerId });
    }
    // 2. Criar assinatura recorrente mensal
    const subscriptionRes = await axios_1.default.post(`${ASAAS_BASE_URL}/subscriptions`, {
        customer: customerId,
        billingType: "UNDEFINED", // Permite cartão, boleto ou pix
        value: price,
        nextDueDate: new Date().toISOString().split("T")[0],
        cycle: "MONTHLY",
        description: `Tovia - Plano ${planLevel.charAt(0).toUpperCase() + planLevel.slice(1)}`,
        externalReference: `${userId}:${planLevel}`,
    }, { headers });
    const subscriptionId = subscriptionRes.data.id;
    // 3. Buscar link de pagamento da primeira cobrança
    const paymentsRes = await axios_1.default.get(`${ASAAS_BASE_URL}/subscriptions/${subscriptionId}/payments`, { headers });
    const firstPayment = (_a = paymentsRes.data.data) === null || _a === void 0 ? void 0 : _a[0];
    const paymentUrl = (firstPayment === null || firstPayment === void 0 ? void 0 : firstPayment.invoiceUrl) || (firstPayment === null || firstPayment === void 0 ? void 0 : firstPayment.bankSlipUrl);
    if (!paymentUrl) {
        throw new functions.HttpsError("internal", "Não foi possível gerar o link de pagamento.");
    }
    // 4. Salvar subscriptionId pendente no Firestore
    await db.collection("users").doc(userId).update({
        asaasSubscriptionId: subscriptionId,
        planoPendente: planLevel,
    });
    return { paymentUrl, subscriptionId };
});
// ─── Suspender usuário (admin) ────────────────────────────────────────────────
exports.suspendUser = functions.onCall({ region: "us-central1" }, async (request) => {
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
    const { userId } = request.data;
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
});
// ─── Webhook do Asaas ──────────────────────────────────────────────────────────
exports.asaasWebhook = functions.onRequest({ region: "us-central1", secrets: ["ASAAS_WEBHOOK_TOKEN"] }, async (req, res) => {
    // Verifica token de segurança no header
    const token = req.headers["asaas-access-token"];
    if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
        res.status(401).send("Unauthorized");
        return;
    }
    const event = req.body;
    const eventType = event === null || event === void 0 ? void 0 : event.event;
    const payment = event === null || event === void 0 ? void 0 : event.payment;
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
        const externalRef = payment.externalReference || "";
        const [userId, planLevel] = externalRef.split(":");
        if (userId && planLevel) {
            await db.collection("users").doc(userId).update({
                plano: planLevel,
                planoPendente: null,
            });
        }
    }
    if (canceledEvents.includes(eventType)) {
        const externalRef = payment.externalReference || "";
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
});
// ─── Salvar configuração de gateway (BYOG) ───────────────────────────────────
exports.saveGatewayConfig = functions.onCall({ secrets: ["GATEWAY_ENCRYPTION_KEY"], region: "us-central1" }, async (request) => {
    if (!request.auth) {
        throw new functions.HttpsError("unauthenticated", "Não autenticado.");
    }
    const { gatewayType, apiKey, sandbox } = request.data;
    if (!apiKey || !gatewayType) {
        throw new functions.HttpsError("invalid-argument", "Dados incompletos.");
    }
    const encKey = process.env.GATEWAY_ENCRYPTION_KEY;
    const userId = request.auth.uid;
    // Valida a chave chamando endpoint leve do Asaas
    const isValid = await (0, gateway_utils_1.testAsaasApiKey)(apiKey, sandbox);
    if (!isValid) {
        throw new functions.HttpsError("invalid-argument", "Chave de API inválida. Verifique e tente novamente.");
    }
    const encryptedKey = (0, gateway_utils_1.encrypt)(apiKey, encKey);
    const webhookToken = (0, gateway_utils_1.genToken)();
    const encryptedWebhookToken = (0, gateway_utils_1.encrypt)(webhookToken, encKey);
    // Registra o webhook na conta Asaas do organizador (best-effort)
    const webhookUrl = "https://tovia.app/api/event-payment-webhook";
    try {
        await (0, gateway_utils_1.registerAsaasWebhook)(apiKey, sandbox, webhookUrl, webhookToken);
    }
    catch (e) {
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
    const webhookTokenHash = (0, crypto_1.createHash)("sha256").update(webhookToken).digest("hex");
    await db.collection("organizer_public").doc(userId).set({
        gateway_connected: true,
        webhook_token_hash: webhookTokenHash,
    }, { merge: true });
    return { success: true };
});
// ─── Criar cobrança de evento (BYOG) ─────────────────────────────────────────
exports.createEventCharge = functions.onCall({ secrets: ["GATEWAY_ENCRYPTION_KEY"], region: "us-central1" }, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const { eventoId, inscricaoId, paymentMethod, installments, attendeeName, attendeeEmail, attendeeCpf, attendeePhone, creditCard, valor, } = request.data;
    if (!eventoId || !inscricaoId || !paymentMethod || !attendeeName || !attendeeEmail || !valor) {
        throw new functions.HttpsError("invalid-argument", "Dados incompletos.");
    }
    const encKey = process.env.GATEWAY_ENCRYPTION_KEY;
    // Busca o evento para descobrir o organizador
    const eventoDoc = await db.collection("eventos").doc(eventoId).get();
    if (!eventoDoc.exists) {
        throw new functions.HttpsError("not-found", "Evento não encontrado.");
    }
    const evento = eventoDoc.data();
    const organizerId = evento.criado_por;
    // Busca o gateway do organizador
    const orgDoc = await db.collection("users").doc(organizerId).get();
    if (!orgDoc.exists) {
        throw new functions.HttpsError("not-found", "Organizador não encontrado.");
    }
    const orgData = orgDoc.data();
    if (!((_a = orgData.gateway) === null || _a === void 0 ? void 0 : _a.encrypted_api_key)) {
        throw new functions.HttpsError("failed-precondition", "Organizador não tem gateway configurado.");
    }
    const apiKey = (0, gateway_utils_1.decrypt)(orgData.gateway.encrypted_api_key, encKey);
    const sandbox = (_b = orgData.gateway.sandbox) !== null && _b !== void 0 ? _b : false;
    // Cria ou reutiliza cliente Asaas do participante
    let customerId;
    try {
        customerId = await (0, gateway_utils_1.createOrFindAsaasCustomer)(apiKey, sandbox, attendeeName, attendeeEmail, `attendee:${inscricaoId}`, attendeeCpf);
    }
    catch (e) {
        const body = JSON.stringify((_d = (_c = e === null || e === void 0 ? void 0 : e.response) === null || _c === void 0 ? void 0 : _c.data) !== null && _d !== void 0 ? _d : e === null || e === void 0 ? void 0 : e.message);
        console.error("[createEventCharge] createCustomer failed:", body);
        throw new functions.HttpsError("internal", `Erro ao criar cliente Asaas: ${body}`);
    }
    // Data de vencimento: 3 dias a partir de hoje
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const dueDateStr = dueDate.toISOString().split("T")[0];
    let charge;
    try {
        charge = await (0, gateway_utils_1.createAsaasCharge)(apiKey, sandbox, {
            customerId,
            value: valor,
            dueDate: dueDateStr,
            description: `Inscrição — ${evento.nome}`,
            billingType: (0, gateway_utils_1.mapBillingType)(paymentMethod),
            installmentCount: installments,
            externalReference: `event:${eventoId}:${inscricaoId}`,
            creditCard: creditCard,
            creditCardHolderInfo: creditCard ? {
                name: attendeeName,
                email: attendeeEmail,
                cpfCnpj: (attendeeCpf || '').replace(/\D/g, ''),
                phone: (attendeePhone || '').replace(/\D/g, ''),
            } : undefined,
        });
    }
    catch (e) {
        const body = JSON.stringify((_f = (_e = e === null || e === void 0 ? void 0 : e.response) === null || _e === void 0 ? void 0 : _e.data) !== null && _f !== void 0 ? _f : e === null || e === void 0 ? void 0 : e.message);
        console.error("[createEventCharge] createCharge failed:", body);
        throw new functions.HttpsError("internal", `Erro ao criar cobrança Asaas: ${body}`);
    }
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
        pixQrCode: (_g = charge.pixQrCode) !== null && _g !== void 0 ? _g : null,
        bankSlipUrl: (_h = charge.bankSlipUrl) !== null && _h !== void 0 ? _h : null,
        identificationField: (_j = charge.identificationField) !== null && _j !== void 0 ? _j : null,
        chargeId: charge.id,
    };
});
//# sourceMappingURL=index.js.map