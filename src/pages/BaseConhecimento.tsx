import { ToviaLogo } from '~/components/ToviaLogo';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ArrowRight, Tag, X, ArrowLeft, LifeBuoy, CheckCircle2, Loader2, MessageSquare, Trash2, Clock, ChevronDown, ChevronUp, Send, RefreshCw, FolderOpen, ChevronLeft, ChevronRight, Mail, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '~/context/AuthContext';
import { listDocuments, updateDocument, removeDocument } from '~/services/firestore';
import { ArtigoBC } from '~/types';
import { orderBy, where } from 'firebase/firestore';
import { createDocument, addDocument } from '~/services/firestore';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Badge config ────────────────────────────────────────────────────────────

const BADGES = {
  chinam: { label: 'Chinám', color: 'bg-orange-50 text-primary' },
  petach: { label: 'Pétach', color: 'bg-blue-100 text-blue-700'       },
  chalem: { label: 'Chalém', color: 'bg-violet-100 text-violet-700'   },
};

const ACCENT: Record<string, string> = {
  chinam: 'bg-primary',
  petach: 'bg-blue-400',
  chalem: 'bg-violet-500',
};

const PLAN_FILTER_ACTIVE: Record<string, string> = {
  chinam: 'bg-primary text-white border-primary',
  petach: 'bg-blue-500 text-white border-blue-500',
  chalem: 'bg-violet-500 text-white border-violet-500',
};

type PlanKey = 'chinam' | 'petach' | 'chalem';

const PLAN_FILTERS: { key: PlanKey; label: string }[] = [
  { key: 'chinam', label: 'Chinám'  },
  { key: 'petach', label: 'Pétach'  },
  { key: 'chalem', label: 'Chalém'  },
];

const PINNED_TAGS = ['início', 'configuração', 'eventos', 'financeiro', 'suporte'];

const CATEGORIA_LABELS_BC: Record<string, string> = {
  'primeiros-passos': 'Primeiros Passos',
  'eventos': 'Gestão de Eventos',
  'financeiro': 'Financeiro',
  'gestao': 'Equipe e Operações',
  'planos': 'Guias por Plano',
  'por-perfil': 'Guias por Tipo de Evento',
  'privacidade': 'Privacidade e Dados',
  'solucoes': 'Problemas e Soluções',
};

const CATEGORIA_ORDER = Object.keys(CATEGORIA_LABELS_BC);

const PLAN_TAG_KEYS = new Set<string>(['chinam', 'petach', 'koach', 'chalem']);

function badgesFromTags(tags: string[]): PlanKey[] {
  const hasChalem = tags.includes('chalem');
  const hasPetach = tags.includes('petach') || tags.includes('koach');
  if (hasChalem) return ['chalem'];
  if (hasPetach) return ['petach', 'chalem'];
  return ['chinam', 'petach', 'chalem'];
}

function accentFromBadges(badges: PlanKey[]): string {
  if (badges[0] === 'chalem') return ACCENT.chalem;
  if (badges[0] === 'petach') return ACCENT.petach;
  return ACCENT.chinam;
}

function articleMatchesPlan(tags: string[], plan: PlanKey): boolean {
  const badges = badgesFromTags(tags);
  return badges.includes(plan);
}

type Categoria = 'problema' | 'duvida' | 'sugestao' | 'outro';

interface MeuTicket {
  id: string;
  titulo: string;
  descricao: string;
  categoria: Categoria;
  status: 'aberto' | 'em_andamento' | 'resolvido' | 'fechado';
  criado_em: string;
  resposta?: string;
  respondido_em?: string;
  resposta_usuario?: string;
}

const STATUS_TICKET: Record<MeuTicket['status'], { label: string; color: string }> = {
  aberto:       { label: 'Aberto',       color: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400' },
  em_andamento: { label: 'Em andamento', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400' },
  resolvido:    { label: 'Resolvido',    color: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400' },
  fechado:      { label: 'Fechado',      color: 'text-gray-500 bg-gray-100' },
};

const CATEGORIA_LABELS: Record<Categoria, string> = {
  problema: 'Problema',
  duvida:   'Dúvida',
  sugestao: 'Sugestão',
  outro:    'Outro',
};

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: 'problema',  label: 'Problema técnico' },
  { value: 'duvida',    label: 'Dúvida'           },
  { value: 'sugestao',  label: 'Sugestão'         },
  { value: 'outro',     label: 'Outro'            },
];

function ArticleCard({ artigo, tagFiltro }: { artigo: ArtigoBC; tagFiltro: string | null }) {
  const badges      = badgesFromTags(artigo.tags);
  const accent      = accentFromBadges(badges);
  const hasBanner   = !!artigo.banner_url;
  const contentTags = artigo.tags.filter(t => !PLAN_TAG_KEYS.has(t));

  return (
    <Link
      to={`/base-de-conhecimento/${artigo.slug}`}
      className="group flex flex-col bg-white border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200"
    >
      {hasBanner ? (
        <div className="h-36 overflow-hidden shrink-0">
          <img src={artigo.banner_url} alt={artigo.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      ) : (
        <div className={cn('h-1.5 shrink-0', accent)} />
      )}
      <div className="flex flex-col gap-3 p-5 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {badges.map(b => (
            <span key={b} className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full', BADGES[b].color)}>
              {BADGES[b].label}
            </span>
          ))}
        </div>
        <div className="flex-1">
          <h2 className="text-[15px] font-black text-foreground leading-tight mb-1.5 group-hover:text-primary transition-colors">{artigo.titulo}</h2>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{artigo.resumo}</p>
        </div>
        {contentTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="w-3 h-3 text-muted-foreground/30 shrink-0" />
            {contentTags.slice(0, 3).map(tag => (
              <span key={tag} className={cn('text-[10px] px-2 py-0.5 rounded-full transition-colors', tagFiltro === tag ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground bg-muted')}>
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Ler artigo <ArrowRight className="w-3 h-3" />
        </div>
      </div>
      <div className={cn('h-1 mt-auto', accent)} />
    </Link>
  );
}

export default function BaseConhecimento() {
  const { user, profile } = useAuth();
  const [artigos, setArtigos]     = useState<ArtigoBC[]>([]);
  const [loading, setLoading]     = useState(true);
  const [busca, setBusca]         = useState('');
  const [planFiltro, setPlanFiltro] = useState<PlanKey | null>(null);
  const [tagFiltro, setTagFiltro]   = useState<string | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<'recentes' | 'mais-vistos'>('recentes');
  const [heroIndex, setHeroIndex] = useState(0);

  // Ticket form
  const [ticketOpen, setTicketOpen]       = useState(false);
  const [ticketTitulo, setTicketTitulo]   = useState('');
  const [ticketCategoria, setTicketCategoria] = useState<Categoria>('duvida');
  const [ticketDesc, setTicketDesc]       = useState('');
  const [ticketSending, setTicketSending] = useState(false);
  const [ticketSent, setTicketSent]       = useState(false);

  // Meus chamados
  const [meusTicketsOpen, setMeusTicketsOpen] = useState(false);
  const [meusTickets, setMeusTickets]         = useState<MeuTicket[]>([]);
  const [loadingMeusTickets, setLoadingMeusTickets] = useState(false);
  const [expandidoId, setExpandidoId]         = useState<string | null>(null);
  const [replyMode, setReplyMode]             = useState<string | null>(null);
  const [replyText, setReplyText]             = useState('');
  const [actionLoading, setActionLoading]     = useState<string | null>(null);

  async function handleTicketSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !ticketTitulo.trim() || !ticketDesc.trim()) return;
    setTicketSending(true);
    try {
      await addDocument('tickets', {
        titulo:       ticketTitulo.trim(),
        descricao:    ticketDesc.trim(),
        categoria:    ticketCategoria,
        status:       'aberto',
        prioridade:   'media',
        cliente_email: user.email ?? '',
        userId:       user.uid,
        nome:         profile?.nome ?? '',
        criado_em:    new Date().toISOString(),
      });
      setTicketSent(true);
      setTicketTitulo('');
      setTicketDesc('');
      setTicketCategoria('duvida');

      // Notificação de confirmação
      const notifId = uuidv4();
      await createDocument('notificacoes', notifId, {
        id: notifId,
        userId: user.uid,
        tipo: 'ticket_criado',
        titulo: 'Ticket aberto com sucesso',
        mensagem: `Recebemos sua solicitação "${ticketTitulo.trim()}". Nossa equipe vai analisar e responder em breve.`,
        data: new Date().toISOString(),
        lida: false,
        acao_requirida: false,
      });
    } finally {
      setTicketSending(false);
    }
  }

  const loadMeusTickets = async () => {
    if (!user) return;
    setLoadingMeusTickets(true);
    try {
      const dados = await listDocuments<MeuTicket>('tickets', [where('userId', '==', user.uid)]);
      setMeusTickets(dados.sort((a, b) => (b.criado_em ?? '').localeCompare(a.criado_em ?? '')));
    } catch {
      toast.error('Erro ao carregar chamados');
    } finally {
      setLoadingMeusTickets(false);
    }
  };

  const marcarNotificacoesTicketLidas = async () => {
    if (!user) return;
    try {
      const notifs = await listDocuments<{ id: string; tipo: string; lida: boolean }>(
        'notificacoes',
        [where('userId', '==', user.uid), where('tipo', '==', 'ticket_respondido'), where('lida', '==', false)]
      );
      await Promise.all(notifs.map(n => updateDocument('notificacoes', n.id, { lida: true })));
    } catch {
      // silencioso — não bloqueia a abertura do painel
    }
  };

  const handleAbrirMeusTickets = () => {
    setMeusTicketsOpen(true);
    setTicketOpen(false);
    setTicketSent(false);
    loadMeusTickets();
    marcarNotificacoesTicketLidas();
  };

  const handleAbrirChamado = () => {
    setTicketOpen(true);
    setMeusTicketsOpen(false);
    setTicketSent(false);
    setExpandidoId(null);
    setReplyMode(null);
  };

  const handleFecharPainel = () => {
    setTicketOpen(false);
    setMeusTicketsOpen(false);
    setTicketSent(false);
  };

  const handleResolverTicket = async (id: string) => {
    setActionLoading(id);
    try {
      await updateDocument('tickets', id, { status: 'resolvido' });
      setMeusTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'resolvido' } : t));
      setExpandidoId(null);
      toast.success('Chamado marcado como resolvido');
    } catch {
      toast.error('Erro ao atualizar chamado');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResponderTicket = async (id: string) => {
    if (!replyText.trim()) return;
    setActionLoading(id);
    try {
      await updateDocument('tickets', id, {
        resposta_usuario: replyText.trim(),
        resposta_usuario_em: new Date().toISOString(),
        status: 'aberto',
      });
      setMeusTickets(prev => prev.map(t =>
        t.id === id ? { ...t, resposta_usuario: replyText.trim(), status: 'aberto' } : t
      ));
      setReplyMode(null);
      setReplyText('');
      toast.success('Resposta enviada!');
    } catch {
      toast.error('Erro ao enviar resposta');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExcluirTicket = async (id: string) => {
    if (!window.confirm('Excluir este chamado? Essa ação não pode ser desfeita.')) return;
    setActionLoading(id);
    try {
      await removeDocument('tickets', id);
      setMeusTickets(prev => prev.filter(t => t.id !== id));
      if (expandidoId === id) setExpandidoId(null);
      toast.success('Chamado excluído');
    } catch {
      toast.error('Erro ao excluir chamado');
    } finally {
      setActionLoading(null);
    }
  };

  // Carregar tickets ao fazer login (para badge de notificação)
  useEffect(() => {
    if (user) loadMeusTickets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const respostasNaoLidas = meusTickets.filter(
    t => t.resposta && t.status === 'em_andamento' && !t.resposta_usuario
  ).length;

  useEffect(() => {
    listDocuments<ArtigoBC>('base_conhecimento', [orderBy('ordem')])
      .then(data => setArtigos(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const topTags = PINNED_TAGS;

  const filtered = useMemo(() => {
    let result = artigos.filter(a => a.visivel !== false);

    if (busca.trim()) {
      const q = busca.toLowerCase();
      result = result.filter(a =>
        a.titulo.toLowerCase().includes(q) ||
        a.resumo.toLowerCase().includes(q) ||
        a.conteudo.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (planFiltro) {
      result = result.filter(a => articleMatchesPlan(a.tags, planFiltro));
    }

    if (tagFiltro) {
      result = result.filter(a => a.tags.includes(tagFiltro));
    }

    if (categoriaFiltro) {
      result = result.filter(a => a.categoria === categoriaFiltro);
    }

    return result;
  }, [artigos, busca, planFiltro, tagFiltro, categoriaFiltro]);

  const hasActiveFilter = planFiltro !== null || tagFiltro !== null || categoriaFiltro !== null;
  const isSearching = busca.trim().length > 0 || hasActiveFilter;

  const groupedByCategoria = useMemo(() => {
    if (isSearching) return null;
    const groups: Record<string, ArtigoBC[]> = {};
    for (const artigo of filtered) {
      const cat = (artigo as ArtigoBC & { categoria?: string }).categoria || 'outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(artigo);
    }
    return CATEGORIA_ORDER
      .filter(cat => groups[cat]?.length)
      .map(cat => ({ key: cat, label: CATEGORIA_LABELS_BC[cat] || cat, artigos: groups[cat] }));
  }, [filtered, isSearching]);

  const heroArticles = useMemo(() => {
    const destaques = artigos.filter(a => a.visivel !== false && a.destaque);
    if (destaques.length > 0) return destaques;
    const withBanner = artigos.filter(a => a.visivel !== false && a.banner_url);
    return withBanner.slice(0, 5);
  }, [artigos]);

  const heroNext = useCallback(() => setHeroIndex(i => (i + 1) % heroArticles.length), [heroArticles.length]);
  const heroPrev = useCallback(() => setHeroIndex(i => (i - 1 + heroArticles.length) % heroArticles.length), [heroArticles.length]);

  useEffect(() => {
    if (heroArticles.length <= 1) return;
    const timer = setInterval(heroNext, 6000);
    return () => clearInterval(timer);
  }, [heroNext, heroArticles.length]);

  function clearFilters() {
    setPlanFiltro(null);
    setTagFiltro(null);
    setCategoriaFiltro(null);
    setOrdenacao('recentes');
  }

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Header Tovia padrão ── */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <a href="/" className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity">
            <span className="text-sm font-light text-gray-400 tracking-tight">feito com</span>
            <ToviaLogo className="h-7 w-auto text-primary" />
          </a>
          <div className="hidden sm:flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="text-sm font-black text-[#1E0B4B] tracking-tight">Base de Conhecimento</span>
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[11px] font-black text-primary uppercase">
                  {(profile?.nome || user.email || '?').charAt(0)}
                </div>
                <span className="hidden sm:block text-xs font-semibold text-foreground truncate max-w-[140px]">
                  {profile?.nome?.split(' ')[0] || user.email}
                </span>
              </div>
              <Link to="/dashboard" className="flex items-center gap-1 text-xs font-black text-primary hover:underline whitespace-nowrap">
                <ArrowLeft className="w-3.5 h-3.5" /> Painel
              </Link>
            </div>
          ) : (
            <a href="/login?cadastro=true" className="text-xs font-black text-primary hover:underline whitespace-nowrap">
              Crie o seu evento →
            </a>
          )}
        </div>
      </header>

      {/* ── Hero com carrossel full-bleed ── */}
      {!isSearching && heroArticles.length > 0 && (
        <section className="relative h-[320px] md:h-[420px] overflow-hidden">
          {heroArticles.map((artigo, idx) => (
            <Link
              key={artigo.id}
              to={`/base-de-conhecimento/${artigo.slug}`}
              className={cn(
                'absolute inset-0 transition-opacity duration-700',
                idx === heroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none',
              )}
            >
              {artigo.banner_url ? (
                <img src={artigo.banner_url} alt={artigo.titulo} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1E0B4B 0%, #2D1470 100%)' }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

              <div className="relative h-full max-w-6xl mx-auto px-6 flex flex-col justify-end pb-10 md:pb-14">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {badgesFromTags(artigo.tags).map(b => (
                    <span key={b} className={cn('text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-sm', BADGES[b].color)}>
                      {BADGES[b].label}
                    </span>
                  ))}
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 drop-shadow-lg">{artigo.titulo}</h2>
                <p className="text-sm md:text-base text-white/70 leading-relaxed line-clamp-2 max-w-2xl mb-3">{artigo.resumo}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                  Ler artigo <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}


          {heroArticles.length > 1 && (
            <div className="absolute bottom-4 left-6 right-6 z-20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {heroArticles.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.preventDefault(); setHeroIndex(idx); }}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300 cursor-pointer',
                      idx === heroIndex ? 'w-8 bg-primary' : 'w-3 bg-white/30 hover:bg-white/50',
                    )}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.preventDefault(); heroPrev(); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.preventDefault(); heroNext(); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Barra de filtros ── */}
      <div className="sticky top-[53px] z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Busca */}
            <div className="relative flex-1 min-w-0 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Pesquisar artigos..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-muted/50 border border-border outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30"
              />
            </div>

            {/* Seletores de filtro */}
            <div className="flex items-center gap-2 flex-wrap">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

              {/* Plano */}
              <select
                value={planFiltro ?? ''}
                onChange={e => setPlanFiltro((e.target.value || null) as PlanKey | null)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-white text-foreground cursor-pointer focus:ring-2 focus:ring-primary/30 focus:border-primary/30 outline-none"
              >
                <option value="">Todos os planos</option>
                {PLAN_FILTERS.map(({ key, label }) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              {/* Categoria */}
              <select
                value={categoriaFiltro ?? ''}
                onChange={e => setCategoriaFiltro(e.target.value || null)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-white text-foreground cursor-pointer focus:ring-2 focus:ring-primary/30 focus:border-primary/30 outline-none"
              >
                <option value="">Todas as categorias</option>
                {CATEGORIA_ORDER.map(cat => (
                  <option key={cat} value={cat}>{CATEGORIA_LABELS_BC[cat]}</option>
                ))}
              </select>

              {/* Ordenar por */}
              <select
                value={ordenacao}
                onChange={e => setOrdenacao(e.target.value as 'recentes' | 'mais-vistos')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-white text-foreground cursor-pointer focus:ring-2 focus:ring-primary/30 focus:border-primary/30 outline-none"
              >
                <option value="recentes">Recentes</option>
                <option value="mais-vistos">Mais vistos</option>
              </select>

              {hasActiveFilter && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" /> Limpar
                </button>
              )}
            </div>
          </div>

          {/* Tags rápidas */}
          {topTags.length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Tag className="w-3 h-3 text-muted-foreground/40 shrink-0" />
              {topTags.map(tag => {
                const active = tagFiltro === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setTagFiltro(active ? null : tag)}
                    className={cn(
                      'text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-all duration-150 cursor-pointer',
                      active
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground bg-muted/30',
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Lista de artigos ── */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium mb-3">
              {busca
                ? `Nenhum artigo encontrado para "${busca}"`
                : 'Nenhum artigo encontrado com os filtros selecionados.'}
            </p>
            {hasActiveFilter && (
              <button onClick={clearFilters} className="text-sm font-semibold text-primary hover:underline cursor-pointer">
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {isSearching && (
              <p className="text-sm text-muted-foreground mb-6">
                {filtered.length} {filtered.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}
                {busca && ` para "${busca}"`}
              </p>
            )}

            {groupedByCategoria ? (
              <div className="space-y-10">
                {groupedByCategoria.map(group => (
                  <section key={group.key}>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border">
                      <h2 className="text-base font-black text-foreground">{group.label}</h2>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {group.artigos.length}
                      </span>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {group.artigos.map(artigo => (
                        <ArticleCard key={artigo.id} artigo={artigo} tagFiltro={tagFiltro} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map(artigo => (
                  <ArticleCard key={artigo.id} artigo={artigo} tagFiltro={tagFiltro} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Ticket de suporte (só logados) ── */}
      {user && (
        <section className="max-w-5xl mx-auto px-6 pb-12">
          <div className="rounded-2xl overflow-hidden shadow-sm">

            {/* Banner principal */}
            <div className="bg-primary px-8 py-8 flex flex-col sm:flex-row items-center gap-6 text-white">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                <LifeBuoy className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-lg font-black leading-snug">Precisa de ajuda?</p>
                <p className="text-sm text-white/75 mt-0.5 leading-relaxed max-w-lg">
                  Abra um chamado e nossa equipe responde em até 1 dia útil.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-center">
                {/* Botão Meus chamados */}
                <button
                  onClick={meusTicketsOpen ? handleFecharPainel : handleAbrirMeusTickets}
                  className={cn(
                    'relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer',
                    meusTicketsOpen
                      ? 'bg-white/15 text-white border-white/30 hover:bg-white/25'
                      : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                  )}
                >
                  <MessageSquare className="w-4 h-4" />
                  Meus chamados
                  {respostasNaoLidas > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                      {respostasNaoLidas}
                    </span>
                  )}
                </button>
                {/* Botão Abrir chamado */}
                <button
                  onClick={ticketOpen ? handleFecharPainel : handleAbrirChamado}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer',
                    ticketOpen
                      ? 'bg-white/15 text-white border-white/30 hover:bg-white/25'
                      : 'bg-white text-primary border-white hover:bg-white/90'
                  )}
                >
                  <LifeBuoy className="w-4 h-4" />
                  {ticketOpen ? 'Fechar' : 'Abrir chamado'}
                </button>
              </div>
            </div>

            {/* ── Painel: Abrir chamado ── */}
            {ticketOpen && (
              <div className="bg-card border-x border-b border-border rounded-b-2xl px-8 py-8">
                {ticketSent ? (
                  <div className="flex flex-col items-center gap-4 py-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-base font-black text-foreground">Chamado enviado com sucesso!</p>
                      <p className="text-sm text-muted-foreground mt-1">Nossa equipe vai analisar e responder em breve. Fique de olho nas notificações.</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setTicketSent(false)} className="text-sm font-semibold text-primary hover:underline cursor-pointer">
                        Abrir outro chamado
                      </button>
                      <span className="text-muted-foreground">·</span>
                      <button onClick={handleAbrirMeusTickets} className="text-sm font-semibold text-primary hover:underline cursor-pointer">
                        Ver meus chamados
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleTicketSubmit} className="space-y-5 max-w-2xl">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Assunto</label>
                        <input
                          type="text"
                          value={ticketTitulo}
                          onChange={e => setTicketTitulo(e.target.value)}
                          placeholder="Descreva brevemente o problema ou dúvida"
                          required
                          className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Categoria</label>
                        <select
                          value={ticketCategoria}
                          onChange={e => setTicketCategoria(e.target.value as Categoria)}
                          className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                        >
                          {CATEGORIAS.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Descrição</label>
                        <textarea
                          value={ticketDesc}
                          onChange={e => setTicketDesc(e.target.value)}
                          placeholder="Explique com detalhes: quanto mais informação, mais rápido te ajudamos."
                          required
                          rows={4}
                          className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-1">
                      <button
                        type="submit"
                        disabled={ticketSending || !ticketTitulo.trim() || !ticketDesc.trim()}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors cursor-pointer"
                      >
                        {ticketSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LifeBuoy className="w-4 h-4" />}
                        Enviar chamado
                      </button>
                      <p className="text-xs text-muted-foreground">Respondemos em até 1 dia útil.</p>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ── Painel: Meus chamados ── */}
            {meusTicketsOpen && (
              <div className="bg-card border-x border-b border-border rounded-b-2xl">
                {/* Header do painel */}
                <div className="flex items-center justify-between px-8 py-4 border-b border-border">
                  <p className="text-sm font-black text-foreground">Meus chamados</p>
                  <button
                    onClick={() => loadMeusTickets()}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                    disabled={loadingMeusTickets}
                  >
                    <RefreshCw className={cn('w-3 h-3', loadingMeusTickets && 'animate-spin')} />
                    Atualizar
                  </button>
                </div>

                {loadingMeusTickets ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Carregando...</span>
                  </div>
                ) : meusTickets.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center px-8">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-foreground">Nenhum chamado aberto</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Quando você abrir um chamado, ele aparecerá aqui com o histórico de respostas.
                    </p>
                    <button
                      onClick={handleAbrirChamado}
                      className="mt-1 text-sm font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Abrir primeiro chamado
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {meusTickets.map(ticket => {
                      const st = STATUS_TICKET[ticket.status];
                      const temResposta = !!ticket.resposta;
                      const naoLido = temResposta && ticket.status === 'em_andamento' && !ticket.resposta_usuario;
                      const isExpanded = expandidoId === ticket.id;
                      const isReplying = replyMode === ticket.id;
                      const loading = actionLoading === ticket.id;
                      const data = ticket.criado_em
                        ? new Date(ticket.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '';

                      return (
                        <div key={ticket.id} className="px-6 py-4">
                          {/* Linha principal */}
                          <div className="flex items-start gap-3">
                            {/* Indicador de resposta não lida */}
                            <div className="mt-1 shrink-0">
                              {naoLido
                                ? <span className="block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                : <span className="block w-2 h-2 rounded-full bg-transparent" />
                              }
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full', st.color)}>
                                  {st.label}
                                </span>
                                <p className="text-sm font-semibold text-foreground truncate">{ticket.titulo}</p>
                                {naoLido && (
                                  <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded-full">
                                    Nova resposta!
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {CATEGORIA_LABELS[ticket.categoria]} · {data}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Botão expandir */}
                              <button
                                onClick={() => setExpandidoId(isExpanded ? null : ticket.id)}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                                title={isExpanded ? 'Recolher' : 'Ver detalhes'}
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              {/* Botão excluir */}
                              <button
                                onClick={() => handleExcluirTicket(ticket.id)}
                                disabled={loading}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 transition-colors cursor-pointer disabled:opacity-40"
                                title="Excluir chamado"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Detalhe expandido */}
                          {isExpanded && (
                            <div className="mt-4 ml-5 space-y-4">
                              {/* Minha mensagem */}
                              <div className="space-y-1.5">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Minha mensagem</p>
                                <div className="bg-muted/40 rounded-xl px-4 py-3 text-sm text-foreground leading-relaxed">
                                  {ticket.descricao}
                                </div>
                              </div>

                              {/* Resposta da equipe */}
                              {temResposta ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Resposta da Equipe Tovia</p>
                                    {ticket.respondido_em && (
                                      <span className="text-[10px] text-muted-foreground">
                                        {new Date(ticket.respondido_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                      </span>
                                    )}
                                  </div>
                                  <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm text-foreground leading-relaxed">
                                    {ticket.resposta}
                                  </div>

                                  {/* Resposta do usuário já enviada */}
                                  {ticket.resposta_usuario && (
                                    <div className="space-y-1.5 mt-2">
                                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sua resposta</p>
                                      <div className="bg-muted/40 rounded-xl px-4 py-3 text-sm text-foreground leading-relaxed">
                                        {ticket.resposta_usuario}
                                      </div>
                                    </div>
                                  )}

                                  {/* Ações (só se não resolvido/fechado e não respondendo) */}
                                  {ticket.status !== 'resolvido' && ticket.status !== 'fechado' && !isReplying && (
                                    <div className="flex gap-2 pt-1">
                                      <button
                                        onClick={() => { setReplyMode(ticket.id); setReplyText(''); }}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                        Responder
                                      </button>
                                      <button
                                        onClick={() => handleResolverTicket(ticket.id)}
                                        disabled={loading}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                                      >
                                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                        Resolvido
                                      </button>
                                    </div>
                                  )}

                                  {/* Caixa de resposta */}
                                  {isReplying && (
                                    <div className="space-y-2 pt-1">
                                      <textarea
                                        autoFocus
                                        rows={3}
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        placeholder="Escreva sua mensagem para a equipe Tovia..."
                                        className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleResponderTicket(ticket.id)}
                                          disabled={loading || !replyText.trim()}
                                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                          Enviar
                                        </button>
                                        <button
                                          onClick={() => setReplyMode(null)}
                                          className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl px-4 py-3">
                                  <Clock className="w-3.5 h-3.5 shrink-0" />
                                  Aguardando resposta da equipe Tovia. Retornamos em até 1 dia útil.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-border py-10 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 text-center">
          <ToviaLogo className="h-7 w-auto text-primary" />
          <p className="text-sm text-muted-foreground">
            Precisa de ajuda? Entre em contato:
          </p>
          <a
            href="mailto:suporte@toviaapp.com.br"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            <Mail className="w-4 h-4" />
            suporte@toviaapp.com.br
          </a>
          <div className="flex items-center gap-4 mt-2">
            <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Voltar ao início
            </Link>
            <span className="text-muted-foreground/30">·</span>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Tovia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
