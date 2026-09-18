import { describe, it, expect } from 'vitest';
import {
  getEstagio,
  isSlotOcupado,
  contarEventosAtivos,
  arquivarEvento,
  desarquivarEvento,
  calcularTransicaoDataFim,
  finalizarAcompanhamento,
} from '~/utils/evento-lifecycle';
import type { Evento } from '~/types/event';

function criarEvento(overrides: Partial<Evento> = {}): Evento {
  return {
    id: '1',
    nome: 'Teste',
    data_inicio: '2026-10-01',
    data_fim: '2026-10-02',
    local: 'Local',
    instituicao: 'Inst',
    vagas_totais: 100,
    criado_por: 'user1',
    habilita_doacoes: false,
    ativo: true,
    campos_customizados: [],
    config_pagamento: {
      pix: { ativo: false, taxa: 0, tipo_taxa: 'fixo' },
      cartao_credito: { ativo: false, taxa: 0, tipo_taxa: 'fixo', parcelas_max: 1 },
      boleto: { ativo: false, taxa: 0, tipo_taxa: 'fixo' },
      parcelamento_limite_data: false,
      installmentLogic: 'free',
    },
    config_comunicacao: {
      email_confirmacao: { assunto: '', corpo: '', ativo: false },
      lembrete_evento: { dias_antes: 1, assunto: '', corpo: '', ativo: false },
    },
    ...overrides,
  };
}

describe('getEstagio', () => {
  it('retorna estagio explícito quando presente', () => {
    expect(getEstagio(criarEvento({ estagio: 'finalizado' }))).toBe('finalizado');
  });

  it('infere ativo quando ativo=true e sem estagio', () => {
    expect(getEstagio(criarEvento({ ativo: true }))).toBe('ativo');
  });

  it('infere inativo quando ativo=false e sem estagio', () => {
    expect(getEstagio(criarEvento({ ativo: false }))).toBe('inativo');
  });
});

describe('isSlotOcupado', () => {
  it('true para evento ativo', () => {
    expect(isSlotOcupado(criarEvento({ estagio: 'ativo' }))).toBe(true);
  });

  it('false para inativo', () => {
    expect(isSlotOcupado(criarEvento({ estagio: 'inativo' }))).toBe(false);
  });

  it('false para finalizado', () => {
    expect(isSlotOcupado(criarEvento({ estagio: 'finalizado' }))).toBe(false);
  });
});

describe('contarEventosAtivos', () => {
  it('conta apenas eventos ativos', () => {
    const eventos = [
      criarEvento({ id: '1', estagio: 'ativo' }),
      criarEvento({ id: '2', estagio: 'inativo' }),
      criarEvento({ id: '3', estagio: 'ativo' }),
      criarEvento({ id: '4', estagio: 'finalizado' }),
    ];
    expect(contarEventosAtivos(eventos)).toBe(2);
  });

  it('compatível com eventos legados (sem estagio)', () => {
    const eventos = [
      criarEvento({ id: '1', ativo: true }),
      criarEvento({ id: '2', ativo: false }),
      criarEvento({ id: '3', ativo: true }),
    ];
    expect(contarEventosAtivos(eventos)).toBe(2);
  });
});

describe('arquivarEvento', () => {
  it('transiciona para inativo com motivo arquivado_manual', () => {
    const resultado = arquivarEvento(criarEvento());
    expect(resultado.estagio).toBe('inativo');
    expect(resultado.ativo).toBe(false);
    expect(resultado.inativo_motivo).toBe('arquivado_manual');
  });
});

describe('desarquivarEvento', () => {
  it('transiciona de volta para ativo', () => {
    const resultado = desarquivarEvento(criarEvento({ ativo: false, estagio: 'inativo' }));
    expect(resultado.estagio).toBe('ativo');
    expect(resultado.ativo).toBe(true);
    expect(resultado.inativo_motivo).toBeUndefined();
  });
});

describe('calcularTransicaoDataFim', () => {
  it('retorna null se data_fim ainda não passou', () => {
    const evento = criarEvento({ data_fim: '2099-12-31' });
    expect(calcularTransicaoDataFim(evento, false)).toBeNull();
  });

  it('transiciona para inativo com acompanhamento se há ciclo financeiro', () => {
    const evento = criarEvento({ data_fim: '2020-01-01' });
    const resultado = calcularTransicaoDataFim(evento, true);
    expect(resultado?.estagio).toBe('inativo');
    expect(resultado?.inativo_motivo).toBe('acompanhamento_financeiro');
  });

  it('transiciona para finalizado se sem ciclo financeiro', () => {
    const evento = criarEvento({ data_fim: '2020-01-01' });
    const resultado = calcularTransicaoDataFim(evento, false);
    expect(resultado?.estagio).toBe('finalizado');
    expect(resultado?.ativo).toBe(false);
  });
});

describe('finalizarAcompanhamento', () => {
  it('transiciona de acompanhamento para finalizado', () => {
    const evento = criarEvento({
      estagio: 'inativo',
      inativo_motivo: 'acompanhamento_financeiro',
    });
    const resultado = finalizarAcompanhamento(evento);
    expect(resultado.estagio).toBe('finalizado');
    expect(resultado.ativo).toBe(false);
    expect(resultado.inativo_motivo).toBeUndefined();
  });
});

describe('evento arquivado com parcela em aberto', () => {
  it('arquivar não muda o fato de que webhooks continuam ativos', () => {
    const resultado = arquivarEvento(criarEvento());
    expect(resultado.estagio).toBe('inativo');
    expect(resultado.inativo_motivo).toBe('arquivado_manual');
  });
});
