import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Inscricao {
  id: string;
  nome?: string;
  email?: string;
  status: 'pendente' | 'pagamento_iniciado' | 'pago' | 'cancelada' | 'analise';
  valor_total: number;
  ticket_nome?: string;
  data_inscricao: string;
  presenca?: boolean;
}

export interface ResumoFinanceiro {
  totalArrecadado: number;
  totalPendente: number;
  totalInscritos: number;
  totalPresentes: number;
}

export function useFinanceiro(eventoId: string | null) {
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventoId) { setLoading(false); return; }
    setLoading(true);

    // inscricoes é subcoleção de eventos
    getDocs(collection(db, 'eventos', eventoId, 'inscricoes')).then((snap) => {
      setInscricoes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Inscricao)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [eventoId]);

  const resumo: ResumoFinanceiro = {
    totalArrecadado: inscricoes
      .filter((i) => i.status === 'pago')
      .reduce((acc, i) => acc + (i.valor_total ?? 0), 0),
    totalPendente: inscricoes
      .filter((i) => i.status === 'pendente' || i.status === 'pagamento_iniciado')
      .reduce((acc, i) => acc + (i.valor_total ?? 0), 0),
    totalInscritos: inscricoes.length,
    totalPresentes: inscricoes.filter((i) => i.presenca).length,
  };

  return { inscricoes, resumo, loading };
}
