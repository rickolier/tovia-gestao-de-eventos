import { describe, it, expect } from 'vitest';
import {
  verificarCriacaoEvento,
  verificarInscricao,
  calcularAlertaInscricoes,
  verificarEquipe,
  verificarComunicado,
  verificarEmailDiscricionario,
  isEmailTransacional,
} from '~/utils/plan-gating';
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
    estagio: 'ativo',
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

describe('verificarCriacaoEvento', () => {
  it('permite criar evento dentro do limite (chinám: 2)', () => {
    const eventos = [criarEvento()];
    const resultado = verificarCriacaoEvento('chinam', eventos);
    expect(resultado.permitido).toBe(true);
    expect(resultado.limiteAtual).toBe(1);
    expect(resultado.limiteMax).toBe(2);
  });

  it('bloqueia no limite (chinám: 2 ativos)', () => {
    const eventos = [criarEvento({ id: '1' }), criarEvento({ id: '2' })];
    const resultado = verificarCriacaoEvento('chinam', eventos);
    expect(resultado.permitido).toBe(false);
  });

  it('não conta eventos inativos', () => {
    const eventos = [
      criarEvento({ id: '1' }),
      criarEvento({ id: '2', estagio: 'inativo', ativo: false }),
    ];
    const resultado = verificarCriacaoEvento('chinam', eventos);
    expect(resultado.permitido).toBe(true);
  });

  it('pétach permite 5 eventos', () => {
    const eventos = Array.from({ length: 4 }, (_, i) => criarEvento({ id: String(i) }));
    expect(verificarCriacaoEvento('petach', eventos).permitido).toBe(true);
    eventos.push(criarEvento({ id: '5' }));
    expect(verificarCriacaoEvento('petach', eventos).permitido).toBe(false);
  });
});

describe('verificarInscricao', () => {
  it('permite inscrição dentro do limite', () => {
    expect(verificarInscricao('chinam', 50).permitido).toBe(true);
  });

  it('permite inscrição na folga de 5% (chinám: 100 → softcap 105)', () => {
    expect(verificarInscricao('chinam', 100).permitido).toBe(true);
    expect(verificarInscricao('chinam', 104).permitido).toBe(true);
  });

  it('bloqueia acima do softcap de 5%', () => {
    expect(verificarInscricao('chinam', 105).permitido).toBe(false);
  });

  it('pétach: softcap = floor(300 * 1.05) = 315', () => {
    expect(verificarInscricao('petach', 314).permitido).toBe(true);
    expect(verificarInscricao('petach', 315).permitido).toBe(false);
  });

  it('respeita limiteOverride (crédito avulso)', () => {
    expect(verificarInscricao('chinam', 200, 500).permitido).toBe(true);
    expect(verificarInscricao('chinam', 525, 500).permitido).toBe(false);
  });
});

describe('calcularAlertaInscricoes', () => {
  it('retorna null abaixo de 80%', () => {
    expect(calcularAlertaInscricoes(79, 100)).toBeNull();
  });

  it('retorna 80 entre 80-89%', () => {
    expect(calcularAlertaInscricoes(80, 100)).toBe(80);
    expect(calcularAlertaInscricoes(89, 100)).toBe(80);
  });

  it('retorna 90 entre 90-99%', () => {
    expect(calcularAlertaInscricoes(90, 100)).toBe(90);
  });

  it('retorna 100 entre 100-104%', () => {
    expect(calcularAlertaInscricoes(100, 100)).toBe(100);
    expect(calcularAlertaInscricoes(104, 100)).toBe(100);
  });

  it('retorna 105 a partir de 105%', () => {
    expect(calcularAlertaInscricoes(105, 100)).toBe(105);
  });
});

describe('verificarEquipe', () => {
  it('permite dentro do limite', () => {
    expect(verificarEquipe('chinam', 2).permitido).toBe(true);
  });

  it('bloqueia no limite', () => {
    expect(verificarEquipe('chinam', 3).permitido).toBe(false);
  });
});

describe('verificarComunicado', () => {
  it('permite o primeiro comunicado', () => {
    expect(verificarComunicado('chinam', 0).permitido).toBe(true);
  });

  it('bloqueia o segundo comunicado', () => {
    expect(verificarComunicado('chinam', 1).permitido).toBe(false);
  });
});

describe('verificarEmailDiscricionario', () => {
  it('permite dentro do limite mensal', () => {
    expect(verificarEmailDiscricionario('chinam', 1999).permitido).toBe(true);
  });

  it('bloqueia no limite mensal', () => {
    expect(verificarEmailDiscricionario('chinam', 2000).permitido).toBe(false);
  });
});

describe('isEmailTransacional', () => {
  it('OTP é transacional', () => {
    expect(isEmailTransacional('otp')).toBe(true);
  });

  it('confirmação é transacional', () => {
    expect(isEmailTransacional('confirmacao')).toBe(true);
  });

  it('comunicado NÃO é transacional', () => {
    expect(isEmailTransacional('comunicado')).toBe(false);
  });
});
