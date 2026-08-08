import {
  emailBoasVindas,
  emailPrimeiroEvento,
  emailConfirmacaoInscricao,
  emailPagamentoNaoRealizado,
  emailConviteEquipe,
  emailConfirmacaoVinculo,
  emailCustom,
  emailCustomHtml,
  emailBoasVindasChinam,
  emailBoasVindasPetach,
  emailBoasVindasKoach,
  emailTicketCriado,
  emailTicketRespondido,
  emailTicketFechado,
} from './email-templates';

// Substitui {nome}, {evento}, {data}, {local} etc. no texto do organizador
export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}
import { auth } from './firebase';

async function send(to: string, subject: string, html: string) {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    await fetch('/api/sendEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ to, subject, html }),
    });
  } catch (err) {
    console.warn('Email send failed (non-blocking):', err);
  }
}

export const Email = {
  boasVindas: (to: string, nome: string) =>
    send(to, 'Bem-vindo ao Tovia! 🎉', emailBoasVindas(nome)),

  primeiroEvento: (to: string, nome: string, eventoNome: string) =>
    send(to, `${eventoNome} foi criado com sucesso! 🚀`, emailPrimeiroEvento(nome, eventoNome)),

  confirmacaoInscricao: (to: string, participanteNome: string, eventoNome: string, eventoData: string, eventoLocal: string, acessoUrl?: string, linkPagamento?: string) =>
    send(to, `Inscrição confirmada: ${eventoNome}`, emailConfirmacaoInscricao(participanteNome, eventoNome, eventoData, eventoLocal, acessoUrl, linkPagamento)),

  pagamentoNaoRealizado: (to: string, nome: string, plano: string, vencimento: string) =>
    send(to, 'Atenção: pagamento pendente na sua conta Tovia ⚠️', emailPagamentoNaoRealizado(nome, plano, vencimento)),

  // eventoNome opcional: sem ele, envia convite global de equipe
  conviteEquipe: (to: string, donoNome: string, eventoNome?: string) => {
    const loginUrl = `${window.location.origin}/login?cadastro=true`;
    const subject = eventoNome
      ? `${donoNome} convidou você para organizar ${eventoNome} 🤝`
      : `${donoNome} adicionou você à equipe no Tovia 🤝`;
    return send(to, subject, emailConviteEquipe(donoNome, loginUrl, eventoNome));
  },

  confirmacaoVinculo: (to: string, nome: string, eventoNome: string) =>
    send(to, `Você entrou na equipe de ${eventoNome}! 🎯`, emailConfirmacaoVinculo(nome, eventoNome)),

  custom: (to: string, subject: string, corpo: string, preview?: string) =>
    send(to, subject, emailCustom(corpo, preview)),

  customHtml: (to: string, subject: string, corpo: string, preview?: string) =>
    send(to, subject, emailCustomHtml(corpo, preview)),

  boasVindasPlano: (to: string, nome: string, plano: 'chinam' | 'petach' | 'koach' | 'chalem', valor?: string, proxVencimento?: string) => {
    if (plano === 'petach') return send(to, 'Bem-vindo ao Tovia Pétach! 🚪', emailBoasVindasPetach(nome, valor || 'R$ 49/mês', proxVencimento || ''));
    if (plano === 'koach')  return send(to, 'Bem-vindo ao Tovia Koách! ⚡',  emailBoasVindasKoach(nome, valor || 'R$ 129/mês', proxVencimento || ''));
    return send(to, 'Bem-vindo ao Tovia! 🌱', emailBoasVindasChinam(nome));
  },

  ticketCriado: (to: string, nome: string, titulo: string, descricao: string, ticketId: string) =>
    send(to, `Ticket aberto: ${titulo} — Tovia 🎫`, emailTicketCriado(nome, titulo, descricao, ticketId)),

  ticketRespondido: (to: string, nome: string, titulo: string, resposta: string) =>
    send(to, `Suporte respondeu: ${titulo} — Tovia 💬`, emailTicketRespondido(nome, titulo, resposta)),

  ticketFechado: (to: string, nome: string, titulo: string, satisfacaoUrl: string) =>
    send(to, `Ticket encerrado — avalie o atendimento Tovia ✅`, emailTicketFechado(nome, titulo, satisfacaoUrl)),
};
