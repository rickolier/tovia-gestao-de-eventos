// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_firebase.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'Tovia <noreply@toviaapp.com.br>';

const PLAN_NAMES: Record<string, string> = {
  petach: 'Pétach',
  koach:  'Koách',
  chalem: 'Chalém',
};
const PLAN_VALUES: Record<string, string> = {
  petach: 'R$ 49/mês',
  koach:  'R$ 129/mês',
  chalem: 'R$ 299/mês',
};

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
  } catch (e) {
    console.warn('Email send failed:', e);
  }
}

function fmtDate(iso: string) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
}

const PRIMARY = '#1a7a45';
const MUTED = '#6b7280';
const TEXT = '#1a1a1a';

function emailWrap(content: string) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f6f3;margin:0;padding:0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f3;padding:40px 16px;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:${PRIMARY};border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
<span style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;">tovia</span>
</td></tr>
<tr><td style="background:#fff;padding:40px;border-radius:0 0 16px 16px;">${content}</td></tr>
<tr><td style="padding:24px 40px;text-align:center;">
<p style="font-size:12px;color:${MUTED};margin:0;">© ${new Date().getFullYear()} Tovia Gestão de Eventos</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function feature(icon: string, title: string, desc: string) {
  return `<tr><td style="padding:8px 0;"><table cellpadding="0" cellspacing="0"><tr>
    <td style="font-size:20px;padding-right:12px;vertical-align:top;">${icon}</td>
    <td><p style="font-size:14px;font-weight:700;color:${TEXT};margin:0 0 2px;">${title}</p>
    <p style="font-size:13px;color:${MUTED};margin:0;">${desc}</p></td>
  </tr></table></td></tr>`;
}

function planBox(plano: string, valor: string, proxVencimento: string) {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:20px 0;">
    <tr><td>
      <p style="font-size:13px;color:${MUTED};margin:2px 0;">Plano: <strong style="color:${TEXT};">${plano}</strong></p>
      <p style="font-size:13px;color:${MUTED};margin:2px 0;">Valor: <strong style="color:${TEXT};">${valor}</strong></p>
      ${proxVencimento ? `<p style="font-size:13px;color:${MUTED};margin:2px 0;">Próxima renovação: <strong style="color:${TEXT};">${proxVencimento}</strong></p>` : ''}
    </td></tr>
  </table>`;
}

function buildEmailBoasVindasPetach(nome: string, valor: string, proxVencimento: string) {
  return emailWrap(`
    <h1 style="font-size:24px;font-weight:900;color:${TEXT};margin:0 0 12px;">Bem-vindo ao Pétach, ${nome}! 🚪</h1>
    <p style="font-size:15px;color:${MUTED};line-height:1.7;margin:0 0 16px;">Pagamento confirmado! O <strong>Plano Pétach</strong> está ativo. Você tem acesso ao módulo financeiro completo:</p>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px;">
      ${feature('📋', 'Inscrições', 'Formulários personalizados e gestão completa de participantes.')}
      ${feature('💰', 'Financeiro manual', 'Registre pagamentos, doações e controle cada centavo.')}
      ${feature('📊', 'Relatórios', 'Visualize receitas, despesas e resultado líquido por evento.')}
    </table>
    <p style="font-size:13px;color:${MUTED};margin:0 0 4px;"><strong style="color:${TEXT};">3 eventos</strong> · até <strong style="color:${TEXT};">200 vagas</strong> · <strong style="color:${TEXT};">3 tipos de ingresso</strong></p>
    ${planBox('Pétach · פֶּתַח', valor, proxVencimento)}
    <a href="https://tovia-gestao-de-eventos.vercel.app/dashboard" style="display:inline-block;background:${PRIMARY};color:#fff;font-weight:800;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;">Acessar o painel</a>
    <p style="font-size:13px;color:${MUTED};margin:24px 0 0;line-height:1.6;">Explore a <a href="https://tovia-gestao-de-eventos.vercel.app/base-de-conhecimento" style="color:${PRIMARY};font-weight:600;">Base de Conhecimento</a> para aprender a usar o módulo financeiro.</p>
  `);
}

function buildEmailBoasVindasKoach(nome: string, valor: string, proxVencimento: string) {
  return emailWrap(`
    <h1 style="font-size:24px;font-weight:900;color:${TEXT};margin:0 0 12px;">Bem-vindo ao Koách, ${nome}! ⚡</h1>
    <p style="font-size:15px;color:${MUTED};line-height:1.7;margin:0 0 16px;">Pagamento confirmado! O <strong>Plano Koách</strong> está ativo — gestão completa com equipe:</p>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px;">
      ${feature('📋', 'Inscrições + Financeiro', 'Tudo do plano anterior, com ainda mais capacidade.')}
      ${feature('🗂️', 'Gestão de eventos', 'Controle recursos, grupos e detalhes do seu evento.')}
      ${feature('✅', 'Tarefas e equipe', 'Convide até 5 colaboradores e distribua tarefas.')}
      ${feature('📊', 'Relatórios avançados', 'Visão completa de inscrições e desempenho da equipe.')}
    </table>
    <p style="font-size:13px;color:${MUTED};margin:0 0 4px;"><strong style="color:${TEXT};">5 eventos</strong> · até <strong style="color:${TEXT};">500 vagas</strong> · <strong style="color:${TEXT};">5 membros de equipe</strong></p>
    ${planBox('Koách · כֹּחַ', valor, proxVencimento)}
    <a href="https://tovia-gestao-de-eventos.vercel.app/dashboard" style="display:inline-block;background:${PRIMARY};color:#fff;font-weight:800;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;">Acessar o painel</a>
    <p style="font-size:13px;color:${MUTED};margin:24px 0 0;line-height:1.6;">Explore a <a href="https://tovia-gestao-de-eventos.vercel.app/base-de-conhecimento" style="color:${PRIMARY};font-weight:600;">Base de Conhecimento</a> para conhecer os módulos de equipe e tarefas.</p>
  `);
}

function buildEmailBoasVindasChalem(nome: string, valor: string, proxVencimento: string) {
  return emailWrap(`
    <h1 style="font-size:24px;font-weight:900;color:${TEXT};margin:0 0 12px;">Bem-vindo ao Chalém, ${nome}! 🌟</h1>
    <p style="font-size:15px;color:${MUTED};line-height:1.7;margin:0 0 16px;">Pagamento confirmado! O <strong>Plano Chalém</strong> está ativo — o plano completo do Tovia, com pagamentos automáticos:</p>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px;">
      ${feature('💳', 'Pagamentos automáticos', 'PIX, boleto e cartão direto na página de inscrição.')}
      ${feature('👥', 'Inscritos ilimitados', 'Sem limite de participantes por evento.')}
      ${feature('🗂️', 'Gestão completa', 'Recursos, grupos, tarefas — 10 membros de equipe.')}
      ${feature('📊', 'Relatórios completos', 'Visão financeira e operacional de todos os eventos.')}
    </table>
    ${planBox('Chalém · שָׁלֵם', valor, proxVencimento)}
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
      <p style="font-size:14px;font-weight:700;color:#92400e;margin:0 0 6px;">Próximo passo: configure seu gateway</p>
      <p style="font-size:13px;color:#78350f;margin:0;line-height:1.6;">Acesse <strong>Configurações → Financeiro</strong> no painel e conecte seu gateway Asaas. Nosso suporte está disponível para ajudar.</p>
    </div>
    <a href="https://tovia-gestao-de-eventos.vercel.app/dashboard" style="display:inline-block;background:${PRIMARY};color:#fff;font-weight:800;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;">Configurar gateway</a>
    <p style="font-size:13px;color:${MUTED};margin:24px 0 0;line-height:1.6;">Explore a <a href="https://tovia-gestao-de-eventos.vercel.app/base-de-conhecimento" style="color:${PRIMARY};font-weight:600;">Base de Conhecimento</a> para o guia completo de configuração do gateway.</p>
  `);
}

function buildEmailPagamentoNaoRealizado(nome: string, plano: string, vencimento: string) {
  return emailWrap(`
    <h1 style="font-size:24px;font-weight:900;color:${TEXT};margin:0 0 12px;">Pagamento não identificado ⚠️</h1>
    <p style="font-size:15px;color:${MUTED};line-height:1.7;margin:0 0 12px;">Olá, <strong>${nome}</strong>. Não identificamos o pagamento da sua assinatura do plano <strong>${plano}</strong>${vencimento ? `, com vencimento em <strong>${vencimento}</strong>` : ''}.</p>
    <p style="font-size:15px;color:${MUTED};line-height:1.7;margin:0 0 12px;">Para manter o acesso, regularize o pagamento o quanto antes.</p>
    <a href="https://tovia-gestao-de-eventos.vercel.app/planos" style="display:inline-block;background:${PRIMARY};color:#fff;font-weight:800;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;margin-top:8px;">Regularizar pagamento</a>
  `);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers['asaas-access-token'];
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expectedToken || token !== expectedToken) return res.status(401).send('Unauthorized');

  const event = req.body;
  const eventType: string = event?.event;
  const payment = event?.payment;

  if (!payment) return res.status(200).send('ok');

  const paidEvents = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'];
  const canceledEvents = ['PAYMENT_OVERDUE', 'SUBSCRIPTION_INACTIVATED'];

  try {
    const externalRef: string = payment.externalReference || '';
    const parts = externalRef.split(':');
    const userId = parts[0];
    const planLevel = parts[1];

    if (!userId) {
      console.warn('Webhook sem userId no externalReference:', externalRef);
      return res.status(200).send('ok');
    }

    // Buscar dados do usuário para o e-mail
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const userEmail = userData?.email;
    const userName = userData?.nome || 'organizador';

    if (paidEvents.includes(eventType)) {
      if (!planLevel) {
        console.warn('Webhook pago sem planLevel:', externalRef);
        return res.status(200).send('ok');
      }
      await db.collection('users').doc(userId).set(
        { plano: planLevel, planoPendente: null },
        { merge: true }
      );
      console.log('Plano ativado com sucesso.');

      const planNotifId = `plan_${userId}`;
      await db.collection('notificacoes').doc(planNotifId).set({
        id: planNotifId,
        userId,
        tipo: 'plano_atualizado',
        titulo: 'Plano atualizado com sucesso!',
        mensagem: `Seu plano foi atualizado para ${PLAN_NAMES[planLevel] || planLevel}. Boas-vindas ao novo plano!`,
        data: new Date().toISOString(),
        lida: false,
        acao_requirida: false,
      });

      // E-mail: boas-vindas por plano
      if (userEmail) {
        const proxVencimento = fmtDate(payment.dueDate
          ? new Date(new Date(payment.dueDate).setMonth(new Date(payment.dueDate).getMonth() + 1)).toISOString().split('T')[0]
          : '');
        const planValor = PLAN_VALUES[planLevel] || '';
        let subject: string;
        let html: string;
        if (planLevel === 'petach') {
          subject = 'Bem-vindo ao Tovia Pétach! 🚪';
          html = buildEmailBoasVindasPetach(userName, planValor, proxVencimento);
        } else if (planLevel === 'koach') {
          subject = 'Bem-vindo ao Tovia Koách! ⚡';
          html = buildEmailBoasVindasKoach(userName, planValor, proxVencimento);
        } else {
          subject = 'Bem-vindo ao Tovia Chalém! 🌟';
          html = buildEmailBoasVindasChalem(userName, planValor, proxVencimento);
        }
        await sendEmail(userEmail, subject, html);
      }
    }

    if (canceledEvents.includes(eventType)) {
      await db.collection('users').doc(userId).set(
        { plano: null, asaasSubscriptionId: null, planoPendente: null },
        { merge: true }
      );
      console.log('Plano cancelado.');

      // E-mail: pagamento não realizado
      if (userEmail && planLevel) {
        await sendEmail(
          userEmail,
          'Atenção: pagamento pendente na sua conta Tovia ⚠️',
          buildEmailPagamentoNaoRealizado(userName, PLAN_NAMES[planLevel] || planLevel, fmtDate(payment.dueDate)),
        );
      }
    }

    return res.status(200).send('ok');
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return res.status(500).send('error');
  }
}
