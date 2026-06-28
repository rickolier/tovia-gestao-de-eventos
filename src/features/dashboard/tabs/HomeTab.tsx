import React from 'react';
import { useAuth } from '~/context/AuthContext';
import { Evento } from '~/types';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, ArrowRight, TrendingUp, CheckCircle2, Clock, Star, UserCog, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

interface HomeTabProps {
  eventos: Evento[];
}

// Circular progress ring component
function ProgressRing({ value, max, color, label, sublabel }: { value: number; max: number; color: string; label: string; sublabel: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/60" />
          <circle
            cx="36" cy="36" r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            className="transition-all duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
          {value}<span className="text-[9px] text-muted-foreground">/{max}</span>
        </span>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}

function ProfileCompletion() {
  const { profile } = useAuth();

  const fields = [
    !!profile?.nome, !!profile?.imagem_url, !!profile?.bio, !!profile?.instituicao,
    !!profile?.telefone, !!profile?.contato_email, !!profile?.site, !!profile?.redes_social?.instagram,
    !!profile?.cnpj, !!profile?.endereco, !!profile?.cep,
  ];

  const doneCount = fields.filter(Boolean).length;
  const total = fields.length;
  const pct = Math.round((doneCount / total) * 100);

  if (pct === 100) return null;

  const isUrgent = pct < 20;
  const styles = isUrgent
    ? { wrap: 'bg-red-600 border-red-700',        text: 'text-white',        sub: 'text-red-100',  bar: 'bg-red-200',    fill: 'bg-white',       btn: 'bg-white hover:bg-red-50 text-red-700' }
    : { wrap: 'bg-amber-400 border-amber-500',     text: 'text-amber-950',   sub: 'text-amber-800', bar: 'bg-amber-200',  fill: 'bg-amber-900',   btn: 'bg-amber-900 hover:bg-amber-800 text-white' };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
      <div className={`${styles.wrap} rounded-xl border p-4 flex items-center gap-4`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${styles.text}`}>Perfil {pct}% completo</span>
            <span className={`text-xs ${styles.sub}`}>{doneCount}/{total} campos</span>
          </div>
          <div className={`w-full ${styles.bar} rounded-full h-1.5`}>
            <div className={`${styles.fill} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <Link to="/dashboard?tab=perfil" className="shrink-0">
          <Button size="sm" className={`${styles.btn} rounded-xl text-xs font-bold px-4 gap-1.5 whitespace-nowrap`}>
            Finalizar cadastro <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function HomeTab({ eventos }: HomeTabProps) {
  const { profile, user } = useAuth();
  const [showAll, setShowAll] = React.useState(false);

  const activeEvents = eventos.filter(e => e.ativo !== false);
  const archivedEvents = eventos.filter(e => e.ativo === false);
  const displayedEvents = showAll ? eventos : eventos.slice(0, 6);
  const hasMore = eventos.length > 6;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const today = new Date();
  const dayName = today.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      {/* ── Welcome Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          {getGreeting()}, {profile?.nome?.split(' ')[0] || 'Produtor'}!
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5 capitalize">{dayName}, {dateStr}</p>
      </motion.div>

      {/* ── Stats Row ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {/* Stat card 1 — Total eventos */}
        <div className="bg-card rounded-xl p-4 border border-border card-flat flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-none">{eventos.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total de eventos</p>
          </div>
        </div>

        {/* Stat card 2 — Ativos */}
        <div className="bg-card rounded-xl p-4 border border-border card-flat flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-none">{activeEvents.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ativos</p>
          </div>
        </div>

        {/* Stat card 3 — Arquivados */}
        <div className="bg-card rounded-xl p-4 border border-border card-flat flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-none">{archivedEvents.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Arquivados</p>
          </div>
        </div>

        {/* Stat card 4 — Plano */}
        <Link to="/planos" className="bg-card rounded-xl p-4 border border-border card-flat flex items-center gap-4 hover:border-primary/40 hover:shadow-sm transition-all group">
          <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-violet-500" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-foreground leading-none capitalize">{profile?.plano ?? 'Start'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Plano atual</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </Link>
      </motion.div>

      {/* ── Profile Completion ── */}
      <ProfileCompletion />

      {/* ── Events List ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Meus Eventos</h2>
            <p className="text-xs text-muted-foreground">{eventos.length} eventos cadastrados</p>
          </div>
          <div className="flex items-center gap-2">
            {hasMore && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                {showAll ? 'Ver menos' : 'Ver todos'}
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <Link to="/eventos/novo">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white h-8 px-3 text-xs font-semibold rounded-lg shadow-sm">
                + Novo evento
              </Button>
            </Link>
          </div>
        </div>

        {eventos.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl py-20 text-center">
            <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">Nenhum evento ainda</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Crie seu primeiro evento e comece a vender ingressos em minutos.
            </p>
            <Link to="/eventos/novo">
              <Button className="bg-primary hover:bg-primary/90 text-white h-10 px-6 font-semibold rounded-lg shadow-sm">
                Criar primeiro evento
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedEvents.map((evento, index) => {
              const dataInicio = new Date(evento.data_inicio);
              const eventColor = evento.cor_tema || '#1a7a45';
              const isGuestEvent = !!user && evento.criado_por !== user.uid;

              return (
                <motion.div
                  key={evento.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
                >
                  <Link to={`/eventos/${evento.id}`}>
                    <div className={cn(
                      'group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer',
                      evento.ativo === false && 'opacity-70 grayscale-[40%]',
                    )}>
                      {/* Color header strip */}
                      <div className="h-2 w-full" style={{ backgroundColor: eventColor }} />

                      {/* Card body */}
                      <div className="p-4">
                        {/* Top row: badge + status */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                            #{(evento.id || 'EV0').slice(0, 6).toUpperCase()}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isGuestEvent && (
                              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                                <UserCog className="w-3 h-3" /> Convidado
                              </span>
                            )}
                            <span className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                              evento.ativo
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-muted text-muted-foreground',
                            )}>
                              {evento.ativo ? 'Ativo' : 'Arquivado'}
                            </span>
                          </div>
                        </div>

                        {/* Event name */}
                        <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 mb-3">
                          {evento.nome}
                        </h3>

                        {/* Meta info */}
                        <div className="space-y-1.5 mb-4">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {isNaN(dataInicio.getTime())
                                ? 'Data a definir'
                                : dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="line-clamp-1">{evento.local || 'Local não informado'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            <span>{evento.vagas_totais || 0} vagas</span>
                          </div>
                        </div>

                        {/* CTA row */}
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <span className="text-[11px] font-semibold text-primary">Gerenciar</span>
                          <ArrowRight className="w-3.5 h-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
