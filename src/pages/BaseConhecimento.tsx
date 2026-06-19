import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ArrowRight, Tag } from 'lucide-react';
import { listDocuments } from '../lib/firebase-utils';
import { ArtigoBC } from '../types';
import { orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';

// ── Badge config ────────────────────────────────────────────────────────────

const BADGES = {
  start:     { label: 'Start',     color: 'bg-emerald-100 text-emerald-700' },
  essencial: { label: 'Essencial', color: 'bg-blue-100 text-blue-700'       },
  pro:       { label: 'Pro',       color: 'bg-violet-100 text-violet-700'   },
};

// Accent stripe color when card has no banner
const ACCENT: Record<string, string> = {
  start:     'bg-primary',
  essencial: 'bg-blue-400',
  pro:       'bg-violet-500',
};

type PlanKey = 'start' | 'essencial' | 'pro';

function badgesFromTags(tags: string[]): PlanKey[] {
  const hasPro      = tags.includes('pro');
  const hasEssencial = tags.includes('essencial');

  if (hasPro && !hasEssencial) return ['pro'];                       // Pro only
  if (hasEssencial)            return ['essencial', 'pro'];          // Essencial + Pro
  return ['start', 'essencial', 'pro'];                              // Start = todos
}

// Highest plan determines accent color
function accentFromBadges(badges: PlanKey[]): string {
  if (badges.length === 1 && badges[0] === 'pro')      return ACCENT.pro;
  if (badges[0] === 'essencial')                        return ACCENT.essencial;
  return ACCENT.start;
}

export default function BaseConhecimento() {
  const [artigos, setArtigos] = useState<ArtigoBC[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    listDocuments<ArtigoBC>('base_conhecimento', [orderBy('ordem')])
      .then(data => setArtigos(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = busca.trim()
    ? artigos.filter(a => {
        const q = busca.toLowerCase();
        return (
          a.titulo.toLowerCase().includes(q) ||
          a.resumo.toLowerCase().includes(q) ||
          a.conteudo.toLowerCase().includes(q) ||
          a.tags.some(t => t.toLowerCase().includes(q))
        );
      })
    : artigos;

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
          <a href="/login?cadastro=true" className="text-xs font-black text-primary hover:underline whitespace-nowrap">
            Crie o seu evento →
          </a>
        </div>
      </header>

      {/* ── Banner ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--sidebar) 0%, #1e3d2a 50%, #1a7a45 100%)', minHeight: '280px' }}
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-primary/20" />

        <div className="relative max-w-5xl mx-auto px-6 py-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
            Base de Conhecimento <span className="text-emerald-400">Tovia</span>
          </h1>
          <p className="text-white/60 text-sm max-w-lg mb-8">
            Tutoriais, guias e explicações sobre cada funcionalidade da plataforma — para você organizar eventos incríveis.
          </p>

          {/* Search bar */}
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Pesquise por funcionalidade, ingresso, pagamento..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm bg-white border-none shadow-xl outline-none focus:ring-2 focus:ring-primary/30"
            />
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
            <p className="text-muted-foreground font-medium">
              {busca ? `Nenhum artigo encontrado para "${busca}"` : 'Nenhum artigo publicado ainda.'}
            </p>
          </div>
        ) : (
          <>
            {busca && (
              <p className="text-sm text-muted-foreground mb-6">
                {filtered.length} {filtered.length === 1 ? 'artigo encontrado' : 'artigos encontrados'} para "{busca}"
              </p>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              {filtered.map(artigo => {
                const badges  = badgesFromTags(artigo.tags);
                const accent  = accentFromBadges(badges);
                const hasBanner = !!artigo.banner_url;
                const contentTags = artigo.tags.filter(t => t !== 'pro' && t !== 'essencial');

                return (
                  <Link
                    key={artigo.id}
                    to={`/base-de-conhecimento/${artigo.slug}`}
                    className="group flex flex-col bg-white border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200"
                  >
                    {/* ── Top visual: banner photo or colored stripe ── */}
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

                    {/* ── Content ── */}
                    <div className="flex flex-col gap-3 p-5 flex-1">
                      {/* Order + plan badges */}
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

                      {/* Tags */}
                      {contentTags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Tag className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                          {contentTags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
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
