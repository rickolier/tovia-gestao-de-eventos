import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '~/services/firebase';
import { listDocuments, createDocument, removeDocument } from '~/services/firestore';
import { Email } from '~/services/email';
import { UserProfile, PlanLevel } from '~/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { v4 as uuidv4 } from 'uuid';
import {
  Megaphone, Users, Plus, Trash2, Edit2, Send, History,
  ChevronLeft, X, Mail, CheckCircle, AlertCircle, RefreshCw, Eye,
  Filter, Zap, Ticket, MapPin, CreditCard, CalendarCheck, CalendarX,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type FiltroDef =
  | { tipo: 'plano'; valores: PlanLevel[] }
  | { tipo: 'sem_plano' }
  | { tipo: 'gateway_conectado' }
  | { tipo: 'eventos_ativos' }
  | { tipo: 'eventos_inativos' }
  | { tipo: 'tickets_abertos' }
  | { tipo: 'cidade'; valor: string };

interface ComunicadoGrupo {
  id: string;
  nome: string;
  filtros: FiltroDef[];
  emails_manuais: string[];
  criado_em: string;
}

interface ComunicadoEnviado {
  id: string;
  assunto: string;
  preview_text?: string;
  corpo: string;
  grupo_nome: string;
  total: number;
  enviado_em: string;
  status: 'enviado' | 'parcial' | 'erro';
  erros?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<PlanLevel, string> = {
  chinam: 'Chinam',
  petach: 'Pétach',
  koach: 'Koách',
  chalem: 'Chalém',
};

const ALL_PLANS: PlanLevel[] = ['chinam', 'petach', 'koach', 'chalem'];

const FILTER_OPTIONS: Array<{
  tipo: FiltroDef['tipo'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hasParam: boolean;
}> = [
  { tipo: 'plano',             label: 'Por plano',                icon: CreditCard,    hasParam: true  },
  { tipo: 'cidade',            label: 'Por cidade',               icon: MapPin,        hasParam: true  },
  { tipo: 'gateway_conectado', label: 'Com gateway conectado',    icon: Zap,           hasParam: false },
  { tipo: 'eventos_ativos',    label: 'Com evento ativo',         icon: CalendarCheck, hasParam: false },
  { tipo: 'eventos_inativos',  label: 'Eventos (todos inativos)', icon: CalendarX,     hasParam: false },
  { tipo: 'tickets_abertos',   label: 'Com ticket aberto',        icon: Ticket,        hasParam: false },
  { tipo: 'sem_plano',         label: 'Sem plano pago',           icon: Users,         hasParam: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function filtroLabel(f: FiltroDef): string {
  switch (f.tipo) {
    case 'plano':             return `Plano: ${f.valores.map(v => PLAN_LABELS[v]).join(', ')}`;
    case 'sem_plano':         return 'Sem plano pago';
    case 'gateway_conectado': return 'Com gateway Asaas conectado';
    case 'eventos_ativos':    return 'Com evento ativo';
    case 'eventos_inativos':  return 'Com eventos (todos inativos)';
    case 'tickets_abertos':   return 'Com ticket aberto ou em andamento';
    case 'cidade':            return `Cidade: ${f.valor}`;
  }
}

function filtroIcon(tipo: FiltroDef['tipo']): React.ComponentType<{ className?: string }> {
  return FILTER_OPTIONS.find(o => o.tipo === tipo)?.icon ?? Filter;
}

async function resolveRecipients(grupo: ComunicadoGrupo, allUsers: UserProfile[]): Promise<string[]> {
  const emailSet = new Set<string>();
  const activeUsers = allUsers.filter(u => !u.desativado && !u.isDemo);

  // Manual emails
  grupo.emails_manuais
    .flatMap(block => block.split(/[\n,;]+/))
    .map(e => e.trim().toLowerCase())
    .filter(e => e.includes('@'))
    .forEach(e => emailSet.add(e));

  for (const filtro of grupo.filtros) {
    if (filtro.tipo === 'plano') {
      activeUsers
        .filter(u => u.plano && filtro.valores.includes(u.plano))
        .forEach(u => emailSet.add(u.email.toLowerCase()));

    } else if (filtro.tipo === 'sem_plano') {
      activeUsers
        .filter(u => !u.plano || u.plano === 'chinam')
        .forEach(u => emailSet.add(u.email.toLowerCase()));

    } else if (filtro.tipo === 'gateway_conectado') {
      activeUsers
        .filter(u => u.gateway_connected)
        .forEach(u => emailSet.add(u.email.toLowerCase()));

    } else if (filtro.tipo === 'cidade') {
      const lc = filtro.valor.toLowerCase();
      activeUsers
        .filter(u => u.cidade?.toLowerCase().includes(lc))
        .forEach(u => emailSet.add(u.email.toLowerCase()));

    } else if (filtro.tipo === 'eventos_ativos') {
      const snap = await getDocs(query(collection(db, 'eventos'), where('ativo', '==', true)));
      const uids = new Set(snap.docs.map(d => d.data().criado_por as string));
      activeUsers.filter(u => uids.has(u.uid)).forEach(u => emailSet.add(u.email.toLowerCase()));

    } else if (filtro.tipo === 'eventos_inativos') {
      const snap = await getDocs(collection(db, 'eventos'));
      const allUids = new Set(snap.docs.map(d => d.data().criado_por as string));
      const activeUids = new Set(
        snap.docs.filter(d => d.data().ativo).map(d => d.data().criado_por as string)
      );
      activeUsers
        .filter(u => allUids.has(u.uid) && !activeUids.has(u.uid))
        .forEach(u => emailSet.add(u.email.toLowerCase()));

    } else if (filtro.tipo === 'tickets_abertos') {
      const tickets = await listDocuments<{ cliente_email?: string; status: string }>('tickets', [
        where('status', 'in', ['aberto', 'em_andamento']),
      ]);
      tickets.filter(t => t.cliente_email).forEach(t => emailSet.add(t.cliente_email!.toLowerCase()));
    }
  }

  return Array.from(emailSet);
}

// ─── Main Component ───────────────────────────────────────────────────────────

type MainView = 'grupos' | 'editar-grupo' | 'novo-comunicado' | 'historico';

export default function AdminComunicadosTab() {
  const [view, setView] = useState<MainView>('grupos');
  const [grupos, setGrupos] = useState<ComunicadoGrupo[]>([]);
  const [historico, setHistorico] = useState<ComunicadoEnviado[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Group editor
  const [editGrupoId, setEditGrupoId] = useState<string | null>(null);
  const [grupoNome, setGrupoNome] = useState('');
  const [grupoFiltros, setGrupoFiltros] = useState<FiltroDef[]>([]);
  const [emailsManuais, setEmailsManuais] = useState('');
  const [addFilterMode, setAddFilterMode] = useState<null | 'picker' | 'plano' | 'cidade'>(null);
  const [pendingPlanos, setPendingPlanos] = useState<PlanLevel[]>([]);
  const [pendingCidade, setPendingCidade] = useState('');
  const [previewEmails, setPreviewEmails] = useState<string[] | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [savingGrupo, setSavingGrupo] = useState(false);

  // Comunicado compose
  const [comGrupoId, setComGrupoId] = useState('');
  const [comAssunto, setComAssunto] = useState('');
  const [comPreview, setComPreview] = useState('');
  const [comCorpo, setComCorpo] = useState('');
  const [confirmStep, setConfirmStep] = useState(false);
  const [resolvedEmails, setResolvedEmails] = useState<string[]>([]);
  const [resolvingEmails, setResolvingEmails] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0, errors: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const [gs, hs] = await Promise.all([
        listDocuments<ComunicadoGrupo>('comunicado_grupos'),
        listDocuments<ComunicadoEnviado>('comunicados_enviados'),
      ]);
      setGrupos(gs.sort((a, b) => b.criado_em.localeCompare(a.criado_em)));
      setHistorico(hs.sort((a, b) => b.enviado_em.localeCompare(a.enviado_em)));
    } catch {
      toast.error('Erro ao carregar comunicados');
    } finally {
      setLoading(false);
    }
  };

  const ensureUsers = async (): Promise<UserProfile[]> => {
    if (allUsers.length > 0) return allUsers;
    const users = await listDocuments<UserProfile>('users');
    setAllUsers(users);
    return users;
  };

  useEffect(() => { load(); }, []);

  // ── Group Editor ─────────────────────────────────────────────────────────

  const openNewGrupo = () => {
    setEditGrupoId(null);
    setGrupoNome('');
    setGrupoFiltros([]);
    setEmailsManuais('');
    setAddFilterMode(null);
    setPreviewEmails(null);
    setView('editar-grupo');
  };

  const openEditGrupo = (g: ComunicadoGrupo) => {
    setEditGrupoId(g.id);
    setGrupoNome(g.nome);
    setGrupoFiltros(g.filtros);
    setEmailsManuais(g.emails_manuais.join('\n'));
    setAddFilterMode(null);
    setPreviewEmails(null);
    setView('editar-grupo');
  };

  const removeFiltro = (idx: number) => {
    setGrupoFiltros(prev => prev.filter((_, i) => i !== idx));
    setPreviewEmails(null);
  };

  const addFiltroSimple = (tipo: FiltroDef['tipo']) => {
    if (grupoFiltros.some(f => f.tipo === tipo)) {
      toast.info('Filtro já adicionado');
      setAddFilterMode(null);
      return;
    }
    setGrupoFiltros(prev => [...prev, { tipo } as FiltroDef]);
    setAddFilterMode(null);
    setPreviewEmails(null);
  };

  const confirmPlanFilter = () => {
    if (pendingPlanos.length === 0) return;
    const idx = grupoFiltros.findIndex(f => f.tipo === 'plano');
    if (idx >= 0) {
      setGrupoFiltros(prev => prev.map((f, i) => i === idx ? { tipo: 'plano', valores: pendingPlanos } : f));
    } else {
      setGrupoFiltros(prev => [...prev, { tipo: 'plano', valores: pendingPlanos }]);
    }
    setPendingPlanos([]);
    setAddFilterMode(null);
    setPreviewEmails(null);
  };

  const confirmCidadeFilter = () => {
    if (!pendingCidade.trim()) return;
    const idx = grupoFiltros.findIndex(f => f.tipo === 'cidade');
    if (idx >= 0) {
      setGrupoFiltros(prev => prev.map((f, i) => i === idx ? { tipo: 'cidade', valor: pendingCidade.trim() } : f));
    } else {
      setGrupoFiltros(prev => [...prev, { tipo: 'cidade', valor: pendingCidade.trim() }]);
    }
    setPendingCidade('');
    setAddFilterMode(null);
    setPreviewEmails(null);
  };

  const handlePreviewGrupo = async () => {
    setLoadingPreview(true);
    try {
      const users = await ensureUsers();
      const draft: ComunicadoGrupo = {
        id: '', nome: grupoNome,
        filtros: grupoFiltros,
        emails_manuais: emailsManuais.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean),
        criado_em: '',
      };
      const emails = await resolveRecipients(draft, users);
      setPreviewEmails(emails);
    } catch {
      toast.error('Erro ao pré-visualizar destinatários');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSaveGrupo = async () => {
    if (!grupoNome.trim()) { toast.error('Dê um nome ao grupo'); return; }
    if (grupoFiltros.length === 0 && !emailsManuais.trim()) {
      toast.error('Adicione pelo menos um filtro ou email manual');
      return;
    }
    setSavingGrupo(true);
    try {
      const id = editGrupoId ?? uuidv4();
      const data: ComunicadoGrupo = {
        id,
        nome: grupoNome.trim(),
        filtros: grupoFiltros,
        emails_manuais: emailsManuais
          .split(/[\n,;]+/)
          .map(e => e.trim())
          .filter(e => e.includes('@')),
        criado_em: editGrupoId
          ? (grupos.find(g => g.id === editGrupoId)?.criado_em ?? new Date().toISOString())
          : new Date().toISOString(),
      };
      await createDocument<ComunicadoGrupo>('comunicado_grupos', id, data);
      toast.success(editGrupoId ? 'Grupo atualizado' : 'Grupo criado');
      await load();
      setView('grupos');
    } catch {
      toast.error('Erro ao salvar grupo');
    } finally {
      setSavingGrupo(false);
    }
  };

  const handleDeleteGrupo = async (g: ComunicadoGrupo) => {
    if (!window.confirm(`Excluir o grupo "${g.nome}"? Esta ação não pode ser desfeita.`)) return;
    await removeDocument('comunicado_grupos', g.id);
    toast.success('Grupo excluído');
    setGrupos(prev => prev.filter(x => x.id !== g.id));
  };

  // ── Comunicado Compose ───────────────────────────────────────────────────

  const openNovoComunicado = () => {
    setComGrupoId('');
    setComAssunto('');
    setComPreview('');
    setComCorpo('');
    setConfirmStep(false);
    setResolvedEmails([]);
    setProgress({ sent: 0, total: 0, errors: 0 });
    setView('novo-comunicado');
  };

  const handlePrepararEnvio = async () => {
    if (!comGrupoId) { toast.error('Selecione um grupo de destinatários'); return; }
    if (!comAssunto.trim()) { toast.error('Preencha o assunto do email'); return; }
    if (!comCorpo.trim()) { toast.error('Escreva o corpo do email'); return; }
    setResolvingEmails(true);
    try {
      const users = await ensureUsers();
      const grupo = grupos.find(g => g.id === comGrupoId)!;
      const emails = await resolveRecipients(grupo, users);
      if (emails.length === 0) {
        toast.error('Nenhum destinatário encontrado para este grupo');
        return;
      }
      setResolvedEmails(emails);
      setConfirmStep(true);
    } catch {
      toast.error('Erro ao resolver destinatários');
    } finally {
      setResolvingEmails(false);
    }
  };

  const handleEnviar = async () => {
    const grupo = grupos.find(g => g.id === comGrupoId)!;
    setSending(true);
    setProgress({ sent: 0, total: resolvedEmails.length, errors: 0 });
    let erros = 0;

    for (const email of resolvedEmails) {
      try {
        await Email.custom(email, comAssunto, comCorpo, comPreview || undefined);
        setProgress(p => ({ ...p, sent: p.sent + 1 }));
      } catch {
        erros++;
        setProgress(p => ({ ...p, sent: p.sent + 1, errors: p.errors + 1 }));
      }
    }

    const status: ComunicadoEnviado['status'] =
      erros === 0 ? 'enviado' : erros === resolvedEmails.length ? 'erro' : 'parcial';

    const id = uuidv4();
    await createDocument<ComunicadoEnviado>('comunicados_enviados', id, {
      id,
      assunto: comAssunto,
      preview_text: comPreview || undefined,
      corpo: comCorpo,
      grupo_nome: grupo.nome,
      total: resolvedEmails.length,
      enviado_em: new Date().toISOString(),
      status,
      erros: erros > 0 ? erros : undefined,
    });

    setSending(false);
    toast.success(
      erros === 0
        ? `Comunicado enviado para ${resolvedEmails.length} destinatários`
        : `Enviado com ${erros} erro(s) de ${resolvedEmails.length}`
    );
    await load();
    setView('historico');
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Carregando...</span>
      </div>
    );
  }

  // ── Grupos view ──────────────────────────────────────────────────────────
  if (view === 'grupos') {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-foreground">Comunicados</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Envie emails para grupos de clientes Tovia</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setView('historico')} className="gap-1.5">
              <History className="w-4 h-4" /> Histórico
            </Button>
            <Button size="sm" onClick={openNovoComunicado} className="gap-1.5">
              <Send className="w-4 h-4" /> Novo comunicado
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Grupos de destinatários</p>
            <Button variant="outline" size="sm" onClick={openNewGrupo} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Novo grupo
            </Button>
          </div>

          {grupos.length === 0 ? (
            <div className="border border-dashed rounded-xl p-8 text-center space-y-2">
              <Users className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-foreground">Nenhum grupo criado</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Crie grupos de destinatários com filtros para segmentar seus comunicados.
              </p>
              <Button variant="outline" size="sm" onClick={openNewGrupo} className="mt-2 gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Criar primeiro grupo
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {grupos.map(g => (
                <div key={g.id} className="border rounded-xl p-4 bg-card flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{g.nome}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {g.filtros.map((f, i) => {
                        const Icon = filtroIcon(f.tipo);
                        return (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5"
                          >
                            <Icon className="w-3 h-3" />
                            {filtroLabel(f)}
                          </span>
                        );
                      })}
                      {g.emails_manuais.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                          <Mail className="w-3 h-3" />
                          {g.emails_manuais.length} email{g.emails_manuais.length !== 1 ? 's' : ''} manual{g.emails_manuais.length !== 1 ? 'is' : ''}
                        </span>
                      )}
                      {g.filtros.length === 0 && g.emails_manuais.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">Sem filtros</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditGrupo(g)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteGrupo(g)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Group editor view ────────────────────────────────────────────────────
  if (view === 'editar-grupo') {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('grupos')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-black text-foreground">
            {editGrupoId ? 'Editar grupo' : 'Novo grupo'}
          </h2>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Nome do grupo</label>
          <Input
            placeholder="Ex: Clientes Koách — São Paulo"
            value={grupoNome}
            onChange={e => setGrupoNome(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Filtros</label>
          <p className="text-xs text-muted-foreground">
            Os filtros são combinados por união — qualquer cliente que corresponda a pelo menos um será incluído.
          </p>

          {grupoFiltros.length > 0 && (
            <div className="space-y-1.5">
              {grupoFiltros.map((f, i) => {
                const Icon = filtroIcon(f.tipo);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2"
                  >
                    <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-sm text-foreground flex-1">{filtroLabel(f)}</span>
                    <button
                      onClick={() => removeFiltro(i)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {addFilterMode === null && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAddFilterMode('picker')}>
              <Plus className="w-3.5 h-3.5" /> Adicionar filtro
            </Button>
          )}

          {addFilterMode === 'picker' && (
            <div className="border rounded-xl p-3 space-y-1 bg-card">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Selecione um filtro
              </p>
              {FILTER_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const alreadyAdded = grupoFiltros.some(f => f.tipo === opt.tipo);
                return (
                  <button
                    key={opt.tipo}
                    disabled={alreadyAdded}
                    onClick={() => {
                      if (opt.tipo === 'plano') { setPendingPlanos([]); setAddFilterMode('plano'); }
                      else if (opt.tipo === 'cidade') { setPendingCidade(''); setAddFilterMode('cidade'); }
                      else addFiltroSimple(opt.tipo);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                      alreadyAdded
                        ? 'text-muted-foreground/40 cursor-not-allowed'
                        : 'hover:bg-muted text-foreground cursor-pointer'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {opt.label}
                    {alreadyAdded && (
                      <span className="ml-auto text-xs text-muted-foreground/40">já adicionado</span>
                    )}
                  </button>
                );
              })}
              <div className="pt-1 border-t">
                <button
                  onClick={() => setAddFilterMode(null)}
                  className="text-xs text-muted-foreground hover:text-foreground px-3 py-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {addFilterMode === 'plano' && (
            <div className="border rounded-xl p-3 space-y-2 bg-card">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Selecione os planos</p>
              {ALL_PLANS.map(p => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={pendingPlanos.includes(p)}
                    onChange={e =>
                      setPendingPlanos(prev =>
                        e.target.checked ? [...prev, p] : prev.filter(x => x !== p)
                      )
                    }
                  />
                  <span className="text-sm text-foreground">{PLAN_LABELS[p]}</span>
                </label>
              ))}
              <div className="flex gap-2 pt-1">
                <Button size="sm" disabled={pendingPlanos.length === 0} onClick={confirmPlanFilter}>
                  Confirmar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAddFilterMode(null)}>Cancelar</Button>
              </div>
            </div>
          )}

          {addFilterMode === 'cidade' && (
            <div className="border rounded-xl p-3 space-y-2 bg-card">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cidade</p>
              <Input
                placeholder="Ex: São Paulo"
                value={pendingCidade}
                onChange={e => setPendingCidade(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmCidadeFilter()}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" disabled={!pendingCidade.trim()} onClick={confirmCidadeFilter}>
                  Confirmar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAddFilterMode(null)}>Cancelar</Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">
            Emails manuais <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <p className="text-xs text-muted-foreground">Separe por vírgula, ponto-e-vírgula ou nova linha.</p>
          <Textarea
            rows={3}
            placeholder={'email@exemplo.com\noutro@email.com'}
            value={emailsManuais}
            onChange={e => { setEmailsManuais(e.target.value); setPreviewEmails(null); }}
          />
        </div>

        <div className="space-y-2">
          <Button
            variant="outline" size="sm" className="gap-1.5"
            onClick={handlePreviewGrupo}
            disabled={loadingPreview}
          >
            {loadingPreview
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <Eye className="w-3.5 h-3.5" />
            }
            Pré-visualizar destinatários
          </Button>

          {previewEmails !== null && (
            <div className="border rounded-xl p-3 bg-muted/30 space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {previewEmails.length} destinatário{previewEmails.length !== 1 ? 's' : ''} encontrado{previewEmails.length !== 1 ? 's' : ''}
              </p>
              {previewEmails.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {previewEmails.map(e => (
                    <span
                      key={e}
                      className="text-xs bg-background border rounded-full px-2 py-0.5 text-muted-foreground font-mono"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button onClick={handleSaveGrupo} disabled={savingGrupo} className="gap-1.5">
            {savingGrupo && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {editGrupoId ? 'Salvar alterações' : 'Criar grupo'}
          </Button>
          <Button variant="ghost" onClick={() => setView('grupos')}>Cancelar</Button>
        </div>
      </div>
    );
  }

  // ── Novo comunicado view ─────────────────────────────────────────────────
  if (view === 'novo-comunicado') {
    const grupoSelecionado = grupos.find(g => g.id === comGrupoId);

    if (sending) {
      const pct = progress.total > 0 ? Math.round((progress.sent / progress.total) * 100) : 0;
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-6 max-w-sm mx-auto text-center">
          <div className="w-14 h-14 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Send className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground">Enviando comunicado...</p>
            <p className="text-sm text-muted-foreground mt-1">
              {progress.sent} de {progress.total} emails enviados
            </p>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Não feche esta página.</p>
        </div>
      );
    }

    if (confirmStep && grupoSelecionado) {
      return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setConfirmStep(false)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-black text-foreground">Confirmar envio</h2>
          </div>

          <div className="border rounded-xl p-4 space-y-3 bg-card">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Grupo:</span>
              <span className="text-sm font-semibold text-foreground">{grupoSelecionado.nome}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Destinatários:</span>
              <span className="text-sm font-semibold text-foreground">{resolvedEmails.length} emails</span>
            </div>
            <div className="pt-2 border-t space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Assunto</p>
              <p className="text-sm text-foreground">{comAssunto}</p>
            </div>
            {comPreview && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Preview</p>
                <p className="text-sm text-muted-foreground italic">{comPreview}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Corpo</p>
              <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">{comCorpo}</p>
            </div>
          </div>

          <div className="border rounded-xl p-3 bg-muted/30">
            <p className="text-xs font-semibold text-foreground mb-1.5">
              Destinatários ({resolvedEmails.length})
            </p>
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
              {resolvedEmails.map(e => (
                <span
                  key={e}
                  className="text-xs bg-background border rounded-full px-2 py-0.5 text-muted-foreground font-mono"
                >
                  {e}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button onClick={handleEnviar} className="gap-1.5">
              <Send className="w-4 h-4" />
              Enviar para {resolvedEmails.length} pessoa{resolvedEmails.length !== 1 ? 's' : ''}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmStep(false)}>Voltar</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('grupos')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-black text-foreground">Novo comunicado</h2>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Grupo de destinatários</label>
          {grupos.length === 0 ? (
            <div className="border border-dashed rounded-xl p-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Nenhum grupo criado ainda.</p>
              <Button
                variant="outline" size="sm"
                onClick={() => { setView('grupos'); setTimeout(openNewGrupo, 50); }}
              >
                Criar grupo
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {grupos.map(g => (
                <button
                  key={g.id}
                  onClick={() => setComGrupoId(g.id === comGrupoId ? '' : g.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left',
                    comGrupoId === g.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                    comGrupoId === g.id ? 'border-primary' : 'border-muted-foreground/30'
                  )}>
                    {comGrupoId === g.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-medium text-foreground">{g.nome}</span>
                  <span className="ml-auto text-xs text-muted-foreground shrink-0">
                    {g.filtros.length} filtro{g.filtros.length !== 1 ? 's' : ''}
                    {g.emails_manuais.length > 0 && ` + ${g.emails_manuais.length} manual`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Assunto</label>
          <Input
            placeholder="Ex: Novidade no Tovia — confira!"
            value={comAssunto}
            onChange={e => setComAssunto(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">
            Texto de preview <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <Input
            placeholder="Aparece abaixo do assunto na caixa de entrada"
            value={comPreview}
            onChange={e => setComPreview(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Corpo do email</label>
          <Textarea
            rows={8}
            placeholder="Escreva o conteúdo do seu comunicado aqui..."
            value={comCorpo}
            onChange={e => setComCorpo(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            O email será enviado com o template visual do Tovia.
          </p>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button
            onClick={handlePrepararEnvio}
            disabled={resolvingEmails || !comGrupoId || !comAssunto.trim() || !comCorpo.trim()}
            className="gap-1.5"
          >
            {resolvingEmails
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Resolvendo...</>
              : <><Eye className="w-4 h-4" /> Preparar envio</>
            }
          </Button>
          <Button variant="ghost" onClick={() => setView('grupos')}>Cancelar</Button>
        </div>
      </div>
    );
  }

  // ── Histórico view ───────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('grupos')}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-black text-foreground">Histórico de envios</h2>
        <Button variant="outline" size="sm" onClick={load} className="ml-auto gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </Button>
      </div>

      {historico.length === 0 ? (
        <div className="border border-dashed rounded-xl p-8 text-center space-y-2">
          <History className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium text-foreground">Nenhum comunicado enviado ainda</p>
          <p className="text-xs text-muted-foreground">Os comunicados enviados aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {historico.map(h => {
            const date = new Date(h.enviado_em);
            const StatusIcon = h.status === 'enviado' ? CheckCircle : h.status === 'erro' ? AlertCircle : Megaphone;
            const statusColor =
              h.status === 'enviado'
                ? 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400'
                : h.status === 'erro'
                ? 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400'
                : 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400';
            const statusLabel =
              h.status === 'enviado' ? 'Enviado' : h.status === 'erro' ? 'Erro' : 'Parcial';

            return (
              <div key={h.id} className="border rounded-xl p-4 bg-card space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{h.assunto}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {h.grupo_nome} · {h.total} destinatário{h.total !== 1 ? 's' : ''}
                      {h.erros ? ` · ${h.erros} erro${h.erros !== 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                  <div className={cn(
                    'flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 shrink-0',
                    statusColor
                  )}>
                    <StatusIcon className="w-3 h-3" />
                    {statusLabel}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {' '}às{' '}
                  {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
