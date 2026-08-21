import { PlanLevel } from '../types';

export interface PlanPrice {
  monthly: number;            // valor mensal em R$ (0 para Chinám)
  annual: number;             // valor anual total em R$ (0 para Chinám)
  monthlyLabel: string;       // 'Gratuito' | 'R$ 49/mês' etc.
  annualMonthLabel: string;   // 'Gratuito' | 'R$ 40,83/mês' etc. (anual ÷ 12)
  annualTotalLabel: string;   // '' | 'R$ 490/ano' etc.
}

export interface PlanConfig {
  name: string;               // 'Plano 1 - Chinám'
  label: string;              // 'Chinám · חינם'
  description: string;
  descriptionHebrew: string;
  price: PlanPrice;
  modulesCount: number;       // quantas colunas de módulo ficam ativas nos cards (máx 3)
  limitsLabel: string;        // resumo dos limites para exibição
  maxActiveEvents: number;
  maxAttendeesPerEvent: number;
  maxTicketsPerEvent: number;
  maxSalesPagesPerEvent: number;
  maxTeamMembers: number;
  modules: {
    registrations: boolean;
    manualPayments: boolean;
    donations: boolean;
    autoPayments: boolean;
    eventManagement: boolean; // recursos, grupos, tarefas — como dono
    tasksAndTeam: boolean;
    reports: boolean;
    calculator: boolean;
  };
}

export const PLAN_CONFIGS: Record<PlanLevel, PlanConfig> = {
  chinam: {
    name: 'Plano 1 - Chinám',
    label: 'Chinám · חינם',
    description: 'Gratuito e permanente. Comece a organizar seu primeiro evento sem custo.',
    descriptionHebrew: 'Chinám (חינם) significa "gratuito" em hebraico.',
    price: {
      monthly: 0,
      annual: 0,
      monthlyLabel: 'Gratuito',
      annualMonthLabel: 'Gratuito',
      annualTotalLabel: '',
    },
    modulesCount: 1,
    limitsLabel: '1 evento · até 100 vagas · 1 ingresso',
    maxActiveEvents: 1,
    maxAttendeesPerEvent: 100,
    maxTicketsPerEvent: 1,
    maxSalesPagesPerEvent: 1,
    maxTeamMembers: 0,
    modules: {
      registrations: true,
      manualPayments: false,
      donations: false,
      autoPayments: false,
      eventManagement: false,
      tasksAndTeam: false,
      reports: true,
      calculator: true,
    },
  },
  petach: {
    name: 'Plano 2 - Pétach',
    label: 'Pétach · פֶּתַח',
    description: 'Inscrições + controle financeiro manual. A porta de entrada para eventos com cobrança.',
    descriptionHebrew: 'Pétach (פֶּתַח) significa "abertura" ou "portal" em hebraico.',
    price: {
      monthly: 5,
      annual: 50,
      monthlyLabel: 'R$ 5/mês',
      annualMonthLabel: 'R$ 4,17/mês',
      annualTotalLabel: 'R$ 50/ano',
    },
    modulesCount: 2,
    limitsLabel: '3 eventos · até 200 vagas · 3 ingressos',
    maxActiveEvents: 3,
    maxAttendeesPerEvent: 200,
    maxTicketsPerEvent: 3,
    maxSalesPagesPerEvent: 1,
    maxTeamMembers: 0,
    modules: {
      registrations: true,
      manualPayments: true,
      donations: true,
      autoPayments: false,
      eventManagement: false,
      tasksAndTeam: false,
      reports: true,
      calculator: true,
    },
  },
  koach: {
    name: 'Plano 3 - Koách',
    label: 'Koách · כֹּחַ',
    description: 'Gestão completa: recursos, grupos, tarefas e equipe. Força total na organização.',
    descriptionHebrew: 'Koách (כֹּחַ) significa "força" ou "potência" em hebraico.',
    price: {
      monthly: 5,
      annual: 50,
      monthlyLabel: 'R$ 5/mês',
      annualMonthLabel: 'R$ 4,17/mês',
      annualTotalLabel: 'R$ 50/ano',
    },
    modulesCount: 3,
    limitsLabel: '5 eventos · até 500 vagas · 5 ingressos · 5 membros de equipe',
    maxActiveEvents: 5,
    maxAttendeesPerEvent: 500,
    maxTicketsPerEvent: 5,
    maxSalesPagesPerEvent: 5,
    maxTeamMembers: 5,
    modules: {
      registrations: true,
      manualPayments: true,
      donations: true,
      autoPayments: false,
      eventManagement: true,
      tasksAndTeam: true,
      reports: true,
      calculator: true,
    },
  },
  chalem: {
    name: 'Plano 4 - Chalém',
    label: 'Chalém · שָׁלֵם',
    description: 'Pagamentos automáticos via PIX, boleto e cartão. Gestão completa, inscritos ilimitados.',
    descriptionHebrew: 'Chalém (שָׁלֵם) significa "completo" ou "pleno" em hebraico — da mesma raiz de Shalom.',
    price: {
      monthly: 5,
      annual: 50,
      monthlyLabel: 'R$ 5/mês',
      annualMonthLabel: 'R$ 4,17/mês',
      annualTotalLabel: 'R$ 50/ano',
    },
    modulesCount: 4,
    limitsLabel: '10 eventos · inscritos ilimitados · 10 ingressos · 10 membros de equipe',
    maxActiveEvents: 10,
    maxAttendeesPerEvent: Infinity,
    maxTicketsPerEvent: 10,
    maxSalesPagesPerEvent: 10,
    maxTeamMembers: 10,
    modules: {
      registrations: true,
      manualPayments: true,
      donations: true,
      autoPayments: false,
      eventManagement: true,
      tasksAndTeam: true,
      reports: true,
      calculator: true,
    },
  },
};

// Compatibilidade com planos antigos armazenados no Firestore
const LEGACY_MAP: Record<string, PlanLevel> = {
  start: 'chinam',
  essencial: 'petach',
  pro: 'koach',
  personalizado: 'chalem',
};

export const getPlanConfig = (level?: PlanLevel | string | null): PlanConfig => {
  const normalized = (level ? (LEGACY_MAP[level] ?? level) : 'chinam') as PlanLevel;
  return PLAN_CONFIGS[normalized] ?? PLAN_CONFIGS.chinam;
};

export const PLAN_ORDER: PlanLevel[] = ['chinam', 'petach', 'koach', 'chalem'];

export const PLAN_RANK: Record<PlanLevel, number> = {
  chinam: 0, petach: 1, koach: 2, chalem: 3,
};
