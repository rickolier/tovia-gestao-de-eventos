import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { listDocuments, createDocument, removeDocument, subscribeToDocuments, updateDocument } from '~/services/firestore';
import { limit } from 'firebase/firestore';
import { Quarto, Inscricao, Pessoa, PaginaVenda } from '~/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// ─── Tipos ───────────────────────────────────────────────────────────────────
export interface Divisao {
  id: string;
  nome: string;
  tipoGrupoKey: string;
  customTipoSingular?: string;
  customTipoPlural?: string;
  customTipoMembros?: string;
  ordem: number;
  criado_em: string;
}

type Reg = Inscricao & { pessoa?: Pessoa };

type CriterioFieldDef = {
  value: string;
  label: string;
  getVal: (reg: Reg) => string | undefined;
};

export const TIPOS_GRUPO = [
  { value: 'grupo',    singular: 'Grupo',    plural: 'Grupos',    membros: 'Membros' },
  { value: 'quarto',   singular: 'Quarto',   plural: 'Quartos',   membros: 'Hóspedes' },
  { value: 'mesa',     singular: 'Mesa',     plural: 'Mesas',     membros: 'Participantes' },
  { value: 'equipe',   singular: 'Equipe',   plural: 'Equipes',   membros: 'Integrantes' },
  { value: 'dinamica', singular: 'Dinâmica', plural: 'Dinâmicas', membros: 'Participantes' },
  { value: 'custom',   singular: '',         plural: '',          membros: '' },
];

export const LIMITE_DIVISOES = 10;

export function getLabelForDivisao(div: Divisao | null) {
  if (!div) return { singular: 'Grupo', plural: 'Grupos', membros: 'Membros' };
  const tipo = TIPOS_GRUPO.find(t => t.value === div.tipoGrupoKey) ?? TIPOS_GRUPO[0];
  return {
    singular: div.tipoGrupoKey === 'custom' ? (div.customTipoSingular || 'Grupo')  : tipo.singular,
    plural:   div.tipoGrupoKey === 'custom' ? (div.customTipoPlural   || 'Grupos') : tipo.plural,
    membros:  div.tipoGrupoKey === 'custom' ? (div.customTipoMembros  || 'Membros'): tipo.membros,
  };
}

export const emptyNovaDivisao = () => ({
  nome: '', tipoGrupoKey: 'grupo',
  customTipoSingular: '', customTipoPlural: '', customTipoMembros: '',
});

const emptyForm = () => ({
  nome: '', numero: '', vagas: 4,
  criterioField: '', criterioValue: '',
  hospedes: [] as string[], responsaveis: [] as string[],
});

export function useRooms(eventoId: string) {
  const [divisoes, setDivisoes]             = useState<Divisao[]>([]);
  const [divisoesLoaded, setDivisoesLoaded] = useState(false);
  const [activeDivisaoId, setActiveDivisaoId] = useState<string | null>(null);

  const [rooms, setRooms]               = useState<Quarto[]>([]);
  const [registrations, setRegistrations] = useState<Reg[]>([]);
  const [formCampos, setFormCampos]     = useState<Array<{ id: string; label: string; tipo: string }>>([]);

  const [viewMode, setViewMode]   = useState<'grid' | 'list'>('grid');
  const [filterText, setFilterText] = useState('');

  const [isDialogOpen, setIsDialogOpen]                     = useState(false);
  const [isAutoConfigOpen, setIsAutoConfigOpen]             = useState(false);
  const [isDeleteRoomDialogOpen, setIsDeleteRoomDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete]                     = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId]                   = useState<string | null>(null);
  const [isNovaDivisaoOpen, setIsNovaDivisaoOpen]           = useState(false);
  const [isDeleteDivisaoOpen, setIsDeleteDivisaoOpen]       = useState(false);
  const [isRenameDivisaoOpen, setIsRenameDivisaoOpen]       = useState(false);
  const [renameValue, setRenameValue]                       = useState('');

  const [novaDivisaoForm, setNovaDivisaoForm] = useState(emptyNovaDivisao());
  const [form, setForm]                       = useState(emptyForm());
  const [autoConfig, setAutoConfig]           = useState({
    quantidade: 5, vagas: 4, criterio: 'ticket_nome',
    prefixoNome: '', lideresIds: [] as string[],
  });

  // ── Computed ──────────────────────────────────────────────────────────────
  const sortedDivisoes = useMemo(() => [...divisoes].sort((a, b) => a.ordem - b.ordem), [divisoes]);
  const activeDivisao  = useMemo(() => sortedDivisoes.find(d => d.id === activeDivisaoId) ?? sortedDivisoes[0] ?? null, [sortedDivisoes, activeDivisaoId]);
  const label          = useMemo(() => getLabelForDivisao(activeDivisao), [activeDivisao]);
  const firstDivisaoId = sortedDivisoes[0]?.id;

  const divisaoRooms = useMemo(() => {
    if (!activeDivisao) return [];
    const isFirst = activeDivisao.id === firstDivisaoId;
    return rooms.filter(r => r.divisaoId === activeDivisao.id || (isFirst && !r.divisaoId));
  }, [rooms, activeDivisao, firstDivisaoId]);

  const filteredRooms = useMemo(() => {
    if (!filterText.trim()) return divisaoRooms;
    const q = filterText.toLowerCase();
    return divisaoRooms.filter(r => r.nome.toLowerCase().includes(q) || (r.numero || '').toLowerCase().includes(q));
  }, [divisaoRooms, filterText]);

  const allocatedIds    = divisaoRooms.flatMap(r => r.hospedes || []);
  const unallocatedRegs = registrations.filter(r => !allocatedIds.includes(r.id));

  const criterioFields = useMemo<CriterioFieldDef[]>(() => [
    { value: 'ticket_nome', label: 'Tipo de Ingresso', getVal: (reg) => reg.ticket_nome },
    ...formCampos.map(c => ({
      value: c.id, label: c.label,
      getVal: (reg: Reg) => {
        const v = reg.respostas_formulario?.[c.id];
        if (v === undefined || v === null || v === '') return undefined;
        if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
        return String(v);
      },
    })),
  ], [formCampos]);

  const criterioFieldDef = criterioFields.find(f => f.value === form.criterioField);

  const criterioValues = useMemo(() => {
    if (!criterioFieldDef) return [];
    const seen = new Set<string>();
    registrations.forEach(r => { const v = criterioFieldDef.getVal(r); if (v) seen.add(v); });
    return Array.from(seen).sort();
  }, [form.criterioField, registrations]);

  const filteredRegs = useMemo(() => {
    const available = registrations.filter(r => {
      const alreadyElsewhere = allocatedIds.includes(r.id) && !form.hospedes.includes(r.id);
      return !alreadyElsewhere;
    });
    if (!criterioFieldDef || !form.criterioValue) return available;
    return available.filter(r => criterioFieldDef.getVal(r) === form.criterioValue);
  }, [form.criterioField, form.criterioValue, form.hospedes, registrations, allocatedIds]);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    listDocuments<PaginaVenda>(`eventos/${eventoId}/paginas_venda`)
      .then(paginas => {
        const seen = new Set<string>();
        const campos: Array<{ id: string; label: string; tipo: string }> = [];
        paginas.forEach(p => {
          (p.campos_formulario ?? []).forEach(c => {
            if (!seen.has(c.id) && !['texto', 'email', 'telefone', 'textarea'].includes(c.tipo)) {
              seen.add(c.id);
              campos.push({ id: c.id, label: c.label, tipo: c.tipo });
            }
          });
        });
        setFormCampos(campos);
      })
      .catch(() => {});
  }, [eventoId]);

  useEffect(() => {
    const unsub = subscribeToDocuments<Divisao>(
      `eventos/${eventoId}/divisoes`, [],
      (docs) => { setDivisoes(docs); setDivisoesLoaded(true); }
    );
    return () => unsub();
  }, [eventoId]);

  useEffect(() => {
    if (!divisoesLoaded || divisoes.length > 0) return;
    const id = uuidv4();
    createDocument(`eventos/${eventoId}/divisoes`, id, {
      id, nome: 'Grupos', tipoGrupoKey: 'grupo', ordem: 0,
      criado_em: new Date().toISOString(),
    });
  }, [divisoesLoaded, divisoes.length, eventoId]);

  useEffect(() => {
    const unsub = subscribeToDocuments<Quarto>(`eventos/${eventoId}/quartos`, [], setRooms);
    const fetchRegs = async () => {
      try {
        const [regData, peopleData] = await Promise.all([
          listDocuments<Inscricao>(`eventos/${eventoId}/inscricoes`, [limit(500)]),
          listDocuments<Pessoa>(`eventos/${eventoId}/pessoas`),
        ]);
        const enriched = regData
          .filter(r => r.status === 'pago' || r.validada_manual)
          .map(reg => ({ ...reg, pessoa: peopleData.find(p => p.id === reg.pessoaId) }));
        setRegistrations(enriched);
      } catch { toast.error('Erro ao carregar lista de inscritos'); }
    };
    fetchRegs();
    return () => unsub();
  }, [eventoId]);

  useEffect(() => {
    setAutoConfig(prev => ({ ...prev, prefixoNome: label.singular }));
  }, [activeDivisao?.id, label.singular]);

  useEffect(() => {
    if (!form.criterioField || !form.criterioValue || !criterioFieldDef) return;
    const matchingIds = filteredRegs
      .filter(r => criterioFieldDef.getVal(r) === form.criterioValue)
      .map(r => r.id);
    setForm(prev => ({ ...prev, hospedes: matchingIds }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.criterioValue]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateDivisao = async () => {
    if (!novaDivisaoForm.nome.trim()) { toast.error('Nome da divisão é obrigatório'); return; }
    if (divisoes.length >= LIMITE_DIVISOES) { toast.error(`Limite de ${LIMITE_DIVISOES} abas atingido.`); return; }
    const id = uuidv4();
    const data: Divisao = {
      id, nome: novaDivisaoForm.nome.trim(), tipoGrupoKey: novaDivisaoForm.tipoGrupoKey,
      ordem: divisoes.length, criado_em: new Date().toISOString(),
      ...(novaDivisaoForm.tipoGrupoKey === 'custom' ? {
        customTipoSingular: novaDivisaoForm.customTipoSingular,
        customTipoPlural:   novaDivisaoForm.customTipoPlural,
        customTipoMembros:  novaDivisaoForm.customTipoMembros,
      } : {}),
    };
    await createDocument(`eventos/${eventoId}/divisoes`, id, data);
    setActiveDivisaoId(id);
    setIsNovaDivisaoOpen(false);
    setNovaDivisaoForm(emptyNovaDivisao());
    toast.success('Nova divisão criada!');
  };

  const handleRenameDivisao = async () => {
    if (!activeDivisao || !renameValue.trim()) return;
    await updateDocument(`eventos/${eventoId}/divisoes`, activeDivisao.id, { nome: renameValue.trim() });
    setIsRenameDivisaoOpen(false);
    toast.success('Divisão renomeada!');
  };

  const handleDeleteDivisao = async () => {
    if (!activeDivisao) return;
    if (sortedDivisoes.length <= 1) { toast.error('É necessário ao menos uma divisão.'); return; }
    const idx = sortedDivisoes.findIndex(d => d.id === activeDivisao.id);
    const next = sortedDivisoes[idx - 1] ?? sortedDivisoes[idx + 1];
    setActiveDivisaoId(next?.id ?? null);
    await removeDocument(`eventos/${eventoId}/divisoes`, activeDivisao.id);
    setIsDeleteDivisaoOpen(false);
    toast.success('Divisão removida.');
  };

  const openCreate = () => { setEditingRoomId(null); setForm(emptyForm()); setIsDialogOpen(true); };

  const openEdit = (room: Quarto) => {
    setEditingRoomId(room.id);
    setForm({
      nome: room.nome, numero: room.numero, vagas: room.vagas || 4,
      criterioField: '', criterioValue: '',
      hospedes: room.hospedes || [], responsaveis: room.responsaveis || [],
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome) { toast.error(`O nome do ${label.singular.toLowerCase()} é obrigatório`); return; }
    const otherRooms = divisaoRooms.filter(r => r.id !== editingRoomId);
    const conflict = form.hospedes.find(hId => otherRooms.some(r => r.hospedes?.includes(hId)));
    if (conflict) {
      const person = registrations.find(r => r.id === conflict);
      toast.error(`${person?.pessoa?.nome || 'Um participante'} já está alocado em outro ${label.singular.toLowerCase()}.`);
      return;
    }
    const criterioStr = (form.criterioField && form.criterioValue)
      ? `${criterioFields.find(f => f.value === form.criterioField)?.label}: ${form.criterioValue}`
      : undefined;
    try {
      const payload: Partial<Quarto> = {
        nome: form.nome, numero: form.numero, vagas: form.vagas,
        hospedes: form.hospedes, responsaveis: form.responsaveis,
        divisaoId: activeDivisao!.id,
        ...(criterioStr ? { criterio: criterioStr } : {}),
      };
      if (editingRoomId) {
        await updateDocument(`eventos/${eventoId}/quartos`, editingRoomId, payload);
        toast.success(`${label.singular} atualizado!`);
      } else {
        const id = uuidv4();
        await createDocument(`eventos/${eventoId}/quartos`, id, { id, eventoId, ...payload });
        toast.success(`${label.singular} criado com sucesso!`);
      }
      setIsDialogOpen(false);
    } catch { toast.error(`Erro ao salvar ${label.singular.toLowerCase()}`); }
  };

  const handleAutoAllocate = async () => {
    if (!activeDivisao) return;
    const criterioFd = criterioFields.find(f => f.value === autoConfig.criterio);
    const criterioLabel = criterioFd?.label ?? '';
    const groups: Record<string, Reg[]> = {};
    const pool = unallocatedRegs.filter(p => !autoConfig.lideresIds.includes(p.id));
    pool.forEach(p => {
      const key = criterioFd?.getVal(p) || 'Outros';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    const sortedPeople = Object.values(groups).flat();
    const selectedLeaders = registrations.filter(r => autoConfig.lideresIds.includes(r.id));
    if (sortedPeople.length === 0 && selectedLeaders.length === 0) { toast.error('Nenhum participante não alocado.'); return; }
    try {
      const count = autoConfig.quantidade;
      const perRoom = Math.ceil(sortedPeople.length / Math.max(count, 1));
      for (let i = 0; i < count; i++) {
        const id = uuidv4();
        const roomPeople = sortedPeople.slice(i * perRoom, i * perRoom + perRoom).map(p => p.id);
        const leaderId = selectedLeaders[i]?.id;
        const finalHospedes = leaderId ? [leaderId, ...roomPeople] : roomPeople;
        if (finalHospedes.length === 0) continue;
        await createDocument(`eventos/${eventoId}/quartos`, id, {
          id, eventoId,
          nome: `${autoConfig.prefixoNome} ${i + 1}`,
          numero: `${100 + i + 1}`,
          vagas: autoConfig.vagas,
          hospedes: finalHospedes,
          responsaveis: leaderId ? [leaderId] : finalHospedes.slice(0, 1),
          divisaoId: activeDivisao.id,
          criterio: `${criterioLabel} (automático)`,
        });
      }
      toast.success(`${count} ${label.plural.toLowerCase()} criados!`);
      setIsAutoConfigOpen(false);
    } catch { toast.error('Erro na alocação automática'); }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      await removeDocument(`eventos/${eventoId}/quartos`, roomToDelete);
      toast.success(`${label.singular} excluído`);
      setIsDeleteRoomDialogOpen(false); setRoomToDelete(null);
    } catch { toast.error(`Erro ao excluir ${label.singular.toLowerCase()}`); }
  };

  const toggleHospede = (id: string) => setForm(prev => {
    const sel = prev.hospedes.includes(id);
    return { ...prev, hospedes: sel ? prev.hospedes.filter(h => h !== id) : [...prev.hospedes, id], responsaveis: sel ? prev.responsaveis.filter(r => r !== id) : prev.responsaveis };
  });

  const toggleResponsavel = (id: string) => setForm(prev => {
    if (!prev.hospedes.includes(id)) return prev;
    const sel = prev.responsaveis.includes(id);
    return { ...prev, responsaveis: sel ? prev.responsaveis.filter(r => r !== id) : [...prev.responsaveis, id] };
  });

  const handleExport = () => {
    if (!activeDivisao) return;
    const rows = divisaoRooms.flatMap(room => {
      const criterio = room.criterio || '—';
      if (!room.hospedes?.length) {
        return [{ [label.singular]: room.nome, Identificador: room.numero || '—', Participante: '(sem membros)', Email: '', Líder: '', Critério: criterio }];
      }
      return room.hospedes.map(hId => {
        const reg = registrations.find(r => r.id === hId);
        return {
          [label.singular]: room.nome, Identificador: room.numero || '—',
          Participante: reg?.pessoa?.nome || reg?.nome || 'Desconhecido',
          Email: reg?.pessoa?.email || reg?.email || '',
          Líder: room.responsaveis?.includes(hId) ? 'Sim' : 'Não', Critério: criterio,
        };
      });
    });
    if (rows.length === 0) { toast.error('Nenhum dado para exportar.'); return; }
    const ws = XLSX.utils.json_to_sheet(rows);
    const keys = Object.keys(rows[0]);
    ws['!cols'] = keys.map(k => ({ wch: Math.min(Math.max(k.length, ...rows.map(r => String((r as any)[k] ?? '').length)) + 2, 50) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeDivisao.nome.slice(0, 31));
    const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    XLSX.writeFile(wb, `${activeDivisao.nome.toLowerCase().replace(/\s+/g, '-')}-${date}.xlsx`);
    toast.success('Exportado com sucesso!');
  };

  return {
    // state
    divisoes, divisoesLoaded, activeDivisaoId, setActiveDivisaoId,
    rooms, registrations,
    viewMode, setViewMode, filterText, setFilterText,
    isDialogOpen, setIsDialogOpen,
    isAutoConfigOpen, setIsAutoConfigOpen,
    isDeleteRoomDialogOpen, setIsDeleteRoomDialogOpen,
    roomToDelete, setRoomToDelete,
    editingRoomId,
    isNovaDivisaoOpen, setIsNovaDivisaoOpen,
    isDeleteDivisaoOpen, setIsDeleteDivisaoOpen,
    isRenameDivisaoOpen, setIsRenameDivisaoOpen,
    renameValue, setRenameValue,
    novaDivisaoForm, setNovaDivisaoForm,
    form, setForm,
    autoConfig, setAutoConfig,
    // computed
    sortedDivisoes, activeDivisao, label,
    divisaoRooms, filteredRooms, filteredRegs,
    allocatedIds, unallocatedRegs,
    criterioFields, criterioFieldDef, criterioValues,
    // TIPOS_GRUPO exposed for the form
    TIPOS_GRUPO, LIMITE_DIVISOES,
    // handlers
    handleCreateDivisao, handleRenameDivisao, handleDeleteDivisao,
    openCreate, openEdit, handleSave, handleAutoAllocate, handleDeleteRoom,
    toggleHospede, toggleResponsavel, handleExport,
  };
}
