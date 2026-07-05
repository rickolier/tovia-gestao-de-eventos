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
exports.requestDataDeletion = exports.validateBillingKey = exports.uploadEventCover = exports.createEventCharge = exports.saveGatewayConfig = exports.asaasWebhook = exports.suspendUser = exports.createCheckout = void 0;
const functions = __importStar(require("firebase-functions/v2/https"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
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
    const valid = await (0, gateway_utils_1.testAsaasApiKey)(apiKey, sandbox !== null && sandbox !== void 0 ? sandbox : true);
    await db.collection("config").doc("billing").update({
        is_valid: valid,
        last_validated_at: new Date().toISOString(),
    });
    return { valid };
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