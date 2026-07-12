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
  chinam: { label: 'Chinám', color: 'bg-emerald-100 text-emerald-700' },
  petach: { label: 'Pétach', color: 'bg-blue-100 text-blue-700'       },
  koach:  { label: 'Koách',  color: 'bg-violet-100 text-violet-700'   },
  chalem: { label: 'Chalém', color: 'bg-amber-100 text-amber-700'     },
};

const ACCENT: Record<string, string> = {
  chinam: 'bg-primary',
  petach: 'bg-blue-400',
  koach:  'bg-violet-500',
  chalem: 'bg-amber-500',
};

// Active filter pill styles (shown on the banner dark bg)
const PLAN_FILTER_ACTIVE: Record<string, string> = {
  chinam: 'bg-emerald-500 text-white border-emerald-500',
  petach: 'bg-blue-500 text-white border-blue-500',
  koach:  'bg-violet-500 text-white border-violet-500',
  chalem: 'bg-amber-500 text-white border-amber-500',
};

type PlanKey = 'chinam' | 'petach' | 'koach' | 'chalem';

const PLAN_FILTERS: { key: PlanKey; label: string }[] = [
  { key: 'chinam', label: 'Chinám'  },
  { key: 'petach', label: 'Pétach'  },
  { key: 'koach',  label: 'Koách'   },
  { key: 'chalem', label: 'Chalém'  },
];

const PINNED_TAGS = ['início', 'configuração', 'eventos', 'financeiro', 'suporte'];

const PLAN_TAG_KEYS = new Set<string>(['chinam', 'petach', 'koach', 'chalem']);

function badgesFromTags(tags: string[]): PlanKey[] {
  const hasChalem = tags.includes('chalem');
  const hasKoach  = tags.includes('koach');
  const hasPetach = tags.includes('petach');
  if (hasChalem && !hasKoach && !hasPetach) return ['chalem'];
  if (hasKoach)  return ['koach', 'chalem'];
  if (hasPetach) return ['petach', 'koach', 'chalem'];
  return ['chinam', 'petach', 'koach', 'chalem'];
}

function accentFromBadges(badges: PlanKey[]): string {
  if (badges[0] === 'chalem') return ACCENT.chalem;
  if (badges[0] === 'koach')  return ACCENT.koach;
  if (badges[0] === 'petach') return ACCENT.petach;
  return ACCENT.chinam;
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
                const contentTags = artigo.tags.filter(t => !PLAN_TAG_KEYS.has(t));

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
          <div className="rounded-2xl overflow-hidden shadow-sm">

            {/* Banner principal */}
            <div className="bg-primary px-8 py-10 flex flex-col sm:flex-row items-center gap-6 text-white">
              <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                <LifeBuoy className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xl font-black leading-snug">Precisa de ajuda?</p>
                <p className="text-sm text-white/80 mt-1 leading-relaxed max-w-lg">
                  Ficou com dúvida ou encontrou algum problema? Nossa equipe está aqui — abra um chamado e respondemos em até 1 dia útil.
                </p>
              </div>
              <button
                onClick={() => { setTicketOpen(v => !v); setTicketSent(false); }}
                className={cn(
                  'shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer',
                  ticketOpen
                    ? 'bg-white/15 text-white border-white/30 hover:bg-white/25'
                    : 'bg-white text-primary border-white hover:bg-white/90'
                )}
              >
                <LifeBuoy className="w-4 h-4" />
                {ticketOpen ? 'Fechar' : 'Abrir chamado'}
              </button>
            </div>

            {/* Formulário */}
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
                    <button
                      onClick={() => setTicketSent(false)}
                      className="text-sm font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Abrir outro chamado
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleTicketSubmit} className="space-y-5 max-w-2xl">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                          Assunto
                        </label>
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
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                          Categoria
                        </label>
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
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                          Descrição
                        </label>
                        <textarea
                          value={ticketDesc}
                          onChange={e => setTicketDesc(e.target.value)}
                          placeholder="Explique com detalhes — quanto mais informação, mais rápido te ajudamos."
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
