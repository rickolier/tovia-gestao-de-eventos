import { useEffect, useMemo, useState } from 'react';
import { Evento, Inscricao, Ticket, Donation } from '~/types';
import { listDocuments } from '~/services/firestore';
import { limit } from 'firebase/firestore';

type PeriodFilter = 'all' | '30d' | '90d' | '12m' | 'custom';
type EventFilterMode = 'all' | 'active' | 'completed' | 'custom';
export type TypeFilter = 'gratuito' | 'pago' | 'doacao';

export type { PeriodFilter, EventFilterMode };

function getPeriodBounds(period: PeriodFilter, customStart: string, customEnd: string) {
  const now = new Date();
  switch (period) {
    case '30d': return { start: new Date(now.getTime() - 30 * 86400000), end: now };
    case '90d': return { start: new Date(now.getTime() - 90 * 86400000), end: now };
    case '12m': return { start: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), end: now };
    case 'custom': return {
      start: customStart ? new Date(customStart) : undefined,
      end: customEnd ? new Date(customEnd + 'T23:59:59') : undefined,
    };
    default: return { start: undefined, end: undefined };
  }
}

export function useReportsTab(eventos: Evento[]) {
  const [eventFilterMode, setEventFilterMode] = useState<EventFilterMode>('all');
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [typeFilters, setTypeFilters] = useState<Set<TypeFilter>>(new Set(['gratuito', 'pago', 'doacao']));

  const [inscByEvent, setInscByEvent] = useState<Map<string, Inscricao[]>>(new Map());
  const [ticketsByEvent, setTicketsByEvent] = useState<Map<string, Ticket[]>>(new Map());
  const [doacoesByEvent, setDoacoesByEvent] = useState<Map<string, Donation[]>>(new Map());
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const filteredEvents = useMemo(() => {
    switch (eventFilterMode) {
      case 'active': return eventos.filter(e => e.ativo !== false);
      case 'completed': return eventos.filter(e => e.ativo === false);
      case 'custom': return eventos.filter(e => selectedEventIds.has(e.id));
      default: return eventos;
    }
  }, [eventos, eventFilterMode, selectedEventIds]);

  useEffect(() => {
    const toLoad = filteredEvents.map(e => e.id).filter(id => !loadedIds.has(id));
    if (toLoad.length === 0) return;
    setLoading(true);
    Promise.all(
      toLoad.map(async (id) => {
        const [insc, tix, doac] = await Promise.all([
          listDocuments<Inscricao>(`eventos/${id}/inscricoes`, [limit(1000)]),
          listDocuments<Ticket>(`eventos/${id}/tickets`),
          listDocuments<Donation>(`eventos/${id}/doacoes`),
        ]);
        return { id, insc, tix, doac };
      })
    ).then(results => {
      setInscByEvent(prev => { const next = new Map(prev); results.forEach(r => next.set(r.id, r.insc)); return next; });
      setTicketsByEvent(prev => { const next = new Map(prev); results.forEach(r => next.set(r.id, r.tix)); return next; });
      setDoacoesByEvent(prev => { const next = new Map(prev); results.forEach(r => next.set(r.id, r.doac)); return next; });
      setLoadedIds(prev => { const next = new Set(prev); toLoad.forEach(id => next.add(id)); return next; });
    }).finally(() => setLoading(false));
  }, [filteredEvents]);

  const periodBounds = useMemo(() =>
    getPeriodBounds(periodFilter, customStart, customEnd),
  [periodFilter, customStart, customEnd]);

  const isInPeriod = (dateStr?: string): boolean => {
    if (!dateStr) return true;
    if (!periodBounds.start && !periodBounds.end) return true;
    const d = new Date(dateStr);
    if (periodBounds.start && d < periodBounds.start) return false;
    if (periodBounds.end && d > periodBounds.end) return false;
    return true;
  };

  const ticketMaps = useMemo(() => {
    const maps = new Map<string, Map<string, Ticket>>();
    for (const [eventId, tickets] of ticketsByEvent) {
      maps.set(eventId, new Map(tickets.map(t => [t.id, t])));
    }
    return maps;
  }, [ticketsByEvent]);

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

  const kpi1 = allInsc.length;
  const kpi2 = useMemo(() => {
    const totalVagas = filteredEvents.reduce((a, e) => a + (e.vagas_totais || 0), 0);
    return totalVagas === 0 ? 0 : Math.min(100, Math.round((kpi1 / totalVagas) * 100));
  }, [kpi1, filteredEvents]);
  const kpi3 = useMemo(() =>
    allInsc.filter(i => i.status === 'pago' && i.tipoIngresso === 'pago')
      .reduce((a, i) => a + (i.valor_pago || 0), 0),
  [allInsc]);
  const kpi4 = useMemo(() => allInsc.filter(i => i.presenca === true).length, [allInsc]);
  const kpi5 = useMemo(() =>
    allDoac.filter(d => d.status === 'aprovada').reduce((a, d) => a + (d.valor || 0), 0),
  [allDoac]);
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
  const kpi7 = useMemo(() => {
    if (filteredEvents.length < 2) return null;
    const sorted = [...filteredEvents].sort(
      (a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime()
    );
    const cur = sorted[0]; const prev = sorted[1];
    const curCount = (inscByEvent.get(cur.id) ?? []).filter(i => i.status !== 'cancelada').length;
    const prevCount = (inscByEvent.get(prev.id) ?? []).filter(i => i.status !== 'cancelada').length;
    const delta = curCount - prevCount;
    const pct = prevCount > 0 ? Math.round((delta / prevCount) * 100) : null;
    return { curName: cur.nome, prevName: prev.nome, curCount, prevCount, delta, pct };
  }, [filteredEvents, inscByEvent]);
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

  return {
    eventFilterMode, setEventFilterMode,
    selectedEventIds, setSelectedEventIds,
    showEventPicker, setShowEventPicker,
    periodFilter, setPeriodFilter,
    customStart, setCustomStart,
    customEnd, setCustomEnd,
    typeFilters,
    loading, filteredEvents, allLoaded,
    allInsc, allDoac,
    kpi1, kpi2, kpi3, kpi4, kpi5,
    kpi6, kpi6Count, kpi6Rate, kpi7, kpi8,
    toggleType, periodLabels, eventModeLabels,
  };
}
