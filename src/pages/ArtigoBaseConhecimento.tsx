import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, User2, BookOpen } from 'lucide-react';
import { listDocuments } from '../lib/firebase-utils';
import { ArtigoBC } from '../types';
import { where } from 'firebase/firestore';

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  pro: { label: 'Pro', color: 'bg-violet-100 text-violet-700' },
  essencial: { label: 'Essencial', color: 'bg-blue-100 text-blue-700' },
};

function planFromTags(tags: string[]): string | null {
  if (tags.includes('pro')) return 'pro';
  if (tags.includes('essencial')) return 'essencial';
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

export default function ArtigoBaseConhecimento() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [artigo, setArtigo] = useState<ArtigoBC | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    listDocuments<ArtigoBC>('base_conhecimento', [where('slug', '==', slug)])
      .then(data => {
        if (data.length > 0) setArtigo(data[0]);
        else setArtigo(null);
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

  const plan = planFromTags(artigo.tags);
  const contentTags = artigo.tags.filter(t => t !== 'pro' && t !== 'essencial');
  const embedUrl = artigo.video_url ? getYoutubeEmbedUrl(artigo.video_url) : null;
  const paragraphs = artigo.conteudo.split(/\n\n+/).filter(Boolean);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <a href="/" className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity">
            <span className="text-sm font-light text-gray-400 tracking-tight">feito com</span>
            <span className="font-logo font-bold text-2xl tracking-tight text-primary leading-none">tovia</span>
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
          style={{ background: 'linear-gradient(135deg, var(--sidebar) 0%, #1e3d2a 60%, #1a7a45 100%)' }}
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

        {/* Back navigation */}
        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
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
