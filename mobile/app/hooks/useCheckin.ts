import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { db } from '../lib/firebase';

export interface InscritoCheckin {
  id: string;
  nome?: string;
  email?: string;
  status: string;
  presenca: boolean;
  checkin_at?: string;
  ticket_nome?: string;
}

interface QueueItem {
  inscricaoId: string;
  presente: boolean;
  at: string;
}

function cacheKey(eventoId: string) { return `checkin_cache_${eventoId}`; }
function queueKey(eventoId: string) { return `checkin_queue_${eventoId}`; }
function syncedAtKey(eventoId: string) { return `checkin_synced_at_${eventoId}`; }

async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch {
    return false;
  }
}

async function loadCache(eventoId: string): Promise<InscritoCheckin[] | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(eventoId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function saveCache(eventoId: string, data: InscritoCheckin[]) {
  try {
    await AsyncStorage.setItem(cacheKey(eventoId), JSON.stringify(data));
    await AsyncStorage.setItem(syncedAtKey(eventoId), new Date().toISOString());
  } catch {}
}

async function loadQueue(eventoId: string): Promise<QueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(queueKey(eventoId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(eventoId: string, queue: QueueItem[]) {
  try {
    await AsyncStorage.setItem(queueKey(eventoId), JSON.stringify(queue));
  } catch {}
}

export async function getSyncedAt(eventoId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(syncedAtKey(eventoId));
  } catch {
    return null;
  }
}

export function useCheckin(eventoId: string | null) {
  const [inscritos, setInscritos] = useState<InscritoCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);

  const inscritosRef = useRef<InscritoCheckin[]>([]);
  inscritosRef.current = inscritos;

  // Sincroniza fila pendente com Firestore
  const flushQueue = useCallback(async () => {
    if (!eventoId) return;
    const queue = await loadQueue(eventoId);
    if (queue.length === 0) return;

    const online = await isOnline();
    if (!online) return;

    const remaining: QueueItem[] = [];
    for (const item of queue) {
      try {
        await updateDoc(
          doc(db, 'eventos', eventoId, 'inscricoes', item.inscricaoId),
          { presenca: item.presente, checkin_at: item.presente ? item.at : null }
        );
      } catch {
        remaining.push(item);
      }
    }
    await saveQueue(eventoId, remaining);
    setPendingSync(remaining.length);
  }, [eventoId]);

  // Download explícito da lista para uso offline
  const downloadOffline = useCallback(async (): Promise<boolean> => {
    if (!eventoId) return false;
    try {
      const snap = await getDocs(collection(db, 'eventos', eventoId, 'inscricoes'));
      const lista: InscritoCheckin[] = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as InscritoCheckin))
        .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'));
      await saveCache(eventoId, lista);
      setSyncedAt(new Date().toISOString());
      setInscritos(lista);
      return true;
    } catch {
      return false;
    }
  }, [eventoId]);

  useEffect(() => {
    if (!eventoId) { setLoading(false); return; }

    let unsubscribe: (() => void) | null = null;

    async function init() {
      const online = await isOnline();

      // Carrega cache para exibição imediata
      const cached = await loadCache(eventoId!);
      if (cached) {
        setInscritos(cached);
        const at = await getSyncedAt(eventoId!);
        setSyncedAt(at);
      }

      const queue = await loadQueue(eventoId!);
      setPendingSync(queue.length);

      if (!online) {
        setOffline(true);
        setLoading(false);
        return;
      }

      // Tenta Firestore em tempo real
      unsubscribe = onSnapshot(
        collection(db, 'eventos', eventoId!, 'inscricoes'),
        async (snap) => {
          const lista: InscritoCheckin[] = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as InscritoCheckin))
            .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'));

          // Aplica fila pendente por cima dos dados do servidor
          const localQueue = await loadQueue(eventoId!);
          for (const item of localQueue) {
            const idx = lista.findIndex((i) => i.id === item.inscricaoId);
            if (idx >= 0) lista[idx] = { ...lista[idx], presenca: item.presente, checkin_at: item.at };
          }

          setInscritos(lista);
          setOffline(false);
          await saveCache(eventoId!, lista);
          setSyncedAt(new Date().toISOString());
          setLoading(false);

          // Aproveita conexão para sincronizar fila
          await flushQueue();
        },
        () => {
          // Firestore falhou — usa cache
          setOffline(true);
          setLoading(false);
        }
      );
    }

    init();
    return () => unsubscribe?.();
  }, [eventoId]);

  async function marcarPresenca(inscricaoId: string, presente: boolean) {
    const at = new Date().toISOString();

    // Atualiza estado local imediatamente
    setInscritos((prev) => {
      const next = prev.map((i) =>
        i.id === inscricaoId ? { ...i, presenca: presente, checkin_at: presente ? at : undefined } : i
      );
      // Atualiza cache com novo estado
      if (eventoId) saveCache(eventoId, next);
      return next;
    });

    const online = await isOnline();
    if (online) {
      try {
        await updateDoc(
          doc(db, 'eventos', eventoId!, 'inscricoes', inscricaoId),
          { presenca: presente, checkin_at: presente ? at : null }
        );
        return;
      } catch {}
    }

    // Offline ou falha: enfileira
    const queue = await loadQueue(eventoId!);
    const idx = queue.findIndex((q) => q.inscricaoId === inscricaoId);
    if (idx >= 0) queue[idx] = { inscricaoId, presente, at };
    else queue.push({ inscricaoId, presente, at });
    await saveQueue(eventoId!, queue);
    setPendingSync(queue.length);
  }

  const presentes = inscritos.filter((i) => i.presenca).length;

  return {
    inscritos,
    presentes,
    total: inscritos.length,
    loading,
    offline,
    pendingSync,
    syncedAt,
    marcarPresenca,
    downloadOffline,
    flushQueue,
  };
}
