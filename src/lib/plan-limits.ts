import { PlanLevel } from '../types';

export interface PlanConfig {
  name: string;
  label: string;
  description: string;
  maxActiveEvents: number;
  maxAttendeesPerEvent: number;
  maxTicketsPerEvent: number;
  modules: {
    // Módulo 1 — Inscrições (todos os planos)
    registrations: boolean;
    // Módulo 2 — Financeiro (Plano B e C)
    manualPayments: boolean;
    donations: boolean;
    financeiroConfig: boolean;
    // Módulo 3 — Gestão do Evento (Plano C)
    eventManagement: boolean;
    tasksAndTeam: boolean;
    checkIn: boolean;
    // Sempre disponível
    reports: boolean;
  };
}

export const PLAN_CONFIGS: Record<PlanLevel, PlanConfig> = {
  // Plano A — apenas Inscrições
  start: {
    name: 'Plano A',
    label: 'Inscrições',
    description: 'Crie eventos e gerencie inscrições e participantes.',
    maxActiveEvents: 3,
    maxAttendeesPerEvent: 300,
    maxTicketsPerEvent: 5,
    modules: {
      registrations: true,
      manualPayments: false,
      donations: false,
      financeiroConfig: false,
      eventManagement: false,
      tasksAndTeam: false,
      checkIn: false,
      reports: true,
    },
  },
  // Plano B — Inscrições + Financeiro
  essencial: {
    name: 'Plano B',
    label: 'Inscrições + Financeiro',
    description: 'Tudo do Plano A mais controle financeiro, pagamentos e doações.',
    maxActiveEvents: 10,
    maxAttendeesPerEvent: 1000,
    maxTicketsPerEvent: 10,
    modules: {
      registrations: true,
      manualPayments: true,
      donations: true,
      financeiroConfig: true,
      eventManagement: false,
      tasksAndTeam: false,
      checkIn: false,
      reports: true,
    },
  },
  // Plano C — Inscrições + Financeiro + Gestão do Evento
  pro: {
    name: 'Plano C',
    label: 'Inscrições + Financeiro + Gestão',
    description: 'Acesso completo: inscrições, financeiro, recursos, grupos e tarefas.',
    maxActiveEvents: 9999,
    maxAttendeesPerEvent: 9999,
    maxTicketsPerEvent: 9999,
    modules: {
      registrations: true,
      manualPayments: true,
      donations: true,
      financeiroConfig: true,
      eventManagement: true,
      tasksAndTeam: true,
      checkIn: true,
      reports: true,
    },
  },
};

export const getPlanConfig = (level: PlanLevel = 'pro'): PlanConfig => {
  return PLAN_CONFIGS[level] || PLAN_CONFIGS.pro;
};
