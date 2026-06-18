import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDocument, listDocuments } from '../lib/firebase-utils';
import { UserProfile, Evento, PaginaVenda } from '../types';
import { where } from 'firebase/firestore';
import {
  Calendar, MapPin, Users, Mail, Phone, Globe, Instagram,
  MessageCircle, GlobeLock, ExternalLink, ChevronRight, Clock,
} from 'lucide-react';
import Logo from '../components/Logo';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function safeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url;
  } catch {}
  return undefined;
}

function getWhatsappLink(phone: string, nome: string) {
  const clean = phone.replace(/\D/g, '');
  const intl = clean.startsWith('55') ? clean : `55${clean}`;
  const msg = encodeURIComponent(`Olá! Vi seu perfil no Tovia e gostaria de saber mais sobre seus eventos.`);
  return `https://wa.me/${intl}?text=${msg}`;
}

export default function PublicOrganizerProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [organizador, setOrganizador] = useState<UserProfile | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [primeirasPaginas, setPrimeirasPaginas] = useState<Record<string, PaginaVenda>>({});

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

        setEventos(eventosData);

        // Busca a primeira página ativa de cada evento para montar o link de inscrição
        const pagMap: Record<string, PaginaVenda> = {};
        await Promise.all(
          eventosData.map(async (ev) => {
            try {
              const pags = await listDocuments<PaginaVenda>(`eventos/${ev.id}/paginas_venda`);
              const ativa = pags.find(p => p.ativa);
              if (ativa) pagMap[ev.id] = ativa;
            } catch {}
          })
        );
        setPrimeirasPaginas(pagMap);
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
  const contactLink = organizador.whatsapp
    ? { href: getWhatsappLink(organizador.whatsapp, displayName), label: 'Fale com o organizador', icon: MessageCircle, isExternal: true }
    : organizador.contato_email
    ? { href: `mailto:${organizador.contato_email}`, label: 'Fale com o organizador', icon: Mail, isExternal: false }
    : organizador.telefone
    ? { href: getWhatsappLink(organizador.telefone, displayName), label: 'Fale com o organizador', icon: MessageCircle, isExternal: true }
    : null;

  const eventosOrdenados = [...eventos].sort(
    (a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
  );

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-gray-900">

      {/* ── Header ── (mesmo da SalesPageContent) */}
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
            {/* Avatar */}
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

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-gray-900 leading-tight">{displayName}</h1>
              {organizador.cargo && (
                <p className="text-sm text-gray-500 mt-0.5">{organizador.cargo}</p>
              )}
              {organizador.bio && (
                <p className="text-sm text-gray-600 mt-2 max-w-lg leading-relaxed">{organizador.bio}</p>
              )}
            </div>

            {/* CTA */}
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

        {/* Eventos disponíveis */}
        <section>
          <div className="mb-4 pb-3 border-b border-gray-200">
            <h2 className="text-lg font-black text-gray-900">Eventos disponíveis</h2>
          </div>

          {eventosOrdenados.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center shadow-sm">
              <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-400">Nenhum evento disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventosOrdenados.map(evento => {
                const pagina = primeirasPaginas[evento.id];
                const href = pagina
                  ? `/e/${evento.id}/${pagina.slug}`
                  : undefined;
                const dataInicio = parseISO(evento.data_inicio);
                const isPast = dataInicio < new Date();

                return (
                  <div
                    key={evento.id}
                    className={`bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all ${href && !isPast ? 'hover:shadow-md hover:-translate-y-0.5' : 'opacity-70'}`}
                  >
                    {/* Color strip */}
                    <div className="h-1.5 w-full bg-primary" style={{ backgroundColor: evento.cor_tema || undefined }} />

                    <div className="p-5">
                      {/* Status badge */}
                      {isPast && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 mb-3">
                          <Clock className="w-3 h-3" /> Encerrado
                        </span>
                      )}

                      <h3 className="font-black text-gray-900 text-sm leading-snug line-clamp-2 mb-3">{evento.nome}</h3>

                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5 shrink-0 text-primary" />
                          <span>
                            {format(dataInicio, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
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

                      {href && !isPast ? (
                        <a
                          href={href}
                          className="flex items-center justify-between pt-3 border-t border-gray-100 group"
                        >
                          <span className="text-xs font-black text-primary">Inscrever-se</span>
                          <ChevronRight className="w-4 h-4 text-primary transition-transform group-hover:translate-x-0.5" />
                        </a>
                      ) : (
                        <div className="pt-3 border-t border-gray-100">
                          <span className="text-xs font-semibold text-gray-400">Inscrições encerradas</span>
                        </div>
                      )}
                    </div>
                  </div>
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

            {/* Links de contato */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
              {organizador.contato_email && (
                <a href={`mailto:${organizador.contato_email}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline font-semibold">
                  <Mail className="w-3.5 h-3.5" /> {organizador.contato_email}
                </a>
              )}
              {organizador.telefone && (
                <a href={getWhatsappLink(organizador.telefone, displayName)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline font-semibold">
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
