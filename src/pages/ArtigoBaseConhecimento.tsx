import { ToviaLogo } from '~/components/ToviaLogo';
import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Tag, User2, BookOpen } from 'lucide-react';
import { listDocuments } from '~/services/firestore';
import { ArtigoBC } from '~/types';
import { where, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  chalem: { label: 'Chalém', color: 'bg-amber-100 text-amber-700'     },
  koach:  { label: 'Koách',  color: 'bg-violet-100 text-violet-700'   },
  petach: { label: 'Pétach', color: 'bg-blue-100 text-blue-700'       },
};

const BADGES = {
  chinam: { label: 'Chinám', color: 'bg-orange-50 text-primary' },
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

const PLAN_TAG_KEYS = new Set<string>(['chinam', 'petach', 'koach', 'chalem']);

type PlanKey = 'chinam' | 'petach' | 'koach' | 'chalem';

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

function planFromTags(tags: string[]): string | null {
  if (tags.includes('chalem')) return 'chalem';
  if (tags.includes('koach'))  return 'koach';
  if (tags.includes('petach')) return 'petach';
  return null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (parsed.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${parsed.pathname}`;
    }
  } catch {}
  return null;
}

function getRelated(current: ArtigoBC, all: ArtigoBC[]): ArtigoBC[] {
  const others = all.filter(a => a.id !== current.id);
  const contentTags = current.tags.filter(t => !PLAN_TAG_KEYS.has(t));

  // Score by shared content tags
  const scored = others.map(a => {
    const shared = a.tags.filter(t => !PLAN_TAG_KEYS.has(t) && contentTags.includes(t));
    return { artigo: a, score: shared.length };
  });

  const withTags = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);

  if (withTags.length >= 2) return withTags.slice(0, 2).map(s => s.artigo);

  // Fallback: fill with adjacent articles by ordem
  const result = withTags.map(s => s.artigo);
  const usedIds = new Set([current.id, ...result.map(a => a.id)]);

  const adjacent = others
    .filter(a => !usedIds.has(a.id))
    .sort((a, b) => Math.abs(a.ordem - current.ordem) - Math.abs(b.ordem - current.ordem));

  for (const a of adjacent) {
    if (result.length >= 2) break;
    result.push(a);
  }

  return result;
}

export default function ArtigoBaseConhecimento() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [artigo, setArtigo]     = useState<ArtigoBC | null>(null);
  const [related, setRelated]   = useState<ArtigoBC[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }

    Promise.all([
      listDocuments<ArtigoBC>('base_conhecimento', [where('slug', '==', slug)]),
      listDocuments<ArtigoBC>('base_conhecimento', [orderBy('ordem')]),
    ])
      .then(([current, all]) => {
        const found = current[0] ?? null;
        setArtigo(found?.visivel === false ? null : found);
        if (found && found.visivel !== false) setRelated(getRelated(found, all.filter(a => a.visivel !== false)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!artigo) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-8 text-center">
        <BookOpen className="w-16 h-16 text-muted-foreground/30" />
        <h1 className="text-2xl font-black text-foreground">Artigo não encontrado</h1>
        <p className="text-muted-foreground max-w-sm text-sm">Este artigo não existe ou foi removido.</p>
        <Link to="/base-de-conhecimento" className="text-sm font-semibold text-primary hover:underline">
          Voltar à Base de Conhecimento
        </Link>
      </div>
    );
  }

  const plan        = planFromTags(artigo.tags);
  const contentTags = artigo.tags.filter(t => !PLAN_TAG_KEYS.has(t));
  const embedUrl    = artigo.video_url ? getYoutubeEmbedUrl(artigo.video_url) : null;
  const paragraphs  = artigo.conteudo.split(/\n\n+/).filter(Boolean);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <a href="/" className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity">
            <span className="text-sm font-light text-gray-400 tracking-tight">feito com</span>
            <ToviaLogo className="h-7 w-auto text-primary" />
          </a>
          <a
            href="/base-de-conhecimento"
            className="hidden sm:block text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors truncate max-w-[200px] text-center"
          >
            Base de Conhecimento
          </a>
          <a href="/login?cadastro=true" className="text-xs font-black text-primary hover:underline whitespace-nowrap">
            Crie o seu evento →
          </a>
        </div>
      </header>

      {/* ── Banner ── */}
      {artigo.banner_url ? (
        <div className="relative h-56 md:h-72 overflow-hidden">
          <img
            src={artigo.banner_url}
            alt={artigo.titulo}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 max-w-3xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
              {artigo.titulo}
            </h1>
          </div>
        </div>
      ) : (
        <div
          className="relative overflow-hidden px-6 pt-10 pb-10"
          style={{ background: 'linear-gradient(135deg, var(--sidebar) 0%, #1e3d2a 60%, #FF6B1A 100%)' }}
        >
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                #{artigo.ordem} · Base de Conhecimento
              </span>
              {plan && (
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${PLAN_LABELS[plan].color}`}>
                  {PLAN_LABELS[plan].label}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
              {artigo.titulo}
            </h1>
          </div>
        </div>
      )}

      {/* ── Article body ── */}
      <main className="max-w-3xl mx-auto px-6 py-10">

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <User2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-foreground">{artigo.autor}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Atualizado em {formatDate(artigo.atualizado_em)}
          </span>
          {contentTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap ml-auto">
              <Tag className="w-3 h-3 text-muted-foreground/40" />
              {contentTags.map(tag => (
                <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <p className="text-base text-foreground font-medium leading-relaxed mb-8 text-balance">
          {artigo.resumo}
        </p>

        {/* Main content */}
        <div className="prose-custom space-y-5">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-sm text-foreground/80 leading-[1.85] whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>

        {/* Video embed */}
        {embedUrl && (
          <div className="mt-10 rounded-2xl overflow-hidden border border-border shadow-sm aspect-video">
            <iframe
              src={embedUrl}
              title={artigo.titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        )}

        {/* ── Related articles ── */}
        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-4">
              Artigos relacionados
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map(rel => {
                const relBadges = badgesFromTags(rel.tags);
                const relAccent = accentFromBadges(relBadges);
                return (
                  <Link
                    key={rel.id}
                    to={`/base-de-conhecimento/${rel.slug}`}
                    className="group flex flex-col bg-white border border-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-200"
                  >
                    {rel.banner_url ? (
                      <div className="h-24 overflow-hidden shrink-0">
                        <img
                          src={rel.banner_url}
                          alt={rel.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className={cn('h-1 shrink-0', relAccent)} />
                    )}
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                          #{rel.ordem}
                        </span>
                        {relBadges.map(b => (
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
                      <p className="text-sm font-black text-foreground leading-tight group-hover:text-primary transition-colors">
                        {rel.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {rel.resumo}
                      </p>
                      <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        Ler artigo <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Back navigation */}
        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <Link
            to="/base-de-conhecimento"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Ver todos os artigos
          </Link>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <ToviaLogo className="h-6 w-auto text-primary" />
          <p className="text-xs text-muted-foreground">Base de Conhecimento · Equipe Tovia</p>
          <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Voltar ao início
          </Link>
        </div>
      </footer>
    </div>
  );
}
