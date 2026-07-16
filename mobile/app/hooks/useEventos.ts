import { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

export interface Evento {
  id: string;
  nome: string;
  data_inicio: string;
  data_fim: string;
  local: string;
  vagas_totais: number;
  ativo: boolean;
  imagem_url?: string;
  criado_por: string;
  equipeIds?: string[];
  descricao?: string;
  hora_inicio?: string;
  hora_fim?: string;
  cor_tema?: string;
}

export interface EventoComInscritos extends Evento {
  total_inscritos: number;
  codigo?: string;
}

function classify(evento: Evento): 'hoje' | 'proximo' | 'encerrado' {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const inicio = new Date(evento.data_inicio);
  const fim = new Date(evento.data_fim);

  if (inicio < amanha && fim >= hoje) return 'hoje';
  if (inicio >= amanha) return 'proximo';
  return 'encerrado';
}

async function contarInscritos(eventoId: string): Promise<number> {
  // inscricoes é subcoleção de eventos
  const snap = await getDocs(collection(db, 'eventos', eventoId, 'inscricoes'));
  return snap.size;
}

export function useEventos() {
  const { user } = useAuth();
  const [eventos, setEventos] = useState<EventoComInscritos[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const seen = new Map<string, Evento>();
    let ownerDone = false;
    let equipeDone = false;

    async function merge() {
      if (!ownerDone || !equipeDone) return;

      const list = Array.from(seen.values());
      const result = await Promise.all(
        list.map(async (ev) => ({
          ...ev,
          total_inscritos: await contarInscritos(ev.id),
        }))
      );
      setEventos(result);
      setLoading(false);
    }

    const qOwner = query(
      collection(db, 'eventos'),
      where('criado_por', '==', user.uid),
    );
    const qEquipe = query(
      collection(db, 'eventos'),
      where('equipeIds', 'array-contains', user.uid),
    );

    const unsubOwner = onSnapshot(qOwner, (snap) => {
      snap.docs.forEach((d) => seen.set(d.id, { id: d.id, ...d.data() } as Evento));
      ownerDone = true;
      merge();
    }, () => {
      ownerDone = true;
      merge();
    });

    const unsubEquipe = onSnapshot(qEquipe, (snap) => {
      snap.docs.forEach((d) => seen.set(d.id, { id: d.id, ...d.data() } as Evento));
      equipeDone = true;
      merge();
    }, () => {
      equipeDone = true;
      merge();
    });

    return () => { unsubOwner(); unsubEquipe(); };
  }, [user]);

  async function toggleAtivo(eventoId: string, novoValor: boolean) {
    await updateDoc(doc(db, 'eventos', eventoId), { ativo: novoValor });
    setEventos((prev) =>
      prev.map((e) => (e.id === eventoId ? { ...e, ativo: novoValor } : e))
    );
  }

  const hoje = eventos.filter((e) => classify(e) === 'hoje');
  const proximos = eventos.filter((e) => classify(e) === 'proximo');
  const encerrados = eventos.filter((e) => classify(e) === 'encerrado');

  return { hoje, proximos, encerrados, loading, toggleAtivo };
}
