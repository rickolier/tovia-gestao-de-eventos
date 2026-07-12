import React, { useEffect, useRef, useState } from 'react';
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
  ChevronLeft, X, Mail, CheckCircle, AlertCircle, RefreshCw,
  Filter, Zap, Ticket, MapPin, CreditCard, CalendarCheck, CalendarX,
  Bold, Italic, Underline as UnderlineIcon, Link2, Link2Off, ChevronDown, ImagePlus,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import UnderlineExtension from '@tiptap/extension-underline';
import ImageExtension from '@tiptap/extension-image';

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
}> = [
  { tipo: 'plano',             label: 'Por plano',                icon: CreditCard    },
  { tipo: 'cidade',            label: 'Por cidade',               icon: MapPin        },
  { tipo: 'gateway_conectado', label: 'Com gateway conectado',    icon: Zap           },
  { tipo: 'eventos_ativos',    label: 'Com evento ativo',         icon: CalendarCheck },
  { tipo: 'eventos_inativos',  label: 'Eventos (todos inativos)', icon: CalendarX     },
  { tipo: 'tickets_abertos',   label: 'Com ticket aberto',        icon: Ticket        },
  { tipo: 'sem_plano',         label: 'Sem plano pago',           icon: Users         },
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isEditorEmpty(html: string) {
  return !html || !html.replace(/<[^>]*>/g, '').trim();
}

// ─── RichTextEditor ───────────────────────────────────────────────────────────

const FONT_SIZE_OPTIONS = [
  { label: 'Normal', value: undefined },
  { label: 'Médio',  value: '17px' },
  { label: 'Grande', value: '20px' },
  { label: 'Título', value: '24px' },
];

function RichTextEditor({
  value, onChange, placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageOpen, setImageOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [sizeOpen, setSizeOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      UnderlineExtension,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { style: 'color:#1a7a45;text-decoration:underline' },
      }),
      ImageExtension.configure({
        HTMLAttributes: { style: 'max-width:100%;height:auto;border-radius:6px;margin:8px 0;display:block' },
      }),
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class: 'min-h-[160px] px-3 py-3 text-sm focus:outline-none leading-relaxed',
        'data-placeholder': placeholder ?? '',
      },
    },
  });

  const activeSize = editor?.getAttributes('textStyle').fontSize as string | undefined;
  const activeSizeLabel = FONT_SIZE_OPTIONS.find(o => o.value === activeSize)?.label ?? 'Normal';

  const applySize = (size: string | undefined) => {
    if (!editor) return;
    if (size) {
      (editor.chain().focus() as any).setFontSize(size).run();
    } else {
      (editor.chain().focus() as any).unsetFontSize().run();
    }
    setSizeOpen(false);
  };

  const toggleLink = () => {
    if (!editor) return;
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    setLinkUrl('');
    setLinkOpen(true);
  };

  const applyLink = () => {
    if (!editor || !linkUrl.trim()) return;
    const href = linkUrl.startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    editor.chain().focus().setLink({ href }).run();
    setLinkOpen(false);
  };

  const openImageInput = () => {
    setImageUrl('');
    setLinkOpen(false);
    setImageOpen(true);
  };

  const applyImage = () => {
    if (!editor || !imageUrl.trim()) return;
    const src = imageUrl.startsWith('http') ? imageUrl.trim() : `https://${imageUrl.trim()}`;
    editor.chain().focus().setImage({ src }).run();
    setImageOpen(false);
  };

  const ToolbarBtn = ({
    active, onClick, title, children,
  }: {
    active?: boolean; onClick: () => void; title: string; children: React.ReactNode;
  }) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        'h-7 w-7 rounded flex items-center justify-center transition-colors shrink-0',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="border rounded-xl overflow-visible focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30 rounded-t-xl flex-wrap">
        {/* Font size */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setSizeOpen(o => !o); }}
            className="h-7 flex items-center gap-1 px-2 rounded text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {activeSizeLabel}
            <ChevronDown className="w-3 h-3" />
          </button>
          {sizeOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-popover border rounded-lg shadow-md py-1 min-w-[110px]">
              {FONT_SIZE_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); applySize(opt.value); }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors',
                    activeSize === opt.value && 'text-primary font-semibold'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        <ToolbarBtn active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} title="Negrito">
          <Bold className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Itálico">
          <Italic className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()} title="Sublinhado">
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <div className="w-px h-4 bg-border mx-1" />

        <ToolbarBtn active={editor?.isActive('link')} onClick={toggleLink} title={editor?.isActive('link') ? 'Remover link' : 'Inserir link'}>
          {editor?.isActive('link') ? <Link2Off className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
        </ToolbarBtn>
        <ToolbarBtn active={false} onClick={openImageInput} title="Inserir imagem ou GIF">
          <ImagePlus className="w-3.5 h-3.5" />
        </ToolbarBtn>
      </div>

      {/* Link input */}
      {linkOpen && (
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/20">
          <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            autoFocus
            type="url"
            placeholder="https://..."
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') setLinkOpen(false); }}
            className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground/50"
          />
          <button type="button" onMouseDown={e => { e.preventDefault(); applyLink(); }}
            className="text-xs font-semibold text-primary hover:underline">OK</button>
          <button type="button" onMouseDown={e => { e.preventDefault(); setLinkOpen(false); }}
            className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Image input */}
      {imageOpen && (
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/20">
          <ImagePlus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            autoFocus
            type="url"
            placeholder="URL da imagem ou GIF (https://...)"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyImage(); if (e.key === 'Escape') setImageOpen(false); }}
            className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground/50"
          />
          <button type="button" onMouseDown={e => { e.preventDefault(); applyImage(); }}
            className="text-xs font-semibold text-primary hover:underline">Inserir</button>
          <button type="button" onMouseDown={e => { e.preventDefault(); setImageOpen(false); }}
            className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Editor area */}
      <style>{`
        .tiptap-editor .ProseMirror p { margin: 0 0 10px; }
        .tiptap-editor .ProseMirror p:last-child { margin-bottom: 0; }
        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground) / 0.5);
          pointer-events: none;
          float: left;
          height: 0;
          font-style: italic;
        }
        .tiptap-editor .ProseMirror a { color:#1a7a45; text-decoration:underline; }
        .tiptap-editor .ProseMirror img { max-width:100%; height:auto; border-radius:6px; margin:8px 0; display:block; cursor:default; }
        .tiptap-editor .ProseMirror img.ProseMirror-selectednode { outline: 2px solid #1a7a45; outline-offset:2px; border-radius:6px; }
      `}</style>
      <div className="tiptap-editor" onClick={() => { if (sizeOpen) setSizeOpen(false); }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// ─── EmailPreviewPanel ────────────────────────────────────────────────────────

function EmailPreviewPanel({ assunto, corpo, previewText, assinatura }: {
  assunto: string;
  corpo: string;
  previewText: string;
  assinatura: string;
}) {
  return (
    <div className="space-y-3 sticky top-4">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Preview em tempo real</span>
      </div>

      {/* Simulação da caixa de entrada */}
      <div className="border rounded-lg p-3 bg-muted/40 space-y-0.5">
        <p className="text-[11px] font-semibold text-foreground truncate">
          {assunto || <span className="text-muted-foreground italic font-normal">Assunto do email...</span>}
        </p>
        {previewText ? (
          <p className="text-[10px] text-muted-foreground truncate">{previewText}</p>
        ) : (
          <p className="text-[10px] text-muted-foreground/40 truncate italic">texto de preview...</p>
        )}
      </div>

      {/* Template do email */}
      <div className="border rounded-xl overflow-hidden shadow-sm text-left">
        {/* Header verde */}
        <div className="bg-[#1B5E38] px-6 py-5 text-center">
          <p className="text-white font-black text-xl tracking-[-0.03em]">tovia</p>
          <p className="text-white/55 text-[8px] font-semibold uppercase tracking-[0.18em] mt-0.5">gestão de eventos</p>
        </div>

        {/* Corpo */}
        <div className="bg-white dark:bg-zinc-900 px-5 py-5 space-y-4">
          <p className="text-[12px] text-gray-500 dark:text-zinc-400">
            Olá,{' '}
            <span className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 rounded-md px-1.5 py-0.5 font-bold text-[11px] font-mono">
              {'{nome}'}
            </span>
            , tudo bem?
          </p>

          <div className="border-t border-gray-100 dark:border-zinc-800" />

          {corpo && !isEditorEmpty(corpo) ? (
            <div
              className="text-[12px] text-gray-700 dark:text-zinc-300 leading-relaxed min-h-12 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:text-[#1a7a45] [&_a]:underline [&_strong]:font-bold [&_em]:italic [&_u]:underline"
              dangerouslySetInnerHTML={{ __html: corpo }}
            />
          ) : (
            <p className="text-[12px] text-gray-300 dark:text-zinc-600 italic min-h-12">
              O conteúdo do seu comunicado aparecerá aqui...
            </p>
          )}

          {assinatura && (
            <>
              <div className="border-t border-gray-100 dark:border-zinc-800" />
              <div className="text-[11px] text-gray-400 dark:text-zinc-500 whitespace-pre-wrap leading-relaxed">
                {assinatura}
              </div>
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className="bg-gray-50 dark:bg-zinc-800/60 border-t border-gray-100 dark:border-zinc-800 px-4 py-3 text-center space-y-0.5">
          <p className="text-[9px] text-gray-400 dark:text-zinc-500">
            © 2026 Tovia Gestão de Eventos · Todos os direitos reservados
          </p>
          <p className="text-[9px] text-gray-400 dark:text-zinc-500">
            Você recebeu este e-mail porque tem uma conta na plataforma Tovia.
          </p>
        </div>
      </div>
    </div>
  );
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
  const [grupoEmails, setGrupoEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [savingGrupo, setSavingGrupo] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  // Ephemeral filter section
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingFiltros, setPendingFiltros] = useState<FiltroDef[]>([]);
  const [addFilterMode, setAddFilterMode] = useState<null | 'picker' | 'plano' | 'cidade'>(null);
  const [pendingPlanos, setPendingPlanos] = useState<PlanLevel[]>([]);
  const [pendingCidade, setPendingCidade] = useState('');
  const [applyingFilters, setApplyingFilters] = useState(false);

  // Comunicado compose
  const DEFAULT_ASSINATURA = 'Obrigado!\nEquipe Tovia\n\nTovia Gestão de Eventos\ntoviaapp.com.br';
  const [comGrupoId, setComGrupoId] = useState('');
  const [comAssunto, setComAssunto] = useState('');
  const [comPreview, setComPreview] = useState('');
  const [comCorpo, setComCorpo] = useState('');
  const [comAssinatura, setComAssinatura] = useState(DEFAULT_ASSINATURA);
  const [editorKey, setEditorKey] = useState(0);
  const [confirmStep, setConfirmStep] = useState(false);
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

  // Keyboard: Delete/Backspace removes selected chip; Esc deselects
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

  // ── Group Editor ─────────────────────────────────────────────────────────

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
        id,
        nome: grupoNome.trim(),
        emails: grupoEmails,
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

  // ── Comunicado Compose ───────────────────────────────────────────────────

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

  const handlePrepararEnvio = () => {
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

    // Resolve first names in batch before sending
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
                Crie grupos de destinatários. Use filtros para popular a lista ou adicione emails manualmente.
              </p>
              <Button variant="outline" size="sm" onClick={openNewGrupo} className="mt-2 gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Criar primeiro grupo
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {grupos.map(g => (
                <div key={g.id} className="border rounded-xl p-4 bg-card flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{g.nome}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(g.emails ?? []).length} destinatário{(g.emails ?? []).length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditGrupo(g)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteGrupo(g)}>
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

  // ── Group editor view — two columns ──────────────────────────────────────
  if (view === 'editar-grupo') {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('grupos')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-black text-foreground">
            {editGrupoId ? 'Editar grupo' : 'Novo grupo'}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Coluna esquerda: formulário */}
          <div className="space-y-5">
            {/* Nome */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Nome do grupo</label>
              <Input
                placeholder="Ex: Clientes Koách — São Paulo"
                value={grupoNome}
                onChange={e => setGrupoNome(e.target.value)}
              />
            </div>

            {/* Manual add */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Adicionar email</label>
              <div className="flex gap-2">
                <Input
                  placeholder="email@exemplo.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addEmailManual()}
                />
                <Button variant="outline" onClick={addEmailManual} className="shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filter section (ephemeral) */}
            <div className="space-y-2">
              {!filterOpen ? (
                <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => setFilterOpen(true)}>
                  <Filter className="w-3.5 h-3.5" /> Preencher via filtros
                </Button>
              ) : (
                <div className="border rounded-xl p-4 space-y-3 bg-card">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Filtros</p>
                    <button onClick={() => { setFilterOpen(false); setPendingFiltros([]); setAddFilterMode(null); }} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Os filtros afunilam por cruzamento (AND). O resultado será <strong>adicionado</strong> à lista ao lado.
                  </p>

                  {pendingFiltros.length > 0 && (
                    <div className="space-y-1.5">
                      {pendingFiltros.map((f, i) => {
                        const Icon = filtroIcon(f.tipo);
                        return (
                          <div key={i} className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                            <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-sm text-foreground flex-1">{filtroLabel(f)}</span>
                            <button onClick={() => setPendingFiltros(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
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
                    <div className="border rounded-lg p-2 space-y-0.5 bg-muted/30">
                      {FILTER_OPTIONS.map(opt => {
                        const Icon = opt.icon;
                        const added = pendingFiltros.some(f => f.tipo === opt.tipo);
                        return (
                          <button
                            key={opt.tipo}
                            disabled={added}
                            onClick={() => {
                              if (opt.tipo === 'plano') { setPendingPlanos([]); setAddFilterMode('plano'); }
                              else if (opt.tipo === 'cidade') { setPendingCidade(''); setAddFilterMode('cidade'); }
                              else addFiltroSimple(opt.tipo);
                            }}
                            className={cn(
                              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                              added ? 'text-muted-foreground/40 cursor-not-allowed' : 'hover:bg-background text-foreground cursor-pointer'
                            )}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            {opt.label}
                            {added && <span className="ml-auto text-xs text-muted-foreground/40">já adicionado</span>}
                          </button>
                        );
                      })}
                      <div className="pt-1 border-t">
                        <button onClick={() => setAddFilterMode(null)} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1">Cancelar</button>
                      </div>
                    </div>
                  )}

                  {addFilterMode === 'plano' && (
                    <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Planos</p>
                      {ALL_PLANS.map(p => (
                        <label key={p} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="rounded" checked={pendingPlanos.includes(p)}
                            onChange={e => setPendingPlanos(prev => e.target.checked ? [...prev, p] : prev.filter(x => x !== p))} />
                          <span className="text-sm text-foreground">{PLAN_LABELS[p]}</span>
                        </label>
                      ))}
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" disabled={pendingPlanos.length === 0} onClick={confirmPlanFilter}>Confirmar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setAddFilterMode(null)}>Cancelar</Button>
                      </div>
                    </div>
                  )}

                  {addFilterMode === 'cidade' && (
                    <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cidade</p>
                      <Input placeholder="Ex: São Paulo" value={pendingCidade} onChange={e => setPendingCidade(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && confirmCidadeFilter()} autoFocus />
                      <div className="flex gap-2">
                        <Button size="sm" disabled={!pendingCidade.trim()} onClick={confirmCidadeFilter}>Confirmar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setAddFilterMode(null)}>Cancelar</Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1 border-t">
                    <Button
                      size="sm"
                      disabled={pendingFiltros.length === 0 || applyingFilters}
                      onClick={handleApplyFilters}
                      className="gap-1.5"
                    >
                      {applyingFilters
                        ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Buscando...</>
                        : <><Plus className="w-3.5 h-3.5" /> Adicionar à lista</>
                      }
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setFilterOpen(false); setPendingFiltros([]); setAddFilterMode(null); }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Save */}
            <div className="flex gap-2 pt-2 border-t">
              <Button onClick={handleSaveGrupo} disabled={savingGrupo} className="gap-1.5">
                {savingGrupo && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {editGrupoId ? 'Salvar alterações' : 'Criar grupo'}
              </Button>
              <Button variant="ghost" onClick={() => setView('grupos')}>Cancelar</Button>
            </div>
          </div>

          {/* Coluna direita: painel de destinatários */}
          <div className="space-y-2 sticky top-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-foreground">Destinatários</label>
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {grupoEmails.length}
              </span>
              {selectedEmail && (
                <span className="text-xs text-destructive font-medium ml-auto">↵ Delete para remover</span>
              )}
            </div>

            <div
              className={cn(
                'border rounded-xl p-3 bg-muted/30 h-[420px] overflow-y-auto transition-colors',
                selectedEmail && 'border-destructive/30'
              )}
              onClick={e => { if (e.target === e.currentTarget) setSelectedEmail(null); }}
            >
              {grupoEmails.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-2.5 text-center px-4">
                  <Users className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    Adicione emails manualmente<br />ou use os filtros ao lado.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 content-start">
                  {grupoEmails.map(e => (
                    <button
                      key={e}
                      onClick={() => setSelectedEmail(prev => prev === e ? null : e)}
                      className={cn(
                        'group inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 font-mono border transition-all',
                        selectedEmail === e
                          ? 'bg-destructive/10 border-destructive text-destructive ring-1 ring-destructive/20'
                          : 'bg-background border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                      )}
                    >
                      {e}
                      <span
                        role="button"
                        onClick={ev => { ev.stopPropagation(); removeEmail(e); }}
                        className={cn(
                          'opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity leading-none',
                          selectedEmail === e && 'opacity-70'
                        )}
                      >
                        <X className="w-2.5 h-2.5" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Novo comunicado view — two columns + live preview ────────────────────
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
            <p className="text-sm text-muted-foreground mt-1">{progress.sent} de {progress.total} emails enviados</p>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
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
              <span className="text-sm font-semibold text-foreground">{grupoSelecionado.emails.length} emails</span>
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
            <div className="pt-2 border-t space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Saudação</p>
              <p className="text-sm text-muted-foreground">
                Cada email será iniciado com <span className="font-mono text-primary text-xs">Olá, {'{nome}'}, tudo bem?</span> personalizado para cada destinatário.
              </p>
            </div>
          </div>

          <div className="border rounded-xl p-3 bg-muted/30">
            <p className="text-xs font-semibold text-foreground mb-1.5">Destinatários ({grupoSelecionado.emails.length})</p>
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
              {grupoSelecionado.emails.map(e => (
                <span key={e} className="text-xs bg-background border rounded-full px-2 py-0.5 text-muted-foreground font-mono">{e}</span>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button onClick={handleEnviar} className="gap-1.5">
              <Send className="w-4 h-4" />
              Enviar para {grupoSelecionado.emails.length} pessoa{grupoSelecionado.emails.length !== 1 ? 's' : ''}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmStep(false)}>Voltar</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('grupos')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-black text-foreground">Novo comunicado</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Coluna esquerda: formulário */}
          <div className="space-y-5">
            {/* Grupo */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Grupo de destinatários</label>
              {grupos.length === 0 ? (
                <div className="border border-dashed rounded-xl p-4 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Nenhum grupo criado ainda.</p>
                  <Button variant="outline" size="sm" onClick={() => { setView('grupos'); setTimeout(openNewGrupo, 50); }}>Criar grupo</Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {grupos.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setComGrupoId(g.id === comGrupoId ? '' : g.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left',
                        comGrupoId === g.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                      )}
                    >
                      <div className={cn('w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center', comGrupoId === g.id ? 'border-primary' : 'border-muted-foreground/30')}>
                        {comGrupoId === g.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <span className="text-sm font-medium text-foreground">{g.nome}</span>
                      <span className="ml-auto text-xs text-muted-foreground shrink-0">
                        {(g.emails ?? []).length} destinatário{(g.emails ?? []).length !== 1 ? 's' : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Assunto */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Assunto</label>
              <Input placeholder="Ex: Novidade no Tovia — confira!" value={comAssunto} onChange={e => setComAssunto(e.target.value)} />
            </div>

            {/* Preview text */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                Texto de preview <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <Input placeholder="Aparece abaixo do assunto na caixa de entrada" value={comPreview} onChange={e => setComPreview(e.target.value)} />
            </div>

            {/* Corpo */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Corpo do email</label>
              <RichTextEditor
                key={editorKey}
                value={comCorpo}
                onChange={setComCorpo}
                placeholder="Escreva o conteúdo do seu comunicado aqui..."
              />
              <p className="text-xs text-muted-foreground">
                O email será iniciado com <span className="font-mono text-primary">Olá, {'{nome}'}, tudo bem?</span> personalizado para cada destinatário.
              </p>
            </div>

            {/* Assinatura */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">Assinatura</label>
                <button
                  onClick={() => setComAssinatura(DEFAULT_ASSINATURA)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Restaurar padrão
                </button>
              </div>
              <Textarea
                rows={5}
                value={comAssinatura}
                onChange={e => setComAssinatura(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                onClick={handlePrepararEnvio}
                disabled={!comGrupoId || !comAssunto.trim() || isEditorEmpty(comCorpo)}
                className="gap-1.5"
              >
                <Send className="w-4 h-4" /> Enviar
              </Button>
              <Button variant="ghost" onClick={() => setView('grupos')}>Cancelar</Button>
            </div>
          </div>

          {/* Coluna direita: preview em tempo real */}
          <EmailPreviewPanel
            assunto={comAssunto}
            corpo={comCorpo}
            previewText={comPreview}
            assinatura={comAssinatura}
          />
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
              h.status === 'enviado' ? 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400' :
              h.status === 'erro'    ? 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400' :
                                       'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400';
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
                  <div className={cn('flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 shrink-0', statusColor)}>
                    <StatusIcon className="w-3 h-3" />
                    {h.status === 'enviado' ? 'Enviado' : h.status === 'erro' ? 'Erro' : 'Parcial'}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
