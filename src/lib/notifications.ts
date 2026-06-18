import { getDocument, createDocument } from './firebase-utils';
import { AppNotification } from '../types';

export async function notifOnce(id: string, data: Omit<AppNotification, 'id'>): Promise<void> {
  const existing = await getDocument<AppNotification>('notificacoes', id);
  if (existing) return;
  await createDocument('notificacoes', id, { ...data, id } as AppNotification);
}

// Creates notification if missing OR if already read (re-surfaces actionable reminders)
export async function notifIfReadOrMissing(id: string, data: Omit<AppNotification, 'id'>): Promise<void> {
  const existing = await getDocument<AppNotification>('notificacoes', id);
  if (existing && !existing.lida) return;
  await createDocument('notificacoes', id, { ...data, id } as AppNotification);
}
