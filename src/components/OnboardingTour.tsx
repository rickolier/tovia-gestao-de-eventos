import React, { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Sparkles, CheckCircle2, Ticket, DollarSign, Users, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanLevel } from '../types';

// ─── Persistence ─────────────────────────────────────────────────────────────

const KEY = (id: string) => `tovia_tour_v1_${id}`;
export const hasTourBeenSeen = (userId: string) => localStorage.getItem(KEY(userId)) === 'seen';
export const markTourSeen    = (userId: string) => localStorage.setItem(KEY(userId), 'seen');

// ─── Types ────────────────────────────────────────────────────────────────────

interface TourStep {
  target?: string;  // data-tour attribute; undefined = centered modal
  title: string;
  description: string;
  icon?: React.ReactNode;
  position?: 'right' | 'left' | 'bottom' | 'top';
}

interface Props {
  userId: string;
  plan: PlanLevel;
  onClose: () => void;
}

// ─── Steps per plan ──────────────────────────────────────────────────────────

function buildSteps(plan: PlanLevel): TourStep[] {
  const steps: TourStep[] = [
    {
      title: 'Bem-vindo ao Tovia!',
      description: 'Sua plataforma de gestão de eventos está pronta. Vamos mostrar os pontos principais em menos de 2 minutos.',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      target: 'nav-inicio',
      title: 'Seus Eventos',
      description: 'Na página Início você vê todos os seus eventos, inscrições recentes e o resumo da atividade.',
      icon: <LayoutGrid className="w-4 h-4" />,
      position: 'right',
    },
    {
      target: 'criar-evento',
      title: 'Crie Seu Primeiro Evento',
      description: 'Clique aqui para criar um evento. Em menos de 1 minuto você terá uma página de inscrição pronta para compartilhar.',
      icon: <Ticket className="w-4 h-4" />,
      position: 'right',
    },
    {
      target: 'nav-perfil',
      title: 'Configure Sua Organização',
      description: 'Adicione logo, nome da organização e dados de contato. Essas informações aparecem nas suas páginas de inscrição e e-mails automáticos.',
      icon: <Users className="w-4 h-4" />,
      position: 'right',
    },
    {
      target: 'nav-agenda',
      title: 'Agenda de Eventos',
      description: 'Visualize todos os seus eventos em um calendário mensal para nunca perder uma data.',
      position: 'right',
    },
  ];

  if (plan === 'essencial' || plan === 'pro') {
    steps.push({
      title: 'Módulo Financeiro',
      description: 'Dentro de cada evento, acesse a aba Financeiro para registrar pagamentos recebidos, doações e acompanhar o fluxo de caixa.',
      icon: <DollarSign className="w-4 h-4" />,
    });
  }

  if (plan === 'pro') {
    steps.push({
      title: 'Gestão Completa',
      description: 'Com o plano Pro você também gerencia Grupos (quartos, mesas, equipes), Tarefas e membros da sua equipe dentro de cada evento.',
      icon: <Users className="w-4 h-4" />,
    });
  }

  steps.push({
    title: 'Tudo Pronto!',
    description: 'Você pode acessar este tour novamente clicando em "Tutorial" na barra lateral. Bora criar seu primeiro evento!',
    icon: <CheckCircle2 className="w-4 h-4" />,
  });

  return steps;
}

// ─── Component ───────────────────────────────────────────────────────────────

const TOOLTIP_W = 296;
const SPOT_PAD  = 6;
const GAP       = 14;

export default function OnboardingTour({ userId, plan, onClose }: Props) {
  const [step, setStep]   = useState(0);
  const [rect, setRect]   = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);

  const steps   = buildSteps(plan);
  const current = steps[step];
  const isLast  = step === steps.length - 1;

  const measure = () => {
    if (current.target) {
      const el = document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    } else {
      setRect(null);
    }
  };

  useLayoutEffect(() => {
    measure();
    setReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleClose = () => { markTourSeen(userId); onClose(); };
  const goNext = () => isLast ? handleClose() : setStep(s => s + 1);
  const goPrev = () => step > 0 && setStep(s => s - 1);

  // ── Spotlight style ────────────────────────────────────────────────────────
  const spotStyle = (): React.CSSProperties | undefined => {
    if (!rect) return undefined;
    return {
      position:     'fixed',
      left:         rect.left  - SPOT_PAD,
      top:          rect.top   - SPOT_PAD,
      width:        rect.width  + SPOT_PAD * 2,
      height:       rect.height + SPOT_PAD * 2,
      borderRadius: 12,
      boxShadow:    '0 0 0 9999px rgba(0,0,0,0.65)',
      border:       '2px solid rgba(124,58,237,0.55)',
      zIndex:       9001,
      pointerEvents:'none',
      transition:   'left .25s ease, top .25s ease, width .25s ease, height .25s ease',
    };
  };

  // ── Tooltip style (positioned relative to spotlight) ──────────────────────
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const tooltipStyle = (): React.CSSProperties => {
    if (!rect || isMobile || !current.position) {
      return {
        position:  'fixed',
        top:       '50%',
        left:      '50%',
        transform: 'translate(-50%, -50%)',
        width:     TOOLTIP_W,
        maxWidth:  'calc(100vw - 32px)',
        zIndex:    9002,
      };
    }
    const pos = current.position;
    const centerY = Math.min(
      Math.max(16, rect.top + rect.height / 2 - 140),
      window.innerHeight - 300,
    );
    if (pos === 'right') return { position: 'fixed', left: rect.right + GAP, top: centerY, width: TOOLTIP_W, zIndex: 9002 };
    if (pos === 'left')  return { position: 'fixed', right: window.innerWidth - rect.left + GAP, top: centerY, width: TOOLTIP_W, zIndex: 9002 };
    if (pos === 'bottom') return { position: 'fixed', top: rect.bottom + GAP, left: Math.max(16, rect.left - TOOLTIP_W / 2 + rect.width / 2), width: TOOLTIP_W, zIndex: 9002 };
    return { position: 'fixed', bottom: window.innerHeight - rect.top + GAP, left: Math.max(16, rect.left - TOOLTIP_W / 2 + rect.width / 2), width: TOOLTIP_W, zIndex: 9002 };
  };

  // ── Arrow pointing toward the target ──────────────────────────────────────
  const ArrowLeft = () => (
    <div
      className="absolute top-1/2 -translate-y-1/2 -left-2 w-0 h-0"
      style={{ borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '8px solid hsl(var(--card))' }}
    />
  );

  if (!ready) return null;

  return createPortal(
    <div className="fixed inset-0 animate-in fade-in duration-200" style={{ zIndex: 9000 }}>

      {/* Backdrop — transparent when spotlight exists (spotlight provides the dark overlay) */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: rect ? 'transparent' : 'rgba(0,0,0,0.65)' }}
        onClick={handleClose}
      />

      {/* Spotlight */}
      {rect && <div style={spotStyle()} />}

      {/* Tooltip card */}
      <div
        style={tooltipStyle()}
        className="bg-card border border-border rounded-2xl shadow-2xl p-5 animate-in fade-in slide-in-from-left-2 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Arrow (only when positioned to right of target) */}
        {rect && current.position === 'right' && !isMobile && <ArrowLeft />}

        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {current.icon && (
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {current.icon}
              </div>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {step + 1} de {steps.length}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <h3 className="text-[15px] font-black text-foreground leading-tight mb-1.5">
          {current.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          {current.description}
        </p>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === step   ? 'bg-primary w-5' :
                i  < step   ? 'bg-primary/40 w-1.5' :
                               'bg-muted w-1.5',
              )}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {step > 0 && (
            <button
              onClick={goPrev}
              className="flex-1 h-9 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Anterior
            </button>
          )}
          <button
            onClick={goNext}
            className="flex-1 h-9 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1"
          >
            {isLast ? 'Concluir' : 'Próximo'}
            {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
