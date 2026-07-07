import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Trash2, UserCheck, Edit2, Settings, Wand2, LayoutGrid, List, Filter, Search, FileDown, Layers, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { listDocuments, createDocument, removeDocument, subscribeToDocuments, updateDocument } from '~/services/firestore';
import { limit } from 'firebase/firestore';
import { Quarto, Inscricao, Pessoa, PaginaVenda } from '~/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface Divisao {
  id: string;
  nome: string;
  tipoGrupoKey: string;
  customTipoSingular?: string;
  customTipoPlural?: string;
  customTipoMembros?: string;
  ordem: number;
  criado_em: string;
}

// ─── Tipos de grupo predefinidos ─────────────────────────────────────────────
const TIPOS_GRUPO = [
  { value: 'grupo',    singular: 'Grupo',    plural: 'Grupos',    membros: 'Membros' },
  { value: 'quarto',   singular: 'Quarto',   plural: 'Quartos',   membros: 'Hóspedes' },
  { value: 'mesa',     singular: 'Mesa',     plural: 'Mesas',     membros: 'Participantes' },
  { value: 'equipe',   singular: 'Equipe',   plural: 'Equipes',   membros: 'Integrantes' },
  { value: 'dinamica', singular: 'Dinâmica', plural: 'Dinâmicas', membros: 'Participantes' },
  { value: 'custom',   singular: '',         plural: '',          membros: '' },
];

const LIMITE_DIVISOES = 10;

// ─── Critérios de distribuição ───────────────────────────────────────────────
type Reg = Inscricao & { pessoa?: Pessoa };

type CriterioFieldDef = {
  value: string;
  label: string;
  getVal: (reg: Reg) => string | undefined;
};

function getLabelForDivisao(div: Divisao | null) {
  if (!div) return { singular: 'Grupo', plural: 'Grupos', membros: 'Membros' };
  const tipo = TIPOS_GRUPO.find(t => t.value === div.tipoGrupoKey) ?? TIPOS_GRUPO[0];
  return {
    singular: div.tipoGrupoKey === 'custom' ? (div.customTipoSingular || 'Grupo')  : tipo.singular,
    plural:   div.tipoGrupoKey === 'custom' ? (div.customTipoPlural   || 'Grupos') : tipo.plural,
    membros:  div.tipoGrupoKey === 'custom' ? (div.customTipoMembros  || 'Membros'): tipo.membros,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
export default function RoomsTab({ eventoId }: { eventoId: string }) {
  // ── Divisões ───────────────────────────────────────────────────────────
  const [divisoes, setDivisoes]           = useState<Divisao[]>([]);
  const [divisoesLoaded, setDivisoesLoaded] = useState(false);
  const [activeDivisaoId, setActiveDivisaoId] = useState<string | null>(null);

  // ── Data ───────────────────────────────────────────────────────────────
  const [rooms, setRooms]               = useState<Quarto[]>([]);
  const [registrations, setRegistrations] = useState<Reg[]>([]);
  const [formCampos, setFormCampos]     = useState<Array<{ id: string; label: string; tipo: string }>>([]);

  // ── View ───────────────────────────────────────────────────────────────
  const [viewMode, setViewMode]   = useState<'grid' | 'list'>('grid');
  const [filterText, setFilterText] = useState('');

  // ── Dialogs ────────────────────────────────────────────────────────────
  const [isDialogOpen, setIsDialogOpen]                   = useState(false);
  const [isAutoConfigOpen, setIsAutoConfigOpen]           = useState(false);
  const [isDeleteRoomDialogOpen, setIsDeleteRoomDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete]                   = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId]                 = useState<string | null>(null);
  const [isNovaDivisaoOpen, setIsNovaDivisaoOpen]         = useState(false);
  const [isDeleteDivisaoOpen, setIsDeleteDivisaoOpen]     = useState(false);
  const [isRenameDivisaoOpen, setIsRenameDivisaoOpen]     = useState(false);
  const [renameValue, setRenameValue]                     = useState('');

  // ── Nova divisão form ──────────────────────────────────────────────────
  const emptyNovaDivisao = () => ({
    nome: '', tipoGrupoKey: 'grupo',
    customTipoSingular: '', customTipoPlural: '', customTipoMembros: '',
  });
  const [novaDivisaoForm, setNovaDivisaoForm] = useState(emptyNovaDivisao());

  // ── Group form ─────────────────────────────────────────────────────────
  const emptyForm = () => ({
    nome: '', numero: '', vagas: 4,
    criterioField: '', criterioValue: '',
    hospedes: [] as string[], responsaveis: [] as string[],
  });
  const [form, setForm] = useState(emptyForm());

  // ── Auto config ────────────────────────────────────────────────────────
  const [autoConfig, setAutoConfig] = useState({
    quantidade: 5, vagas: 4, criterio: 'ticket_nome',
    prefixoNome: '', lideresIds: [] as string[],
  });

  // ── Computed ───────────────────────────────────────────────────────────
  const sortedDivisoes = useMemo(
    () => [...divisoes].sort((a, b) => a.ordem - b.ordem),
    [divisoes]
  );

  const activeDivisao = useMemo(
    () => sortedDivisoes.find(d => d.id === activeDivisaoId) ?? sortedDivisoes[0] ?? null,
    [sortedDivisoes, activeDivisaoId]
  );

  const label = useMemo(() => getLabelForDivisao(activeDivisao), [activeDivisao]);

  const firstDivisaoId = sortedDivisoes[0]?.id;

  // Rooms that belong to the active divisão (backwards-compat: no divisaoId → first tab)
  const divisaoRooms = useMemo(() => {
    if (!activeDivisao) return [];
    const isFirst = activeDivisao.id === firstDivisaoId;
    return rooms.filter(r =>
      r.divisaoId === activeDivisao.id ||
      (isFirst && !r.divisaoId)
    );
  }, [rooms, activeDivisao, firstDivisaoId]);

  const filteredRooms = useMemo(() => {
    if (!filterText.trim()) return divisaoRooms;
    const q = filterText.toLowerCase();
    return divisaoRooms.filter(r =>
      r.nome.toLowerCase().includes(q) ||
      (r.numero || '').toLowerCase().includes(q)
    );
  }, [divisaoRooms, filterText]);

  const allocatedIds   = divisaoRooms.flatMap(r => r.hospedes || []);
  const unallocatedRegs = registrations.filter(r => !allocatedIds.includes(r.id));

  const criterioFields = useMemo<CriterioFieldDef[]>(() => [
    { value: 'ticket_nome', label: 'Tipo de Ingresso', getVal: (reg) => reg.ticket_nome },
    ...formCampos.map(c => ({
      value: c.id,
      label: c.label,
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

  // ── Data fetching ──────────────────────────────────────────────────────
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

  // Auto-create first divisão if none exist after load
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

  // Auto-select participants when criterion value changes
  useEffect(() => {
    if (!form.criterioField || !form.criterioValue || !criterioFieldDef) return;
    const matchingIds = filteredRegs
      .filter(r => criterioFieldDef.getVal(r) === form.criterioValue)
      .map(r => r.id);
    setForm(prev => ({ ...prev, hospedes: matchingIds }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.criterioValue]);

  // ── Divisão handlers ───────────────────────────────────────────────────
  const handleCreateDivisao = async () => {
    if (!novaDivisaoForm.nome.trim()) { toast.error('Nome da divisão é obrigatório'); return; }
    if (divisoes.length >= LIMITE_DIVISOES) { toast.error(`Limite de ${LIMITE_DIVISOES} abas atingido.`); return; }
    const id = uuidv4();
    const data: Divisao = {
      id,
      nome: novaDivisaoForm.nome.trim(),
      tipoGrupoKey: novaDivisaoForm.tipoGrupoKey,
      ordem: divisoes.length,
      criado_em: new Date().toISOString(),
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
    // Move to previous tab before deleting
    const idx = sortedDivisoes.findIndex(d => d.id === activeDivisao.id);
    const next = sortedDivisoes[idx - 1] ?? sortedDivisoes[idx + 1];
    setActiveDivisaoId(next?.id ?? null);
    await removeDocument(`eventos/${eventoId}/divisoes`, activeDivisao.id);
    setIsDeleteDivisaoOpen(false);
    toast.success('Divisão removida.');
  };

  // ── Group handlers ─────────────────────────────────────────────────────
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

  // ── Export ─────────────────────────────────────────────────────────────
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
          [label.singular]: room.nome,
          Identificador: room.numero || '—',
          Participante: reg?.pessoa?.nome || reg?.nome || 'Desconhecido',
          Email: reg?.pessoa?.email || reg?.email || '',
          Líder: room.responsaveis?.includes(hId) ? 'Sim' : 'Não',
          Critério: criterio,
        };
      });
    });

    if (rows.length === 0) { toast.error('Nenhum dado para exportar.'); return; }

    const ws = XLSX.utils.json_to_sheet(rows);
    // Auto column widths
    const keys = Object.keys(rows[0]);
    ws['!cols'] = keys.map(k => ({
      wch: Math.min(Math.max(k.length, ...rows.map(r => String((r as any)[k] ?? '').length)) + 2, 50),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeDivisao.nome.slice(0, 31));
    const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    XLSX.writeFile(wb, `${activeDivisao.nome.toLowerCase().replace(/\s+/g, '-')}-${date}.xlsx`);
    toast.success('Exportado com sucesso!');
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 text-foreground">

      <div className="tab-page-header">
        <div><h2>Grupos</h2><p>Organize os participantes em grupos, mesas, dinâmicas e muito mais.</p></div>
      </div>

      {/* ── Divisões tabs ── */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-0">
        {sortedDivisoes.map(div => (
          <button
            key={div.id}
            onClick={() => setActiveDivisaoId(div.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors -mb-px shrink-0',
              activeDivisao?.id === div.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            {div.nome}
            {activeDivisao?.id === div.id && (
              <span className="text-[10px] font-bold text-primary/60 ml-0.5">
                ({getLabelForDivisao(div).plural.toLowerCase()})
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => {
            if (sortedDivisoes.length >= LIMITE_DIVISOES) {
              toast.error(`Limite de ${LIMITE_DIVISOES} abas atingido.`);
              return;
            }
            setIsNovaDivisaoOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-muted-foreground hover:text-primary border-b-2 border-transparent -mb-px shrink-0 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Nova Divisão
        </button>
      </div>

      {/* ── Top bar ── */}
      {activeDivisao && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {unallocatedRegs.length} sem alocação · {divisaoRooms.length} {label.plural.toLowerCase()}
              </span>

              {/* View toggle */}
              <div className="flex items-center border border-border rounded-xl overflow-hidden h-10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 h-full flex items-center transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/60'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 h-full flex items-center transition-colors border-l border-border ${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/60'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline"
                    className="border-border text-muted-foreground hover:bg-muted/40 gap-2 rounded-xl font-bold h-10">
                    <Settings className="w-4 h-4" /> Editar Aba
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-xl border-border p-1">
                  <DropdownMenuItem
                    onClick={() => { setRenameValue(activeDivisao.nome); setIsRenameDivisaoOpen(true); }}
                    className="gap-2.5 rounded-lg font-semibold cursor-pointer">
                    <Pencil className="w-4 h-4 text-muted-foreground" /> Renomear aba
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsAutoConfigOpen(true)}
                    className="gap-2.5 rounded-lg font-semibold cursor-pointer">
                    <Wand2 className="w-4 h-4 text-muted-foreground" /> Preencher automaticamente
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExport}
                    className="gap-2.5 rounded-lg font-semibold cursor-pointer">
                    <FileDown className="w-4 h-4 text-muted-foreground" /> Exportar XLSX
                  </DropdownMenuItem>
                  {sortedDivisoes.length > 1 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setIsDeleteDivisaoOpen(true)}
                        className="gap-2.5 rounded-lg font-semibold cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                        <X className="w-4 h-4" /> Remover aba
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={openCreate}
                className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl font-bold h-10 px-5 shadow-sm transition-all active:scale-95 flex-1 sm:flex-none">
                <Plus className="w-4 h-4" /> Novo {label.singular}
              </Button>
            </div>
          </div>

          {/* ── Search bar ── */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={`Buscar ${label.plural.toLowerCase()}...`}
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="pl-9 h-10 rounded-xl border-border bg-muted/30 text-sm"
            />
          </div>

          {/* ── Grid view ── */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredRooms.length === 0 && (
                <div className="col-span-full py-20 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
                  <Users className="w-14 h-14 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    {divisaoRooms.length === 0 ? `Nenhum ${label.singular.toLowerCase()} cadastrado ainda.` : 'Nenhum resultado encontrado.'}
                  </p>
                  {divisaoRooms.length === 0 && <p className="text-xs text-muted-foreground/60 mt-1">Crie {label.plural.toLowerCase()} e aloque os participantes.</p>}
                </div>
              )}
              {filteredRooms.map(room => (
                <Card key={room.id} className="border border-border shadow-sm rounded-2xl bg-card overflow-hidden group hover:shadow-md transition-all hover:-translate-y-0.5 card-flat">
                  <div className="h-1.5 bg-primary/40 group-hover:bg-primary transition-colors" />
                  <CardHeader className="pb-2 pt-3 px-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm font-bold text-foreground">{room.nome}</CardTitle>
                        <div className="flex gap-2 mt-0.5 flex-wrap">
                          {room.numero && <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">#{room.numero}</span>}
                          <span className="text-[10px] text-primary font-semibold uppercase tracking-widest">
                            {room.hospedes?.length || 0}/{room.vagas || 0} vagas
                          </span>
                          {room.criterio && (
                            <span className="text-[10px] text-muted-foreground/70 font-medium italic">{room.criterio}</span>
                          )}
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground/40 group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-2 space-y-2">
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">{label.membros}</p>
                      {(room.hospedes?.length || 0) === 0
                        ? <p className="text-xs text-muted-foreground/50 italic">Nenhum membro alocado</p>
                        : (
                          <div className="flex flex-wrap gap-1">
                            {room.hospedes?.map(hId => {
                              const reg = registrations.find(r => r.id === hId);
                              const isResp = room.responsaveis?.includes(hId);
                              return (
                                <div key={hId} className={`text-[10px] px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${isResp ? 'bg-primary/10 border-primary/20 text-primary font-bold' : 'bg-muted/50 border-border/30 text-foreground font-medium'}`}>
                                  {isResp && <UserCheck className="w-3 h-3" />}
                                  {reg ? (reg.pessoa?.nome || reg.nome || 'Sem nome') : 'Desconhecido'}
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>
                    <div className="flex gap-2 pt-1 border-t border-border/50">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-primary/10" onClick={() => openEdit(room)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 ml-auto"
                        onClick={() => { setRoomToDelete(room.id); setIsDeleteRoomDialogOpen(true); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ── List view ── */}
          {viewMode === 'list' && (
            <div className="rounded-2xl border border-border overflow-hidden bg-card">
              <div className="grid grid-cols-[2fr_1fr_1fr_3fr_2fr_auto] gap-4 px-5 py-3 bg-muted/40 border-b border-border">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ID</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vagas</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label.membros}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Líder(es)</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground sr-only">Ações</span>
              </div>
              {filteredRooms.length === 0 && (
                <div className="py-16 text-center">
                  <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    {divisaoRooms.length === 0 ? `Nenhum ${label.singular.toLowerCase()} cadastrado ainda.` : 'Nenhum resultado encontrado.'}
                  </p>
                </div>
              )}
              {filteredRooms.map((room, idx) => {
                const membros = room.hospedes?.map(hId => registrations.find(r => r.id === hId)) ?? [];
                const lideres = membros.filter(r => r && room.responsaveis?.includes(r.id));
                const ocupacao = room.hospedes?.length || 0;
                const total = room.vagas || 0;
                const pct = total > 0 ? ocupacao / total : 0;
                return (
                  <div key={room.id} className={`grid grid-cols-[2fr_1fr_1fr_3fr_2fr_auto] gap-4 px-5 py-4 items-center transition-colors hover:bg-muted/20 ${idx !== filteredRooms.length - 1 ? 'border-b border-border/50' : ''}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-foreground truncate block">{room.nome}</span>
                        {room.criterio && <span className="text-[10px] text-muted-foreground/60 italic">{room.criterio}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{room.numero ? `#${room.numero}` : <span className="text-muted-foreground/30">—</span>}</span>
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-bold ${pct >= 1 ? 'text-destructive' : pct >= 0.8 ? 'text-amber-500' : 'text-primary'}`}>{ocupacao}/{total}</span>
                      <div className="h-1 rounded-full bg-muted overflow-hidden w-12">
                        <div className={`h-full rounded-full transition-all ${pct >= 1 ? 'bg-destructive' : pct >= 0.8 ? 'bg-amber-400' : 'bg-primary'}`} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 min-w-0">
                      {membros.length === 0
                        ? <span className="text-xs text-muted-foreground/40 italic">Nenhum</span>
                        : membros.slice(0, 5).map(reg => reg && (
                          <span key={reg.id} className="text-[10px] bg-muted/60 border border-border/40 rounded-md px-1.5 py-0.5 text-foreground font-medium truncate max-w-[100px]">
                            {reg.pessoa?.nome || reg.nome || 'Sem nome'}
                          </span>
                        ))}
                      {membros.length > 5 && <span className="text-[10px] bg-muted/60 border border-border/40 rounded-md px-1.5 py-0.5 text-muted-foreground font-medium">+{membros.length - 5}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 min-w-0">
                      {lideres.length === 0
                        ? <span className="text-xs text-muted-foreground/40 italic">—</span>
                        : lideres.map(reg => reg && (
                          <span key={reg.id} className="text-[10px] bg-primary/10 border border-primary/20 rounded-md px-1.5 py-0.5 text-primary font-bold flex items-center gap-1">
                            <UserCheck className="w-2.5 h-2.5" />
                            {reg.pessoa?.nome?.split(' ')[0] || reg.nome?.split(' ')[0] || 'Líder'}
                          </span>
                        ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-primary/10" onClick={() => openEdit(room)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => { setRoomToDelete(room.id); setIsDeleteRoomDialogOpen(true); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ════════════════ DIALOG — Nova Divisão ════════════════ */}
      <Dialog open={isNovaDivisaoOpen} onOpenChange={setIsNovaDivisaoOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl border-none shadow-2xl p-8 bg-card">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" /> Nova Divisão
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">Crie uma nova aba de grupos independente para este evento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nome da aba</Label>
              <Input
                placeholder="Ex: Grupos da Manhã, Mesas do Jantar..."
                value={novaDivisaoForm.nome}
                onChange={e => setNovaDivisaoForm(f => ({ ...f, nome: e.target.value }))}
                className="rounded-xl border-border h-11"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tipo de grupo</Label>
              <Select value={novaDivisaoForm.tipoGrupoKey} onValueChange={v => setNovaDivisaoForm(f => ({ ...f, tipoGrupoKey: v }))}>
                <SelectTrigger className="rounded-xl border-border h-11 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-border">
                  {TIPOS_GRUPO.filter(t => t.value !== 'custom').map(t => (
                    <SelectItem key={t.value} value={t.value} className="font-medium">{t.plural}</SelectItem>
                  ))}
                  <SelectItem value="custom" className="font-medium text-primary">Personalizado...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {novaDivisaoForm.tipoGrupoKey === 'custom' && (
              <div className="space-y-3 pt-1">
                {([
                  ['Singular', 'Ex: Célula', 'customTipoSingular'],
                  ['Plural',   'Ex: Células', 'customTipoPlural'],
                  ['Membros',  'Ex: Integrantes', 'customTipoMembros'],
                ] as const).map(([lbl, ph, key]) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{lbl}</Label>
                    <Input placeholder={ph} value={(novaDivisaoForm as any)[key]} onChange={e => setNovaDivisaoForm(f => ({ ...f, [key]: e.target.value }))} className="rounded-xl border-border h-10" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="pt-6 gap-2">
            <Button variant="ghost" onClick={() => { setIsNovaDivisaoOpen(false); setNovaDivisaoForm(emptyNovaDivisao()); }} className="rounded-xl h-11 px-6 font-bold text-muted-foreground hover:bg-muted">Cancelar</Button>
            <Button onClick={handleCreateDivisao} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-11 font-bold">Criar divisão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════ DIALOG — Renomear Divisão ════════════════ */}
      <Dialog open={isRenameDivisaoOpen} onOpenChange={setIsRenameDivisaoOpen}>
        <DialogContent className="sm:max-w-xs rounded-2xl border-none shadow-2xl p-8 bg-card">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-foreground">Renomear divisão</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRenameDivisao()}
            className="rounded-xl border-border h-11"
            autoFocus
          />
          <DialogFooter className="pt-4 gap-2">
            <Button variant="ghost" onClick={() => setIsRenameDivisaoOpen(false)} className="rounded-xl h-11 px-6 font-bold text-muted-foreground hover:bg-muted">Cancelar</Button>
            <Button onClick={handleRenameDivisao} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-11 font-bold">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════ DIALOG — Excluir Divisão ════════════════ */}
      <Dialog open={isDeleteDivisaoOpen} onOpenChange={setIsDeleteDivisaoOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl border-none shadow-2xl p-8 bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">Remover divisão</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1">
              Os grupos desta aba serão removidos. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-6 gap-2">
            <Button variant="ghost" onClick={() => setIsDeleteDivisaoOpen(false)} className="rounded-xl h-11 px-6 font-bold text-muted-foreground hover:bg-muted">Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteDivisao} className="rounded-xl h-11 px-6 font-black shadow-lg">Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════ DIALOG — Criar / Editar grupo ════════════════ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[520px] w-[95vw] max-h-[92vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl p-8 bg-card">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Users className="w-5 h-5" />
              </div>
              {editingRoomId ? `Editar ${label.singular}` : `Novo ${label.singular}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-3">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nome</Label>
              <Input placeholder={`Ex: ${label.singular} A`} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Capacidade</Label>
              <Input type="number" min={1} placeholder="Ex: 10" value={form.vagas || ''} onFocus={e => e.target.select()} onChange={e => setForm({ ...form, vagas: Number(e.target.value) })} className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Filter className="w-3 h-3" /> Critério de seleção
                <span className="text-[10px] normal-case font-normal text-muted-foreground/60 ml-1">— filtra e pré-seleciona participantes</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.criterioField} onValueChange={v => setForm({ ...form, criterioField: v, criterioValue: '', hospedes: [] })}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-semibold shadow-sm text-sm"><SelectValue placeholder="Campo..." /></SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-border">
                    <SelectItem value="">Sem critério</SelectItem>
                    {criterioFields.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={form.criterioValue} onValueChange={v => setForm({ ...form, criterioValue: v })} disabled={!form.criterioField || criterioValues.length === 0}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-semibold shadow-sm text-sm disabled:opacity-40"><SelectValue placeholder="Valor..." /></SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-border">
                    {criterioValues.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.criterioField && form.criterioValue && (
                <p className="text-[11px] text-primary font-semibold pl-1">
                  ✓ {filteredRegs.filter(r => criterioFieldDef?.getVal(r) === form.criterioValue).length} participante(s) correspondem ao critério
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Selecionar participantes</Label>
                <div className="flex gap-2 items-center">
                  {form.hospedes.length > 0 && (
                    <Badge variant="outline" className="text-[10px] px-2 h-5 font-bold text-primary border-primary/30">{form.hospedes.length} selecionado(s)</Badge>
                  )}
                  {filteredRegs.length > 0 && (
                    <button type="button" className="text-[10px] text-primary/70 hover:text-primary font-semibold underline underline-offset-2"
                      onClick={() => setForm(prev => ({ ...prev, hospedes: prev.hospedes.length === filteredRegs.length ? [] : filteredRegs.map(r => r.id) }))}>
                      {form.hospedes.length === filteredRegs.length ? 'Desmarcar todos' : 'Selecionar todos'}
                    </button>
                  )}
                </div>
              </div>
              <ScrollArea className="h-[200px] border border-border/50 rounded-2xl p-2 bg-muted/10">
                <div className="space-y-0.5">
                  {filteredRegs.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      {form.criterioField && form.criterioValue ? 'Nenhum participante corresponde a este critério.' : 'Todos os participantes já foram alocados.'}
                    </p>
                  )}
                  {filteredRegs.map(reg => (
                    <div key={reg.id} className="flex items-center justify-between p-3 hover:bg-card rounded-xl group transition-all">
                      <div className="flex items-center gap-3">
                        <Checkbox id={`reg-${reg.id}`} checked={form.hospedes.includes(reg.id)} onCheckedChange={() => toggleHospede(reg.id)} className="rounded-md h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                        <div className="flex flex-col">
                          <label htmlFor={`reg-${reg.id}`} className="text-sm font-bold text-foreground cursor-pointer leading-none">{reg.pessoa?.nome || reg.nome || 'Sem nome'}</label>
                          <span className="text-[10px] text-muted-foreground mt-0.5">{[reg.ticket_nome, reg.pessoa?.celula ? `Célula: ${reg.pessoa.celula}` : null].filter(Boolean).join(' · ') || reg.pessoa?.email || reg.email || ''}</span>
                        </div>
                      </div>
                      {form.hospedes.includes(reg.id) && (
                        <Button size="sm" variant={form.responsaveis.includes(reg.id) ? 'default' : 'outline'} className={`h-7 text-[10px] rounded-full gap-1 px-3 font-bold transition-all ${form.responsaveis.includes(reg.id) ? 'bg-primary text-white shadow-sm' : 'border-primary/20 text-primary hover:bg-primary/10'}`} onClick={() => toggleResponsavel(reg.id)}>
                          <UserCheck className="w-3 h-3" /> Líder
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter className="pt-6 flex flex-col md:flex-row gap-3">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-2xl h-12 px-8 font-bold text-muted-foreground hover:bg-muted">Cancelar</Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white w-full rounded-2xl h-12 font-black shadow-xl shadow-primary/20 transition-all active:scale-95">
              {editingRoomId ? 'Salvar Alterações' : `Criar ${label.singular}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════ DIALOG — Alocação automática ════════════════ */}
      <Dialog open={isAutoConfigOpen} onOpenChange={setIsAutoConfigOpen}>
        <DialogContent className="sm:max-w-[480px] w-[95vw] max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl p-8 bg-card">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl font-black text-foreground tracking-tight">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Wand2 className="w-5 h-5" /></div>
              Alocação Automática
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1">Cria os {label.plural.toLowerCase()} e distribui os participantes não alocados.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Qtd {label.plural}</Label>
                <Input type="number" value={autoConfig.quantidade || ''} onFocus={e => e.target.select()} onChange={e => setAutoConfig({ ...autoConfig, quantidade: Number(e.target.value) })} className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Vagas / {label.singular}</Label>
                <Input type="number" value={autoConfig.vagas || ''} onFocus={e => e.target.select()} onChange={e => setAutoConfig({ ...autoConfig, vagas: Number(e.target.value) })} className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Prefixo do nome</Label>
              <Input placeholder={`Ex: ${label.singular} A`} value={autoConfig.prefixoNome} onChange={e => setAutoConfig({ ...autoConfig, prefixoNome: e.target.value })} className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Critério de distribuição</Label>
              <Select value={autoConfig.criterio} onValueChange={v => setAutoConfig({ ...autoConfig, criterio: v })}>
                <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  {criterioFields.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Selecionar Líderes <span className="normal-case font-normal text-muted-foreground/60">(um por {label.singular.toLowerCase()})</span></Label>
              <ScrollArea className="h-[130px] border border-border/50 rounded-2xl p-2 bg-muted/10">
                <div className="space-y-0.5">
                  {registrations.map(reg => (
                    <div key={reg.id} className="flex items-center gap-2 p-2 hover:bg-card rounded-lg transition-all">
                      <Checkbox id={`lider-${reg.id}`} checked={autoConfig.lideresIds.includes(reg.id)} onCheckedChange={checked => setAutoConfig({ ...autoConfig, lideresIds: checked ? [...autoConfig.lideresIds, reg.id] : autoConfig.lideresIds.filter(id => id !== reg.id) })} className="rounded-md h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                      <label htmlFor={`lider-${reg.id}`} className="text-sm font-bold text-foreground cursor-pointer">{reg.pessoa?.nome || reg.nome} {reg.pessoa?.celula ? `(${reg.pessoa.celula})` : ''}</label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter className="pt-6 flex flex-col md:flex-row gap-3">
            <Button variant="ghost" onClick={() => setIsAutoConfigOpen(false)} className="rounded-2xl h-12 px-8 font-bold text-muted-foreground hover:bg-muted">Cancelar</Button>
            <Button onClick={handleAutoAllocate} className="bg-primary hover:bg-primary/90 text-white w-full rounded-2xl h-12 font-black shadow-xl shadow-primary/20 transition-all active:scale-95">Gerar e Alocar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════ DIALOG — Confirmar exclusão ════════════════ */}
      <Dialog open={isDeleteRoomDialogOpen} onOpenChange={setIsDeleteRoomDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-none shadow-2xl p-8 bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">Excluir {label.singular}</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1">Tem certeza que deseja excluir este {label.singular.toLowerCase()}? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-6 flex flex-col md:flex-row gap-3">
            <Button variant="ghost" onClick={() => setIsDeleteRoomDialogOpen(false)} className="rounded-xl h-11 px-8 font-bold text-muted-foreground hover:bg-muted">Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteRoom} className="rounded-xl h-11 px-8 font-black shadow-lg shadow-destructive/20 active:scale-95 transition-all">Excluir {label.singular}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
