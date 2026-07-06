import React, { useEffect, useState, useMemo } from 'react';
import { Evento, Inscricao, Ticket, Donation } from '~/types';
import { useAuth } from '~/context/AuthContext';
import { listDocuments } from '~/services/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, TrendingUp, TrendingDown, DollarSign, CheckSquare, Heart,
  Award, BarChart3, Ticket as TicketIcon, Calendar, Lock,
  Minus, ChevronDown, ChevronUp, Gift
} from 'lucide-react';
import { cn } from '@/lib/utils';

type PeriodFilter = 'all' | '30d' | '90d' | '12m' | 'custom';
type EventFilterMode = 'all' | 'active' | 'completed' | 'custom';
type TypeFilter = 'gratuito' | 'pago' | 'doacao';

interface ReportsTabProps {
  eventos: Evento[];
}

function getPeriodBounds(period: PeriodFilter, customStart: string, customEnd: string) {
  const now = new Date();
  switch (period) {
    case '30d': return { start: new Date(now.getTime() - 30 * 86400000), end: now };
    case '90d': return { start: new Date(now.getTime() - 90 * 86400000), end: now };
    case '12m': return { start: new Date(now.getTime() - 365 * 86400000), end: now };
    case 'custom': return {
      start: customStart ? new Date(customStart) : undefined,
      end: customEnd ? new Date(customEnd + 'T23:59:59') : undefined,
    };
    default: return {} as { start?: Date; end?: Date };
  }
}

function fmtCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'primary',
  locked = false,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: string;
  color?: 'primary' | 'emerald' | 'amber' | 'violet' | 'rose';
  locked?: boolean;
}) {
  const colorMap = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', val: 'text-primary' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', val: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', val: 'text-amber-600' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', val: 'text-violet-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', val: 'text-rose-600' },
  };
  const c = colorMap[color];

  return (
    <Card className="border border-border shadow-sm bg-card rounded-2xl relative overflow-hidden">
      <CardContent className="p-5">
        {locked && (
          <div className="absolute inset-0 bg-muted/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2 rounded-2xl">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground text-center px-4">Disponível no plano Essencial ou Pro</span>
          </div>
        )}
        <div className="flex items-start gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', c.bg)}>
            <Icon className={cn('w-5 h-5', c.text)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5">{label}</p>
            <p className={cn('text-2xl font-black leading-none', c.val)}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1 leading-snug">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportsTab({ eventos }: ReportsTabProps) {
  const { profile } = useAuth();
  const isPro = profile?.plano === 'petach' || profile?.plano === 'koach' || profile?.plano === 'chalem' ||
    profile?.plano === 'essencial' || profile?.plano === 'pro' || profile?.plano === 'personalizado';

  // Filter state
  const [eventFilterMode, setEventFilterMode] = useState<EventFilterMode>('all');
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [typeFilters, setTypeFilters] = useState<Set<TypeFilter>>(new Set(['gratuito', 'pago', 'doacao']));

  // Loaded data
  const [inscByEvent, setInscByEvent] = useState<Map<string, Inscricao[]>>(new Map());
  const [ticketsByEvent, setTicketsByEvent] = useState<Map<string, Ticket[]>>(new Map());
  const [doacoesByEvent, setDoacoesByEvent] = useState<Map<string, Donation[]>>(new Map());
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Derived: filtered event list
  const filteredEvents = useMemo(() => {
    switch (eventFilterMode) {
      case 'active': return eventos.filter(e => e.ativo !== false);
      case 'completed': return eventos.filter(e => e.ativo === false);
      case 'custom': return eventos.filter(e => selectedEventIds.has(e.id));
      default: return eventos;
    }
  }, [eventos, eventFilterMode, selectedEventIds]);

  // Fetch data for events not yet loaded
  useEffect(() => {
    const toLoad = filteredEvents.map(e => e.id).filter(id => !loadedIds.has(id));
    if (toLoad.length === 0) return;
    setLoading(true);
    Promise.all(
      toLoad.map(async (id) => {
        const [insc, tix, doac] = await Promise.all([
          listDocuments<Inscricao>(`eventos/${id}/inscricoes`),
          listDocuments<Ticket>(`eventos/${id}/tickets`),
          listDocuments<Donation>(`eventos/${id}/doacoes`),
        ]);
        return { id, insc, tix, doac };
      })
    ).then(results => {
      setInscByEvent(prev => {
        const next = new Map(prev);
        results.forEach(r => next.set(r.id, r.insc));
        return next;
      });
      setTicketsByEvent(prev => {
        const next = new Map(prev);
        results.forEach(r => next.set(r.id, r.tix));
        return next;
      });
      setDoacoesByEvent(prev => {
        const next = new Map(prev);
        results.forEach(r => next.set(r.id, r.doac));
        return next;
      });
      setLoadedIds(prev => {
        const next = new Set(prev);
        toLoad.forEach(id => next.add(id));
        return next;
      });
    }).finally(() => setLoading(false));
  }, [filteredEvents]);

  const periodBounds = useMemo(() =>
    getPeriodBounds(periodFilter, customStart, customEnd),
  [periodFilter, customStart, customEnd]);

  function isInPeriod(dateStr?: string): boolean {
    if (!dateStr) return true;
    if (!periodBounds.start && !periodBounds.end) return true;
    const d = new Date(dateStr);
    if (periodBounds.start && d < periodBounds.start) return false;
    if (periodBounds.end && d > periodBounds.end) return false;
    return true;
  }

  const ticketMaps = useMemo(() => {
    const maps = new Map<string, Map<string, Ticket>>();
    for (const [eventId, tickets] of ticketsByEvent) {
      maps.set(eventId, new Map(tickets.map(t => [t.id, t])));
    }
    return maps;
  }, [ticketsByEvent]);

  // All inscriptions with type, filtered
  const allInsc = useMemo(() => {
    const result: (Inscricao & { tipoIngresso: TypeFilter; eventoId: string })[] = [];
    for (const evento of filteredEvents) {
      const inscricoes = inscByEvent.get(evento.id) ?? [];
      const ticketMap = ticketMaps.get(evento.id) ?? new Map();
      for (const insc of inscricoes) {
        if (insc.status === 'cancelada') continue;
        if (!isInPeriod(insc.data_inscricao)) continue;
        const ticket = ticketMap.get(insc.ticketId);
        const tipo: TypeFilter = ticket?.tipo === 'doacao' ? 'doacao' : ticket?.tipo === 'pago' ? 'pago' : 'gratuito';
        if (!typeFilters.has(tipo)) continue;
        result.push({ ...insc, tipoIngresso: tipo, eventoId: evento.id });
      }
    }
    return result;
  }, [filteredEvents, inscByEvent, ticketMaps, typeFilters, periodBounds]);

  // All donations, filtered
  const allDoac = useMemo(() => {
    if (!typeFilters.has('doacao')) return [];
    const result: Donation[] = [];
    for (const evento of filteredEvents) {
      const doacoes = doacoesByEvent.get(evento.id) ?? [];
      for (const d of doacoes) {
        if (d.status === 'cancelada') continue;
        if (!isInPeriod(d.dataPagamento || d.data)) continue;
        result.push(d);
      }
    }
    return result;
  }, [filteredEvents, doacoesByEvent, typeFilters, periodBounds]);

  // KPI 1 — Total inscrições confirmadas
  const kpi1 = allInsc.length;

  // KPI 2 — Taxa de ocupação média
  const kpi2 = useMemo(() => {
    const totalVagas = filteredEvents.reduce((a, e) => a + (e.vagas_totais || 0), 0);
    return totalVagas === 0 ? 0 : Math.min(100, Math.round((kpi1 / totalVagas) * 100));
  }, [kpi1, filteredEvents]);

  // KPI 3 — Receita total
  const kpi3 = useMemo(() =>
    allInsc.filter(i => i.status === 'pago' && i.tipoIngresso === 'pago')
      .reduce((a, i) => a + (i.valor_pago || 0), 0),
  [allInsc]);

  // KPI 4 — Check-ins
  const kpi4 = useMemo(() => allInsc.filter(i => i.presenca === true).length, [allInsc]);

  // KPI 5 — Total doações
  const kpi5 = useMemo(() =>
    allDoac.filter(d => d.status === 'aprovada').reduce((a, d) => a + (d.valor || 0), 0),
  [allDoac]);

  // KPI 6 — Evento destaque
  const kpi6 = useMemo(() => {
    if (filteredEvents.length === 0) return null;
    return filteredEvents.reduce((best, ev) => {
      const count = (inscByEvent.get(ev.id) ?? []).filter(i => i.status !== 'cancelada').length;
      const rate = count / (ev.vagas_totais || 1);
      const bestCount = (inscByEvent.get(best.id) ?? []).filter(i => i.status !== 'cancelada').length;
      const bestRate = bestCount / (best.vagas_totais || 1);
      return rate > bestRate ? ev : best;
    }, filteredEvents[0]);
  }, [filteredEvents, inscByEvent]);

  const kpi6Count = kpi6 ? (inscByEvent.get(kpi6.id) ?? []).filter(i => i.status !== 'cancelada').length : 0;
  const kpi6Rate = kpi6 ? Math.min(100, Math.round((kpi6Count / (kpi6.vagas_totais || 1)) * 100)) : 0;

  // KPI 7 — Crescimento (compare 2 most recent events by data_inicio)
  const kpi7 = useMemo(() => {
    if (filteredEvents.length < 2) return null;
    const sorted = [...filteredEvents].sort(
      (a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime()
    );
    const cur = sorted[0];
    const prev = sorted[1];
    const curCount = (inscByEvent.get(cur.id) ?? []).filter(i => i.status !== 'cancelada').length;
    const prevCount = (inscByEvent.get(prev.id) ?? []).filter(i => i.status !== 'cancelada').length;
    const delta = curCount - prevCount;
    const pct = prevCount > 0 ? Math.round((delta / prevCount) * 100) : null;
    return { curName: cur.nome, prevName: prev.nome, curCount, prevCount, delta, pct };
  }, [filteredEvents, inscByEvent]);

  // KPI 8 — Distribuição por tipo
  const kpi8 = useMemo(() => {
    const gratuito = allInsc.filter(i => i.tipoIngresso === 'gratuito').length;
    const pago = allInsc.filter(i => i.tipoIngresso === 'pago').length;
    const doacao = allInsc.filter(i => i.tipoIngresso === 'doacao').length;
    const total = gratuito + pago + doacao || 1;
    return { gratuito, pago, doacao, total };
  }, [allInsc]);

  const allLoaded = filteredEvents.length === 0 || filteredEvents.every(e => loadedIds.has(e.id));

  const toggleType = (t: TypeFilter) => {
    setTypeFilters(prev => {
      const next = new Set(prev);
      if (next.has(t) && next.size > 1) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const periodLabels: Record<PeriodFilter, string> = {
    all: 'Todo histórico', '30d': 'Últimos 30 dias', '90d': 'Últimos 90 dias', '12m': 'Último ano', custom: 'Personalizado',
  };
  const eventModeLabels: Record<EventFilterMode, string> = {
    all: 'Todos os eventos', active: 'Ativos', completed: 'Concluídos', custom: 'Selecionados',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visão consolidada de todos os seus eventos.</p>
      </div>

      {/* Filter bar */}
      <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Event filter */}
          <div className="relative">
            <div className="flex items-center gap-1">
              {(['all', 'active', 'completed', 'custom'] as EventFilterMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => { setEventFilterMode(mode); if (mode === 'custom') setShowEventPicker(p => !p); else setShowEventPicker(false); }}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                    eventFilterMode === mode
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                  )}
                >
                  {eventModeLabels[mode]}
                  {mode === 'custom' && eventFilterMode === 'custom' && (
                    <span className="ml-1 opacity-70">({selectedEventIds.size})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Custom event picker */}
            {showEventPicker && eventFilterMode === 'custom' && (
              <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-2xl shadow-lg z-20 min-w-[240px] max-h-60 overflow-y-auto p-2">
                {eventos.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">Nenhum evento encontrado.</p>
                ) : (
                  eventos.map(ev => (
                    <button
                      key={ev.id}
                      onClick={() => {
                        setSelectedEventIds(prev => {
                          const next = new Set(prev);
                          if (next.has(ev.id)) next.delete(ev.id);
                          else next.add(ev.id);
                          return next;
                        });
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2',
                        selectedEventIds.has(ev.id) ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center',
                        selectedEventIds.has(ev.id) ? 'border-primary bg-primary' : 'border-border'
                      )}>
                        {selectedEventIds.has(ev.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                      </div>
                      <span className="truncate">{ev.nome}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period filter */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-1">Período:</span>
            {(['all', '30d', '90d', '12m', 'custom'] as PeriodFilter[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                  periodFilter === p
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                )}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1 flex-wrap">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-1">Tipo:</span>
            {([
              { key: 'gratuito', label: 'Gratuito', icon: TicketIcon },
              { key: 'pago', label: 'Pago', icon: DollarSign },
              { key: 'doacao', label: 'Doação', icon: Gift },
            ] as { key: TypeFilter; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => toggleType(key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border',
                  typeFilters.has(key)
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground'
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date range */}
        {periodFilter === 'custom' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">De:</span>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="h-8 px-3 text-xs border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground font-medium">Até:</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="h-8 px-3 text-xs border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {loading && !allLoaded && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Carregando dados dos eventos...
        </div>
      )}

      {/* No events */}
      {filteredEvents.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-sm">Nenhum evento corresponde ao filtro selecionado.</p>
        </div>
      )}

      {filteredEvents.length > 0 && (
        <>
          {/* Row 1: 4 main KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={Users}
              label="Inscrições confirmadas"
              value={kpi1.toLocaleString('pt-BR')}
              sub={`em ${filteredEvents.length} evento${filteredEvents.length !== 1 ? 's' : ''}`}
              color="primary"
            />
            <KpiCard
              icon={BarChart3}
              label="Taxa de ocupação"
              value={`${kpi2}%`}
              sub={`${kpi1} de ${filteredEvents.reduce((a, e) => a + (e.vagas_totais || 0), 0).toLocaleString('pt-BR')} vagas`}
              color="emerald"
            />
            <KpiCard
              icon={DollarSign}
              label="Receita total"
              value={fmtCurrency(kpi3)}
              sub="ingressos pagos confirmados"
              color="amber"
              locked={!isPro}
            />
            <KpiCard
              icon={CheckSquare}
              label="Check-ins realizados"
              value={kpi4.toLocaleString('pt-BR')}
              sub={kpi1 > 0 ? `${Math.round((kpi4 / kpi1) * 100)}% dos inscritos` : '—'}
              color="violet"
              locked={!isPro}
            />
          </div>

          {/* Row 2: 3 more KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              icon={Heart}
              label="Total em doações"
              value={fmtCurrency(kpi5)}
              sub={`${allDoac.filter(d => d.status === 'aprovada').length} doação${allDoac.filter(d => d.status === 'aprovada').length !== 1 ? 'ões' : ''} aprovada${allDoac.filter(d => d.status === 'aprovada').length !== 1 ? 's' : ''}`}
              color="rose"
              locked={!isPro}
            />

            {/* KPI 6: Evento destaque */}
            <Card className="border border-border shadow-sm bg-card rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5">Evento destaque</p>
                    {kpi6 ? (
                      <>
                        <p className="text-sm font-black text-foreground leading-snug truncate">{kpi6.nome}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all duration-700"
                              style={{ width: `${kpi6Rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-black text-amber-600 shrink-0">{kpi6Rate}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{kpi6Count} inscrito{kpi6Count !== 1 ? 's' : ''} de {kpi6.vagas_totais} vagas</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPI 7: Crescimento */}
            <Card className="border border-border shadow-sm bg-card rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    kpi7
                      ? kpi7.delta > 0 ? 'bg-emerald-50' : kpi7.delta < 0 ? 'bg-rose-50' : 'bg-muted'
                      : 'bg-muted'
                  )}>
                    {kpi7 ? (
                      kpi7.delta > 0
                        ? <TrendingUp className="w-5 h-5 text-emerald-600" />
                        : kpi7.delta < 0
                          ? <TrendingDown className="w-5 h-5 text-rose-500" />
                          : <Minus className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5">Crescimento</p>
                    {kpi7 ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className={cn(
                            'text-2xl font-black',
                            kpi7.delta > 0 ? 'text-emerald-600' : kpi7.delta < 0 ? 'text-rose-500' : 'text-foreground'
                          )}>
                            {kpi7.delta > 0 ? '+' : ''}{kpi7.delta}
                          </span>
                          {kpi7.pct !== null && (
                            <span className={cn(
                              'text-sm font-bold',
                              kpi7.delta > 0 ? 'text-emerald-600' : kpi7.delta < 0 ? 'text-rose-500' : 'text-muted-foreground'
                            )}>
                              ({kpi7.delta > 0 ? '+' : ''}{kpi7.pct}%)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-snug">
                          <span className="font-bold truncate" title={kpi7.curName}>{kpi7.curName.length > 20 ? kpi7.curName.slice(0, 20) + '…' : kpi7.curName}</span>
                          {' vs '}
                          <span title={kpi7.prevName}>{kpi7.prevName.length > 20 ? kpi7.prevName.slice(0, 20) + '…' : kpi7.prevName}</span>
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Mínimo 2 eventos para calcular.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KPI 8: Distribuição por tipo (full-width) */}
          <Card className="border border-border shadow-sm bg-card rounded-2xl">
            <CardHeader className="border-b border-border px-5 py-3.5">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <TicketIcon className="w-4 h-4" />
                Distribuição por tipo de ingresso
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {kpi8.total === 1 && kpi8.gratuito + kpi8.pago + kpi8.doacao === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma inscrição no período selecionado.</p>
              ) : (
                <div className="space-y-4">
                  {/* Bar */}
                  <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                    {kpi8.gratuito > 0 && (
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-700"
                        style={{ width: `${(kpi8.gratuito / kpi8.total) * 100}%` }}
                      />
                    )}
                    {kpi8.pago > 0 && (
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-700"
                        style={{ width: `${(kpi8.pago / kpi8.total) * 100}%` }}
                      />
                    )}
                    {kpi8.doacao > 0 && (
                      <div
                        className="bg-rose-400 h-full rounded-full transition-all duration-700"
                        style={{ width: `${(kpi8.doacao / kpi8.total) * 100}%` }}
                      />
                    )}
                    {kpi8.gratuito + kpi8.pago + kpi8.doacao === 0 && (
                      <div className="bg-muted h-full rounded-full w-full" />
                    )}
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Gratuito', count: kpi8.gratuito, color: 'bg-primary', textColor: 'text-primary' },
                      { label: 'Pago', count: kpi8.pago, color: 'bg-amber-500', textColor: 'text-amber-600' },
                      { label: 'Doação', count: kpi8.doacao, color: 'bg-rose-400', textColor: 'text-rose-500' },
                    ].map(({ label, count, color, textColor }) => (
                      <div key={label} className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                        <div className={cn('w-3 h-3 rounded-full shrink-0', color)} />
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
                          <p className={cn('text-xl font-black leading-none mt-0.5', textColor)}>{count.toLocaleString('pt-BR')}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {kpi8.total > 0 ? `${Math.round((count / kpi8.total) * 100)}%` : '—'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
