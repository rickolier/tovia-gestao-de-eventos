import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '~/services/firebase';
import { listDocuments, createDocument, removeDocument } from '~/services/firestore';
import { Email } from '~/services/email';
import { UserProfile, PlanLevel } from '~/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

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
  emails: string[];
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

export type { FiltroDef, ComunicadoGrupo, ComunicadoEnviado };

export type MainView = 'grupos' | 'editar-grupo' | 'novo-comunicado' | 'historico';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function applyFilters(filtros: FiltroDef[], allUsers: UserProfile[]): Promise<string[]> {
  if (filtros.length === 0) return [];
  let matches = allUsers.filter(u => !u.desativado && !u.isDemo);

  for (const filtro of filtros) {
    if (filtro.tipo === 'plano') {
      matches = matches.filter(u => u.plano && filtro.valores.includes(u.plano));
    } else if (filtro.tipo === 'sem_plano') {
      matches = matches.filter(u => !u.plano || u.plano === 'chinam');
    } else if (filtro.tipo === 'gateway_conectado') {
      matches = matches.filter(u => u.gateway_connected);
    } else if (filtro.tipo === 'cidade') {
      const lc = filtro.valor.toLowerCase();
      matches = matches.filter(u => u.cidade?.toLowerCase().includes(lc));
    } else if (filtro.tipo === 'eventos_ativos') {
      const snap = await getDocs(query(collection(db, 'eventos'), where('ativo', '==', true)));
      const uids = new Set(snap.docs.map(d => d.data().criado_por as string));
      matches = matches.filter(u => uids.has(u.uid));
    } else if (filtro.tipo === 'eventos_inativos') {
      const snap = await getDocs(collection(db, 'eventos'));
      const allUids = new Set(snap.docs.map(d => d.data().criado_por as string));
      const activeUids = new Set(snap.docs.filter(d => d.data().ativo).map(d => d.data().criado_por as string));
      matches = matches.filter(u => allUids.has(u.uid) && !activeUids.has(u.uid));
    } else if (filtro.tipo === 'tickets_abertos') {
      const tickets = await listDocuments<{ cliente_email?: string; status: string }>('tickets', [
        where('status', 'in', ['aberto', 'em_andamento']),
      ]);
      const ticketEmails = new Set(tickets.filter(t => t.cliente_email).map(t => t.cliente_email!.toLowerCase()));
      matches = matches.filter(u => ticketEmails.has(u.email.toLowerCase()));
    }
  }

  return matches.map(u => u.email.toLowerCase());
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const DEFAULT_ASSINATURA = 'Obrigado!\nEquipe Tovia\n\nTovia Gestão de Eventos\ntoviaapp.com.br';

export function useAdminComunicados() {
  const [view, setView]       = useState<MainView>('grupos');
  const [grupos, setGrupos]   = useState<ComunicadoGrupo[]>([]);
  const [historico, setHistorico] = useState<ComunicadoEnviado[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Group editor
  const [editGrupoId, setEditGrupoId]   = useState<string | null>(null);
  const [grupoNome, setGrupoNome]       = useState('');
  const [grupoEmails, setGrupoEmails]   = useState<string[]>([]);
  const [emailInput, setEmailInput]     = useState('');
  const [savingGrupo, setSavingGrupo]   = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  // Filter section
  const [filterOpen, setFilterOpen]           = useState(false);
  const [pendingFiltros, setPendingFiltros]   = useState<FiltroDef[]>([]);
  const [addFilterMode, setAddFilterMode]     = useState<null | 'picker' | 'plano' | 'cidade'>(null);
  const [pendingPlanos, setPendingPlanos]     = useState<PlanLevel[]>([]);
  const [pendingCidade, setPendingCidade]     = useState('');
  const [applyingFilters, setApplyingFilters] = useState(false);

  // Comunicado compose
  const [comGrupoId, setComGrupoId]       = useState('');
  const [comAssunto, setComAssunto]       = useState('');
  const [comPreview, setComPreview]       = useState('');
  const [comCorpo, setComCorpo]           = useState('');
  const [comAssinatura, setComAssinatura] = useState(DEFAULT_ASSINATURA);
  const [editorKey, setEditorKey]         = useState(0);
  const [confirmStep, setConfirmStep]     = useState(false);
  const [sending, setSending]             = useState(false);
  const [progress, setProgress]           = useState({ sent: 0, total: 0, errors: 0 });

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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!selectedEmail) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        setGrupoEmails(prev => prev.filter(x => x !== selectedEmail));
        setSelectedEmail(null);
        e.preventDefault();
      }
      if (e.key === 'Escape') setSelectedEmail(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedEmail]);

  // ── Group Editor ────────────────────────────────────────────────────────────

  const openNewGrupo = () => {
    setEditGrupoId(null);
    setGrupoNome('');
    setGrupoEmails([]);
    setEmailInput('');
    setSelectedEmail(null);
    setFilterOpen(false);
    setPendingFiltros([]);
    setAddFilterMode(null);
    setView('editar-grupo');
  };

  const openEditGrupo = (g: ComunicadoGrupo) => {
    setEditGrupoId(g.id);
    setGrupoNome(g.nome);
    setGrupoEmails(g.emails ?? []);
    setEmailInput('');
    setSelectedEmail(null);
    setFilterOpen(false);
    setPendingFiltros([]);
    setAddFilterMode(null);
    setView('editar-grupo');
  };

  const addEmailManual = () => {
    const raw = emailInput.trim().toLowerCase();
    if (!raw.includes('@')) { toast.error('Email inválido'); return; }
    if (grupoEmails.includes(raw)) { toast.info('Email já está na lista'); return; }
    setGrupoEmails(prev => [...prev, raw]);
    setEmailInput('');
  };

  const removeEmail = (email: string) => {
    setGrupoEmails(prev => prev.filter(e => e !== email));
    if (selectedEmail === email) setSelectedEmail(null);
  };

  const addFiltroSimple = (tipo: FiltroDef['tipo']) => {
    if (pendingFiltros.some(f => f.tipo === tipo)) { toast.info('Filtro já adicionado'); setAddFilterMode(null); return; }
    setPendingFiltros(prev => [...prev, { tipo } as FiltroDef]);
    setAddFilterMode(null);
  };

  const confirmPlanFilter = () => {
    if (pendingPlanos.length === 0) return;
    const idx = pendingFiltros.findIndex(f => f.tipo === 'plano');
    if (idx >= 0) setPendingFiltros(prev => prev.map((f, i) => i === idx ? { tipo: 'plano', valores: pendingPlanos } : f));
    else setPendingFiltros(prev => [...prev, { tipo: 'plano', valores: pendingPlanos }]);
    setPendingPlanos([]);
    setAddFilterMode(null);
  };

  const confirmCidadeFilter = () => {
    if (!pendingCidade.trim()) return;
    const idx = pendingFiltros.findIndex(f => f.tipo === 'cidade');
    if (idx >= 0) setPendingFiltros(prev => prev.map((f, i) => i === idx ? { tipo: 'cidade', valor: pendingCidade.trim() } : f));
    else setPendingFiltros(prev => [...prev, { tipo: 'cidade', valor: pendingCidade.trim() }]);
    setPendingCidade('');
    setAddFilterMode(null);
  };

  const handleApplyFilters = async () => {
    setApplyingFilters(true);
    try {
      const users = await ensureUsers();
      const resolved = await applyFilters(pendingFiltros, users);
      const current = new Set(grupoEmails);
      const added = resolved.filter(e => !current.has(e));
      setGrupoEmails(prev => [...prev, ...added]);
      toast.success(
        added.length > 0
          ? `${added.length} email${added.length !== 1 ? 's' : ''} adicionado${added.length !== 1 ? 's' : ''}`
          : 'Nenhum email novo encontrado'
      );
      setFilterOpen(false);
      setPendingFiltros([]);
      setAddFilterMode(null);
    } catch {
      toast.error('Erro ao aplicar filtros');
    } finally {
      setApplyingFilters(false);
    }
  };

  const handleSaveGrupo = async () => {
    if (!grupoNome.trim()) { toast.error('Dê um nome ao grupo'); return; }
    if (grupoEmails.length === 0) { toast.error('Adicione pelo menos um email ao grupo'); return; }
    setSavingGrupo(true);
    try {
      const id = editGrupoId ?? uuidv4();
      await createDocument<ComunicadoGrupo>('comunicado_grupos', id, {
        id, nome: grupoNome.trim(), emails: grupoEmails,
        criado_em: editGrupoId
          ? (grupos.find(g => g.id === editGrupoId)?.criado_em ?? new Date().toISOString())
          : new Date().toISOString(),
      });
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
    if (!window.confirm(`Excluir o grupo "${g.nome}"?`)) return;
    await removeDocument('comunicado_grupos', g.id);
    toast.success('Grupo excluído');
    setGrupos(prev => prev.filter(x => x.id !== g.id));
  };

  // ── Comunicado Compose ──────────────────────────────────────────────────────

  const openNovoComunicado = () => {
    setComGrupoId('');
    setComAssunto('');
    setComPreview('');
    setComCorpo('');
    setComAssinatura(DEFAULT_ASSINATURA);
    setConfirmStep(false);
    setProgress({ sent: 0, total: 0, errors: 0 });
    setEditorKey(k => k + 1);
    setView('novo-comunicado');
  };

  const handlePrepararEnvio = (isEditorEmpty: (html: string) => boolean) => {
    if (!comGrupoId) { toast.error('Selecione um grupo de destinatários'); return; }
    if (!comAssunto.trim()) { toast.error('Preencha o assunto do email'); return; }
    if (isEditorEmpty(comCorpo)) { toast.error('Escreva o corpo do email'); return; }
    const grupo = grupos.find(g => g.id === comGrupoId)!;
    if (!grupo.emails.length) { toast.error('Este grupo não tem destinatários'); return; }
    setConfirmStep(true);
  };

  const handleEnviar = async () => {
    const grupo = grupos.find(g => g.id === comGrupoId)!;
    const emails = grupo.emails;

    const users = await ensureUsers();
    const nameMap = new Map<string, string>();
    for (const u of users) {
      if (u.email) {
        const firstName = (u.nome || '').split(' ')[0].trim();
        if (firstName) nameMap.set(u.email.toLowerCase(), firstName);
      }
    }

    setSending(true);
    setProgress({ sent: 0, total: emails.length, errors: 0 });
    let erros = 0;

    const P = 'margin:0 0 14px;color:#1a1a1a;font-size:15px;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,sans-serif';
    const SIG = 'margin:0 0 6px;color:#6b7280;font-size:13px;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,sans-serif';
    const HR = '<hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px"/>';

    for (const email of emails) {
      try {
        const nome = nameMap.get(email.toLowerCase());
        const greetingHtml = nome
          ? `<p style="${P}">Olá, <strong>${nome}</strong>, tudo bem?</p>${HR}`
          : `<p style="${P}">Olá, tudo bem?</p>${HR}`;
        const bodyHtml = `<div style="${P}">${comCorpo}</div>`;
        const signatureHtml = comAssinatura.trim()
          ? `<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0 12px"/>${
              comAssinatura.trim().split('\n').map(line =>
                line.trim() ? `<p style="${SIG}">${line}</p>` : ''
              ).join('')
            }`
          : '';
        const bodyFinal = greetingHtml + bodyHtml + signatureHtml;
        await Email.customHtml(email, comAssunto, bodyFinal, comPreview || undefined);
        setProgress(p => ({ ...p, sent: p.sent + 1 }));
      } catch {
        erros++;
        setProgress(p => ({ ...p, sent: p.sent + 1, errors: p.errors + 1 }));
      }
    }

    const status: ComunicadoEnviado['status'] =
      erros === 0 ? 'enviado' : erros === emails.length ? 'erro' : 'parcial';

    const id = uuidv4();
    await createDocument<ComunicadoEnviado>('comunicados_enviados', id, {
      id, assunto: comAssunto, preview_text: comPreview || undefined,
      corpo: comCorpo, grupo_nome: grupo.nome, total: emails.length,
      enviado_em: new Date().toISOString(), status,
      erros: erros > 0 ? erros : undefined,
    });

    setSending(false);
    toast.success(erros === 0
      ? `Comunicado enviado para ${emails.length} destinatários`
      : `Enviado com ${erros} erro(s) de ${emails.length}`
    );
    await load();
    setView('historico');
  };

  return {
    view, setView,
    grupos, historico, loading, allUsers, load,
    editGrupoId,
    grupoNome, setGrupoNome,
    grupoEmails, setGrupoEmails,
    emailInput, setEmailInput,
    savingGrupo,
    selectedEmail, setSelectedEmail,
    filterOpen, setFilterOpen,
    pendingFiltros, setPendingFiltros,
    addFilterMode, setAddFilterMode,
    pendingPlanos, setPendingPlanos,
    pendingCidade, setPendingCidade,
    applyingFilters,
    comGrupoId, setComGrupoId,
    comAssunto, setComAssunto,
    comPreview, setComPreview,
    comCorpo, setComCorpo,
    comAssinatura, setComAssinatura,
    editorKey,
    confirmStep, setConfirmStep,
    sending, progress,
    DEFAULT_ASSINATURA,
    openNewGrupo, openEditGrupo,
    addEmailManual, removeEmail,
    addFiltroSimple, confirmPlanFilter, confirmCidadeFilter,
    handleApplyFilters, handleSaveGrupo, handleDeleteGrupo,
    openNovoComunicado, handlePrepararEnvio, handleEnviar,
  };
}
