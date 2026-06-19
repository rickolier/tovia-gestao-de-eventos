import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ArrowRight, Tag } from 'lucide-react';
import { listDocuments } from '../lib/firebase-utils';
import { ArtigoBC } from '../types';
import { orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  pro: { label: 'Pro', color: 'bg-violet-100 text-violet-700' },
  essencial: { label: 'Essencial', color: 'bg-blue-100 text-blue-700' },
};

function planFromTags(tags: string[]): string | null {
  if (tags.includes('pro')) return 'pro';
  if (tags.includes('essencial')) return 'essencial';
  return null;
}

export default function BaseConhecimento() {
  const [artigos, setArtigos] = useState<ArtigoBC[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    listDocuments<ArtigoBC>('base_conhecimento', [orderBy('ordem')])
      .then(data => { setArtigos(data); })
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
      <header className="h-14 bg-white border-b border-border flex items-center px-6 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Feito com <span className="text-primary font-black">tovia</span>
          </Link>
          <span className="text-sm font-black text-foreground">Base de Conhecimento</span>
          <Link
            to="/login?cadastro=true"
            className="text-xs font-black bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Crie seu evento!
          </Link>
        </div>
      </header>

      {/* ── Banner ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--sidebar) 0%, #1e3d2a 50%, #1a7a45 100%)',
          minHeight: '280px',
        }}
      >
        {/* Decorative circles */}
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
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map(artigo => {
                const plan = planFromTags(artigo.tags);
                return (
                  <Link
                    key={artigo.id}
                    to={`/base-de-conhecimento/${artigo.slug}`}
                    className="group flex flex-col gap-3 bg-white border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition-all"
                  >
                    {/* Order + plan badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">
                        #{artigo.ordem}
                      </span>
                      {plan && (
                        <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full', PLAN_LABELS[plan].color)}>
                          {PLAN_LABELS[plan].label}
                        </span>
                      )}
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
                    {artigo.tags.filter(t => t !== 'pro' && t !== 'essencial').length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Tag className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                        {artigo.tags.filter(t => t !== 'pro' && t !== 'essencial').slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Ler artigo <ArrowRight className="w-3 h-3" />
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
