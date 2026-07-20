import * as functions from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import axios from "axios";
import { createHash } from "crypto";
import sharp from "sharp";
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
  start: 39,
  essencial: 99,
  pro: 249,
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

    // Verifica que a inscrição pertence a este evento (previne cobrança em inscrição de outro evento)
    const targetColl = isDonation ? "doacoes" : "inscricoes";
    const inscricaoSnap = await db.collection(`eventos/${eventoId}/${targetColl}`).doc(inscricaoId).get();
    if (!inscricaoSnap.exists) {
      throw new functions.HttpsError("not-found", "Inscrição não encontrada neste evento.");
    }
    const inscricaoData = inscricaoSnap.data()!;
    const alreadyPaid = isDonation ? inscricaoData.status === "aprovada" : inscricaoData.status === "pago";
    if (alreadyPaid) {
      throw new functions.HttpsError("failed-precondition", "Esta cobrança já foi processada.");
    }

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
      console.error("[createEventCharge] createCustomer failed — status:", e?.response?.status ?? "unknown");
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
        console.error("[createEventCharge] createSubscription failed — status:", e?.response?.status ?? "unknown");
        throw new functions.HttpsError("internal", "Erro ao criar cobrança recorrente. Tente novamente.");
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
      console.error("[createEventCharge] createCharge failed — status:", e?.response?.status ?? "unknown");
      throw new functions.HttpsError("internal", "Erro ao criar cobrança. Tente novamente.");
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

// ─── Upload seguro de capa de evento ─────────────────────────────────────────
// Verifica que o caller é o dono do evento antes de gravar no Storage.
export const uploadEventCover = functions.onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new functions.HttpsError("unauthenticated", "Não autenticado.");
    }

    const uid = request.auth.uid;
    const { eventoId, imageBase64, contentType } = request.data as {
      eventoId?: string;
      imageBase64?: string;
      contentType?: string;
    };

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
    const criado_por: string = eventoSnap.data()!.criado_por ?? "";
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

    const bucket = getStorage().bucket("ai-studio-applet-webapp-84f64.firebasestorage.app");
    const file = bucket.file(path);
    await file.save(buffer, { contentType, resumable: false });
    await file.makePublic();

    const downloadUrl = `https://storage.googleapis.com/ai-studio-applet-webapp-84f64.firebasestorage.app/${path}?t=${Date.now()}`;

    // Atualiza o evento com a nova URL
    await db.collection("eventos").doc(eventoId).update({ imagem_url: downloadUrl });

    console.log(`[uploadEventCover] uid=${uid} evento=${eventoId} path=${path}`);
    return { downloadUrl };
  }
);

// ─── Validar chave de billing da plataforma Tovia ────────────────────────────
export const validateBillingKey = functions.onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new functions.HttpsError("unauthenticated", "Não autenticado.");
    }

    const callerEmail = request.auth.token.email;
    const isToviaMaster =
      callerEmail === "admin@tovia.app" ||
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

    const { asaas_api_key: apiKey, sandbox } = configDoc.data() as {
      asaas_api_key: string;
      sandbox: boolean;
    };

    if (!apiKey) {
      throw new functions.HttpsError("not-found", "Chave API não definida.");
    }

    const baseUrl = sandbox ? "https://sandbox.asaas.com/api/v3" : "https://api.asaas.com/api/v3";
    let valid = false;
    let debugInfo = "";
    try {
      const res = await import("axios").then(m => m.default.get(`${baseUrl}/customers`, {
        params: { limit: 1 },
        headers: { access_token: apiKey, "Content-Type": "application/json" },
        timeout: 10000,
      }));
      valid = res.status === 200;
      debugInfo = `status=${res.status}`;
    } catch (e: any) {
      const status = e?.response?.status;
      const body = JSON.stringify(e?.response?.data ?? e?.message ?? "unknown");
      debugInfo = `status=${status} body=${body}`;
    }

    await db.collection("config").doc("billing").update({
      is_valid: valid,
      last_validated_at: new Date().toISOString(),
    });

    return { valid, sandbox: !!sandbox, baseUrl, debugInfo };
  }
);

// ─── E-mail via Resend ────────────────────────────────────────────────────────
async function sendEmailResend(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.warn("[email] RESEND_API_KEY não configurada — e-mail ignorado."); return; }
  await axios.post(
    "https://api.resend.com/emails",
    { from: "Tovia <noreply@tovia.app>", to, subject, html },
    { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } },
  );
}

function emailLembrete(nome: string, eventoNome: string, tipo: "primeiro" | "final", paymentUrl?: string): string {
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
export const processarInscricoesPendentes = onSchedule(
  {
    schedule: "every day 08:00",
    timeZone: "America/Sao_Paulo",
    region: "us-central1",
    secrets: ["RESEND_API_KEY"],
  },
  async () => {
    const now = new Date();

    const snapshot = await db
      .collectionGroup("inscricoes")
      .where("status", "in", ["pendente", "pagamento_iniciado"])
      .get();

    if (snapshot.empty) return;

    // Agrupa por eventoId para buscar nomes dos eventos de uma vez
    const eventoIds = new Set<string>();
    snapshot.docs.forEach(doc => {
      const eventoId = doc.ref.parent.parent?.id;
      if (eventoId) eventoIds.add(eventoId);
    });

    const eventoNomes: Record<string, string> = {};
    await Promise.all(Array.from(eventoIds).map(async (id) => {
      const snap = await db.collection("eventos").doc(id).get();
      eventoNomes[id] = snap.data()?.nome ?? "Evento";
    }));

    const emailPromises: Promise<void>[] = [];
    // Processa em lotes de 500 (limite do Firestore batch)
    const chunks: admin.firestore.DocumentSnapshot[][] = [];
    for (let i = 0; i < snapshot.docs.length; i += 499) {
      chunks.push(snapshot.docs.slice(i, i + 499));
    }

    for (const chunk of chunks) {
      const batch = db.batch();

      for (const doc of chunk) {
        const data = doc.data() as Record<string, any>;
        const dataInscricao = data.data_inscricao
          ? new Date(data.data_inscricao)
          : null;
        if (!dataInscricao) continue;

        const diffDays = Math.floor(
          (now.getTime() - dataInscricao.getTime()) / (1000 * 60 * 60 * 24)
        );

        const eventoId = doc.ref.parent.parent?.id ?? "";
        const eventoNome = eventoNomes[eventoId] ?? "Evento";
        const email: string = data.email ?? "";
        const nome: string = data.nome ?? "Participante";
        const paymentUrl: string | undefined = data.gateway_payment_url;

        if (diffDays >= 10) {
          batch.update(doc.ref, { status: "cancelada", cancelada_automaticamente: true, cancelada_em: now.toISOString() });
        } else if (diffDays >= 7 && !data.lembrete_7d_enviado) {
          batch.update(doc.ref, { lembrete_7d_enviado: true });
          if (email) {
            emailPromises.push(
              sendEmailResend(
                email,
                `⚠️ Último aviso — inscrição em ${eventoNome}`,
                emailLembrete(nome, eventoNome, "final", paymentUrl),
              ).catch(e => console.error("[email] lembrete_7d falhou:", e))
            );
          }
        } else if (diffDays >= 4 && !data.lembrete_4d_enviado) {
          batch.update(doc.ref, { lembrete_4d_enviado: true });
          if (email) {
            emailPromises.push(
              sendEmailResend(
                email,
                `Lembrete — sua inscrição em ${eventoNome} está pendente`,
                emailLembrete(nome, eventoNome, "primeiro", paymentUrl),
              ).catch(e => console.error("[email] lembrete_4d falhou:", e))
            );
          }
        }
      }

      await batch.commit();
    }

    await Promise.allSettled(emailPromises);
    console.log(`[processarInscricoesPendentes] processadas ${snapshot.size} inscrições.`);
  }
);

// ─── Lembrete de evento (config_comunicacao.lembrete_evento) ─────────────────
// Roda às 08h BRT. Para cada evento com lembrete ativo, no dia certo,
// envia e-mail customizado a todos os inscritos confirmados.
export const lembreteEvento = onSchedule(
  {
    schedule: "every day 08:00",
    timeZone: "America/Sao_Paulo",
    region: "us-central1",
    secrets: ["RESEND_API_KEY"],
  },
  async () => {
    const now = new Date();

    // Busca eventos com lembrete ativo
    const eventosSnap = await db
      .collection("eventos")
      .where("config_comunicacao.lembrete_evento.ativo", "==", true)
      .get();

    if (eventosSnap.empty) return;

    const emailPromises: Promise<void>[] = [];

    for (const eventoDoc of eventosSnap.docs) {
      const ev = eventoDoc.data() as Record<string, any>;
      const cfg = ev.config_comunicacao?.lembrete_evento as { dias_antes: number; assunto: string; corpo: string; ativo: boolean } | undefined;
      if (!cfg?.ativo || !cfg.corpo) continue;

      const dataInicio = ev.data_inicio ? new Date(ev.data_inicio) : null;
      if (!dataInicio) continue;

      const daysUntil = Math.round((dataInicio.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil !== cfg.dias_antes) continue;

      // Evita reenvio no mesmo dia
      const jaEnviado: string | undefined = ev.lembrete_evento_enviado_em;
      if (jaEnviado && jaEnviado.startsWith(now.toISOString().split("T")[0])) continue;

      // Marca como enviado
      await eventoDoc.ref.update({ lembrete_evento_enviado_em: now.toISOString() });

      // Busca inscritos confirmados
      const inscritos = await db
        .collection(`eventos/${eventoDoc.id}/inscricoes`)
        .where("status", "in", ["pago"])
        .get();

      for (const inscDoc of inscritos.docs) {
        const insc = inscDoc.data() as Record<string, any>;
        const emailTo: string = insc.email ?? "";
        if (!emailTo) continue;

        const vars: Record<string, string> = {
          nome: insc.nome ?? "Participante",
          evento: ev.nome ?? "Evento",
          data: dataInicio.toLocaleDateString("pt-BR"),
          local: ev.local ?? "",
        };

        const subject = cfg.assunto
          ? cfg.assunto.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`)
          : `Lembrete: ${ev.nome} em ${cfg.dias_antes} dia(s)`;
        const corpo = cfg.corpo.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);

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

        emailPromises.push(
          sendEmailResend(emailTo, subject, bodyHtml)
            .catch(e => console.error("[lembreteEvento] falhou:", e))
        );
      }
    }

    await Promise.allSettled(emailPromises);
    console.log(`[lembreteEvento] processados ${eventosSnap.size} eventos.`);
  }
);

// ─── Upload seguro de foto de perfil ─────────────────────────────────────────
// Valida magic bytes, redimensiona para 300×300px e grava via Admin SDK.
export const uploadProfilePhoto = functions.onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new functions.HttpsError("unauthenticated", "Não autenticado.");
    }

    const uid = request.auth.uid;
    const { imageBase64, contentType } = request.data as {
      imageBase64?: string;
      contentType?: string;
    };

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
    const isPng  = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp = buffer.slice(0, 4).toString("ascii") === "RIFF" && buffer.slice(8, 12).toString("ascii") === "WEBP";
    if (!isJpeg && !isPng && !isWebp) {
      throw new functions.HttpsError("invalid-argument", "O arquivo enviado não é uma imagem válida.");
    }

    await checkRateLimit(uid, "uploadProfilePhoto", 10);

    // Redimensiona para 300×300px (cover, sem distorção) e converte para JPEG
    const resized = await sharp(buffer)
      .resize(300, 300, { fit: "cover", position: "centre" })
      .jpeg({ quality: 85 })
      .toBuffer();

    const path = `profiles/${uid}/foto`;
    const bucket = getStorage().bucket("ai-studio-applet-webapp-84f64.firebasestorage.app");
    const file = bucket.file(path);
    await file.save(resized, { contentType: "image/jpeg", resumable: false });
    await file.makePublic();

    const downloadUrl = `https://storage.googleapis.com/ai-studio-applet-webapp-84f64.firebasestorage.app/${path}?t=${Date.now()}`;

    await db.collection("users").doc(uid).update({ imagem_url: downloadUrl });

    console.log(`[uploadProfilePhoto] uid=${uid}`);
    return { downloadUrl };
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
