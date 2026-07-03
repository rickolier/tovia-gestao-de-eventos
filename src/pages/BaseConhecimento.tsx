import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ArrowRight, Tag, X, ArrowLeft, LifeBuoy, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '~/context/AuthContext';
import { listDocuments } from '~/services/firestore';
import { ArtigoBC } from '~/types';
import { orderBy, addDoc, collection } from 'firebase/firestore';
import { db } from '~/services/firebase';
import { createDocument } from '~/services/firestore';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

// ── Badge config ────────────────────────────────────────────────────────────

const BADGES = {
  start:     { label: 'Start',     color: 'bg-emerald-100 text-emerald-700' },
  essencial: { label: 'Essencial', color: 'bg-blue-100 text-blue-700'       },
  pro:       { label: 'Pro',       color: 'bg-violet-100 text-violet-700'   },
};

const ACCENT: Record<string, string> = {
  start:     'bg-primary',
  essencial: 'bg-blue-400',
  pro:       'bg-violet-500',
};

// Active filter pill styles (shown on the banner dark bg)
const PLAN_FILTER_ACTIVE: Record<string, string> = {
  start:     'bg-emerald-500 text-white border-emerald-500',
  essencial: 'bg-blue-500 text-white border-blue-500',
  pro:       'bg-violet-500 text-white border-violet-500',
};

type PlanKey = 'start' | 'essencial' | 'pro';

const PLAN_FILTERS: { key: PlanKey; label: string }[] = [
  { key: 'start',     label: 'Start'     },
  { key: 'essencial', label: 'Essencial' },
  { key: 'pro',       label: 'Pro'       },
];

const PINNED_TAGS = ['início', 'configuração', 'eventos', 'financeiro', 'suporte'];

function badgesFromTags(tags: string[]): PlanKey[] {
  const hasPro       = tags.includes('pro');
  const hasEssencial = tags.includes('essencial');
  if (hasPro && !hasEssencial) return ['pro'];
  if (hasEssencial)            return ['essencial', 'pro'];
  return ['start', 'essencial', 'pro'];
}

function accentFromBadges(badges: PlanKey[]): string {
  if (badges.length === 1 && badges[0] === 'pro') return ACCENT.pro;
  if (badges[0] === 'essencial')                  return ACCENT.essencial;
  return ACCENT.start;
}

function articleMatchesPlan(tags: string[], plan: PlanKey): boolean {
  const badges = badgesFromTags(tags);
  return badges.includes(plan);
}

type Categoria = 'problema' | 'duvida' | 'sugestao' | 'outro';

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: 'problema',  label: 'Problema técnico' },
  { value: 'duvida',    label: 'Dúvida'           },
  { value: 'sugestao',  label: 'Sugestão'         },
  { value: 'outro',     label: 'Outro'            },
];

export default function BaseConhecimento() {
  const { user, profile } = useAuth();
  const [artigos, setArtigos]     = useState<ArtigoBC[]>([]);
  const [loading, setLoading]     = useState(true);
  const [busca, setBusca]         = useState('');
  const [planFiltro, setPlanFiltro] = useState<PlanKey | null>(null);
  const [tagFiltro, setTagFiltro]   = useState<string | null>(null);

  // Ticket form
  const [ticketOpen, setTicketOpen]       = useState(false);
  const [ticketTitulo, setTicketTitulo]   = useState('');
  const [ticketCategoria, setTicketCategoria] = useState<Categoria>('duvida');
  const [ticketDesc, setTicketDesc]       = useState('');
  const [ticketSending, setTicketSending] = useState(false);
  const [ticketSent, setTicketSent]       = useState(false);

  async function handleTicketSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !ticketTitulo.trim() || !ticketDesc.trim()) return;
    setTicketSending(true);
    try {
      await addDoc(collection(db, 'tickets'), {
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

  useEffect(() => {
    listDocuments<ArtigoBC>('base_conhecimento', [orderBy('ordem')])
      .then(data => setArtigos(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const topTags = PINNED_TAGS;

  const filtered = useMemo(() => {
    let result = artigos;

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

    return result;
  }, [artigos, busca, planFiltro, tagFiltro]);

  const hasActiveFilter = planFiltro !== null || tagFiltro !== null;

  function clearFilters() {
    setPlanFiltro(null);
    setTagFiltro(null);
  }

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <a href="/" className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity">
            <span className="text-sm font-light text-gray-400 tracking-tight">feito com</span>
            <span className="font-logo font-bold text-2xl tracking-tight text-primary leading-none">tovia</span>
          </a>
          <span className="hidden sm:block text-xs font-semibold text-gray-500 truncate max-w-[200px] text-center">
            Base de Conhecimento
          </span>
          {user ? (
            <Link to="/dashboard" className="flex items-center gap-1 text-xs font-black text-primary hover:underline whitespace-nowrap">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao painel
            </Link>
          ) : (
            <a href="/login?cadastro=true" className="text-xs font-black text-primary hover:underline whitespace-nowrap">
              Crie o seu evento →
            </a>
          )}
        </div>
      </header>

      {/* ── Banner ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--sidebar) 0%, #1e3d2a 50%, #1a7a45 100%)' }}
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-primary/20" />

        <div className="relative max-w-5xl mx-auto px-6 py-14 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
            Base de Conhecimento <span className="text-emerald-400">tovia</span>
          </h1>
          <p className="text-white/60 text-sm max-w-lg mb-7">
            Tutoriais, guias e explicações sobre cada funcionalidade da plataforma — para você organizar eventos incríveis.
          </p>

          {/* Search bar */}
          <div className="relative w-full max-w-lg mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Pesquise por funcionalidade, ingresso, pagamento..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm bg-white border-none shadow-xl outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* ── Filters ── */}
          <div className="flex flex-col items-center gap-3 w-full max-w-lg">

            {/* Plan filters */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mr-1">Plano</span>
              {PLAN_FILTERS.map(({ key, label }) => {
                const active = planFiltro === key;
                return (
                  <button
                    key={key}
                    onClick={() => setPlanFiltro(active ? null : key)}
                    className={cn(
                      'text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all duration-150',
                      active
                        ? PLAN_FILTER_ACTIVE[key]
                        : 'border-white/25 text-white/70 hover:border-white/50 hover:text-white bg-white/5',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Tag filters */}
            {topTags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <Tag className="w-3 h-3 text-white/40 shrink-0" />
                {topTags.map(tag => {
                  const active = tagFiltro === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setTagFiltro(active ? null : tag)}
                      className={cn(
                        'text-[11px] font-semibold px-3 py-1 rounded-full border transition-all duration-150',
                        active
                          ? 'bg-white text-primary border-white'
                          : 'border-white/25 text-white/70 hover:border-white/50 hover:text-white bg-white/5',
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Clear filters */}
            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[11px] font-semibold text-white/50 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Article list ── */}
      <main className="max-w-5xl mx-auto px-6 py-12">
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
              <button onClick={clearFilters} className="text-sm font-semibold text-primary hover:underline">
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {(busca || hasActiveFilter) && (
              <p className="text-sm text-muted-foreground mb-6">
                {filtered.length} {filtered.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}
                {busca && ` para "${busca}"`}
              </p>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              {filtered.map(artigo => {
                const badges      = badgesFromTags(artigo.tags);
                const accent      = accentFromBadges(badges);
                const hasBanner   = !!artigo.banner_url;
                const contentTags = artigo.tags.filter(t => t !== 'pro' && t !== 'essencial');

                return (
                  <Link
                    key={artigo.id}
                    to={`/base-de-conhecimento/${artigo.slug}`}
                    className="group flex flex-col bg-white border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200"
                  >
                    {/* Top visual */}
                    {hasBanner ? (
                      <div className="h-36 overflow-hidden shrink-0">
                        <img
                          src={artigo.banner_url}
                          alt={artigo.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className={cn('h-1.5 shrink-0', accent)} />
                    )}

                    {/* Content */}
                    <div className="flex flex-col gap-3 p-5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                          #{artigo.ordem}
                        </span>
                        {badges.map(b => (
                          <span
                            key={b}
                            className={cn(
                              'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full',
                              BADGES[b].color,
                            )}
                          >
                            {BADGES[b].label}
                          </span>
                        ))}
                      </div>

                      <div className="flex-1">
                        <h2 className="text-[15px] font-black text-foreground leading-tight mb-1.5 group-hover:text-primary transition-colors">
                          {artigo.titulo}
                        </h2>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {artigo.resumo}
                        </p>
                      </div>

                      {contentTags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Tag className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                          {contentTags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded-full transition-colors',
                                tagFiltro === tag
                                  ? 'bg-primary/10 text-primary font-semibold'
                                  : 'text-muted-foreground bg-muted',
                              )}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Ler artigo <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* ── Ticket de suporte (só logados) ── */}
      {user && (
        <section className="max-w-5xl mx-auto px-6 pb-12">
          <div className="rounded-2xl border border-border bg-muted/30 overflow-hidden">
            {/* Header clicável */}
            <button
              onClick={() => { setTicketOpen(v => !v); setTicketSent(false); }}
              className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <LifeBuoy className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Não encontrou o que procurava?</p>
                  <p className="text-xs text-muted-foreground">Abra um ticket e o suporte Tovia te responde em breve.</p>
                </div>
              </div>
              <span className={cn(
                'text-xs font-bold px-3 py-1.5 rounded-full border transition-colors shrink-0',
                ticketOpen
                  ? 'bg-muted text-muted-foreground border-border'
                  : 'bg-primary text-white border-primary'
              )}>
                {ticketOpen ? 'Fechar' : 'Abrir ticket'}
              </span>
            </button>

            {/* Formulário */}
            {ticketOpen && (
              <div className="border-t border-border px-6 py-6">
                {ticketSent ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Ticket enviado!</p>
                    <p className="text-xs text-muted-foreground">Nossa equipe vai analisar e responder em breve.</p>
                    <button
                      onClick={() => setTicketSent(false)}
                      className="text-xs font-semibold text-primary hover:underline mt-1"
                    >
                      Abrir outro ticket
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleTicketSubmit} className="space-y-4 max-w-2xl">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                          Assunto
                        </label>
                        <input
                          type="text"
                          value={ticketTitulo}
                          onChange={e => setTicketTitulo(e.target.value)}
                          placeholder="Descreva brevemente o problema ou dúvida"
                          required
                          className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                          Categoria
                        </label>
                        <select
                          value={ticketCategoria}
                          onChange={e => setTicketCategoria(e.target.value as Categoria)}
                          className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          {CATEGORIAS.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                          Descrição
                        </label>
                        <textarea
                          value={ticketDesc}
                          onChange={e => setTicketDesc(e.target.value)}
                          placeholder="Explique com detalhes — quanto mais informação, mais rápido te ajudamos."
                          required
                          rows={4}
                          className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={ticketSending || !ticketTitulo.trim() || !ticketDesc.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors"
                      >
                        {ticketSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LifeBuoy className="w-4 h-4" />}
                        Enviar ticket
                      </button>
                      <p className="text-xs text-muted-foreground">Respondemos em até 1 dia útil.</p>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-xl font-black text-primary">tovia</span>
          <p className="text-xs text-muted-foreground">Base de Conhecimento · Equipe Tovia</p>
          <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Voltar ao início
          </Link>
        </div>
      </footer>
    </div>
  );
}
