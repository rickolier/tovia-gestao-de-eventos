import { describe, it, expect } from 'vitest';
import { PLAN_CONFIGS, getPlanConfig, PLAN_ORDER, PLAN_RANK, VISIBLE_PLAN_ORDER } from '../../src/utils/plan-limits';
import type { PlanLevel } from '../../src/types';

describe('PLAN_CONFIGS', () => {
  it('define 4 entradas (3 planos + 1 legado)', () => {
    expect(Object.keys(PLAN_CONFIGS)).toHaveLength(4);
  });

  it('nomes corretos: Chinám, Pétach, Chalém', () => {
    expect(PLAN_CONFIGS.chinam.label).toContain('Chinám');
    expect(PLAN_CONFIGS.petach.label).toContain('Pétach');
    expect(PLAN_CONFIGS.chalem.label).toContain('Chalém');
  });

  describe('Chinám (gratuito)', () => {
    const c = PLAN_CONFIGS.chinam;
    it('preço zero', () => {
      expect(c.price.monthly).toBe(0);
      expect(c.price.annual).toBe(0);
      expect(c.price.monthlyLabel).toBe('Gratuito');
    });
    it('limites: 2 eventos, 100 vagas, 3 ingressos, 3 equipe', () => {
      expect(c.maxActiveEvents).toBe(2);
      expect(c.maxAttendeesPerEvent).toBe(100);
      expect(c.maxTicketsPerEvent).toBe(3);
      expect(c.maxTeamMembers).toBe(3);
    });
    it('sem BYOG e sem créditos avulsos', () => {
      expect(c.byog).toBe(false);
      expect(c.allowExtraCredits).toBe(false);
    });
    it('módulos: inscrições, relatórios e calculadora apenas', () => {
      expect(c.modules.registrations).toBe(true);
      expect(c.modules.reports).toBe(true);
      expect(c.modules.calculator).toBe(true);
      expect(c.modules.manualPayments).toBe(false);
      expect(c.modules.donations).toBe(false);
      expect(c.modules.autoPayments).toBe(false);
      expect(c.modules.eventManagement).toBe(false);
      expect(c.modules.tasksAndTeam).toBe(false);
    });
  });

  describe('Pétach', () => {
    const p = PLAN_CONFIGS.petach;
    it('limites: 5 eventos, 300 vagas, 10 equipe', () => {
      expect(p.maxActiveEvents).toBe(5);
      expect(p.maxAttendeesPerEvent).toBe(300);
      expect(p.maxTeamMembers).toBe(10);
    });
    it('BYOG e créditos avulsos R$199', () => {
      expect(p.byog).toBe(true);
      expect(p.allowExtraCredits).toBe(true);
      expect(p.extraCreditPrice).toBe(199);
    });
    it('todos os módulos ativos', () => {
      expect(p.modules.registrations).toBe(true);
      expect(p.modules.manualPayments).toBe(true);
      expect(p.modules.donations).toBe(true);
      expect(p.modules.autoPayments).toBe(true);
      expect(p.modules.eventManagement).toBe(true);
      expect(p.modules.tasksAndTeam).toBe(true);
      expect(p.modules.reports).toBe(true);
      expect(p.modules.calculator).toBe(true);
    });
  });

  describe('Koách (legado)', () => {
    const k = PLAN_CONFIGS.koach;
    it('marcado como legado', () => {
      expect(k.legacy).toBe(true);
    });
    it('mesmos limites do Pétach', () => {
      expect(k.maxActiveEvents).toBe(PLAN_CONFIGS.petach.maxActiveEvents);
      expect(k.maxAttendeesPerEvent).toBe(PLAN_CONFIGS.petach.maxAttendeesPerEvent);
      expect(k.maxTeamMembers).toBe(PLAN_CONFIGS.petach.maxTeamMembers);
    });
  });

  describe('Chalém', () => {
    const ch = PLAN_CONFIGS.chalem;
    it('limites: 15 eventos, 600 vagas, 30 equipe', () => {
      expect(ch.maxActiveEvents).toBe(15);
      expect(ch.maxAttendeesPerEvent).toBe(600);
      expect(ch.maxTeamMembers).toBe(30);
    });
    it('todos os módulos ativos', () => {
      expect(ch.modules.registrations).toBe(true);
      expect(ch.modules.manualPayments).toBe(true);
      expect(ch.modules.donations).toBe(true);
      expect(ch.modules.autoPayments).toBe(true);
      expect(ch.modules.eventManagement).toBe(true);
      expect(ch.modules.tasksAndTeam).toBe(true);
      expect(ch.modules.reports).toBe(true);
      expect(ch.modules.calculator).toBe(true);
    });
  });

  describe('preços atualizados', () => {
    it('pétach R$119/mês, R$1.190/ano', () => {
      expect(PLAN_CONFIGS.petach.price.monthly).toBe(119);
      expect(PLAN_CONFIGS.petach.price.annual).toBe(1190);
      expect(PLAN_CONFIGS.petach.price.monthlyLabel).toBe('R$ 119/mês');
      expect(PLAN_CONFIGS.petach.price.annualTotalLabel).toBe('R$ 1.190/ano');
    });
    it('chalém R$299/mês, R$2.990/ano', () => {
      expect(PLAN_CONFIGS.chalem.price.monthly).toBe(299);
      expect(PLAN_CONFIGS.chalem.price.annual).toBe(2990);
      expect(PLAN_CONFIGS.chalem.price.monthlyLabel).toBe('R$ 299/mês');
      expect(PLAN_CONFIGS.chalem.price.annualTotalLabel).toBe('R$ 2.990/ano');
    });
    it('anual = mensal × 10', () => {
      expect(PLAN_CONFIGS.petach.price.annual).toBe(PLAN_CONFIGS.petach.price.monthly * 10);
      expect(PLAN_CONFIGS.chalem.price.annual).toBe(PLAN_CONFIGS.chalem.price.monthly * 10);
    });
    it('koách tem mesmo preço que pétach', () => {
      expect(PLAN_CONFIGS.koach.price.monthly).toBe(PLAN_CONFIGS.petach.price.monthly);
      expect(PLAN_CONFIGS.koach.price.annual).toBe(PLAN_CONFIGS.petach.price.annual);
    });
  });

  describe('comunicados e emails', () => {
    it('todos os planos têm 1 comunicado/evento', () => {
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
    expect(getPlanConfig('pro').label).toContain('Pétach');
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

describe('VISIBLE_PLAN_ORDER', () => {
  it('tem 3 planos visíveis sem legado', () => {
    expect(VISIBLE_PLAN_ORDER).toEqual(['chinam', 'petach', 'chalem']);
  });
});

describe('PLAN_RANK', () => {
  it('ordena chinam < petach < koach < chalem', () => {
    expect(PLAN_RANK.chinam).toBeLessThan(PLAN_RANK.petach);
    expect(PLAN_RANK.petach).toBeLessThan(PLAN_RANK.koach);
    expect(PLAN_RANK.koach).toBeLessThan(PLAN_RANK.chalem);
  });
});
