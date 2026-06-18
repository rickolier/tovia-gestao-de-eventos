import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getDocument, listDocuments } from '../lib/firebase-utils';
import { UserProfile, Evento, PaginaVenda } from '../types';
import { where } from 'firebase/firestore';
import {
  Calendar, MapPin, Users, Mail, Phone, Globe, Instagram,
  MessageCircle, GlobeLock, ExternalLink, ChevronRight, X,
  FileText, ArrowRight, Loader2,
} from 'lucide-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function safeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url;
  } catch {}
  return undefined;
}

function getWhatsappLink(phone: string) {
  const clean = phone.replace(/\D/g, '');
  const intl = clean.startsWith('55') ? clean : `55${clean}`;
  const msg = encodeURIComponent('Olá! Vi seu perfil no Tovia e gostaria de saber mais sobre seus eventos.');
  return `https://wa.me/${intl}?text=${msg}`;
}

// ─── Modal de páginas do evento ───────────────────────────────────────────────
function EventPagesModal({
  evento,
  onClose,
}: {
  evento: Evento;
  onClose: () => void;
}) {
  const [pages, setPages] = useState<PaginaVenda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDocuments<PaginaVenda>(`eventos/${evento.id}/paginas_venda`)
      .then(data => setPages(data.filter(p => p.ativa)))
      .catch(() => setPages([]))
      .finally(() => setLoading(false));
  }, [evento.id]);

  // Fecha ao clicar no overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const dataInicio = parseISO(evento.data_inicio);
  const dataFim = parseISO(evento.data_fim);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header do modal */}
        <div className="relative">
          {/* Color strip */}
          <div className="h-1.5 w-full bg-primary" style={{ backgroundColor: evento.cor_tema || undefined }} />

          <div className="px-6 pt-5 pb-4">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>

            <h2 className="text-lg font-black text-gray-900 pr-10 leading-tight">{evento.nome}</h2>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                {format(dataInicio, "d 'de' MMM", { locale: ptBR })}
                {evento.data_fim && evento.data_fim !== evento.data_inicio && (
                  <> → {format(dataFim, "d 'de' MMM 'de' yyyy", { locale: ptBR })}</>
                )}
              </span>
              {evento.local && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  {evento.local}
                </span>
              )}
            </div>
          </div>

          <div className="border-b border-gray-100 mx-6" />
        </div>

        {/* Corpo do modal */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : pages.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-400">Nenhuma página de inscrição disponível.</p>
              <p className="text-xs text-gray-400 mt-1">As inscrições para este evento podem estar encerradas.</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                {pages.length === 1 ? '1 opção de inscrição' : `${pages.length} opções de inscrição`}
              </p>
              {pages.map(page => (
                <a
                  key={page.id}
                  href={`/e/${evento.id}/${page.slug}`}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                    <FileText className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-gray-900 leading-tight">{page.nome}</p>
                    {page.descricao && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{page.descricao}</p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors shrink-0" />
                </a>
              ))}
            </>
          )}
        </div>

        {/* Footer do modal */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PublicOrganizerProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [organizador, setOrganizador] = useState<UserProfile | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    (async () => {
      try {
        const user = await getDocument<UserProfile>('users', userId);
        if (!user || !user.pagina_publica) { setLoading(false); return; }
        setOrganizador(user);

        const eventosData = await listDocuments<Evento>('eventos', [
          where('criado_por', '==', userId),
          where('ativo', '==', true),
        ]).catch(() => [] as Evento[]);

        // Ordena: futuros primeiro (por data_inicio asc), passados no final
        const today = startOfDay(new Date());
        const futuros = eventosData
          .filter(e => !isBefore(parseISO(e.data_fim), today))
          .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());
        const passados = eventosData
          .filter(e => isBefore(parseISO(e.data_fim), today))
          .sort((a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime());

        setEventos([...futuros, ...passados]);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!organizador) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8 text-center">
        <GlobeLock className="w-16 h-16 text-muted-foreground/30" />
        <h1 className="text-2xl font-black text-foreground">Página não encontrada</h1>
        <p className="text-muted-foreground max-w-sm">Este perfil de organizador não existe ou está inativo.</p>
        <a href="/" className="text-sm font-black text-primary hover:underline">Ir para o início →</a>
      </div>
    );
  }

  const displayName = organizador.instituicao || organizador.nome;
  const today = startOfDay(new Date());

  const contactLink = organizador.whatsapp
    ? { href: getWhatsappLink(organizador.whatsapp), label: 'Fale com o organizador', icon: MessageCircle, isExternal: true }
    : organizador.contato_email
    ? { href: `mailto:${organizador.contato_email}`, label: 'Fale com o organizador', icon: Mail, isExternal: false }
    : organizador.telefone
    ? { href: getWhatsappLink(organizador.telefone), label: 'Fale com o organizador', icon: MessageCircle, isExternal: true }
    : null;

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-gray-900">

      {/* Modal de páginas do evento */}
      {selectedEvent && (
        <EventPagesModal
          evento={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <a href="/" className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity">
            <span className="text-sm font-light text-gray-400 tracking-tight">feito com</span>
            <span className="font-logo font-bold text-2xl tracking-tight text-primary leading-none">tovia</span>
          </a>
          <span className="hidden sm:block text-xs font-semibold text-gray-500 truncate max-w-[200px] text-center">
            {displayName}
          </span>
          <a href="/" className="text-xs font-black text-primary hover:underline whitespace-nowrap">
            Crie o seu evento →
          </a>
        </div>
      </header>

      {/* ── Profile banner ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="shrink-0">
              {organizador.imagem_url ? (
                <img
                  src={organizador.imagem_url}
                  alt={displayName}
                  className="w-24 h-24 rounded-2xl object-cover border border-gray-100 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                  <span className="text-4xl font-black text-primary">{displayName[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-gray-900 leading-tight">{displayName}</h1>
              {organizador.cargo && <p className="text-sm text-gray-500 mt-0.5">{organizador.cargo}</p>}
              {organizador.bio && (
                <p className="text-sm text-gray-600 mt-2 max-w-lg leading-relaxed">{organizador.bio}</p>
              )}
            </div>

            {contactLink && (
              <a
                href={contactLink.href}
                target={contactLink.isExternal ? '_blank' : undefined}
                rel={contactLink.isExternal ? 'noopener noreferrer' : undefined}
                className="shrink-0 flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-black text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-[0.97]"
              >
                <contactLink.icon className="w-4 h-4" />
                {contactLink.label}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">

        {/* Eventos */}
        <section>
          <div className="mb-4 pb-3 border-b border-gray-200">
            <h2 className="text-lg font-black text-gray-900">Eventos</h2>
            {eventos.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">Clique em um evento para ver as opções de inscrição.</p>
            )}
          </div>

          {eventos.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center shadow-sm">
              <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-400">Nenhum evento disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventos.map(evento => {
                const dataInicio = parseISO(evento.data_inicio);
                const isPast = isBefore(parseISO(evento.data_fim), today);

                return (
                  <button
                    key={evento.id}
                    onClick={() => setSelectedEvent(evento)}
                    className={`text-left bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all w-full ${
                      !isPast
                        ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer hover:border-primary/30'
                        : 'opacity-60 cursor-pointer hover:opacity-80'
                    }`}
                  >
                    {/* Color strip */}
                    <div className="h-1.5 w-full bg-primary" style={{ backgroundColor: evento.cor_tema || undefined }} />

                    <div className="p-5">
                      {isPast && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 mb-2">
                          Encerrado
                        </span>
                      )}

                      <h3 className="font-black text-gray-900 text-sm leading-snug line-clamp-2 mb-3">{evento.nome}</h3>

                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5 shrink-0 text-primary" />
                          <span>{format(dataInicio, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                        </div>
                        {evento.local && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                            <span className="line-clamp-1">{evento.local}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Users className="w-3.5 h-3.5 shrink-0 text-primary" />
                          <span>{evento.vagas_totais} vagas</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className={`text-xs font-black ${isPast ? 'text-gray-400' : 'text-primary'}`}>
                          {isPast ? 'Ver detalhes' : 'Ver inscrições'}
                        </span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${isPast ? 'text-gray-300' : 'text-primary'}`} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Sobre o organizador */}
        <section>
          <div className="mb-4 pb-3 border-b border-gray-200">
            <h2 className="text-lg font-black text-gray-900">Sobre o organizador</h2>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-start gap-4">
              {organizador.imagem_url ? (
                <img src={organizador.imagem_url} alt={displayName} className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-black text-primary">{displayName[0]?.toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-900">{displayName}</p>
                {organizador.cargo && <p className="text-sm text-gray-500">{organizador.cargo}</p>}
              </div>
            </div>

            {(organizador.descricao || organizador.bio) && (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {organizador.descricao || organizador.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
              {organizador.contato_email && (
                <a href={`mailto:${organizador.contato_email}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline font-semibold">
                  <Mail className="w-3.5 h-3.5" /> {organizador.contato_email}
                </a>
              )}
              {organizador.telefone && (
                <a href={getWhatsappLink(organizador.telefone)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline font-semibold">
                  <Phone className="w-3.5 h-3.5" /> {organizador.telefone}
                </a>
              )}
              {safeUrl(organizador.site) && (
                <a href={safeUrl(organizador.site)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline font-semibold">
                  <Globe className="w-3.5 h-3.5" /> Site <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {organizador.redes_social?.instagram && (
                <a href={`https://instagram.com/${organizador.redes_social.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline font-semibold">
                  <Instagram className="w-3.5 h-3.5" /> @{organizador.redes_social.instagram.replace('@', '')}
                </a>
              )}
              {safeUrl(organizador.link_importante_1) && (
                <a href={safeUrl(organizador.link_importante_1)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline font-semibold">
                  <ExternalLink className="w-3.5 h-3.5" /> Link
                </a>
              )}
              {safeUrl(organizador.link_importante_2) && (
                <a href={safeUrl(organizador.link_importante_2)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline font-semibold">
                  <ExternalLink className="w-3.5 h-3.5" /> Link 2
                </a>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white mt-8">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
          <a href="/" className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity">
            <span className="text-xs font-light text-gray-400 tracking-tight">feito com</span>
            <span className="font-logo font-bold text-lg tracking-tight text-primary leading-none">tovia</span>
          </a>
          <a href="/" className="text-xs font-black text-primary hover:underline">
            Organize seus eventos →
          </a>
        </div>
      </footer>
    </div>
  );
}
