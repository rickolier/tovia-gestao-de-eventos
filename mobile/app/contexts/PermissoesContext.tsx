import { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

export type Permissao = 'registrations' | 'management' | 'tasks' | 'checkin' | 'rooms';

interface PermissoesContextValue {
  loading: boolean;
  /** Usuário é dono de pelo menos um evento → acesso total */
  isOrganizador: boolean;
  /** União de todas as permissões em todos os eventos em que é membro */
  permissoes: Set<Permissao>;
  /** true se é apenas membro de equipe (não é dono de nenhum evento) */
  isMemberOnly: boolean;
  /** Helpers por aba */
  podeVerFinanceiro: boolean;
  podeVerTarefas: boolean;
  podeVerCheckin: boolean;
  podeVerInicio: boolean;
}

const defaultValue: PermissoesContextValue = {
  loading: true,
  isOrganizador: false,
  permissoes: new Set(),
  isMemberOnly: false,
  podeVerFinanceiro: true,
  podeVerTarefas: true,
  podeVerCheckin: true,
  podeVerInicio: true,
};

const PermissoesContext = createContext<PermissoesContextValue>(defaultValue);

export function PermissoesProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [value, setValue] = useState<PermissoesContextValue>(defaultValue);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setValue({ ...defaultValue, loading: false });
      return;
    }

    let doneDono = false;
    let doneMembro = false;
    let isDono = false;
    let permSet = new Set<Permissao>();

    function compute() {
      if (!doneDono || !doneMembro) return;

      const management = permSet.has('management');
      const isOrganizador = isDono;

      // management equivale a acesso total, assim como ser dono
      const fullAccess = isOrganizador || management;
      const isMemberOnly = !isOrganizador && permSet.size > 0;

      setValue({
        loading: false,
        isOrganizador,
        permissoes: permSet,
        isMemberOnly,
        podeVerInicio: fullAccess || !isMemberOnly,
        podeVerFinanceiro: fullAccess || permSet.has('registrations'),
        podeVerTarefas: fullAccess || permSet.has('tasks'),
        podeVerCheckin: fullAccess || permSet.has('checkin'),
      });
    }

    // 1) Verifica se é dono de algum evento
    const qDono = query(collection(db, 'eventos'), where('criado_por', '==', user.uid));
    const unsubDono = onSnapshot(qDono, (snap) => {
      isDono = !snap.empty;
      doneDono = true;
      compute();
    }, () => { doneDono = true; compute(); });

    // 2) Busca eventos em que é membro e coleta permissões
    const qMembro = query(collection(db, 'eventos'), where('equipeIds', 'array-contains', user.uid));
    const unsubMembro = onSnapshot(qMembro, (snap) => {
      const newPerm = new Set<Permissao>();
      snap.docs.forEach((d) => {
        const equipe: { userId: string; permissoes: Permissao[] }[] = d.data().equipe ?? [];
        const membro = equipe.find((m) => m.userId === user.uid);
        membro?.permissoes?.forEach((p) => newPerm.add(p));
      });
      permSet = newPerm;
      doneMembro = true;
      compute();
    }, () => { doneMembro = true; compute(); });

    return () => { unsubDono(); unsubMembro(); };
  }, [user, authLoading]);

  return (
    <PermissoesContext.Provider value={value}>
      {children}
    </PermissoesContext.Provider>
  );
}

export function usePermissoes() {
  return useContext(PermissoesContext);
}
