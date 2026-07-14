import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'notif_settings_v1';

export interface CustomNotif {
  id: string;
  message: string;
  scheduledAt: string; // ISO string
  eventoNome?: string;
}

export interface NotifSettings {
  eventReminder: { enabled: boolean; hoursBefore: number };
  offlineReminder: { enabled: boolean };
  custom: CustomNotif[];
}

const DEFAULT_SETTINGS: NotifSettings = {
  eventReminder: { enabled: true, hoursBefore: 2 },
  offlineReminder: { enabled: true },
  custom: [],
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotifPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleEventReminder(
  eventoId: string,
  eventoNome: string,
  dataInicio: Date,
  hoursBefore: number,
): Promise<string | null> {
  const triggerDate = new Date(dataInicio.getTime() - hoursBefore * 60 * 60 * 1000);
  if (triggerDate <= new Date()) return null;

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Seu evento começa em breve',
        body: `${eventoNome} começa em ${hoursBefore === 1 ? '1 hora' : `${hoursBefore} horas`}. Tudo pronto?`,
        data: { eventoId, type: 'event_reminder' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
  } catch {
    return null;
  }
}

export async function scheduleOfflineReminder(
  eventoId: string,
  eventoNome: string,
  dataInicio: Date,
): Promise<string | null> {
  const triggerDate = new Date(dataInicio.getTime() - 24 * 60 * 60 * 1000);
  if (triggerDate <= new Date()) return null;

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Prepare o check-in offline',
        body: `${eventoNome} começa amanhã. Baixe a lista de inscritos para usar sem internet.`,
        data: { eventoId, type: 'offline_reminder' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
  } catch {
    return null;
  }
}

export function useNotifications() {
  const [settings, setSettings] = useState<NotifSettings>(DEFAULT_SETTINGS);
  const [permGranted, setPermGranted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { status } = await Notifications.getPermissionsAsync();
      setPermGranted(status === 'granted');

      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        try { setSettings(JSON.parse(raw)); } catch {}
      }
      setLoading(false);
    }
    init();
  }, []);

  const save = useCallback(async (next: NotifSettings) => {
    setSettings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotifPermission();
    setPermGranted(granted);
    return granted;
  }, []);

  const updateEventReminder = useCallback(async (patch: Partial<NotifSettings['eventReminder']>) => {
    const next = { ...settings, eventReminder: { ...settings.eventReminder, ...patch } };
    await save(next);
  }, [settings, save]);

  const updateOfflineReminder = useCallback(async (enabled: boolean) => {
    const next = { ...settings, offlineReminder: { enabled } };
    await save(next);
  }, [settings, save]);

  const addCustom = useCallback(async (notif: Omit<CustomNotif, 'id'>) => {
    const id = Date.now().toString();
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title: 'Tovia',
          body: notif.message,
          data: { type: 'custom' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(notif.scheduledAt) },
      });
    } catch {}
    const next = { ...settings, custom: [...settings.custom, { ...notif, id }] };
    await save(next);
  }, [settings, save]);

  const removeCustom = useCallback(async (id: string) => {
    try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
    const next = { ...settings, custom: settings.custom.filter((c) => c.id !== id) };
    await save(next);
  }, [settings, save]);

  return {
    settings,
    permGranted,
    loading,
    requestPermission,
    updateEventReminder,
    updateOfflineReminder,
    addCustom,
    removeCustom,
  };
}
