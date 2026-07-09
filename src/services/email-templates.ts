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
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <meta name="x-apple-disable-message-reformatting" />
  <style>
    :root { color-scheme: light only; }
    body { margin: 0 !important; padding: 0 !important; background-color: #f4f6f3 !important; }
  </style>
  ${preview ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preview}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
</head>
<body style="${BASE}" bgcolor="#f4f6f3">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f6f3" style="background-color:#f4f6f3;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td bgcolor="${PRIMARY}" style="background-color:${PRIMARY} !important;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <span style="font-size:28px;font-weight:900;color:#ffffff !important;letter-spacing:-1px;-webkit-text-fill-color:#ffffff;">tovia</span>
            <span style="font-size:11px;font-weight:600;color:#a7f3d0 !important;-webkit-text-fill-color:#a7f3d0;display:block;letter-spacing:3px;margin-top:4px;">GESTÃO DE EVENTOS</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td bgcolor="#ffffff" style="background-color:#ffffff !important;padding:40px;border-radius:0 0 16px 16px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;">
            <p style="font-size:12px;color:${MUTED};margin:0;">© ${new Date().getFullYear()} Tovia Gestão de Eventos · Todos os direitos reservados</p>
            <p style="font-size:12px;color:${MUTED};margin:4px 0 0;">Você recebeu este e-mail porque tem uma conta na plataforma Tovia.</p>
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
    ${h1(`Bem-vindo ao Tovia, ${nome || 'organizador'}!`)}
    ${p('Sua conta foi criada com sucesso. O Tovia é a plataforma completa para gestão de eventos — inscrições, financeiro e gestão da equipe.')}
    ${p('Para ativar sua conta, <strong>verifique sua caixa de entrada</strong>: enviamos um segundo e-mail com o <strong>código de 6 dígitos</strong> para confirmar seu endereço.')}
    ${btn('Confirmar meu e-mail', 'https://www.toviaapp.com.br/verificar-email')}
    ${divider()}
    ${p('Não encontrou o código? Verifique a pasta de spam ou acesse o link acima para reenviar.')}
    ${p('Qualquer dúvida, estamos aqui para ajudar.')}
  `, 'Confirme seu e-mail para ativar sua conta Tovia');
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
    ${btn('Ver meu evento', 'https://tovia-gestao-de-eventos.vercel.app/dashboard')}
  `, `${eventoNome} foi criado com sucesso!`);
}

export function emailConfirmacaoInscricao(participanteNome: string, eventoNome: string, eventoData: string, eventoLocal: string, acessoUrl?: string) {
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
    ${acessoUrl ? btn('Ver minha inscrição', acessoUrl) : ''}
    ${p('Guarde este e-mail como comprovante da sua inscrição. Nos vemos em breve!')}
  `, `Você está inscrito em ${eventoNome}`);
}

export function emailPagamentoNaoRealizado(nome: string, plano: string, vencimento: string) {
  return wrap(`
    ${h1('Pagamento não identificado ⚠️')}
    ${p(`Olá, <strong>${nome}</strong>. Não identificamos o pagamento da sua assinatura do plano <strong>${plano}</strong>, com vencimento em <strong>${vencimento}</strong>.`)}
    ${p('Para manter o acesso às funcionalidades do seu plano, regularize o pagamento o quanto antes.')}
    ${btn('Regularizar pagamento', 'https://tovia-gestao-de-eventos.vercel.app/planos')}
    ${divider()}
    ${p('Se já realizou o pagamento, aguarde alguns minutos para a confirmação automática.')}
  `, 'Atenção: pagamento pendente na sua conta Tovia');
}

export function emailConviteEquipe(donoNome: string, loginUrl: string, eventoNome?: string) {
  const contexto = eventoNome
    ? `colaborar na organização do evento <strong>${eventoNome}</strong>`
    : `fazer parte da equipe de organização de <strong>${donoNome}</strong>`;
  const preview = eventoNome
    ? `${donoNome} convidou você para organizar ${eventoNome}`
    : `${donoNome} adicionou você à equipe no Tovia`;
  return wrap(`
    ${h1('Você foi convidado para a equipe! 🤝')}
    ${p(`<strong>${donoNome}</strong> convidou você para ${contexto}.`)}
    ${p('Como membro da equipe, você poderá visualizar inscritos e ajudar na gestão de recursos, grupos e tarefas — apenas o que o organizador liberar para você.')}
    ${p('Para aceitar, basta criar sua conta gratuita no Tovia — não é necessário nenhum plano pago:')}
    ${btn('Criar conta e entrar na equipe', loginUrl)}
    ${divider()}
    ${p('Já tem conta? Faça login com o e-mail em que recebeu este convite e a conexão será ativada automaticamente.')}
  `, preview);
}

export function emailConfirmacaoVinculo(nome: string, eventoNome: string) {
  return wrap(`
    ${h1('Você entrou na equipe! 🎯')}
    ${p(`Olá, <strong>${nome}</strong>! Seu vínculo com o evento <strong>${eventoNome}</strong> foi confirmado com sucesso.`)}
    ${p('O evento já aparece no seu painel com o indicativo de convidado. Você tem acesso às funcionalidades liberadas pelo organizador.')}
    ${btn('Ver meu painel', 'https://tovia-gestao-de-eventos.vercel.app/dashboard')}
  `, `Você agora faz parte da equipe de ${eventoNome}`);
}

// ─── Boas-vindas por plano ───────────────────────────────────────────────────

export function emailBoasVindasChinam(nome: string) {
  return wrap(`
    ${h1(`Bem-vindo ao Tovia, ${nome || 'organizador'}! 🌱`)}
    ${p('Sua conta está ativa no <strong>Plano Chinám</strong> — gratuito para sempre. Aqui está tudo que você pode explorar agora:')}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;margin-bottom:24px;">
      ${feature('📋', 'Inscrições', 'Crie formulários personalizados e gerencie participantes em tempo real.')}
      ${feature('📊', 'Relatórios básicos', 'Acompanhe os números do seu evento com clareza.')}
      ${feature('🧮', 'Calculadora de evento', 'Estime custos, receitas e margem antes de começar.')}
    </table>
    ${p('Você começa com <strong>1 evento ativo</strong>, com até <strong>100 vagas</strong> e <strong>1 tipo de ingresso</strong>. Perfeito para o primeiro passo!')}
    ${divider()}
    ${p('Precisa de mais recursos? Explore os planos Pétach e Koách para desbloquear o módulo financeiro, gestão de equipe e muito mais.')}
    ${btn('Acessar o painel', 'https://tovia-gestao-de-eventos.vercel.app/dashboard')}
    ${divider()}
    ${p('Tem dúvidas? Nossa <a href="https://tovia-gestao-de-eventos.vercel.app/base-de-conhecimento" style="color:${PRIMARY};font-weight:600;">Base de Conhecimento</a> tem guias passo a passo para cada funcionalidade. E se precisar de ajuda direta, abra um ticket de suporte no painel.')}
  `, 'Sua conta Tovia está ativa — veja o que você pode fazer agora');
}

export function emailBoasVindasPetach(nome: string, valor: string, proxVencimento: string) {
  return wrap(`
    ${h1(`Bem-vindo ao Pétach, ${nome || 'organizador'}! 🚪`)}
    ${p('Seu pagamento foi confirmado e o <strong>Plano Pétach</strong> já está ativo na sua conta. Agora você tem acesso ao módulo financeiro completo:')}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;margin-bottom:24px;">
      ${feature('📋', 'Inscrições', 'Formulários personalizados e gestão completa de participantes.')}
      ${feature('💰', 'Financeiro manual', 'Registre pagamentos, doações e controle cada centavo com precisão.')}
      ${feature('📊', 'Relatórios', 'Visualize receitas, despesas e resultado líquido por evento.')}
      ${feature('🧮', 'Calculadora', 'Planeje o financeiro antes mesmo de abrir as inscrições.')}
    </table>
    ${p('Você tem <strong>3 eventos ativos</strong>, até <strong>200 vagas</strong> por evento e <strong>3 tipos de ingresso</strong>.')}
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:20px 0;">
      <tr><td>
        <p style="font-size:13px;color:${MUTED};margin:2px 0;">Plano: <strong style="color:${TEXT};">Pétach · פֶּתַח</strong></p>
        <p style="font-size:13px;color:${MUTED};margin:2px 0;">Valor: <strong style="color:${TEXT};">${valor}</strong></p>
        ${proxVencimento ? `<p style="font-size:13px;color:${MUTED};margin:2px 0;">Próxima renovação: <strong style="color:${TEXT};">${proxVencimento}</strong></p>` : ''}
      </td></tr>
    </table>
    ${btn('Acessar o painel', 'https://tovia-gestao-de-eventos.vercel.app/dashboard')}
    ${divider()}
    ${p('Explore a <a href="https://tovia-gestao-de-eventos.vercel.app/base-de-conhecimento" style="color:${PRIMARY};font-weight:600;">Base de Conhecimento</a> para aprender a usar o módulo financeiro. Qualquer dúvida, abra um ticket no painel — estamos aqui.')}
  `, 'Plano Pétach ativo — módulo financeiro liberado');
}

export function emailBoasVindasKoach(nome: string, valor: string, proxVencimento: string) {
  return wrap(`
    ${h1(`Bem-vindo ao Koách, ${nome || 'organizador'}! ⚡`)}
    ${p('Pagamento confirmado! O <strong>Plano Koách</strong> está ativo. Você agora tem acesso à gestão completa de eventos — equipe, grupos, tarefas e muito mais:')}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;margin-bottom:24px;">
      ${feature('📋', 'Inscrições + Financeiro', 'Tudo do plano anterior, com ainda mais capacidade.')}
      ${feature('🗂️', 'Gestão de eventos', 'Controle recursos, grupos e configure seu evento com detalhes.')}
      ${feature('✅', 'Tarefas e equipe', 'Convide até 5 colaboradores, distribua tarefas e acompanhe o andamento.')}
      ${feature('📊', 'Relatórios avançados', 'Visão completa de inscrições, financeiro e desempenho da equipe.')}
    </table>
    ${p('Você tem <strong>5 eventos ativos</strong>, até <strong>500 vagas</strong> por evento, <strong>5 ingressos</strong> e <strong>5 membros de equipe</strong>.')}
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:20px 0;">
      <tr><td>
        <p style="font-size:13px;color:${MUTED};margin:2px 0;">Plano: <strong style="color:${TEXT};">Koách · כֹּחַ</strong></p>
        <p style="font-size:13px;color:${MUTED};margin:2px 0;">Valor: <strong style="color:${TEXT};">${valor}</strong></p>
        ${proxVencimento ? `<p style="font-size:13px;color:${MUTED};margin:2px 0;">Próxima renovação: <strong style="color:${TEXT};">${proxVencimento}</strong></p>` : ''}
      </td></tr>
    </table>
    ${btn('Acessar o painel', 'https://tovia-gestao-de-eventos.vercel.app/dashboard')}
    ${divider()}
    ${p('Sugerimos começar pela <a href="https://tovia-gestao-de-eventos.vercel.app/base-de-conhecimento" style="color:${PRIMARY};font-weight:600;">Base de Conhecimento</a> para conhecer os módulos de equipe e tarefas. Qualquer dúvida, abra um ticket de suporte no painel.')}
  `, 'Plano Koách ativo — gestão completa e equipe liberadas');
}

export function emailBoasVindasChalem(nome: string, valor: string, proxVencimento: string) {
  return wrap(`
    ${h1(`Bem-vindo ao Chalém, ${nome || 'organizador'}! 🌟`)}
    ${p('Pagamento confirmado! O <strong>Plano Chalém</strong> está ativo — o plano completo do Tovia. Você tem acesso a tudo, incluindo pagamentos automáticos via PIX, boleto e cartão:')}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;margin-bottom:24px;">
      ${feature('💳', 'Pagamentos automáticos', 'Cobranças via PIX, boleto e cartão direto na página de inscrição.')}
      ${feature('👥', 'Inscritos ilimitados', 'Sem limite de participantes por evento.')}
      ${feature('🗂️', 'Gestão completa', 'Recursos, grupos, tarefas, equipe — 10 membros incluídos.')}
      ${feature('📊', 'Relatórios completos', 'Visão financeira e operacional de todos os seus eventos.')}
    </table>
    ${p('Você tem <strong>10 eventos ativos</strong>, <strong>inscritos ilimitados</strong>, <strong>10 tipos de ingresso</strong> e <strong>10 membros de equipe</strong>.')}
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:20px 0;">
      <tr><td>
        <p style="font-size:13px;color:${MUTED};margin:2px 0;">Plano: <strong style="color:${TEXT};">Chalém · שָׁלֵם</strong></p>
        <p style="font-size:13px;color:${MUTED};margin:2px 0;">Valor: <strong style="color:${TEXT};">${valor}</strong></p>
        ${proxVencimento ? `<p style="font-size:13px;color:${MUTED};margin:2px 0;">Próxima renovação: <strong style="color:${TEXT};">${proxVencimento}</strong></p>` : ''}
      </td></tr>
    </table>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
      <p style="font-size:14px;font-weight:700;color:#92400e;margin:0 0 6px;">Próximo passo: configure seu gateway de pagamento</p>
      <p style="font-size:13px;color:#78350f;margin:0;line-height:1.6;">Para usar os pagamentos automáticos, acesse <strong>Configurações → Financeiro</strong> no painel e conecte seu gateway Asaas. Nosso suporte está disponível para ajudar na configuração.</p>
    </div>
    ${btn('Configurar gateway', 'https://tovia-gestao-de-eventos.vercel.app/dashboard')}
    ${divider()}
    ${p('Nossa <a href="https://tovia-gestao-de-eventos.vercel.app/base-de-conhecimento" style="color:${PRIMARY};font-weight:600;">Base de Conhecimento</a> tem um guia completo de configuração do gateway. Dúvidas? Abra um ticket de suporte — temos prioridade para o Chalém.')}
  `, 'Plano Chalém ativo — pagamentos automáticos e gestão completa');
}

// ─── Tickets de suporte ───────────────────────────────────────────────────────

export function emailTicketCriado(nome: string, titulo: string, descricao: string, ticketId: string) {
  return wrap(`
    ${h1('Seu ticket foi aberto! 🎫')}
    ${p(`Olá, <strong>${nome || 'organizador'}</strong>! Recebemos sua solicitação e nossa equipe irá analisá-la em breve.`)}
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f9fafb;border-radius:12px;padding:20px;margin:20px 0;">
      <tr><td>
        <p style="font-size:11px;color:${MUTED};margin:0 0 6px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Protocolo</p>
        <p style="font-size:13px;font-weight:700;color:${TEXT};margin:0 0 12px;">#${ticketId.slice(0, 8).toUpperCase()}</p>
        <p style="font-size:11px;color:${MUTED};margin:0 0 4px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Assunto</p>
        <p style="font-size:14px;font-weight:700;color:${TEXT};margin:0 0 12px;">${titulo}</p>
        <p style="font-size:11px;color:${MUTED};margin:0 0 4px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Descrição</p>
        <p style="font-size:13px;color:${MUTED};margin:0;line-height:1.6;">${descricao}</p>
      </td></tr>
    </table>
    ${p('Você receberá um e-mail assim que tivermos uma resposta. O tempo médio de resposta é de <strong>1 dia útil</strong>.')}
    ${btn('Acessar o painel', 'https://tovia-gestao-de-eventos.vercel.app/dashboard')}
  `, `Protocolo #${ticketId.slice(0, 8).toUpperCase()} aberto`);
}

export function emailTicketRespondido(nome: string, titulo: string, resposta: string) {
  return wrap(`
    ${h1('Seu ticket recebeu uma resposta 💬')}
    ${p(`Olá, <strong>${nome || 'organizador'}</strong>! Nossa equipe respondeu à sua solicitação.`)}
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f9fafb;border-radius:12px;padding:20px;margin:20px 0;">
      <tr><td>
        <p style="font-size:11px;color:${MUTED};margin:0 0 4px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Assunto</p>
        <p style="font-size:14px;font-weight:700;color:${TEXT};margin:0 0 16px;">${titulo}</p>
        <p style="font-size:11px;color:${MUTED};margin:0 0 4px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Resposta do suporte</p>
        <p style="font-size:14px;color:${TEXT};margin:0;line-height:1.7;white-space:pre-line;">${resposta}</p>
      </td></tr>
    </table>
    ${p('Se precisar de mais ajuda ou a resposta não resolveu sua dúvida, acesse o painel para acompanhar o ticket.')}
    ${btn('Ver ticket no painel', 'https://tovia-gestao-de-eventos.vercel.app/dashboard')}
  `, 'O suporte Tovia respondeu ao seu ticket');
}

export function emailTicketFechado(nome: string, titulo: string, satisfacaoUrl: string) {
  return wrap(`
    ${h1('Ticket encerrado — obrigado pelo contato! ✅')}
    ${p(`Olá, <strong>${nome || 'organizador'}</strong>! Seu ticket foi marcado como encerrado.`)}
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f9fafb;border-radius:12px;padding:20px;margin:20px 0;">
      <tr><td>
        <p style="font-size:11px;color:${MUTED};margin:0 0 4px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Assunto</p>
        <p style="font-size:14px;font-weight:700;color:${TEXT};margin:0;">${titulo}</p>
      </td></tr>
    </table>
    ${p('Leva menos de 1 minuto e ajuda a melhorar nosso atendimento. Você pode avaliar o suporte que recebeu:')}
    ${btn('Avaliar atendimento', satisfacaoUrl)}
    ${divider()}
    ${p('Se o problema voltar a ocorrer ou tiver novas dúvidas, abra um novo ticket pelo painel.')}
  `, 'Seu ticket foi encerrado — avalie o atendimento');
}

// Envolve corpo customizado (texto do organizador) no template Tovia padrão
export function emailCustom(corpo: string, preview = '') {
  const html = corpo
    .split('\n')
    .map(line => line.trim() ? `<p style="margin:0 0 16px;color:${TEXT};font-size:15px;line-height:1.6;">${line}</p>` : '')
    .join('');
  return wrap(html, preview);
}
