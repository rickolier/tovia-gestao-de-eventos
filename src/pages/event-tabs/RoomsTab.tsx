import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Trash2, UserCheck, Edit2, Settings, Wand2, LayoutGrid, Filter } from 'lucide-react';
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
import { listDocuments, createDocument, removeDocument, subscribeToDocuments, updateDocument } from '../../lib/firebase-utils';
import { Quarto, Inscricao, Pessoa } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// ─── Tipos de grupo predefinidos ────────────────────────────────────────────
const TIPOS_GRUPO = [
  { value: 'grupo',    singular: 'Grupo',    plural: 'Grupos',    membros: 'Membros' },
  { value: 'quarto',   singular: 'Quarto',   plural: 'Quartos',   membros: 'Hóspedes' },
  { value: 'mesa',     singular: 'Mesa',     plural: 'Mesas',     membros: 'Participantes' },
  { value: 'equipe',   singular: 'Equipe',   plural: 'Equipes',   membros: 'Integrantes' },
  { value: 'dinamica', singular: 'Dinâmica', plural: 'Dinâmicas', membros: 'Participantes' },
  { value: 'custom',   singular: '',         plural: '',          membros: '' },
];

// ─── Critérios disponíveis (baseados nos campos de Pessoa / Inscrição) ──────
type Reg = Inscricao & { pessoa?: Pessoa };

const CRITERIO_FIELDS = [
  {
    value: 'genero',
    label: 'Sexo',
    getVal: (reg: Reg) => reg.pessoa?.genero,
  },
  {
    value: 'celula',
    label: 'Célula',
    getVal: (reg: Reg) => reg.pessoa?.celula,
  },
  {
    value: 'ticket_nome',
    label: 'Tipo de Ingresso',
    getVal: (reg: Reg) => reg.ticket_nome,
  },
  {
    value: 'faixa_etaria',
    label: 'Faixa Etária',
    getVal: (reg: Reg) => {
      const idade = reg.pessoa?.idade;
      if (!idade) return undefined;
      if (idade < 12) return 'Criança (< 12)';
      if (idade < 18) return 'Adolescente (12–17)';
      if (idade < 30) return 'Jovem (18–29)';
      if (idade < 50) return 'Adulto (30–49)';
      return 'Sênior (50+)';
    },
  },
];

const GENERO_LABEL: Record<string, string> = { masculino: 'Masculino', feminino: 'Feminino' };

// ═════════════════════════════════════════════════════════════════════════════
export default function RoomsTab({ eventoId }: { eventoId: string }) {
  const [rooms, setRooms] = useState<Quarto[]>([]);
  const [registrations, setRegistrations] = useState<Reg[]>([]);

  // ── Tipo de grupo ──────────────────────────────────────────────────────
  const [tipoGrupoKey, setTipoGrupoKey] = useState('grupo');
  const [customTipoSingular, setCustomTipoSingular] = useState('');
  const [customTipoPlural, setCustomTipoPlural] = useState('');
  const [customTipoMembros, setCustomTipoMembros] = useState('');
  const [isTipoDialogOpen, setIsTipoDialogOpen] = useState(false);

  const tipoAtual = TIPOS_GRUPO.find(t => t.value === tipoGrupoKey) ?? TIPOS_GRUPO[0];
  const label = {
    singular: tipoGrupoKey === 'custom' ? (customTipoSingular || 'Grupo')  : tipoAtual.singular,
    plural:   tipoGrupoKey === 'custom' ? (customTipoPlural   || 'Grupos') : tipoAtual.plural,
    membros:  tipoGrupoKey === 'custom' ? (customTipoMembros  || 'Membros'): tipoAtual.membros,
  };

  // ── Dialog state ───────────────────────────────────────────────────────
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAutoConfigOpen, setIsAutoConfigOpen] = useState(false);
  const [isDeleteRoomDialogOpen, setIsDeleteRoomDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  // ── New group form ─────────────────────────────────────────────────────
  const emptyForm = () => ({
    nome: '',
    numero: '',
    vagas: 4,
    criterioField: '',
    criterioValue: '',
    hospedes: [] as string[],
    responsaveis: [] as string[],
  });
  const [form, setForm] = useState(emptyForm());

  // ── Auto config ────────────────────────────────────────────────────────
  const [autoConfig, setAutoConfig] = useState({
    quantidade: 5,
    vagas: 4,
    criterio: 'celula',
    prefixoNome: '',
    lideresIds: [] as string[],
  });

  // ── Derived data ───────────────────────────────────────────────────────
  const allocatedIds = rooms.flatMap(r => r.hospedes || []);
  const unallocatedRegs = registrations.filter(r => !allocatedIds.includes(r.id));

  const criterioFieldDef = CRITERIO_FIELDS.find(f => f.value === form.criterioField);

  const criterioValues = useMemo(() => {
    if (!criterioFieldDef) return [];
    const seen = new Set<string>();
    registrations.forEach(r => {
      const v = criterioFieldDef.getVal(r);
      if (v) seen.add(v);
    });
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
    const unsub = subscribeToDocuments<Quarto>(`eventos/${eventoId}/quartos`, [], setRooms);
    const fetchRegs = async () => {
      try {
        const [regData, peopleData] = await Promise.all([
          listDocuments<Inscricao>(`eventos/${eventoId}/inscricoes`),
          listDocuments<Pessoa>(`eventos/${eventoId}/pessoas`),
        ]);
        const enriched = regData
          .filter(r => r.status === 'pago' || r.validada_manual)
          .map(reg => ({ ...reg, pessoa: peopleData.find(p => p.id === reg.pessoaId) }));
        setRegistrations(enriched);
      } catch {
        toast.error('Erro ao carregar lista de inscritos');
      }
    };
    fetchRegs();
    return () => unsub();
  }, [eventoId]);

  useEffect(() => {
    setAutoConfig(prev => ({ ...prev, prefixoNome: label.singular }));
  }, [tipoGrupoKey, customTipoSingular]);

  // Auto-select participants when criterion value changes
  useEffect(() => {
    if (!form.criterioField || !form.criterioValue || !criterioFieldDef) return;
    const matchingIds = filteredRegs
      .filter(r => criterioFieldDef.getVal(r) === form.criterioValue)
      .map(r => r.id);
    setForm(prev => ({ ...prev, hospedes: matchingIds }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.criterioValue]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const openCreate = () => { setEditingRoomId(null); setForm(emptyForm()); setIsDialogOpen(true); };

  const openEdit = (room: Quarto) => {
    setEditingRoomId(room.id);
    setForm({ nome: room.nome, numero: room.numero, vagas: room.vagas || 4, criterioField: '', criterioValue: '', hospedes: room.hospedes || [], responsaveis: room.responsaveis || [] });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome) { toast.error(`O nome do ${label.singular.toLowerCase()} é obrigatório`); return; }
    const otherRooms = rooms.filter(r => r.id !== editingRoomId);
    const conflict = form.hospedes.find(hId => otherRooms.some(r => r.hospedes?.includes(hId)));
    if (conflict) {
      const person = registrations.find(r => r.id === conflict);
      toast.error(`${person?.pessoa?.nome || 'Um participante'} já está alocado em outro ${label.singular.toLowerCase()}.`);
      return;
    }
    try {
      const payload = { nome: form.nome, numero: form.numero, vagas: form.vagas, hospedes: form.hospedes, responsaveis: form.responsaveis };
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
    const criterioFd = CRITERIO_FIELDS.find(f => f.value === autoConfig.criterio);
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
          id, eventoId, nome: `${autoConfig.prefixoNome} ${i + 1}`, numero: `${100 + i + 1}`, vagas: autoConfig.vagas,
          hospedes: finalHospedes, responsaveis: leaderId ? [leaderId] : finalHospedes.slice(0, 1),
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

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 text-foreground">

      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/60 border border-border rounded-xl px-3 h-10">
            <LayoutGrid className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select value={tipoGrupoKey} onValueChange={v => { setTipoGrupoKey(v); if (v === 'custom') setIsTipoDialogOpen(true); }}>
              <SelectTrigger className="border-none bg-transparent shadow-none h-auto p-0 text-sm font-semibold text-foreground focus:ring-0 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl border-border">
                {TIPOS_GRUPO.filter(t => t.value !== 'custom').map(t => (
                  <SelectItem key={t.value} value={t.value} className="font-medium">{t.plural}</SelectItem>
                ))}
                <SelectItem value="custom" className="font-medium text-primary">Personalizar...</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {unallocatedRegs.length} sem alocação · {rooms.length} {label.plural.toLowerCase()}
          </span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setIsAutoConfigOpen(true)}
            className="border-primary text-primary hover:bg-primary/5 gap-2 rounded-xl font-bold h-10 flex-1 sm:flex-none">
            <Settings className="w-4 h-4" /> Automático
          </Button>
          <Button onClick={openCreate}
            className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl font-bold h-10 px-5 shadow-sm transition-all active:scale-95 flex-1 sm:flex-none">
            <Plus className="w-4 h-4" /> Novo Grupo
          </Button>
        </div>
      </div>

      {/* ── Cards grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {rooms.length === 0 && (
          <div className="col-span-full py-20 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
            <Users className="w-14 h-14 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">Nenhum {label.singular.toLowerCase()} cadastrado ainda.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Crie {label.plural.toLowerCase()} e aloque os participantes.</p>
          </div>
        )}
        {rooms.map(room => (
          <Card key={room.id} className="border border-border shadow-sm rounded-2xl bg-card overflow-hidden group hover:shadow-md transition-all hover:-translate-y-0.5 card-flat">
            <div className="h-1.5 bg-primary/40 group-hover:bg-primary transition-colors" />
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">{room.nome}</CardTitle>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    {room.numero && <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">#{room.numero}</span>}
                    <span className="text-[10px] text-primary font-semibold uppercase tracking-widest">
                      {room.hospedes?.length || 0}/{room.vagas || 0} vagas
                    </span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground/40 group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">{label.membros}</p>
                {(room.hospedes?.length || 0) === 0
                  ? <p className="text-xs text-muted-foreground/50 italic">Nenhum membro alocado</p>
                  : (
                    <div className="flex flex-wrap gap-1.5">
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
              <div className="flex gap-2 pt-3 border-t border-border/50">
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

      {/* ════════════════════════════════════════════════
          DIALOG — Personalizar tipo de grupo
      ════════════════════════════════════════════════ */}
      <Dialog open={isTipoDialogOpen} onOpenChange={setIsTipoDialogOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl border-none shadow-2xl p-8 bg-card">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-foreground">Personalizar tipo de grupo</DialogTitle>
            <DialogDescription className="text-muted-foreground">Defina como chamará cada divisão no seu evento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {([
              ['Nome no singular', 'Ex: Célula', customTipoSingular, setCustomTipoSingular],
              ['Nome no plural',   'Ex: Células', customTipoPlural,  setCustomTipoPlural],
              ['Nome dos membros', 'Ex: Participantes', customTipoMembros, setCustomTipoMembros],
            ] as const).map(([lbl, ph, val, setter]) => (
              <div key={lbl} className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{lbl}</Label>
                <Input placeholder={ph} value={val} onChange={e => (setter as any)(e.target.value)} className="rounded-xl border-border h-11" />
              </div>
            ))}
          </div>
          <DialogFooter className="pt-6 gap-2">
            <Button variant="ghost" onClick={() => { setTipoGrupoKey('grupo'); setIsTipoDialogOpen(false); }} className="rounded-xl">Cancelar</Button>
            <Button onClick={() => setIsTipoDialogOpen(false)} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════
          DIALOG — Criar / Editar grupo
      ════════════════════════════════════════════════ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[520px] w-[95vw] max-h-[92vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl p-8 bg-card">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Users className="w-5 h-5" />
              </div>
              {editingRoomId ? `Editar ${label.singular}` : 'Novo Grupo'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-3">

            {/* Nome + Identificador */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nome do grupo</Label>
                <Input
                  placeholder={`Ex: ${label.singular} A`}
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Identificador</Label>
                <Input
                  placeholder="Ex: A1, 101..."
                  value={form.numero}
                  onChange={e => setForm({ ...form, numero: e.target.value })}
                  className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary shadow-sm"
                />
              </div>
            </div>

            {/* Capacidade */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Capacidade</Label>
              <Input
                type="number" min={1}
                placeholder="Ex: 10"
                value={form.vagas}
                onChange={e => setForm({ ...form, vagas: Number(e.target.value) })}
                className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary shadow-sm"
              />
            </div>

            {/* Critério */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Filter className="w-3 h-3" /> Critério de seleção
                <span className="text-[10px] normal-case font-normal text-muted-foreground/60 ml-1">— filtra e pré-seleciona participantes</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={form.criterioField}
                  onValueChange={v => setForm({ ...form, criterioField: v, criterioValue: '', hospedes: [] })}
                >
                  <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-semibold shadow-sm text-sm">
                    <SelectValue placeholder="Campo..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-border">
                    <SelectItem value="">Sem critério</SelectItem>
                    {CRITERIO_FIELDS.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={form.criterioValue}
                  onValueChange={v => setForm({ ...form, criterioValue: v })}
                  disabled={!form.criterioField || criterioValues.length === 0}
                >
                  <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-semibold shadow-sm text-sm disabled:opacity-40">
                    <SelectValue placeholder="Valor..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-border">
                    {criterioValues.map(v => (
                      <SelectItem key={v} value={v}>{GENERO_LABEL[v] ?? v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.criterioField && form.criterioValue && (
                <p className="text-[11px] text-primary font-semibold pl-1">
                  ✓ {filteredRegs.filter(r => criterioFieldDef?.getVal(r) === form.criterioValue).length} participante(s) correspondem ao critério
                </p>
              )}
            </div>

            {/* Selecionar participantes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Selecionar participantes
                </Label>
                <div className="flex gap-2 items-center">
                  {form.hospedes.length > 0 && (
                    <Badge variant="outline" className="text-[10px] px-2 h-5 font-bold text-primary border-primary/30">
                      {form.hospedes.length} selecionado(s)
                    </Badge>
                  )}
                  {filteredRegs.length > 0 && (
                    <button
                      type="button"
                      className="text-[10px] text-primary/70 hover:text-primary font-semibold underline underline-offset-2"
                      onClick={() => setForm(prev => ({
                        ...prev,
                        hospedes: prev.hospedes.length === filteredRegs.length ? [] : filteredRegs.map(r => r.id),
                      }))}
                    >
                      {form.hospedes.length === filteredRegs.length ? 'Desmarcar todos' : 'Selecionar todos'}
                    </button>
                  )}
                </div>
              </div>
              <ScrollArea className="h-[200px] border border-border/50 rounded-2xl p-2 bg-muted/10">
                <div className="space-y-0.5">
                  {filteredRegs.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      {form.criterioField && form.criterioValue
                        ? 'Nenhum participante corresponde a este critério.'
                        : 'Todos os participantes já foram alocados.'}
                    </p>
                  )}
                  {filteredRegs.map(reg => (
                    <div key={reg.id} className="flex items-center justify-between p-3 hover:bg-card rounded-xl group transition-all">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`reg-${reg.id}`}
                          checked={form.hospedes.includes(reg.id)}
                          onCheckedChange={() => toggleHospede(reg.id)}
                          className="rounded-md h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <div className="flex flex-col">
                          <label htmlFor={`reg-${reg.id}`} className="text-sm font-bold text-foreground cursor-pointer leading-none">
                            {reg.pessoa?.nome || reg.nome || 'Sem nome'}
                          </label>
                          <span className="text-[10px] text-muted-foreground mt-0.5">
                            {[reg.ticket_nome, reg.pessoa?.celula ? `Célula: ${reg.pessoa.celula}` : null]
                              .filter(Boolean).join(' · ') || reg.pessoa?.email || reg.email || ''}
                          </span>
                        </div>
                      </div>
                      {form.hospedes.includes(reg.id) && (
                        <Button
                          size="sm"
                          variant={form.responsaveis.includes(reg.id) ? 'default' : 'outline'}
                          className={`h-7 text-[10px] rounded-full gap-1 px-3 font-bold transition-all ${form.responsaveis.includes(reg.id) ? 'bg-primary text-white shadow-sm' : 'border-primary/20 text-primary hover:bg-primary/10'}`}
                          onClick={() => toggleResponsavel(reg.id)}
                        >
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
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-10 font-black shadow-xl shadow-primary/20 transition-all active:scale-95">
              {editingRoomId ? 'Salvar Alterações' : 'Criar Grupo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════
          DIALOG — Alocação automática
      ════════════════════════════════════════════════ */}
      <Dialog open={isAutoConfigOpen} onOpenChange={setIsAutoConfigOpen}>
        <DialogContent className="sm:max-w-[480px] w-[95vw] max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl p-8 bg-card">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl font-black text-foreground tracking-tight">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Wand2 className="w-5 h-5" />
              </div>
              Alocação Automática
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1">
              Cria os {label.plural.toLowerCase()} e distribui os participantes não alocados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Qtd {label.plural}</Label>
                <Input type="number" value={autoConfig.quantidade} onChange={e => setAutoConfig({ ...autoConfig, quantidade: Number(e.target.value) })} className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Vagas / {label.singular}</Label>
                <Input type="number" value={autoConfig.vagas} onChange={e => setAutoConfig({ ...autoConfig, vagas: Number(e.target.value) })} className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Prefixo do nome</Label>
              <Input placeholder={`Ex: ${label.singular} A`} value={autoConfig.prefixoNome} onChange={e => setAutoConfig({ ...autoConfig, prefixoNome: e.target.value })} className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Critério de distribuição</Label>
              <Select value={autoConfig.criterio} onValueChange={v => setAutoConfig({ ...autoConfig, criterio: v })}>
                <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  {CRITERIO_FIELDS.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Selecionar Líderes <span className="normal-case font-normal text-muted-foreground/60">(um por {label.singular.toLowerCase()})</span>
              </Label>
              <ScrollArea className="h-[130px] border border-border/50 rounded-2xl p-2 bg-muted/10">
                <div className="space-y-0.5">
                  {registrations.map(reg => (
                    <div key={reg.id} className="flex items-center gap-2 p-2 hover:bg-card rounded-lg transition-all">
                      <Checkbox
                        id={`lider-${reg.id}`}
                        checked={autoConfig.lideresIds.includes(reg.id)}
                        onCheckedChange={checked => setAutoConfig({
                          ...autoConfig,
                          lideresIds: checked ? [...autoConfig.lideresIds, reg.id] : autoConfig.lideresIds.filter(id => id !== reg.id),
                        })}
                        className="rounded-md h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <label htmlFor={`lider-${reg.id}`} className="text-sm font-bold text-foreground cursor-pointer">
                        {reg.pessoa?.nome || reg.nome} {reg.pessoa?.celula ? `(${reg.pessoa.celula})` : ''}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter className="pt-6 flex flex-col md:flex-row gap-3">
            <Button variant="ghost" onClick={() => setIsAutoConfigOpen(false)} className="rounded-2xl h-12 px-8 font-bold text-muted-foreground hover:bg-muted">Cancelar</Button>
            <Button onClick={handleAutoAllocate} className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-10 font-black shadow-xl shadow-primary/20 transition-all active:scale-95">
              Gerar e Alocar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════
          DIALOG — Confirmar exclusão
      ════════════════════════════════════════════════ */}
      <Dialog open={isDeleteRoomDialogOpen} onOpenChange={setIsDeleteRoomDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-none shadow-2xl p-8 bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">Excluir {label.singular}</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1">
              Tem certeza que deseja excluir este {label.singular.toLowerCase()}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-6 flex flex-col md:flex-row gap-3">
            <Button variant="ghost" onClick={() => setIsDeleteRoomDialogOpen(false)} className="rounded-xl h-11 px-6 font-bold text-muted-foreground hover:bg-muted">Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteRoom} className="rounded-xl h-11 px-8 font-black shadow-lg shadow-destructive/20 active:scale-95 transition-all">
              Excluir {label.singular}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
