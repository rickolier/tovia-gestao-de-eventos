import { PlanLevel } from '../types';

export interface PlanConfig {
  name: string;
  maxActiveEvents: number;
  maxAttendeesPerEvent: number;
  maxTicketsPerEvent: number;
  modules: {
    registrations: boolean;
    manualPayments: boolean;
    automaticPayments: boolean;
    reports: boolean;
    eventManagement: boolean;
    tasksAndTeam: boolean;
    donations: boolean;
    checkIn: boolean;
    teamManagement: boolean;
  };
  features: {
    customFormLimit: number;
    revenuePerTicket: boolean;
    netValue: boolean;
    costPerAttendee: boolean;
    marginPerAttendee: boolean;
    kanban: boolean;
    schedule: boolean;
    teamInvites: boolean;
    teamAccess: boolean;
  };
}

export const PLAN_CONFIGS: Record<PlanLevel, PlanConfig> = {
  start: {
    name: 'Start (Gratuito)',
    maxActiveEvents: 1,
    maxAttendeesPerEvent: 100,
    maxTicketsPerEvent: 2,
    modules: {
      registrations: true,
      manualPayments: true,
      automaticPayments: false,
      reports: true,
      eventManagement: false,
      tasksAndTeam: false,
      donations: false,
      checkIn: false,
      teamManagement: false,
    },
    features: {
      customFormLimit: 10,
      revenuePerTicket: false,
      netValue: false,
      costPerAttendee: false,
      marginPerAttendee: false,
      kanban: false,
      schedule: false,
      teamInvites: false,
      teamAccess: false,
    }
  },
  essencial: {
    name: 'Essencial',
    maxActiveEvents: 3,
    maxAttendeesPerEvent: 200,
    maxTicketsPerEvent: 5,
    modules: {
      registrations: true,
      manualPayments: true,
      automaticPayments: true,
      reports: true,
      eventManagement: true,
      tasksAndTeam: true,
      donations: true,
      checkIn: true,
      teamManagement: false,
    },
    features: {
      customFormLimit: 10, // Assuming 10 is standard max for now
      revenuePerTicket: true,
      netValue: true,
      costPerAttendee: true,
      marginPerAttendee: true,
      kanban: true,
      schedule: true,
      teamInvites: false,
      teamAccess: false,
    }
  },
  pro: {
    name: 'Pro',
    maxActiveEvents: 10,
    maxAttendeesPerEvent: 1000,
    maxTicketsPerEvent: 10,
    modules: {
      registrations: true,
      manualPayments: true,
      automaticPayments: true,
      reports: true,
      eventManagement: true,
      tasksAndTeam: true,
      donations: true,
      checkIn: true,
      teamManagement: true,
    },
    features: {
      customFormLimit: 10,
      revenuePerTicket: true,
      netValue: true,
      costPerAttendee: true,
      marginPerAttendee: true,
      kanban: true,
      schedule: true,
      teamInvites: true,
      teamAccess: true,
    }
  }
};

export const getPlanConfig = (level: PlanLevel = 'pro'): PlanConfig => {
  return PLAN_CONFIGS[level] || PLAN_CONFIGS.pro;
};
