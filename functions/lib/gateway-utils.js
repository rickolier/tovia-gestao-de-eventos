"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.genToken = genToken;
exports.asaasBaseUrl = asaasBaseUrl;
exports.testAsaasApiKey = testAsaasApiKey;
exports.registerAsaasWebhook = registerAsaasWebhook;
exports.createOrFindAsaasCustomer = createOrFindAsaasCustomer;
exports.createAsaasCharge = createAsaasCharge;
exports.mapBillingType = mapBillingType;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const ALGORITHM = 'aes-256-gcm';
function encrypt(text, keyHex) {
    const key = Buffer.from(keyHex.trim(), 'hex');
    const iv = (0, crypto_1.randomBytes)(16);
    const cipher = (0, crypto_1.createCipheriv)(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}
function decrypt(data, keyHex) {
    const [ivHex, authTagHex, encrypted] = data.split(':');
    const key = Buffer.from(keyHex.trim(), 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = (0, crypto_1.createDecipheriv)(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
function genToken() {
    return (0, crypto_1.randomBytes)(32).toString('hex');
}
function asaasHeaders(apiKey) {
    return { access_token: apiKey, 'Content-Type': 'application/json' };
}
function asaasBaseUrl(sandbox) {
    return sandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/api/v3';
}
async function testAsaasApiKey(apiKey, sandbox) {
    var _a, _b, _c, _d;
    try {
        // GET /customers?limit=1 is a lightweight endpoint available in all Asaas plans
        const res = await axios_1.default.get(`${asaasBaseUrl(sandbox)}/customers`, {
            params: { limit: 1 },
            headers: asaasHeaders(apiKey),
            timeout: 10000,
        });
        return res.status === 200;
    }
    catch (e) {
        const status = (_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.status;
        const data = JSON.stringify((_d = (_c = (_b = e === null || e === void 0 ? void 0 : e.response) === null || _b === void 0 ? void 0 : _b.data) !== null && _c !== void 0 ? _c : e === null || e === void 0 ? void 0 : e.message) !== null && _d !== void 0 ? _d : 'unknown');
        console.error(`[testAsaasApiKey] sandbox=${sandbox} status=${status} error=${data}`);
        return false;
    }
}
async function registerAsaasWebhook(apiKey, sandbox, webhookUrl, authToken) {
    await axios_1.default.post(`${asaasBaseUrl(sandbox)}/webhooks`, {
        url: webhookUrl,
        interrupted: false,
        enabled: true,
        apiVersion: 3,
        authToken,
        sendType: 'SEQUENTIALLY',
        events: [
            'PAYMENT_CONFIRMED',
            'PAYMENT_RECEIVED',
            'PAYMENT_OVERDUE',
            'PAYMENT_DELETED',
            'PAYMENT_REFUNDED',
        ],
    }, { headers: asaasHeaders(apiKey), timeout: 8000 });
}
async function createOrFindAsaasCustomer(apiKey, sandbox, name, email, externalRef, cpfCnpj) {
    const base = asaasBaseUrl(sandbox);
    const headers = asaasHeaders(apiKey);
    // Try to find existing customer by externalReference
    const search = await axios_1.default.get(`${base}/customers`, {
        params: { externalReference: externalRef },
        headers,
        timeout: 8000,
    });
    if (search.data.totalCount > 0) {
        return search.data.data[0].id;
    }
    const payload = { name, email, externalReference: externalRef };
    if (cpfCnpj) {
        payload.cpfCnpj = cpfCnpj.replace(/\D/g, ''); // remove pontuação
    }
    const create = await axios_1.default.post(`${base}/customers`, payload, { headers, timeout: 8000 });
    return create.data.id;
}
async function createAsaasCharge(apiKey, sandbox, opts) {
    const base = asaasBaseUrl(sandbox);
    const headers = asaasHeaders(apiKey);
    const body = {
        customer: opts.customerId,
        billingType: opts.billingType,
        value: opts.value,
        dueDate: opts.dueDate,
        description: opts.description,
        externalReference: opts.externalReference,
    };
    if (opts.billingType === 'CREDIT_CARD') {
        if (opts.creditCard)
            body.creditCard = opts.creditCard;
        if (opts.creditCardHolderInfo)
            body.creditCardHolderInfo = opts.creditCardHolderInfo;
        if (opts.installmentCount && opts.installmentCount > 1) {
            body.installmentCount = opts.installmentCount;
            body.installmentValue = parseFloat((opts.value / opts.installmentCount).toFixed(2));
        }
    }
    const res = await axios_1.default.post(`${base}/payments`, body, { headers, timeout: 15000 });
    const p = res.data;
    const result = {
        id: p.id,
        invoiceUrl: p.invoiceUrl,
        bankSlipUrl: p.bankSlipUrl,
        identificationField: p.identificationField,
        status: p.status,
    };
    if (opts.billingType === 'PIX') {
        try {
            const pixRes = await axios_1.default.get(`${base}/payments/${p.id}/pixQrCode`, {
                headers,
                timeout: 8000,
            });
            result.pixQrCode = {
                encodedImage: pixRes.data.encodedImage,
                payload: pixRes.data.payload,
                expirationDate: pixRes.data.expirationDate,
            };
        }
        catch (_a) {
            // QR code may take a moment; client can poll or use invoiceUrl
        }
    }
    return result;
}
function mapBillingType(method) {
    var _a;
    const map = {
        pix: 'PIX',
        boleto: 'BOLETO',
        credito: 'CREDIT_CARD',
        cartao: 'CREDIT_CARD',
    };
    return (_a = map[method]) !== null && _a !== void 0 ? _a : 'UNDEFINED';
}
//# sourceMappingURL=gateway-utils.js.map