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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestDataDeletion = exports.uploadProfilePhoto = exports.lembreteEvento = exports.processarInscricoesPendentes = exports.validateBillingKey = exports.uploadEventCover = exports.createEventCharge = exports.saveGatewayConfig = exports.asaasWebhook = exports.suspendUser = exports.createCheckout = void 0;
const functions = __importStar(require("firebase-functions/v2/https"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const sharp_1 = __importDefault(require("sharp"));
const gateway_utils_1 = require("./gateway-utils");
admin.initializeApp();
const db = (0, firestore_1.getFirestore)(admin.app(), 'ai-studio-5b5d834d-8788-4cb4-90df-ca1c7e43a048');
const ASAAS_BASE_URL = (_a = process.env.ASAAS_BASE_URL) !== null && _a !== void 0 ? _a : "https://sandbox.asaas.com/api/v3";
// ─── Rate limiting ────────────────────────────────────────────────────────────
// Bloqueia abuso de Cloud Functions (billing attack, brute-force).
// Janela deslizante de 1 hora por uid+ação.
async function checkRateLimit(uid, action, maxPerHour = 20) {
    const ref = db.collection("_rate_limits").doc(`${uid}_${action}`);
    const windowMs = 60 * 60 * 1000;
    const now = Date.now();
    await db.runTransaction(async (tx) => {
        const doc = await tx.get(ref);
        const data = doc.data();
        if (!data || now - data.windowStart > windowMs) {
            tx.set(ref, { count: 1, windowStart: now });
        }
        else if (data.count >= maxPerHour) {
            throw new functions.HttpsError("resource-exhausted", "Muitas requisições. Tente novamente em 1 hora.");
        }
        else {
            tx.update(ref, { count: data.count + 1 });
        }
    });
}
const PLAN_PRICES = {
    start: 39,
    essencial: 99,
    pro: 249,
};
// ─── Criar checkout de assinatura ─────────────────────────────────────────────
exports.createCheckout = functions.onCall({ secrets: ["ASAAS_API_KEY"], region: "us-central1" }, async (request) => {
    var _a;
    const { planLevel, userId, userName, userEmail } = request.data;
    if (!planLevel || !userId || !userEmail) {
        throw new functions.HttpsError("invalid-argument", "Dados incompletos.");
    }
    if (request.auth)
        await checkRateLimit(request.auth.uid, "createCheckout", 10);
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
    const callerEmail = request.auth.token.email;
    const isToviaMaster = callerEmail === "admin@tovia.app";
    if (!isToviaMaster) {
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
    await checkRateLimit(request.auth.uid, "saveGatewayConfig", 10);
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const { eventoId, inscricaoId, isDonation, paymentMethod, installments, attendeeName, attendeeEmail, attendeeCpf, attendeePhone, creditCard, valor, } = request.data;
    if (!eventoId || !inscricaoId || !paymentMethod || !attendeeName || !attendeeEmail || !valor) {
        throw new functions.HttpsError("invalid-argument", "Dados incompletos.");
    }
    // Rate limit por IP aproximado (uid anônimo ou autenticado)
    const rateLimitUid = (_b = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid) !== null && _b !== void 0 ? _b : `anon_${attendeeEmail}`;
    await checkRateLimit(rateLimitUid, "createEventCharge", 15);
    const encKey = process.env.GATEWAY_ENCRYPTION_KEY;
    // Busca o evento para descobrir o organizador
    const eventoDoc = await db.collection("eventos").doc(eventoId).get();
    if (!eventoDoc.exists) {
        throw new functions.HttpsError("not-found", "Evento não encontrado.");
    }
    const evento = eventoDoc.data();
    const organizerId = evento.criado_por;
    // Verifica que a inscrição pertence a este evento (previne cobrança em inscrição de outro evento)
    const targetColl = isDonation ? "doacoes" : "inscricoes";
    const inscricaoSnap = await db.collection(`eventos/${eventoId}/${targetColl}`).doc(inscricaoId).get();
    if (!inscricaoSnap.exists) {
        throw new functions.HttpsError("not-found", "Inscrição não encontrada neste evento.");
    }
    const inscricaoData = inscricaoSnap.data();
    const alreadyPaid = isDonation ? inscricaoData.status === "aprovada" : inscricaoData.status === "pago";
    if (alreadyPaid) {
        throw new functions.HttpsError("failed-precondition", "Esta cobrança já foi processada.");
    }
    // Busca o gateway do organizador
    const orgDoc = await db.collection("users").doc(organizerId).get();
    if (!orgDoc.exists) {
        throw new functions.HttpsError("not-found", "Organizador não encontrado.");
    }
    const orgData = orgDoc.data();
    if (!((_c = orgData.gateway) === null || _c === void 0 ? void 0 : _c.encrypted_api_key)) {
        throw new functions.HttpsError("failed-precondition", "Organizador não tem gateway configurado.");
    }
    const apiKey = (0, gateway_utils_1.decrypt)(orgData.gateway.encrypted_api_key, encKey);
    const sandbox = (_d = orgData.gateway.sandbox) !== null && _d !== void 0 ? _d : false;
    // Cria ou reutiliza cliente Asaas do participante
    let customerId;
    try {
        customerId = await (0, gateway_utils_1.createOrFindAsaasCustomer)(apiKey, sandbox, attendeeName, attendeeEmail, `attendee:${inscricaoId}`, attendeeCpf);
    }
    catch (e) {
        console.error("[createEventCharge] createCustomer failed — status:", (_f = (_e = e === null || e === void 0 ? void 0 : e.response) === null || _e === void 0 ? void 0 : _e.status) !== null && _f !== void 0 ? _f : "unknown");
        throw new functions.HttpsError("internal", "Erro ao criar cliente no gateway. Tente novamente.");
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
        const totalInstallments = Math.max(2, installments !== null && installments !== void 0 ? installments : 2);
        const installmentValue = parseFloat((valor / totalInstallments).toFixed(2));
        let subscription;
        try {
            subscription = await (0, gateway_utils_1.createAsaasSubscription)(apiKey, sandbox, {
                customerId,
                installmentValue,
                nextDueDate: dueDateStr,
                description: `Inscrição — ${evento.nome} (${totalInstallments}x recorrente)`,
                maxPayments: totalInstallments,
                externalReference: `event:${eventoId}:${inscricaoId}`,
                creditCard,
                creditCardHolderInfo: holderInfo,
            });
        }
        catch (e) {
            console.error("[createEventCharge] createSubscription failed — status:", (_h = (_g = e === null || e === void 0 ? void 0 : e.response) === null || _g === void 0 ? void 0 : _g.status) !== null && _h !== void 0 ? _h : "unknown");
            throw new functions.HttpsError("internal", "Erro ao criar cobrança recorrente. Tente novamente.");
        }
        const subColl = isDonation ? 'doacoes' : 'inscricoes';
        await db.collection(`eventos/${eventoId}/${subColl}`).doc(inscricaoId).update(Object.assign(Object.assign({}, (isDonation ? { formaPagamento: 'recorrente' } : { status: 'pagamento_iniciado', forma_pagamento: 'recorrente' })), { gateway_subscription_id: subscription.id, installments: totalInstallments, installment_value: installmentValue }));
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
            creditCard,
            creditCardHolderInfo: holderInfo,
        });
    }
    catch (e) {
        console.error("[createEventCharge] createCharge failed — status:", (_k = (_j = e === null || e === void 0 ? void 0 : e.response) === null || _j === void 0 ? void 0 : _j.status) !== null && _k !== void 0 ? _k : "unknown");
        throw new functions.HttpsError("internal", "Erro ao criar cobrança. Tente novamente.");
    }
    const chargeColl = isDonation ? 'doacoes' : 'inscricoes';
    await db
        .collection(`eventos/${eventoId}/${chargeColl}`)
        .doc(inscricaoId)
        .update(Object.assign(Object.assign({}, (isDonation
        ? { formaPagamento: paymentMethod }
        : { status: 'pagamento_iniciado', forma_pagamento: paymentMethod })), { gateway_charge_id: charge.id, gateway_payment_url: charge.invoiceUrl }));
    return {
        paymentUrl: charge.invoiceUrl,
        pixQrCode: (_l = charge.pixQrCode) !== null && _l !== void 0 ? _l : null,
        bankSlipUrl: (_m = charge.bankSlipUrl) !== null && _m !== void 0 ? _m : null,
        identificationField: (_o = charge.identificationField) !== null && _o !== void 0 ? _o : null,
        chargeId: charge.id,
        installmentValue: null,
        installmentCount: null,
    };
});
// ─── Upload seguro de capa de evento ─────────────────────────────────────────
// Verifica que o caller é o dono do evento antes de gravar no Storage.
exports.uploadEventCover = functions.onCall({ region: "us-central1" }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new functions.HttpsError("unauthenticated", "Não autenticado.");
    }
    const uid = request.auth.uid;
    const { eventoId, imageBase64, contentType } = request.data;
    if (!eventoId || !imageBase64 || !contentType) {
        throw new functions.HttpsError("invalid-argument", "eventoId, imageBase64 e contentType são obrigatórios.");
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(contentType)) {
        throw new functions.HttpsError("invalid-argument", "Tipo de imagem inválido. Use JPEG, PNG ou WebP.");
    }
    // Verifica que o caller é o dono do evento
    const eventoSnap = await db.collection("eventos").doc(eventoId).get();
    if (!eventoSnap.exists) {
        throw new functions.HttpsError("not-found", "Evento não encontrado.");
    }
    const criado_por = (_a = eventoSnap.data().criado_por) !== null && _a !== void 0 ? _a : "";
    if (criado_por !== uid) {
        throw new functions.HttpsError("permission-denied", "Você não tem permissão para alterar este evento.");
    }
    // Tamanho máximo: 5MB (base64 → ~3.75MB real)
    if (imageBase64.length > 7 * 1024 * 1024) {
        throw new functions.HttpsError("invalid-argument", "Imagem muito grande. Máximo 5MB.");
    }
    const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const path = `eventos/${eventoId}/capa.${ext}`;
    const buffer = Buffer.from(imageBase64, "base64");
    const bucket = (0, storage_1.getStorage)().bucket("ai-studio-applet-webapp-84f64.firebasestorage.app");
    const file = bucket.file(path);
    await file.save(buffer, { contentType, resumable: false });
    await file.makePublic();
    const downloadUrl = `https://storage.googleapis.com/ai-studio-applet-webapp-84f64.firebasestorage.app/${path}?t=${Date.now()}`;
    // Atualiza o evento com a nova URL
    await db.collection("eventos").doc(eventoId).update({ imagem_url: downloadUrl });
    console.log(`[uploadEventCover] uid=${uid} evento=${eventoId} path=${path}`);
    return { downloadUrl };
});
// ─── Validar chave de billing da plataforma Tovia ────────────────────────────
exports.validateBillingKey = functions.onCall({ region: "us-central1" }, async (request) => {
    var _a, _b, _c, _d;
    if (!request.auth) {
        throw new functions.HttpsError("unauthenticated", "Não autenticado.");
    }
    const callerEmail = request.auth.token.email;
    const isToviaMaster = callerEmail === "admin@tovia.app" ||
        callerEmail === "admin@toviaapp.com.br";
    if (!isToviaMaster) {
        const adminDoc = await db.collection("admins").doc(request.auth.uid).get();
        if (!adminDoc.exists) {
            throw new functions.HttpsError("permission-denied", "Acesso negado.");
        }
    }
    const configDoc = await db.collection("config").doc("billing").get();
    if (!configDoc.exists) {
        throw new functions.HttpsError("not-found", "Nenhuma chave configurada.");
    }
    const { asaas_api_key: apiKey, sandbox } = configDoc.data();
    if (!apiKey) {
        throw new functions.HttpsError("not-found", "Chave API não definida.");
    }
    const baseUrl = sandbox ? "https://sandbox.asaas.com/api/v3" : "https://api.asaas.com/api/v3";
    let valid = false;
    let debugInfo = "";
    try {
        const res = await Promise.resolve().then(() => __importStar(require("axios"))).then(m => m.default.get(`${baseUrl}/customers`, {
            params: { limit: 1 },
            headers: { access_token: apiKey, "Content-Type": "application/json" },
            timeout: 10000,
        }));
        valid = res.status === 200;
        debugInfo = `status=${res.status}`;
    }
    catch (e) {
        const status = (_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.status;
        const body = JSON.stringify((_d = (_c = (_b = e === null || e === void 0 ? void 0 : e.response) === null || _b === void 0 ? void 0 : _b.data) !== null && _c !== void 0 ? _c : e === null || e === void 0 ? void 0 : e.message) !== null && _d !== void 0 ? _d : "unknown");
        debugInfo = `status=${status} body=${body}`;
    }
    await db.collection("config").doc("billing").update({
        is_valid: valid,
        last_validated_at: new Date().toISOString(),
    });
    return { valid, sandbox: !!sandbox, baseUrl, debugInfo };
});
// ─── E-mail via Resend ────────────────────────────────────────────────────────
async function sendEmailResend(to, subject, html) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn("[email] RESEND_API_KEY não configurada — e-mail ignorado.");
        return;
    }
    await axios_1.default.post("https://api.resend.com/emails", { from: "Tovia <noreply@tovia.app>", to, subject, html }, { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } });
}
function emailLembrete(nome, eventoNome, tipo, paymentUrl) {
    const urgencia = tipo === "final"
        ? "⚠️ Último aviso: sua inscrição será cancelada em breve."
        : "Sua inscrição ainda está pendente de pagamento.";
    const cta = paymentUrl
        ? `<a href="${paymentUrl}" style="display:inline-block;margin-top:20px;padding:14px 28px;background:#22c55e;color:#fff;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">Concluir pagamento</a>`
        : `<p style="margin-top:16px;color:#6b7280;font-size:14px;">Acesse o link que recebeu no momento da inscrição para concluir o pagamento.</p>`;
    return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#111827">
      <h2 style="color:#22c55e;margin-bottom:4px">Tovia</h2>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
      <p style="font-size:16px">Olá, <strong>${nome}</strong>!</p>
      <p style="font-size:15px;color:#374151">${urgencia}</p>
      <p style="font-size:15px;color:#374151">
        Você se inscreveu em <strong>${eventoNome}</strong> mas o pagamento ainda não foi confirmado.
        ${tipo === "final" ? "Após 10 dias sem confirmação, a inscrição é <strong>cancelada automaticamente</strong>." : "Você ainda tem alguns dias para concluir."}
      </p>
      ${cta}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/>
      <p style="font-size:12px;color:#9ca3af">Este é um e-mail automático do Tovia. Caso já tenha pago, aguarde até 3 dias úteis para a confirmação aparecer.</p>
    </div>`;
}
// ─── Processamento diário de inscrições pendentes ────────────────────────────
// Roda às 08h (horário de Brasília). Regras:
//   Dia  4 → 1º lembrete por e-mail
//   Dia  7 → lembrete final por e-mail
//   Dia 10 → cancela automaticamente
exports.processarInscricoesPendentes = (0, scheduler_1.onSchedule)({
    schedule: "every day 08:00",
    timeZone: "America/Sao_Paulo",
    region: "us-central1",
    secrets: ["RESEND_API_KEY"],
}, async () => {
    var _a, _b, _c, _d, _e;
    const now = new Date();
    const snapshot = await db
        .collectionGroup("inscricoes")
        .where("status", "in", ["pendente", "pagamento_iniciado"])
        .get();
    if (snapshot.empty)
        return;
    // Agrupa por eventoId para buscar nomes dos eventos de uma vez
    const eventoIds = new Set();
    snapshot.docs.forEach(doc => {
        var _a;
        const eventoId = (_a = doc.ref.parent.parent) === null || _a === void 0 ? void 0 : _a.id;
        if (eventoId)
            eventoIds.add(eventoId);
    });
    const eventoNomes = {};
    await Promise.all(Array.from(eventoIds).map(async (id) => {
        var _a, _b;
        const snap = await db.collection("eventos").doc(id).get();
        eventoNomes[id] = (_b = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.nome) !== null && _b !== void 0 ? _b : "Evento";
    }));
    const emailPromises = [];
    // Processa em lotes de 500 (limite do Firestore batch)
    const chunks = [];
    for (let i = 0; i < snapshot.docs.length; i += 499) {
        chunks.push(snapshot.docs.slice(i, i + 499));
    }
    for (const chunk of chunks) {
        const batch = db.batch();
        for (const doc of chunk) {
            const data = doc.data();
            const dataInscricao = data.data_inscricao
                ? new Date(data.data_inscricao)
                : null;
            if (!dataInscricao)
                continue;
            const diffDays = Math.floor((now.getTime() - dataInscricao.getTime()) / (1000 * 60 * 60 * 24));
            const eventoId = (_b = (_a = doc.ref.parent.parent) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : "";
            const eventoNome = (_c = eventoNomes[eventoId]) !== null && _c !== void 0 ? _c : "Evento";
            const email = (_d = data.email) !== null && _d !== void 0 ? _d : "";
            const nome = (_e = data.nome) !== null && _e !== void 0 ? _e : "Participante";
            const paymentUrl = data.gateway_payment_url;
            if (diffDays >= 10) {
                batch.update(doc.ref, { status: "cancelada", cancelada_automaticamente: true, cancelada_em: now.toISOString() });
            }
            else if (diffDays >= 7 && !data.lembrete_7d_enviado) {
                batch.update(doc.ref, { lembrete_7d_enviado: true });
                if (email) {
                    emailPromises.push(sendEmailResend(email, `⚠️ Último aviso — inscrição em ${eventoNome}`, emailLembrete(nome, eventoNome, "final", paymentUrl)).catch(e => console.error("[email] lembrete_7d falhou:", e)));
                }
            }
            else if (diffDays >= 4 && !data.lembrete_4d_enviado) {
                batch.update(doc.ref, { lembrete_4d_enviado: true });
                if (email) {
                    emailPromises.push(sendEmailResend(email, `Lembrete — sua inscrição em ${eventoNome} está pendente`, emailLembrete(nome, eventoNome, "primeiro", paymentUrl)).catch(e => console.error("[email] lembrete_4d falhou:", e)));
                }
            }
        }
        await batch.commit();
    }
    await Promise.allSettled(emailPromises);
    console.log(`[processarInscricoesPendentes] processadas ${snapshot.size} inscrições.`);
});
// ─── Lembrete de evento (config_comunicacao.lembrete_evento) ─────────────────
// Roda às 08h BRT. Para cada evento com lembrete ativo, no dia certo,
// envia e-mail customizado a todos os inscritos confirmados.
exports.lembreteEvento = (0, scheduler_1.onSchedule)({
    schedule: "every day 08:00",
    timeZone: "America/Sao_Paulo",
    region: "us-central1",
    secrets: ["RESEND_API_KEY"],
}, async () => {
    var _a, _b, _c, _d, _e;
    const now = new Date();
    // Busca eventos com lembrete ativo
    const eventosSnap = await db
        .collection("eventos")
        .where("config_comunicacao.lembrete_evento.ativo", "==", true)
        .get();
    if (eventosSnap.empty)
        return;
    const emailPromises = [];
    for (const eventoDoc of eventosSnap.docs) {
        const ev = eventoDoc.data();
        const cfg = (_a = ev.config_comunicacao) === null || _a === void 0 ? void 0 : _a.lembrete_evento;
        if (!(cfg === null || cfg === void 0 ? void 0 : cfg.ativo) || !cfg.corpo)
            continue;
        const dataInicio = ev.data_inicio ? new Date(ev.data_inicio) : null;
        if (!dataInicio)
            continue;
        const daysUntil = Math.round((dataInicio.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil !== cfg.dias_antes)
            continue;
        // Evita reenvio no mesmo dia
        const jaEnviado = ev.lembrete_evento_enviado_em;
        if (jaEnviado && jaEnviado.startsWith(now.toISOString().split("T")[0]))
            continue;
        // Marca como enviado
        await eventoDoc.ref.update({ lembrete_evento_enviado_em: now.toISOString() });
        // Busca inscritos confirmados
        const inscritos = await db
            .collection(`eventos/${eventoDoc.id}/inscricoes`)
            .where("status", "in", ["pago"])
            .get();
        for (const inscDoc of inscritos.docs) {
            const insc = inscDoc.data();
            const emailTo = (_b = insc.email) !== null && _b !== void 0 ? _b : "";
            if (!emailTo)
                continue;
            const vars = {
                nome: (_c = insc.nome) !== null && _c !== void 0 ? _c : "Participante",
                evento: (_d = ev.nome) !== null && _d !== void 0 ? _d : "Evento",
                data: dataInicio.toLocaleDateString("pt-BR"),
                local: (_e = ev.local) !== null && _e !== void 0 ? _e : "",
            };
            const subject = cfg.assunto
                ? cfg.assunto.replace(/\{(\w+)\}/g, (_, k) => { var _a; return (_a = vars[k]) !== null && _a !== void 0 ? _a : `{${k}}`; })
                : `Lembrete: ${ev.nome} em ${cfg.dias_antes} dia(s)`;
            const corpo = cfg.corpo.replace(/\{(\w+)\}/g, (_, k) => { var _a; return (_a = vars[k]) !== null && _a !== void 0 ? _a : `{${k}}`; });
            const corpoHtml = corpo
                .split("\n")
                .map(l => l.trim() ? `<p style="font-size:15px;color:#374151;margin:0 0 14px">${l}</p>` : "")
                .join("");
            const bodyHtml = `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
          <h2 style="color:#22c55e">Tovia</h2><hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
          ${corpoHtml}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/>
          <p style="font-size:12px;color:#9ca3af">Este é um e-mail automático do Tovia.</p>
        </div>`;
            emailPromises.push(sendEmailResend(emailTo, subject, bodyHtml)
                .catch(e => console.error("[lembreteEvento] falhou:", e)));
        }
    }
    await Promise.allSettled(emailPromises);
    console.log(`[lembreteEvento] processados ${eventosSnap.size} eventos.`);
});
// ─── Upload seguro de foto de perfil ─────────────────────────────────────────
// Valida magic bytes, redimensiona para 300×300px e grava via Admin SDK.
exports.uploadProfilePhoto = functions.onCall({ region: "us-central1" }, async (request) => {
    if (!request.auth) {
        throw new functions.HttpsError("unauthenticated", "Não autenticado.");
    }
    const uid = request.auth.uid;
    const { imageBase64, contentType } = request.data;
    if (!imageBase64 || !contentType) {
        throw new functions.HttpsError("invalid-argument", "imageBase64 e contentType são obrigatórios.");
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(contentType)) {
        throw new functions.HttpsError("invalid-argument", "Tipo inválido. Use JPEG, PNG ou WebP.");
    }
    // Tamanho máximo: base64 de 5MB real ≈ 6.7MB de string
    if (imageBase64.length > 7 * 1024 * 1024) {
        throw new functions.HttpsError("invalid-argument", "Imagem muito grande. Máximo 5MB.");
    }
    const buffer = Buffer.from(imageBase64, "base64");
    // Valida magic bytes (assinatura real do arquivo)
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp = buffer.slice(0, 4).toString("ascii") === "RIFF" && buffer.slice(8, 12).toString("ascii") === "WEBP";
    if (!isJpeg && !isPng && !isWebp) {
        throw new functions.HttpsError("invalid-argument", "O arquivo enviado não é uma imagem válida.");
    }
    await checkRateLimit(uid, "uploadProfilePhoto", 10);
    // Redimensiona para 300×300px (cover, sem distorção) e converte para JPEG
    const resized = await (0, sharp_1.default)(buffer)
        .resize(300, 300, { fit: "cover", position: "centre" })
        .jpeg({ quality: 85 })
        .toBuffer();
    const path = `profiles/${uid}/foto`;
    const bucket = (0, storage_1.getStorage)().bucket("ai-studio-applet-webapp-84f64.firebasestorage.app");
    const file = bucket.file(path);
    await file.save(resized, { contentType: "image/jpeg", resumable: false });
    await file.makePublic();
    const downloadUrl = `https://storage.googleapis.com/ai-studio-applet-webapp-84f64.firebasestorage.app/${path}?t=${Date.now()}`;
    await db.collection("users").doc(uid).update({ imagem_url: downloadUrl });
    console.log(`[uploadProfilePhoto] uid=${uid}`);
    return { downloadUrl };
});
// ─── LGPD Art. 18 — Solicitação de exclusão de dados pessoais ────────────────
// Anonimiza os dados imediatamente e marca a conta para exclusão completa.
// A deleção definitiva das subcoleções ocorre de forma assíncrona (batch).
exports.requestDataDeletion = functions.onCall({ region: "us-central1" }, async (request) => {
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
});
//# sourceMappingURL=index.js.map