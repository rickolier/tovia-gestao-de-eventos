import { describe, it, expect } from 'vitest';
import { PLAN_CONFIGS, getPlanConfig, PLAN_ORDER, PLAN_RANK } from '~/utils/plan-limits';

describe('PLAN_CONFIGS', () => {
  it('define exatamente 4 planos', () => {
    expect(Object.keys(PLAN_CONFIGS)).toHaveLength(4);
  });

  it('chinám é gratuito', () => {
    expect(PLAN_CONFIGS.chinam.price.monthly).toBe(0);
    expect(PLAN_CONFIGS.chinam.price.monthlyLabel).toBe('Gratuito');
  });

  it('chinám tem limites restritos', () => {
    expect(PLAN_CONFIGS.chinam.maxActiveEvents).toBe(1);
    expect(PLAN_CONFIGS.chinam.maxAttendeesPerEvent).toBe(100);
    expect(PLAN_CONFIGS.chinam.maxTicketsPerEvent).toBe(1);
  });

  it('chalém tem inscritos ilimitados', () => {
    expect(PLAN_CONFIGS.chalem.maxAttendeesPerEvent).toBe(Infinity);
  });

  it('cada plano tem nome correto', () => {
    expect(PLAN_CONFIGS.chinam.name).toBe('Plano 1 - Chinám');
    expect(PLAN_CONFIGS.petach.name).toBe('Plano 2 - Pétach');
    expect(PLAN_CONFIGS.koach.name).toBe('Plano 3 - Koách');
    expect(PLAN_CONFIGS.chalem.name).toBe('Plano 4 - Chalém');
  });

  it('limites crescem com o plano', () => {
    const order = PLAN_ORDER;
    for (let i = 1; i < order.length; i++) {
      const prev = PLAN_CONFIGS[order[i - 1]];
      const curr = PLAN_CONFIGS[order[i]];
      expect(curr.maxActiveEvents).toBeGreaterThanOrEqual(prev.maxActiveEvents);
      expect(curr.maxTicketsPerEvent).toBeGreaterThanOrEqual(prev.maxTicketsPerEvent);
    }
  });

  it('módulos habilitam progressivamente', () => {
    expect(PLAN_CONFIGS.chinam.modules.manualPayments).toBe(false);
    expect(PLAN_CONFIGS.petach.modules.manualPayments).toBe(true);
    expect(PLAN_CONFIGS.chinam.modules.eventManagement).toBe(false);
    expect(PLAN_CONFIGS.koach.modules.eventManagement).toBe(true);
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
    expect(getPlanConfig('pro').name).toBe('Plano 3 - Koách');
    expect(getPlanConfig('personalizado').name).toBe('Plano 4 - Chalém');
  });

  it('retorna chinám para plano desconhecido', () => {
    expect(getPlanConfig('inexistente').name).toBe('Plano 1 - Chinám');
  });
});

describe('PLAN_ORDER', () => {
  it('está na ordem correta', () => {
    expect(PLAN_ORDER).toEqual(['chinam', 'petach', 'koach', 'chalem']);
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
