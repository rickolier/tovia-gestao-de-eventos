import { describe, it, expect } from 'vitest';
import { PLAN_CONFIGS, getPlanConfig, PLAN_ORDER, PLAN_RANK, VISIBLE_PLAN_ORDER } from '~/utils/plan-limits';

describe('PLAN_CONFIGS', () => {
  it('define 4 entradas (3 planos + 1 legado)', () => {
    expect(Object.keys(PLAN_CONFIGS)).toHaveLength(4);
  });

  it('chinám é gratuito', () => {
    expect(PLAN_CONFIGS.chinam.price.monthly).toBe(0);
    expect(PLAN_CONFIGS.chinam.price.monthlyLabel).toBe('Gratuito');
  });

  it('chinám tem limites corretos', () => {
    expect(PLAN_CONFIGS.chinam.maxActiveEvents).toBe(2);
    expect(PLAN_CONFIGS.chinam.maxAttendeesPerEvent).toBe(100);
    expect(PLAN_CONFIGS.chinam.maxTeamMembers).toBe(3);
    expect(PLAN_CONFIGS.chinam.byog).toBe(false);
  });

  it('pétach tem BYOG e créditos avulsos', () => {
    expect(PLAN_CONFIGS.petach.byog).toBe(true);
    expect(PLAN_CONFIGS.petach.allowExtraCredits).toBe(true);
    expect(PLAN_CONFIGS.petach.extraCreditPrice).toBe(199);
  });

  it('chalém tem limites altos', () => {
    expect(PLAN_CONFIGS.chalem.maxActiveEvents).toBe(15);
    expect(PLAN_CONFIGS.chalem.maxAttendeesPerEvent).toBe(600);
    expect(PLAN_CONFIGS.chalem.maxTeamMembers).toBe(30);
  });

  it('koách é legado e espelha pétach', () => {
    expect(PLAN_CONFIGS.koach.legacy).toBe(true);
    expect(PLAN_CONFIGS.koach.maxActiveEvents).toBe(PLAN_CONFIGS.petach.maxActiveEvents);
    expect(PLAN_CONFIGS.koach.price.monthly).toBe(PLAN_CONFIGS.petach.price.monthly);
  });

  it('cada plano tem nome correto', () => {
    expect(PLAN_CONFIGS.chinam.name).toBe('Plano 1 - Chinám');
    expect(PLAN_CONFIGS.petach.name).toBe('Plano 2 - Pétach');
    expect(PLAN_CONFIGS.chalem.name).toBe('Plano 3 - Chalém');
  });

  it('limites crescem com o plano (planos visíveis)', () => {
    const order = VISIBLE_PLAN_ORDER;
    for (let i = 1; i < order.length; i++) {
      const prev = PLAN_CONFIGS[order[i - 1]];
      const curr = PLAN_CONFIGS[order[i]];
      expect(curr.maxActiveEvents).toBeGreaterThanOrEqual(prev.maxActiveEvents);
    }
  });

  it('todos os planos têm 1 comunicado por evento', () => {
    for (const plan of VISIBLE_PLAN_ORDER) {
      expect(PLAN_CONFIGS[plan].maxComunicadosPerEvent).toBe(1);
    }
  });

  it('emails/mês crescem com o plano', () => {
    expect(PLAN_CONFIGS.chinam.maxEmailsPerMonth).toBe(2000);
    expect(PLAN_CONFIGS.petach.maxEmailsPerMonth).toBe(15000);
    expect(PLAN_CONFIGS.chalem.maxEmailsPerMonth).toBe(50000);
  });
});

describe('getPlanConfig', () => {
  it('retorna config para plano válido', () => {
    expect(getPlanConfig('petach').name).toBe('Plano 2 - Pétach');
  });

  it('retorna chinám para null/undefined', () => {
    expect(getPlanConfig(null).name).toBe('Plano 1 - Chinám');
    expect(getPlanConfig(undefined).name).toBe('Plano 1 - Chinám');
  });

  it('mapeia planos legados para os novos', () => {
    expect(getPlanConfig('start').name).toBe('Plano 1 - Chinám');
    expect(getPlanConfig('essencial').name).toBe('Plano 2 - Pétach');
    expect(getPlanConfig('pro').name).toBe('Plano 2 - Pétach');
    expect(getPlanConfig('personalizado').name).toBe('Plano 3 - Chalém');
  });

  it('retorna chinám para plano desconhecido', () => {
    expect(getPlanConfig('inexistente').name).toBe('Plano 1 - Chinám');
  });
});

describe('PLAN_ORDER', () => {
  it('tem 4 entradas incluindo legado', () => {
    expect(PLAN_ORDER).toEqual(['chinam', 'petach', 'koach', 'chalem']);
  });
});

describe('VISIBLE_PLAN_ORDER', () => {
  it('tem 3 planos visíveis', () => {
    expect(VISIBLE_PLAN_ORDER).toEqual(['chinam', 'petach', 'chalem']);
  });
});

describe('PLAN_RANK', () => {
  it('rank crescente', () => {
    expect(PLAN_RANK.chinam).toBe(0);
    expect(PLAN_RANK.petach).toBe(1);
    expect(PLAN_RANK.koach).toBe(2);
    expect(PLAN_RANK.chalem).toBe(3);
  });
});

describe('preços atualizados', () => {
  it('pétach R$119/mês, R$1.190/ano', () => {
    expect(PLAN_CONFIGS.petach.price.monthly).toBe(119);
    expect(PLAN_CONFIGS.petach.price.annual).toBe(1190);
  });

  it('chalém R$299/mês, R$2.990/ano', () => {
    expect(PLAN_CONFIGS.chalem.price.monthly).toBe(299);
    expect(PLAN_CONFIGS.chalem.price.annual).toBe(2990);
  });

  it('anual = mensal × 10', () => {
    expect(PLAN_CONFIGS.petach.price.annual).toBe(PLAN_CONFIGS.petach.price.monthly * 10);
    expect(PLAN_CONFIGS.chalem.price.annual).toBe(PLAN_CONFIGS.chalem.price.monthly * 10);
  });
});
