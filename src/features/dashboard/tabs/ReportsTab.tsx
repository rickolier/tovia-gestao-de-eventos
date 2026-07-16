import React from 'react';
import { Evento } from '~/types';
import { useAuth } from '~/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, TrendingUp, TrendingDown, DollarSign, CheckSquare, Heart,
  Award, BarChart3, Ticket as TicketIcon, Calendar, Lock,
  Minus, ChevronDown, ChevronUp, Gift
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReportsTab, TypeFilter, PeriodFilter, EventFilterMode } from './hooks/useReportsTab';

interface ReportsTabProps {
  eventos: Evento[];
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
            <span className="text-xs font-bold text-muted-foreground text-center px-4">Disponível no plano Pétach ou Koách</span>
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
  const isPro = profile?.plano === 'petach' || profile?.plano === 'koach' || profile?.plano === 'chalem';

  const {
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
  } = useReportsTab(eventos);

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
