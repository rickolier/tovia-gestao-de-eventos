// Paleta e estilo base
const BASE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f4f6f3;
  margin: 0;
  padding: 0;
`;

const PRIMARY = '#1a7a45';
const PRIMARY_DARK = '#155f37';
const TEXT = '#1a1a1a';
const MUTED = '#6b7280';

function wrap(content: string, preview = '') {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${preview ? `<meta name="x-apple-disable-message-reformatting" /><div style="display:none;max-height:0;overflow:hidden;">${preview}</div>` : ''}
</head>
<body style="${BASE}">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f3;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:${PRIMARY};border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-1px;">ekko</span>
            <span style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.5);display:block;letter-spacing:3px;margin-top:2px;">GESTÃO DE EVENTOS</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;border-radius:0 0 16px 16px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;">
            <p style="font-size:12px;color:${MUTED};margin:0;">© ${new Date().getFullYear()} Ekko Gestão de Eventos · Todos os direitos reservados</p>
            <p style="font-size:12px;color:${MUTED};margin:4px 0 0;">Você recebeu este e-mail porque tem uma conta na plataforma Ekko.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(label: string, href: string) {
  return `<a href="${href}" style="display:inline-block;background:${PRIMARY};color:#ffffff;font-weight:800;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;margin-top:24px;letter-spacing:0.5px;">${label}</a>`;
}

function h1(text: string) {
  return `<h1 style="font-size:26px;font-weight:900;color:${TEXT};margin:0 0 12px;line-height:1.2;">${text}</h1>`;
}

function p(text: string) {
  return `<p style="font-size:15px;color:${MUTED};line-height:1.7;margin:0 0 12px;">${text}</p>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />`;
}

function feature(icon: string, title: string, desc: string) {
  return `
  <tr>
    <td style="padding:10px 0;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="font-size:22px;padding-right:14px;vertical-align:top;">${icon}</td>
        <td>
          <p style="font-size:14px;font-weight:700;color:${TEXT};margin:0 0 2px;">${title}</p>
          <p style="font-size:13px;color:${MUTED};margin:0;">${desc}</p>
        </td>
      </tr></table>
    </td>
  </tr>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────────────────────

export function emailBoasVindas(nome: string) {
  return wrap(`
    ${h1(`Bem-vindo ao Ekko, ${nome || 'organizador'}! 🎉`)}
    ${p('Sua conta foi criada com sucesso. O Ekko é a plataforma completa para gestão de eventos — inscrições, financeiro, equipe e muito mais.')}
    ${p('Você está no plano <strong>Start gratuito</strong>. Pode criar seu primeiro evento agora mesmo!')}
    ${btn('Criar meu primeiro evento', 'https://ekko-gestao-de-eventos.vercel.app/dashboard')}
    ${divider()}
    ${p('Qualquer dúvida, estamos aqui. Bom evento!')}
  `, 'Sua conta Ekko foi criada com sucesso!');
}

export function emailTutorial(nome: string) {
  return wrap(`
    ${h1(`${nome || 'Olá'}, conheça o Ekko por dentro 👋`)}
    ${p('Aqui está um guia rápido das principais funcionalidades para você começar com tudo:')}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;">
      ${feature('📋', 'Páginas de Inscrição', 'Crie formulários personalizados com link único para cada evento.')}
      ${feature('👥', 'Gestão de Participantes', 'Acompanhe inscrições, status e dados de cada participante.')}
      ${feature('💰', 'Módulo Financeiro (Essencial+)', 'Registre pagamentos, doações e controle taxas e margens.')}
      ${feature('✅', 'Tarefas e Equipe (Pro)', 'Distribua tarefas, convide colaboradores e gerencie grupos.')}
    </table>
    ${btn('Acessar o painel', 'https://ekko-gestao-de-eventos.vercel.app/dashboard')}
  `, 'Veja tudo que o Ekko pode fazer pelo seu evento');
}

export function emailPrimeiroEvento(nome: string, eventoNome: string) {
  return wrap(`
    ${h1('Seu primeiro evento foi criado! 🚀')}
    ${p(`Parabéns, <strong>${nome}</strong>! O evento <strong>${eventoNome}</strong> está pronto.`)}
    ${p('Agora você pode:')}
    <ul style="font-size:14px;color:${MUTED};line-height:2;padding-left:20px;margin:0 0 16px;">
      <li>Criar uma página de inscrição personalizada</li>
      <li>Compartilhar o link com os participantes</li>
      <li>Acompanhar as inscrições em tempo real</li>
    </ul>
    ${btn('Ver meu evento', 'https://ekko-gestao-de-eventos.vercel.app/dashboard')}
  `, `${eventoNome} foi criado com sucesso!`);
}

export function emailConfirmacaoInscricao(participanteNome: string, eventoNome: string, eventoData: string, eventoLocal: string) {
  return wrap(`
    ${h1('Inscrição confirmada! ✅')}
    ${p(`Olá, <strong>${participanteNome}</strong>! Sua inscrição no evento abaixo foi registrada com sucesso.`)}
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f9fafb;border-radius:12px;padding:20px;margin:20px 0;">
      <tr><td style="padding:6px 0;">
        <p style="font-size:18px;font-weight:900;color:${TEXT};margin:0 0 12px;">${eventoNome}</p>
        <p style="font-size:13px;color:${MUTED};margin:2px 0;">📅 ${eventoData}</p>
        <p style="font-size:13px;color:${MUTED};margin:2px 0;">📍 ${eventoLocal}</p>
      </td></tr>
    </table>
    ${p('Guarde este e-mail como comprovante da sua inscrição. Nos vemos em breve!')}
  `, `Você está inscrito em ${eventoNome}`);
}

export function emailPagamentoConfirmado(nome: string, plano: string, valor: string, proxVencimento: string) {
  return wrap(`
    ${h1('Pagamento confirmado! 💳')}
    ${p(`Olá, <strong>${nome}</strong>! Recebemos o pagamento da sua assinatura Ekko.`)}
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:20px 0;">
      <tr><td>
        <p style="font-size:13px;color:${MUTED};margin:2px 0;">Plano: <strong style="color:${TEXT};">${plano}</strong></p>
        <p style="font-size:13px;color:${MUTED};margin:2px 0;">Valor: <strong style="color:${TEXT};">${valor}</strong></p>
        <p style="font-size:13px;color:${MUTED};margin:2px 0;">Próximo vencimento: <strong style="color:${TEXT};">${proxVencimento}</strong></p>
      </td></tr>
    </table>
    ${btn('Ver detalhes do plano', 'https://ekko-gestao-de-eventos.vercel.app/dashboard')}
  `, 'Seu pagamento foi confirmado');
}

export function emailPagamentoNaoRealizado(nome: string, plano: string, vencimento: string) {
  return wrap(`
    ${h1('Pagamento não identificado ⚠️')}
    ${p(`Olá, <strong>${nome}</strong>. Não identificamos o pagamento da sua assinatura do plano <strong>${plano}</strong>, com vencimento em <strong>${vencimento}</strong>.`)}
    ${p('Para manter o acesso às funcionalidades do seu plano, regularize o pagamento o quanto antes.')}
    ${btn('Regularizar pagamento', 'https://ekko-gestao-de-eventos.vercel.app/planos')}
    ${divider()}
    ${p('Se já realizou o pagamento, aguarde alguns minutos para a confirmação automática.')}
  `, 'Atenção: pagamento pendente na sua conta Ekko');
}

export function emailConviteEquipe(eventoNome: string, donoNome: string, loginUrl: string) {
  return wrap(`
    ${h1(`Você foi convidado para a equipe! 🤝`)}
    ${p(`<strong>${donoNome}</strong> convidou você para colaborar na organização do evento <strong>${eventoNome}</strong>.`)}
    ${p('Como membro da equipe, você poderá visualizar inscritos e ajudar na gestão de recursos, grupos e tarefas.')}
    ${p('Para aceitar, basta criar sua conta gratuita no Ekko — não é necessário nenhum plano pago:')}
    ${btn('Criar conta e entrar na equipe', loginUrl)}
    ${divider()}
    ${p('Já tem conta? Faça login com o e-mail em que recebeu este convite e o evento aparecerá automaticamente no seu painel.')}
  `, `${donoNome} convidou você para organizar ${eventoNome}`);
}

export function emailConfirmacaoVinculo(nome: string, eventoNome: string) {
  return wrap(`
    ${h1('Você entrou na equipe! 🎯')}
    ${p(`Olá, <strong>${nome}</strong>! Seu vínculo com o evento <strong>${eventoNome}</strong> foi confirmado com sucesso.`)}
    ${p('O evento já aparece no seu painel com o indicativo de convidado. Você tem acesso às funcionalidades liberadas pelo organizador.')}
    ${btn('Ver meu painel', 'https://ekko-gestao-de-eventos.vercel.app/dashboard')}
  `, `Você agora faz parte da equipe de ${eventoNome}`);
}
