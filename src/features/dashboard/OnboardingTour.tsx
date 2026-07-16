import React, { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, ChevronRight, ChevronLeft, Sparkles, CheckCircle2,
  Ticket, DollarSign, Users, House, User, CalendarDays,
  Calculator, BarChart3, CreditCard, Plus, Globe,
  BookOpen, Package, Bed, ListChecks, UserPlus,
  Settings2, Heart, QrCode, Tag, GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanLevel } from '~/types';

// ─── Tour IDs ────────────────────────────────────────────────────────────────

export type TourId = 'inicial' | 'inscricoes' | 'financeiro' | 'gestao';

// ─── Persistence ─────────────────────────────────────────────────────────────

const KEY_V2 = (userId: string, tourId: TourId) => `tovia_tour_v2_${tourId}_${userId}`;
// Legacy key from v1 (single tour). If seen, treat 'inscricoes' as seen for existing users.
const KEY_V1 = (userId: string) => `tovia_tour_v1_${userId}`;

export const hasTourBeenSeen = (userId: string, tourId: TourId): boolean => {
  // Legacy v1 tour covered everything — treat all tours as seen for those users
  if (localStorage.getItem(KEY_V1(userId)) === 'seen') return true;
  return localStorage.getItem(KEY_V2(userId, tourId)) === 'seen';
};

export const markTourSeen = (userId: string, tourId: TourId): void => {
  localStorage.setItem(KEY_V2(userId, tourId), 'seen');
};

// ─── Tour metadata (for selector UI) ─────────────────────────────────────────

export interface TourMeta {
  id: TourId;
  label: string;
  description: string;
  icon: React.ReactNode;
  plans: PlanLevel[];
}

export const TOUR_DEFS: TourMeta[] = [
  {
    id: 'inicial',
    label: 'Tutorial Inicial',
    description: 'Conheça o painel do Tovia: navegação, perfil, agenda e como criar seu primeiro evento.',
    icon: <Sparkles className="w-4 h-4" />,
    plans: ['chinam', 'petach', 'koach', 'chalem'],
  },
  {
    id: 'inscricoes',
    label: 'Módulo de Inscrições',
    description: 'Ingressos, páginas de venda, participantes, cupons e check-in — dentro do seu evento.',
    icon: <Ticket className="w-4 h-4" />,
    plans: ['chinam', 'petach', 'koach', 'chalem'],
  },
  {
    id: 'financeiro',
    label: 'Módulo Financeiro',
    description: 'Configuração financeira, pagamentos manuais e doações.',
    icon: <DollarSign className="w-4 h-4" />,
    plans: ['petach', 'koach', 'chalem'],
  },
  {
    id: 'gestao',
    label: 'Módulo de Gestão',
    description: 'Recursos, grupos, tarefas, equipe e calculadora de eventos.',
    icon: <ListChecks className="w-4 h-4" />,
    plans: ['koach', 'chalem'],
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface TourStep {
  target?: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  position?: 'right' | 'left' | 'bottom' | 'top';
}

interface Props {
  userId: string;
  plan: PlanLevel;
  tourId: TourId;
  onClose: () => void;
}

// ─── Steps per tour ──────────────────────────────────────────────────────────

const PLAN_WELCOME: Record<PlanLevel, string> = {
  chinam:
    'Você está no plano Chinám (gratuito): 1 evento ativo, até 100 participantes, 1 ingresso por evento. Vamos ver o caminho mais rápido para começar!',
  petach:
    'Plano Pétach: até 3 eventos simultâneos, 200 participantes cada, 3 tipos de ingresso, controle financeiro manual e doações incluídos. Vamos configurar tudo!',
  koach:
    'Plano Koách: até 5 eventos com 500 participantes cada, equipe colaborativa, grupos, tarefas e recursos. Aqui vai o caminho para extrair o máximo do Tovia!',
  chalem:
    'Plano Chalém: 10 eventos, inscritos ilimitados, pagamentos automáticos via PIX, boleto e cartão, e equipe com até 10 membros. O plano completo do Tovia!',
};

const PLAN_TICKET_DESC: Record<PlanLevel, string> = {
  chinam:
    'No plano Chinám você cria 1 ingresso gratuito por evento, com número de vagas e prazo. Para criar ingressos pagos ou múltiplos tipos, faça upgrade para o Pétach.',
  petach:
    'Configure ingressos gratuitos, pagos (Pix, dinheiro, transferência) ou por doação — até 3 tipos por evento. Para pagamentos automáticos online, conheça o plano Chalém.',
  koach:
    'Crie até 5 tipos de ingresso: gratuitos, pagos e doações, cada um com valor, vagas e prazo independentes. Para pagamentos automáticos, conheça o plano Chalém.',
  chalem:
    'Crie até 10 tipos de ingresso: gratuitos, pagos e doações. Com pagamentos automáticos (BYOG), seus participantes pagam via PIX, boleto ou cartão direto para sua conta.',
};

const PLAN_FINAL_DESC: Record<PlanLevel, string> = {
  chinam:
    'Você conhece o módulo de inscrições! Crie seu evento, configure o ingresso e divulgue o link. Para desbloquear pagamentos e doações, conheça o plano Pétach em Configurações → Faturamento.',
  petach:
    'Você conhece o módulo de inscrições! Próximo passo: explore o Módulo Financeiro — clique em Tutorial na barra lateral e escolha "Módulo Financeiro" para aprender a registrar pagamentos.',
  koach:
    'Você conhece o módulo de inscrições! Explore também o Módulo Financeiro e o Módulo de Gestão em Tutorial para usar o Tovia ao máximo.',
  chalem:
    'Você conhece o módulo de inscrições! Explore também o Módulo Financeiro e o Módulo de Gestão em Tutorial para usar o Tovia ao máximo.',
};

function buildSteps(tourId: TourId, plan: PlanLevel): TourStep[] {
  if (tourId === 'inicial') {
    return [
      {
        title: 'Bem-vindo ao Tovia!',
        description: PLAN_WELCOME[plan],
        icon: <Sparkles className="w-4 h-4" />,
      },
      {
        target: 'nav-perfil',
        title: 'Complete o seu perfil!',
        description: 'Adicione logo, nome da sua organização e dados de contato. Essas informações aparecem nas páginas de inscrição e nos e-mails enviados aos participantes.',
        icon: <User className="w-4 h-4" />,
        position: 'right',
      },
      {
        target: 'nav-agenda',
        title: 'Agenda de Eventos!',
        description: 'Visualize todos os seus eventos num calendário mensal. Ideal para nunca perder uma data importante.',
        icon: <CalendarDays className="w-4 h-4" />,
        position: 'right',
      },
      {
        target: 'nav-relatorios',
        title: 'Relatórios!',
        description: 'Acompanhe os números consolidados de todos os seus eventos: capacidade total, eventos ativos e destaque de desempenho.',
        icon: <BarChart3 className="w-4 h-4" />,
        position: 'right',
      },
      {
        target: 'nav-configuracoes',
        title: 'Configurações e Faturamento!',
        description: 'Gerencie o plano que você contratou, seus limites de eventos e participantes, e o histórico de pagamentos da plataforma.',
        icon: <CreditCard className="w-4 h-4" />,
        position: 'right',
      },
      {
        target: 'nav-inicio',
        title: 'Seus eventos!',
        description: 'Na página Início você encontra todos os seus eventos e acessa qualquer um deles com um clique.',
        icon: <House className="w-4 h-4" />,
        position: 'right',
      },
      {
        target: 'criar-evento',
        title: 'Crie seu primeiro evento!',
        description: 'Clique aqui para criar um evento. Você define nome, data, local e todos os dados importantes. Ao entrar no evento, você verá um tutorial de cada módulo!',
        icon: <Plus className="w-4 h-4" />,
        position: 'right',
      },
      {
        title: 'Tovia está pronto para você!',
        description: 'Navegação conhecida, perfil configurado, primeiro evento a caminho. Cada módulo tem seu próprio tutorial — Inscrições, Financeiro e Gestão — que aparece automaticamente quando você acessar.',
        icon: <Sparkles className="w-4 h-4" />,
      },
    ];
  }

  if (tourId === 'inscricoes') {
    return [
      {
        title: 'Módulo de Inscrições!',
        description: 'Aqui dentro do evento você tem tudo para gerenciar os participantes. Vamos conhecer cada funcionalidade!',
        icon: <Ticket className="w-4 h-4" />,
      },
      {
        title: 'Configure os ingressos!',
        description: PLAN_TICKET_DESC[plan],
        icon: <Ticket className="w-4 h-4" />,
      },
      {
        title: 'Páginas de inscrição!',
        description: 'São links públicos que você compartilha com os participantes. Cada página tem ingressos vinculados, formulário personalizado e confirmação automática por e-mail.',
        icon: <Globe className="w-4 h-4" />,
      },
      {
        title: 'Cupons de desconto!',
        description: 'Crie cupons percentuais ou fixos para os seus eventos. Compartilhe com o público certo e acompanhe os usos em tempo real.',
        icon: <Tag className="w-4 h-4" />,
      },
      {
        title: 'Participantes!',
        description: 'Veja todas as inscrições realizadas: nome, contato, ingresso escolhido e status do pagamento. Exporte a lista quando precisar.',
        icon: <Users className="w-4 h-4" />,
      },
      {
        title: 'Check-in no dia do evento!',
        description: 'Use a tela de check-in para confirmar a presença dos participantes no dia. Busque por nome, CPF ou leia o QR Code do ingresso.',
        icon: <QrCode className="w-4 h-4" />,
      },
      {
        title: plan === 'chinam' ? 'Você está pronto para começar!' : 'Módulo de Inscrições concluído!',
        description: PLAN_FINAL_DESC[plan],
        icon: <BookOpen className="w-4 h-4" />,
      },
    ];
  }

  if (tourId === 'financeiro') {
    return [
      {
        title: 'Módulo Financeiro desbloqueado!',
        description: 'O Tovia não cobra seus participantes — você usa Pix, dinheiro, transferência ou qualquer meio, e registra aqui o que recebeu. Vamos ver como funciona!',
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        title: 'Configure as finanças do evento!',
        description: 'Na aba Configurações do evento, defina as taxas e os valores reais — isso permite que os relatórios financeiros sejam precisos.',
        icon: <Settings2 className="w-4 h-4" />,
      },
      {
        title: 'Registre e acompanhe pagamentos!',
        description: 'Na aba Financeiro você registra pagamentos manualmente, confirma entradas, acompanha parcelas e tem uma visão clara do fluxo de caixa.',
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        title: 'Acompanhe as doações!',
        description: 'Na aba Doações você vê todas as contribuições do evento. Você também pode alocar uma doação para um participante específico.',
        icon: <Heart className="w-4 h-4" />,
      },
      {
        title: 'Módulo Financeiro concluído!',
        description: 'Você conhece as ferramentas financeiras do Tovia. Para rever este tutorial, clique em Tutorial na barra lateral e escolha o módulo.',
        icon: <CheckCircle2 className="w-4 h-4" />,
      },
    ];
  }

  // gestao
  return [
    {
      title: 'Módulo de Gestão desbloqueado!',
      description: 'Com o plano Pro você tem acesso às ferramentas de gestão avançada: recursos, grupos, tarefas, equipe e calculadora de eventos.',
      icon: <ListChecks className="w-4 h-4" />,
    },
    {
      title: 'Calculadora de Evento!',
      description: 'Use a calculadora (em Configurações → Calculadora) para estimar o investimento do seu evento — defina vagas, custos fixos e variáveis e veja a viabilidade financeira.',
      icon: <Calculator className="w-4 h-4" />,
    },
    {
      title: 'Recursos do evento!',
      description: 'Na aba Recursos você cadastra tudo que o evento precisa: equipamentos, espaços, materiais. Gerencie disponibilidade e alocações em um só lugar.',
      icon: <Package className="w-4 h-4" />,
    },
    {
      title: 'Grupos e salas!',
      description: 'Divida os participantes em grupos, quartos, mesas ou qualquer estrutura. Ideal para acampamentos, retiros e eventos com hospedagem.',
      icon: <Bed className="w-4 h-4" />,
    },
    {
      title: 'Tarefas da equipe!',
      description: 'Organize o cronograma do evento em tarefas com responsáveis e prazos. Cada membro da equipe sabe exatamente o que precisa fazer e quando.',
      icon: <ListChecks className="w-4 h-4" />,
    },
    {
      title: 'Equipe do evento!',
      description: 'Adicione colaboradores ao evento para que eles também possam gerenciar inscrições, financeiro e tarefas. Configure as permissões de cada membro.',
      icon: <UserPlus className="w-4 h-4" />,
    },
    {
      title: 'Módulo de Gestão concluído!',
      description: 'Você conhece todas as ferramentas de gestão do Tovia. Para rever este tutorial, clique em Tutorial na barra lateral e escolha o módulo.',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  ];
}

// ─── Component ───────────────────────────────────────────────────────────────

const TOOLTIP_W = 296;
const SPOT_PAD  = 6;
const GAP       = 14;

export default function OnboardingTour({ userId, plan, tourId, onClose }: Props) {
  const [step, setStep]   = useState(0);
  const [rect, setRect]   = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);

  const steps   = buildSteps(tourId, plan);
  const current = steps[step];
  const isLast  = step === steps.length - 1;
  const tourMeta = TOUR_DEFS.find(t => t.id === tourId);

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

  const handleClose = () => { markTourSeen(userId, tourId); onClose(); };
  const goNext = () => isLast ? handleClose() : setStep(s => s + 1);
  const goPrev = () => step > 0 && setStep(s => s - 1);

  const spotStyle = (): React.CSSProperties | undefined => {
    if (!rect) return undefined;
    return {
      position:      'fixed',
      left:          rect.left  - SPOT_PAD,
      top:           rect.top   - SPOT_PAD,
      width:         rect.width  + SPOT_PAD * 2,
      height:        rect.height + SPOT_PAD * 2,
      borderRadius:  12,
      boxShadow:     '0 0 0 9999px rgba(0,0,0,0.65)',
      border:        '2px solid rgba(124,58,237,0.55)',
      zIndex:        9001,
      pointerEvents: 'none',
      transition:    'left .25s ease, top .25s ease, width .25s ease, height .25s ease',
    };
  };

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
    if (pos === 'right')  return { position: 'fixed', left: rect.right + GAP, top: centerY, width: TOOLTIP_W, zIndex: 9002 };
    if (pos === 'left')   return { position: 'fixed', right: window.innerWidth - rect.left + GAP, top: centerY, width: TOOLTIP_W, zIndex: 9002 };
    if (pos === 'bottom') return { position: 'fixed', top: rect.bottom + GAP, left: Math.max(16, rect.left - TOOLTIP_W / 2 + rect.width / 2), width: TOOLTIP_W, zIndex: 9002 };
    return { position: 'fixed', bottom: window.innerHeight - rect.top + GAP, left: Math.max(16, rect.left - TOOLTIP_W / 2 + rect.width / 2), width: TOOLTIP_W, zIndex: 9002 };
  };

  const ArrowLeft = () => (
    <div
      className="absolute top-1/2 -translate-y-1/2 -left-2 w-0 h-0"
      style={{ borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '8px solid hsl(var(--card))' }}
    />
  );

  if (!ready) return null;

  return createPortal(
    <div className="fixed inset-0 animate-in fade-in duration-200" style={{ zIndex: 9000 }}>
      <div
        className="absolute inset-0"
        style={{ backgroundColor: rect ? 'transparent' : 'rgba(0,0,0,0.65)' }}
        onClick={handleClose}
      />

      {rect && <div style={spotStyle()} />}

      <div
        style={tooltipStyle()}
        className="bg-card border border-border rounded-2xl shadow-2xl p-5 animate-in fade-in slide-in-from-left-2 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {rect && current.position === 'right' && !isMobile && <ArrowLeft />}

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {current.icon && (
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {current.icon}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary/70">
                {tourMeta?.label}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {step + 1} de {steps.length}
              </span>
            </div>
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
                i === step ? 'bg-primary w-5' :
                i  < step  ? 'bg-primary/40 w-1.5' :
                              'bg-muted w-1.5',
              )}
            />
          ))}
        </div>

        {/* Buttons */}
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

// ─── Tour Selector Modal ──────────────────────────────────────────────────────

interface TourSelectorProps {
  userId: string;
  plan: PlanLevel;
  onStart: (tourId: TourId) => void;
  onClose: () => void;
}

export function TourSelector({ userId, plan, onStart, onClose }: TourSelectorProps) {
  const availableTours = TOUR_DEFS.filter(t => t.plans.includes(plan));

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ zIndex: 9000 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">Tutoriais por Módulo</h2>
              <p className="text-[10px] text-muted-foreground">Escolha o módulo que quer ver</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Module list */}
        <div className="space-y-2">
          {availableTours.map(tour => {
            const seen = hasTourBeenSeen(userId, tour.id);
            return (
              <button
                key={tour.id}
                onClick={() => { onClose(); onStart(tour.id); }}
                className="w-full flex items-start gap-3 p-4 rounded-2xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                  {tour.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-foreground">{tour.label}</span>
                    {seen && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary-foreground0 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                        Visto
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{tour.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-2 group-hover:text-primary transition-colors" />
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
