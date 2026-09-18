import type { Evento, EventoEstagio, InativoMotivo } from '../types/event.js';

export function getEstagio(evento: Evento): EventoEstagio {
  if (evento.estagio) return evento.estagio;
  return evento.ativo !== false ? 'ativo' : 'inativo';
}

export function isSlotOcupado(evento: Evento): boolean {
  return getEstagio(evento) === 'ativo';
}

export function contarEventosAtivos(eventos: Evento[]): number {
  return eventos.filter(isSlotOcupado).length;
}

export interface TransicaoResult {
  estagio: EventoEstagio;
  ativo: boolean;
  inativo_motivo?: InativoMotivo;
}

export function arquivarEvento(_evento: Evento): TransicaoResult {
  return {
    estagio: 'inativo',
    ativo: false,
    inativo_motivo: 'arquivado_manual',
  };
}

export function desarquivarEvento(_evento: Evento): TransicaoResult {
  return {
    estagio: 'ativo',
    ativo: true,
    inativo_motivo: undefined,
  };
}

export function calcularTransicaoDataFim(
  evento: Evento,
  temCicloFinanceiroAberto: boolean,
): TransicaoResult | null {
  const agora = new Date();
  const dataFim = new Date(evento.data_fim);
  if (dataFim >= agora) return null;

  if (temCicloFinanceiroAberto) {
    return {
      estagio: 'inativo',
      ativo: false,
      inativo_motivo: 'acompanhamento_financeiro',
    };
  }

  return {
    estagio: 'finalizado',
    ativo: false,
    inativo_motivo: undefined,
  };
}

export function finalizarAcompanhamento(_evento: Evento): TransicaoResult {
  return {
    estagio: 'finalizado',
    ativo: false,
    inativo_motivo: undefined,
  };
}
