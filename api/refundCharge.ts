import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, auth } from './_firebase.js';
import { decrypt } from './_gateway-utils.js';
import { createPaymentProvider } from './_payments/factory.js';
import type { GatewayType } from './_payments/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autorizado' });

  let uid: string;
  try {
    const decoded = await auth.verifyIdToken(authHeader.split(' ')[1]);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }

  const { eventoId, pagamentoId, valor } = req.body as {
    eventoId: string;
    pagamentoId: string;
    valor?: number;
  };

  if (!eventoId || !pagamentoId) {
    return res.status(400).json({ error: 'Dados incompletos. Recarregue a página e tente novamente.' });
  }

  const eventoDoc = await db.collection('eventos').doc(eventoId).get();
  if (!eventoDoc.exists) return res.status(404).json({ error: 'Evento não encontrado' });
  if (eventoDoc.data()!.criado_por !== uid) {
    return res.status(403).json({ error: 'Sem permissão' });
  }

  const pagamentoDoc = await db.collection(`eventos/${eventoId}/pagamentos`).doc(pagamentoId).get();
  if (!pagamentoDoc.exists) return res.status(404).json({ error: 'Pagamento não encontrado' });

  const pagamento = pagamentoDoc.data()!;
  if (pagamento.origem !== 'automatico') {
    return res.status(400).json({ error: 'O estorno automático está disponível apenas para pagamentos processados pelo gateway. Pagamentos manuais devem ser devolvidos diretamente ao participante.' });
  }
  if (!pagamento.gateway_payment_id) {
    return res.status(400).json({ error: 'Este pagamento não possui um identificador no gateway. Isso pode acontecer se o webhook de confirmação não foi recebido corretamente. Entre em contato com o suporte.' });
  }
  if (pagamento.status === 'estornado') {
    return res.status(400).json({ error: 'Este pagamento já foi estornado anteriormente. Verifique o histórico de estornos do participante.' });
  }

  const secretsDoc = await db.collection('organizer_secrets').doc(uid).get();
  if (!secretsDoc.exists) return res.status(400).json({ error: 'Seu gateway de pagamento não está configurado. Acesse Configurações → Financeiro para conectá-lo antes de processar estornos.' });

  const secrets = secretsDoc.data()!;
  const encKey = process.env.GATEWAY_ENCRYPTION_KEY;
  if (!encKey) return res.status(500).json({ error: 'Erro interno do servidor. A equipe técnica foi notificada. Tente novamente mais tarde.' });

  const apiKey = decrypt(secrets.api_key_encrypted, encKey);
  const sandbox: boolean = secrets.sandbox ?? false;
  const gatewayType: GatewayType = (secrets.type as GatewayType) ?? 'asaas';

  const provider = createPaymentProvider(gatewayType, apiKey, sandbox);

  try {
    const refundValue = valor && valor > 0 && valor < pagamento.valor ? valor : undefined;
    const result = await provider.refundCharge(pagamento.gateway_payment_id, refundValue);

    const estornoId = `est_${pagamentoId}_${Date.now()}`;
    const estornoData = {
      id: estornoId,
      eventoId,
      inscricaoId: pagamento.inscricaoId,
      pagamentoId,
      gateway_payment_id: pagamento.gateway_payment_id,
      valor: refundValue ?? pagamento.valor,
      tipo: refundValue ? 'parcial' : 'total',
      status: 'processando',
      metodo_original: pagamento.metodo,
      solicitado_em: new Date().toISOString(),
    };

    await db.collection(`eventos/${eventoId}/estornos`).doc(estornoId).set(estornoData);

    await db.collection(`eventos/${eventoId}/pagamentos`).doc(pagamentoId).update({
      status: 'estornado',
    });

    if (!refundValue) {
      const inscricaoRef = db.collection(`eventos/${eventoId}/inscricoes`).doc(pagamento.inscricaoId);
      const inscricaoDoc = await inscricaoRef.get();
      if (inscricaoDoc.exists) {
        const inscricao = inscricaoDoc.data()!;
        const novoValorPago = Math.max(0, (inscricao.valor_pago || 0) - pagamento.valor);
        await inscricaoRef.update({
          valor_pago: novoValorPago,
          status: novoValorPago <= 0 ? 'estornado' : 'pagamento_iniciado',
        });
      }
    } else {
      const inscricaoRef = db.collection(`eventos/${eventoId}/inscricoes`).doc(pagamento.inscricaoId);
      const inscricaoDoc = await inscricaoRef.get();
      if (inscricaoDoc.exists) {
        const inscricao = inscricaoDoc.data()!;
        const novoValorPago = Math.max(0, (inscricao.valor_pago || 0) - refundValue);
        await inscricaoRef.update({
          valor_pago: novoValorPago,
          status: novoValorPago >= inscricao.valor_total ? 'pago' : novoValorPago > 0 ? 'pagamento_iniciado' : 'estornado',
        });
      }
    }

    return res.status(200).json({ success: true, estornoId, gatewayResult: result });
  } catch (err: unknown) {
    const axiosErr = (err as any)?.response;
    const httpStatus = axiosErr?.status;
    const gatewayMsg = axiosErr?.data?.errors?.[0]?.description ?? '';

    const errorMap: Record<string, string> = {
      'Payment value is not valid': 'O valor do estorno é inválido. Verifique se não excede o valor original do pagamento.',
      'Payment refund is not allowed': 'O gateway não permite estorno para este pagamento. Isso pode ocorrer para cobranças ainda não confirmadas ou já estornadas.',
      'Invalid payment': 'Pagamento não encontrado no gateway. Ele pode ter sido removido diretamente no painel do Asaas.',
      'Payment refund value is greater than the payment value': 'O valor do estorno é maior que o valor do pagamento original.',
    };

    let userMsg = errorMap[gatewayMsg] ?? '';

    if (!userMsg && httpStatus) {
      const statusMap: Record<number, string> = {
        401: 'Sua chave de API do gateway expirou ou foi revogada. Reconecte o gateway em Configurações → Financeiro.',
        403: 'Sua chave de API não tem permissão para processar estornos. Verifique as permissões no painel do Asaas.',
        404: 'Pagamento não encontrado no gateway. Verifique no painel do Asaas se a cobrança ainda existe.',
        429: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        500: 'Erro temporário no Asaas. Tente novamente em alguns minutos.',
        503: 'O Asaas está temporariamente indisponível. Tente mais tarde.',
      };
      userMsg = statusMap[httpStatus] ?? '';
    }

    if (!userMsg) {
      userMsg = gatewayMsg || (err as Error)?.message || 'Erro inesperado ao processar o estorno. Tente novamente ou entre em contato com o suporte.';
    }

    console.error('[refundCharge] Erro:', httpStatus, gatewayMsg, (err as Error)?.message);
    return res.status(httpStatus === 500 || httpStatus === 503 ? 502 : 400).json({ error: userMsg });
  }
}
