import { useState, useEffect } from 'react';
import {
  collection, onSnapshot,
  doc, updateDoc, addDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type TaskStatus = 'pendente' | 'em_progresso' | 'concluida' | 'atrasada';

export interface Tarefa {
  id: string;
  eventoId: string;
  titulo: string;
  descricao: string;
  responsavel: string;
  dataLimite: string;
  status: TaskStatus;
  prioridade: 'baixa' | 'media' | 'alta';
  dataCriacao: string;
}

export function useTarefas(eventoId: string | null) {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventoId) { setLoading(false); return; }

    // tarefas é subcoleção de eventos (path: eventos/{id}/tarefas)
    return onSnapshot(
      collection(db, 'eventos', eventoId, 'tarefas'),
      (snap) => {
        setTarefas(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Tarefa)));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [eventoId]);

  async function toggleConcluida(tarefa: Tarefa) {
    const novoStatus: TaskStatus = tarefa.status === 'concluida' ? 'pendente' : 'concluida';
    await updateDoc(doc(db, 'eventos', eventoId!, 'tarefas', tarefa.id), { status: novoStatus });
  }

  async function mudarStatus(tarefa: Tarefa, novoStatus: TaskStatus) {
    if (tarefa.status === novoStatus) return;
    await updateDoc(doc(db, 'eventos', eventoId!, 'tarefas', tarefa.id), { status: novoStatus });
  }

  async function criarTarefa(dados: Omit<Tarefa, 'id' | 'dataCriacao'>) {
    await addDoc(collection(db, 'eventos', eventoId!, 'tarefas'), {
      ...dados,
      dataCriacao: new Date().toISOString(),
    });
  }

  return { tarefas, loading, toggleConcluida, mudarStatus, criarTarefa };
}
