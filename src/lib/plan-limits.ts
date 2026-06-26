import { PlanLevel } from '../types';

interface PlanConfig {
  name: string;
  label: string;
  description: string;
  maxActiveEvents: number;
  maxAttendeesPerEvent: number;
  maxTicketsPerEvent: number;
  maxFreeAttendeesTotal?: number;
  modules: {
    // Módulo 1 — Inscrições (todos os planos)
    registrations: boolean;
    // Módulo 2 — Financeiro Manual (Essencial+)
    manualPayments: boolean;
    donations: boolean;
    financeiroConfig: boolean;
    // Módulo 3 — Pagamentos Automáticos via gateway (Pro)
    autoPayments: boolean;
    // Módulo 4 — Gestão do Evento: recursos, tarefas, equipe (Pro)
    eventManagement: boolean;
    tasksAndTeam: boolean;
    // Sempre disponível
    reports: boolean;
  };
}

export const PLAN_CONFIGS: Record<PlanLevel, PlanConfig> = {
  start: {
    name: 'Start',
    label: 'Inscrições',
    description: 'Crie eventos e gerencie inscrições e participantes gratuitamente.',
    maxActiveEvents: 1,
    maxAttendeesPerEvent: 200,
    maxTicketsPerEvent: 1,
    modules: {
      registrations: true,
      manualPayments: false,
      donations: false,
      financeiroConfig: false,
      autoPayments: false,
      eventManagement: false,
      tasksAndTeam: false,
      reports: true,
    },
  },
  essencial: {
    name: 'Essencial',
    label: 'Inscrições + Financeiro Manual',
    description: 'Gerencie inscrições e controle financeiro manualmente: registre pagamentos, doações e acompanhe o saldo de cada participante.',
    maxActiveEvents: 3,
    maxAttendeesPerEvent: 500,
    maxTicketsPerEvent: 3,
    modules: {
      registrations: true,
      manualPayments: true,
      donations: true,
      financeiroConfig: true,
      autoPayments: false,
      eventManagement: false,
      tasksAndTeam: false,
      reports: true,
    },
  },
  pro: {
    name: 'Pro',
    label: 'Pagamentos Automáticos + Gestão Completa',
    description: 'Checkout online, pagamentos automáticos via PIX, boleto e cartão, gestão de recursos, tarefas e equipe.',
    maxActiveEvents: 10,
    maxAttendeesPerEvent: 1000,
    maxTicketsPerEvent: 10,
    modules: {
      registrations: true,
      manualPayments: true,
      donations: true,
      financeiroConfig: true,
      autoPayments: true,
      eventManagement: true,
      tasksAndTeam: true,
      reports: true,
    },
  },
  personalizado: {
    name: 'Personalizado',
    label: 'Ilimitado + Pagamentos Automáticos',
    description: 'Todos os módulos sem limite de eventos ou inscritos pagos. Eventos gratuitos limitados a 10.000 inscritos por evento.',
    maxActiveEvents: Infinity,
    maxAttendeesPerEvent: Infinity,
    maxTicketsPerEvent: Infinity,
    maxFreeAttendeesTotal: 10000,
    modules: {
      registrations: true,
      manualPayments: true,
      donations: true,
      financeiroConfig: true,
      autoPayments: true,
      eventManagement: true,
      tasksAndTeam: true,
      reports: true,
    },
  },
};

export const getPlanConfig = (level: PlanLevel = 'pro'): PlanConfig => {
  return PLAN_CONFIGS[level] || PLAN_CONFIGS.pro;
};
