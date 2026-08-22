import { describe, it, expect } from 'vitest';
import { PLAN_CONFIGS, getPlanConfig, PLAN_ORDER, PLAN_RANK } from '../../src/utils/plan-limits';
import type { PlanLevel } from '../../src/types';

describe('PLAN_CONFIGS', () => {
  it('define 4 planos', () => {
    expect(Object.keys(PLAN_CONFIGS)).toHaveLength(4);
  });

  it('nomes corretos: Chinám, Pétach, Koách, Chalém', () => {
    expect(PLAN_CONFIGS.chinam.label).toContain('Chinám');
    expect(PLAN_CONFIGS.petach.label).toContain('Pétach');
    expect(PLAN_CONFIGS.koach.label).toContain('Koách');
    expect(PLAN_CONFIGS.chalem.label).toContain('Chalém');
  });

  describe('Chinám (gratuito)', () => {
    const c = PLAN_CONFIGS.chinam;
    it('preço zero', () => {
      expect(c.price.monthly).toBe(0);
      expect(c.price.annual).toBe(0);
      expect(c.price.monthlyLabel).toBe('Gratuito');
    });
    it('limites: 1 evento, 100 vagas, 1 ingresso, 0 equipe', () => {
      expect(c.maxActiveEvents).toBe(1);
      expect(c.maxAttendeesPerEvent).toBe(100);
      expect(c.maxTicketsPerEvent).toBe(1);
      expect(c.maxTeamMembers).toBe(0);
    });
    it('módulos: inscrições e relatórios apenas', () => {
      expect(c.modules.registrations).toBe(true);
      expect(c.modules.reports).toBe(true);
      expect(c.modules.manualPayments).toBe(false);
      expect(c.modules.donations).toBe(false);
      expect(c.modules.autoPayments).toBe(false);
      expect(c.modules.eventManagement).toBe(false);
      expect(c.modules.tasksAndTeam).toBe(false);
    });
  });

  describe('Pétach', () => {
    const p = PLAN_CONFIGS.petach;
    it('limites: 3 eventos, 200 vagas, 3 ingressos', () => {
      expect(p.maxActiveEvents).toBe(3);
      expect(p.maxAttendeesPerEvent).toBe(200);
      expect(p.maxTicketsPerEvent).toBe(3);
    });
    it('módulos: pagamentos manuais e doações', () => {
      expect(p.modules.manualPayments).toBe(true);
      expect(p.modules.donations).toBe(true);
      expect(p.modules.autoPayments).toBe(false);
    });
  });

  describe('Koách', () => {
    const k = PLAN_CONFIGS.koach;
    it('limites: 5 eventos, 500 vagas, 5 equipe', () => {
      expect(k.maxActiveEvents).toBe(5);
      expect(k.maxAttendeesPerEvent).toBe(500);
      expect(k.maxTeamMembers).toBe(5);
    });
    it('módulos: gestão e equipe ativados', () => {
      expect(k.modules.eventManagement).toBe(true);
      expect(k.modules.tasksAndTeam).toBe(true);
      expect(k.modules.autoPayments).toBe(false);
    });
  });

  describe('Chalém', () => {
    const ch = PLAN_CONFIGS.chalem;
    it('limites: 10 eventos, inscritos ilimitados, 10 equipe', () => {
      expect(ch.maxActiveEvents).toBe(10);
      expect(ch.maxAttendeesPerEvent).toBe(Infinity);
      expect(ch.maxTeamMembers).toBe(10);
    });
    it('todos os módulos ativos', () => {
      expect(ch.modules.registrations).toBe(true);
      expect(ch.modules.manualPayments).toBe(true);
      expect(ch.modules.donations).toBe(true);
      expect(ch.modules.eventManagement).toBe(true);
      expect(ch.modules.tasksAndTeam).toBe(true);
      expect(ch.modules.reports).toBe(true);
    });
  });

  describe('preços de teste (R$5)', () => {
    for (const plan of ['petach', 'koach', 'chalem'] as PlanLevel[]) {
      it(`${plan} custa R$5/mês`, () => {
        expect(PLAN_CONFIGS[plan].price.monthly).toBe(5);
        expect(PLAN_CONFIGS[plan].price.monthlyLabel).toBe('R$ 5/mês');
      });
      it(`${plan} custa R$50/ano`, () => {
        expect(PLAN_CONFIGS[plan].price.annual).toBe(50);
        expect(PLAN_CONFIGS[plan].price.annualTotalLabel).toBe('R$ 50/ano');
      });
    }
  });
});

describe('getPlanConfig', () => {
  it('retorna Chinám para null/undefined', () => {
    expect(getPlanConfig(null).label).toContain('Chinám');
    expect(getPlanConfig(undefined).label).toContain('Chinám');
  });

  it('retorna config correta por nível', () => {
    expect(getPlanConfig('petach').label).toContain('Pétach');
    expect(getPlanConfig('chalem').label).toContain('Chalém');
  });

  it('mapeia planos legados corretamente', () => {
    expect(getPlanConfig('start').label).toContain('Chinám');
    expect(getPlanConfig('essencial').label).toContain('Pétach');
    expect(getPlanConfig('pro').label).toContain('Koách');
    expect(getPlanConfig('personalizado').label).toContain('Chalém');
  });

  it('retorna Chinám para plano desconhecido', () => {
    expect(getPlanConfig('platinum').label).toContain('Chinám');
  });
});

describe('PLAN_ORDER', () => {
  it('tem 4 planos na ordem crescente', () => {
    expect(PLAN_ORDER).toEqual(['chinam', 'petach', 'koach', 'chalem']);
  });
});

describe('PLAN_RANK', () => {
  it('ordena chinam < petach < koach < chalem', () => {
    expect(PLAN_RANK.chinam).toBeLessThan(PLAN_RANK.petach);
    expect(PLAN_RANK.petach).toBeLessThan(PLAN_RANK.koach);
    expect(PLAN_RANK.koach).toBeLessThan(PLAN_RANK.chalem);
  });
});
