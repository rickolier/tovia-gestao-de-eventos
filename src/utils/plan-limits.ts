import { PlanLevel } from '../types';

export interface PlanPrice {
  monthly: number;
  annual: number;
  monthlyLabel: string;
  annualMonthLabel: string;
  annualTotalLabel: string;
}

export interface PlanConfig {
  name: string;
  label: string;
  description: string;
  descriptionHebrew: string;
  price: PlanPrice;
  modulesCount: number;
  limitsLabel: string;
  maxActiveEvents: number;
  maxAttendeesPerEvent: number;
  maxTicketsPerEvent: number;
  maxSalesPagesPerEvent: number;
  maxTeamMembers: number;
  maxComunicadosPerEvent: number;
  maxEmailsPerMonth: number;
  byog: boolean;
  allowExtraCredits: boolean;
  extraCreditPrice: number;
  legacy?: boolean;
  modules: {
    registrations: boolean;
    manualPayments: boolean;
    donations: boolean;
    autoPayments: boolean;
    eventManagement: boolean;
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
    limitsLabel: '2 eventos · até 100 vagas · 3 membros de equipe',
    maxActiveEvents: 2,
    maxAttendeesPerEvent: 100,
    maxTicketsPerEvent: 3,
    maxSalesPagesPerEvent: 1,
    maxTeamMembers: 3,
    maxComunicadosPerEvent: 1,
    maxEmailsPerMonth: 2000,
    byog: false,
    allowExtraCredits: false,
    extraCreditPrice: 0,
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
    description: 'BYOG + equipe + gestão completa. A porta de entrada para eventos profissionais.',
    descriptionHebrew: 'Pétach (פֶּתַח) significa "abertura" ou "portal" em hebraico.',
    price: {
      monthly: 119,
      annual: 1190,
      monthlyLabel: 'R$ 119/mês',
      annualMonthLabel: 'R$ 99,17/mês',
      annualTotalLabel: 'R$ 1.190/ano',
    },
    modulesCount: 3,
    limitsLabel: '5 eventos · até 300 vagas · 10 membros de equipe',
    maxActiveEvents: 5,
    maxAttendeesPerEvent: 300,
    maxTicketsPerEvent: 5,
    maxSalesPagesPerEvent: 5,
    maxTeamMembers: 10,
    maxComunicadosPerEvent: 1,
    maxEmailsPerMonth: 15000,
    byog: true,
    allowExtraCredits: true,
    extraCreditPrice: 199,
    modules: {
      registrations: true,
      manualPayments: true,
      donations: true,
      autoPayments: true,
      eventManagement: true,
      tasksAndTeam: true,
      reports: true,
      calculator: true,
    },
  },
  koach: {
    name: 'Plano 2 - Pétach',
    label: 'Pétach · פֶּתַח',
    description: 'BYOG + equipe + gestão completa. A porta de entrada para eventos profissionais.',
    descriptionHebrew: 'Pétach (פֶּתַח) significa "abertura" ou "portal" em hebraico.',
    legacy: true,
    price: {
      monthly: 119,
      annual: 1190,
      monthlyLabel: 'R$ 119/mês',
      annualMonthLabel: 'R$ 99,17/mês',
      annualTotalLabel: 'R$ 1.190/ano',
    },
    modulesCount: 3,
    limitsLabel: '5 eventos · até 300 vagas · 10 membros de equipe',
    maxActiveEvents: 5,
    maxAttendeesPerEvent: 300,
    maxTicketsPerEvent: 5,
    maxSalesPagesPerEvent: 5,
    maxTeamMembers: 10,
    maxComunicadosPerEvent: 1,
    maxEmailsPerMonth: 15000,
    byog: true,
    allowExtraCredits: true,
    extraCreditPrice: 199,
    modules: {
      registrations: true,
      manualPayments: true,
      donations: true,
      autoPayments: true,
      eventManagement: true,
      tasksAndTeam: true,
      reports: true,
      calculator: true,
    },
  },
  chalem: {
    name: 'Plano 3 - Chalém',
    label: 'Chalém · שָׁלֵם',
    description: 'Pagamentos automáticos, equipe grande e volume alto. Gestão completa para eventos de grande porte.',
    descriptionHebrew: 'Chalém (שָׁלֵם) significa "completo" ou "pleno" em hebraico — da mesma raiz de Shalom.',
    price: {
      monthly: 299,
      annual: 2990,
      monthlyLabel: 'R$ 299/mês',
      annualMonthLabel: 'R$ 249,17/mês',
      annualTotalLabel: 'R$ 2.990/ano',
    },
    modulesCount: 4,
    limitsLabel: '15 eventos · até 600 vagas · 30 membros de equipe',
    maxActiveEvents: 15,
    maxAttendeesPerEvent: 600,
    maxTicketsPerEvent: 10,
    maxSalesPagesPerEvent: 10,
    maxTeamMembers: 30,
    maxComunicadosPerEvent: 1,
    maxEmailsPerMonth: 50000,
    byog: true,
    allowExtraCredits: true,
    extraCreditPrice: 199,
    modules: {
      registrations: true,
      manualPayments: true,
      donations: true,
      autoPayments: true,
      eventManagement: true,
      tasksAndTeam: true,
      reports: true,
      calculator: true,
    },
  },
};

const LEGACY_MAP: Record<string, PlanLevel> = {
  start: 'chinam',
  essencial: 'petach',
  pro: 'petach',
  personalizado: 'chalem',
};

export const getPlanConfig = (level?: PlanLevel | string | null): PlanConfig => {
  const normalized = (level ? (LEGACY_MAP[level] ?? level) : 'chinam') as PlanLevel;
  return PLAN_CONFIGS[normalized] ?? PLAN_CONFIGS.chinam;
};

export const PLAN_ORDER: PlanLevel[] = ['chinam', 'petach', 'koach', 'chalem'];

export const VISIBLE_PLAN_ORDER: PlanLevel[] = ['chinam', 'petach', 'chalem'];

export const PLAN_RANK: Record<PlanLevel, number> = {
  chinam: 0, petach: 1, koach: 2, chalem: 3,
};
