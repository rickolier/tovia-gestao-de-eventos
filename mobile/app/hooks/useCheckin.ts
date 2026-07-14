import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
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

export function useCheckin(eventoId: string | null) {
  const [inscritos, setInscritos] = useState<InscritoCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventoId) { setLoading(false); return; }

    // inscricoes é subcoleção de eventos
    return onSnapshot(
      collection(db, 'eventos', eventoId, 'inscricoes'),
      (snap) => {
        setInscritos(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as InscritoCheckin))
            .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'))
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [eventoId]);

  async function marcarPresenca(inscricaoId: string, presente: boolean) {
    await updateDoc(
      doc(db, 'eventos', eventoId!, 'inscricoes', inscricaoId),
      { presenca: presente, checkin_at: presente ? new Date().toISOString() : null }
    );
  }

  const presentes = inscritos.filter((i) => i.presenca).length;

  return { inscritos, presentes, total: inscritos.length, loading, marcarPresenca };
}
