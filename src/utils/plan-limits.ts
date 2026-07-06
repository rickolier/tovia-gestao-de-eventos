import { PlanLevel } from '../types';

interface PlanConfig {
  name: string;
  label: string;
  description: string;
  descriptionHebrew: string;
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
    eventManagement: boolean;  // recursos, grupos, tarefas — como dono
    tasksAndTeam: boolean;
    reports: boolean;
    calculator: boolean;
  };
}

export const PLAN_CONFIGS: Record<PlanLevel, PlanConfig> = {
  chinam: {
    name: 'Plano 1 - Chinám',
    label: 'Chinám · חינם',
    description: 'Gratuito. Comece a organizar seu primeiro evento sem custo.',
    descriptionHebrew: 'Chinám (חינם) significa "gratuito" em hebraico.',
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
    maxActiveEvents: 10,
    maxAttendeesPerEvent: Infinity,
    maxTicketsPerEvent: 10,
    maxSalesPagesPerEvent: 10,
    maxTeamMembers: 10,
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

export const PLAN_RANK: Record<PlanLevel, number> = {
  chinam: 0, petach: 1, koach: 2, chalem: 3,
};
