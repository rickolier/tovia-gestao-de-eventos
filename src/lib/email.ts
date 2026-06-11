import {
  emailBoasVindas,
  emailTutorial,
  emailPrimeiroEvento,
  emailConfirmacaoInscricao,
  emailPagamentoConfirmado,
  emailPagamentoNaoRealizado,
  emailConviteEquipe,
  emailConfirmacaoVinculo,
} from './email-templates';

async function send(to: string, subject: string, html: string) {
  try {
    await fetch('/api/sendEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    });
  } catch (err) {
    console.warn('Email send failed (non-blocking):', err);
  }
}

export const Email = {
  boasVindas: (to: string, nome: string) =>
    send(to, 'Bem-vindo ao Ekko! 🎉', emailBoasVindas(nome)),

  tutorial: (to: string, nome: string) =>
    send(to, 'Conheça tudo que o Ekko pode fazer pelo seu evento', emailTutorial(nome)),

  primeiroEvento: (to: string, nome: string, eventoNome: string) =>
    send(to, `${eventoNome} foi criado com sucesso! 🚀`, emailPrimeiroEvento(nome, eventoNome)),

  confirmacaoInscricao: (to: string, participanteNome: string, eventoNome: string, eventoData: string, eventoLocal: string) =>
    send(to, `Inscrição confirmada: ${eventoNome}`, emailConfirmacaoInscricao(participanteNome, eventoNome, eventoData, eventoLocal)),

  pagamentoConfirmado: (to: string, nome: string, plano: string, valor: string, proxVencimento: string) =>
    send(to, 'Pagamento confirmado — Ekko 💳', emailPagamentoConfirmado(nome, plano, valor, proxVencimento)),

  pagamentoNaoRealizado: (to: string, nome: string, plano: string, vencimento: string) =>
    send(to, 'Atenção: pagamento pendente na sua conta Ekko ⚠️', emailPagamentoNaoRealizado(nome, plano, vencimento)),

  conviteEquipe: (to: string, eventoNome: string, donoNome: string) => {
    const loginUrl = `${window.location.origin}/login?cadastro=true`;
    return send(to, `${donoNome} convidou você para organizar ${eventoNome} 🤝`, emailConviteEquipe(eventoNome, donoNome, loginUrl));
  },

  confirmacaoVinculo: (to: string, nome: string, eventoNome: string) =>
    send(to, `Você entrou na equipe de ${eventoNome}! 🎯`, emailConfirmacaoVinculo(nome, eventoNome)),
};
