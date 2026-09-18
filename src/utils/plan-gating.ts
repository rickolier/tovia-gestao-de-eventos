import { getPlanConfig } from './plan-limits.js';
import { contarEventosAtivos } from './evento-lifecycle.js';
import type { PlanLevel } from '../types/user.js';
import type { Evento } from '../types/event.js';

export interface GatingResult {
  permitido: boolean;
  motivo?: string;
  limiteAtual?: number;
  limiteMax?: number;
  percentual?: number;
}

const FOLGA_INSCRICOES = 0.05;

export function verificarCriacaoEvento(
  plano: PlanLevel | string | null | undefined,
  eventos: Evento[],
): GatingResult {
  const config = getPlanConfig(plano);
  const ativos = contarEventosAtivos(eventos);
  const max = config.maxActiveEvents;

  if (ativos >= max) {
    return {
      permitido: false,
      motivo: `Limite de ${max} eventos ativos atingido. Faça upgrade ou arquive um evento.`,
      limiteAtual: ativos,
      limiteMax: max,
      percentual: 100,
    };
  }

  return { permitido: true, limiteAtual: ativos, limiteMax: max, percentual: Math.round((ativos / max) * 100) };
}

export function verificarInscricao(
  plano: PlanLevel | string | null | undefined,
  inscricoesAtuais: number,
  limiteOverride?: number,
): GatingResult {
  const config = getPlanConfig(plano);
  const limiteBase = limiteOverride ?? config.maxAttendeesPerEvent;
  const limiteSoftCap = Math.floor(limiteBase * (1 + FOLGA_INSCRICOES));
  const percentual = Math.round((inscricoesAtuais / limiteBase) * 100);

  if (inscricoesAtuais >= limiteSoftCap) {
    return {
      permitido: false,
      motivo: `Limite de inscrições atingido (${limiteSoftCap}). Compre um crédito avulso ou faça upgrade.`,
      limiteAtual: inscricoesAtuais,
      limiteMax: limiteBase,
      percentual,
    };
  }

  return { permitido: true, limiteAtual: inscricoesAtuais, limiteMax: limiteBase, percentual };
}

export type NivelAlerta = 80 | 90 | 100 | 105;

export function calcularAlertaInscricoes(
  inscricoesAtuais: number,
  limiteBase: number,
): NivelAlerta | null {
  const percentual = (inscricoesAtuais / limiteBase) * 100;
  if (percentual >= 105) return 105;
  if (percentual >= 100) return 100;
  if (percentual >= 90) return 90;
  if (percentual >= 80) return 80;
  return null;
}

export function verificarEquipe(
  plano: PlanLevel | string | null | undefined,
  membrosAtuais: number,
): GatingResult {
  const config = getPlanConfig(plano);
  const max = config.maxTeamMembers;

  if (membrosAtuais >= max) {
    return {
      permitido: false,
      motivo: `Limite de ${max} membros de equipe atingido.`,
      limiteAtual: membrosAtuais,
      limiteMax: max,
      percentual: 100,
    };
  }

  return { permitido: true, limiteAtual: membrosAtuais, limiteMax: max, percentual: Math.round((membrosAtuais / max) * 100) };
}

export function verificarComunicado(
  plano: PlanLevel | string | null | undefined,
  comunicadosEnviados: number,
): GatingResult {
  const config = getPlanConfig(plano);
  const max = config.maxComunicadosPerEvent;

  if (comunicadosEnviados >= max) {
    return {
      permitido: false,
      motivo: `Limite de ${max} comunicado(s) por evento atingido.`,
      limiteAtual: comunicadosEnviados,
      limiteMax: max,
      percentual: 100,
    };
  }

  return { permitido: true, limiteAtual: comunicadosEnviados, limiteMax: max, percentual: Math.round((comunicadosEnviados / max) * 100) };
}

export function verificarEmailDiscricionario(
  plano: PlanLevel | string | null | undefined,
  emailsEnviadosNoMes: number,
): GatingResult {
  const config = getPlanConfig(plano);
  const max = config.maxEmailsPerMonth;

  if (emailsEnviadosNoMes >= max) {
    return {
      permitido: false,
      motivo: `Limite de ${max.toLocaleString('pt-BR')} e-mails/mês atingido.`,
      limiteAtual: emailsEnviadosNoMes,
      limiteMax: max,
      percentual: 100,
    };
  }

  return { permitido: true, limiteAtual: emailsEnviadosNoMes, limiteMax: max, percentual: Math.round((emailsEnviadosNoMes / max) * 100) };
}

export function isEmailTransacional(_tipo: string): boolean {
  const transacionais = ['otp', 'confirmacao', 'verificacao', 'reset_senha', 'convite_equipe'];
  return transacionais.includes(_tipo);
}
