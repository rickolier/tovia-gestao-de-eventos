import React, { useState, useMemo } from 'react';
import { Evento } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  eachDayOfInterval,
  isWithinInterval,
  parseISO,
  startOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, List, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface Holiday {
  date: Date;
  name: string;
}

function getEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function getBrazilianHolidays(year: number): Holiday[] {
  const fixed: Holiday[] = [
    { date: new Date(year, 0, 1),  name: 'Confraternização Universal' },
    { date: new Date(year, 3, 21), name: 'Tiradentes' },
    { date: new Date(year, 4, 1),  name: 'Dia do Trabalho' },
    { date: new Date(year, 8, 7),  name: 'Independência do Brasil' },
    { date: new Date(year, 9, 12), name: 'Nossa Sra. Aparecida' },
    { date: new Date(year, 10, 2), name: 'Finados' },
    { date: new Date(year, 10, 15),name: 'Proclamação da República' },
    { date: new Date(year, 10, 20),name: 'Consciência Negra' },
    { date: new Date(year, 11, 25),name: 'Natal' },
  ];

  const easter = getEaster(year);
  const variable: Holiday[] = [
    { date: addDays(easter, -48), name: 'Carnaval (segunda)' },
    { date: addDays(easter, -47), name: 'Carnaval (terça)' },
    { date: addDays(easter, -2),  name: 'Sexta-Feira Santa' },
    { date: easter,               name: 'Páscoa' },
    { date: addDays(easter, 60),  name: 'Corpus Christi' },
  ];

  return [...fixed, ...variable].sort((a, b) => a.date.getTime() - b.date.getTime());
}

interface CalendarTabProps {
  eventos: Evento[];
}

export default function CalendarTab({ eventos }: CalendarTabProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showHolidays, setShowHolidays] = useState(true);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const holidays = useMemo(() => getBrazilianHolidays(currentMonth.getFullYear()), [currentMonth]);

  const getHolidaysForDay = (day: Date): Holiday[] => {
    if (!showHolidays) return [];
    return holidays.filter(h => isSameDay(h.date, day));
  };

  const getEventsForDay = (day: Date) => {
    const targetDay = startOfDay(day);
    return eventos.filter(evento => {
      const start = startOfDay(parseISO(evento.data_inicio));
      const end = startOfDay(parseISO(evento.data_fim));
      return isWithinInterval(targetDay, { start, end });
    });
  };

  const upcomingEvents = eventos
    .filter(e => new Date(e.data_inicio) >= startOfDay(new Date()))
    .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime())
    .slice(0, 8);

  const upcomingHolidays = useMemo(() => {
    if (!showHolidays) return [];
    const today = startOfDay(new Date());
    return getBrazilianHolidays(today.getFullYear())
      .concat(getBrazilianHolidays(today.getFullYear() + 1))
      .filter(h => h.date >= today)
      .slice(0, 5);
  }, [showHolidays]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black tracking-tight text-foreground">Agenda de Eventos</h2>
        <p className="text-sm text-muted-foreground">Visualize seus eventos programados no calendário e lista.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendar Section */}
        <Card className="xl:col-span-3 border-none shadow-sm bg-card rounded-3xl overflow-hidden transition-colors">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border p-6 flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black capitalize text-foreground">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle feriados */}
              <button
                onClick={() => setShowHolidays(v => !v)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                  showHolidays
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                }`}
              >
                <PartyPopper className="w-3.5 h-3.5" />
                Feriados
              </button>
              <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-border">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="py-4 text-center text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const dayHolidays = getHolidaysForDay(day);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());
                const hasHoliday = dayHolidays.length > 0;

                return (
                  <div
                    key={idx}
                    className={`min-h-[120px] p-2 border-r border-b border-border/50 flex flex-col gap-1 transition-colors hover:bg-accent/30 ${
                      !isCurrentMonth ? 'bg-muted/30 opacity-30 shadow-inner' : ''
                    } ${hasHoliday && isCurrentMonth ? 'bg-amber-50/40' : ''}`}
                  >
                    <span className={`text-[10px] font-black mb-1 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                      isToday ? 'bg-primary text-white shadow-md shadow-primary/20 scale-110' : 'text-muted-foreground'
                    }`}>
                      {format(day, 'd')}
                    </span>

                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] no-scrollbar">
                      {dayHolidays.map((holiday, hi) => (
                        <span
                          key={hi}
                          title={holiday.name}
                          className="text-[9px] p-1.5 bg-amber-100 text-amber-700 font-bold truncate rounded-md border-l-2 border-amber-400"
                        >
                          🇧🇷 {holiday.name}
                        </span>
                      ))}
                      {dayEvents.map(evento => {
                        const isStart = isSameDay(day, parseISO(evento.data_inicio));
                        const isEnd = isSameDay(day, parseISO(evento.data_fim));

                        return (
                          <Link
                            key={evento.id}
                            to={`/eventos/${evento.id}`}
                            className={`text-[9px] p-1.5 bg-primary/10 text-primary font-black truncate hover:bg-primary/20 transition-all border-l-2 border-primary ${
                              isStart ? 'rounded-l-md' : ''
                            } ${
                              isEnd ? 'rounded-r-md' : ''
                            } shadow-sm group`}
                            title={evento.nome}
                          >
                            <span className="group-hover:translate-x-0.5 transition-transform inline-block">
                              {evento.nome}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events Sidebar */}
        <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden flex flex-col transition-colors">
          <CardHeader className="bg-muted/30 border-b border-border p-5">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
              <List className="w-4 h-4 text-primary" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto no-scrollbar">
            <div className="divide-y divide-border/50">
              {upcomingEvents.map(evento => (
                <Link
                  key={evento.id}
                  to={`/eventos/${evento.id}`}
                  className="flex items-center gap-4 p-5 hover:bg-accent transition-colors group"
                >
                  <div className="w-11 h-11 bg-primary/10 rounded-2xl flex flex-col items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    <span className="text-sm font-black leading-none">{format(parseISO(evento.data_inicio), 'dd')}</span>
                    <span className="text-[9px] uppercase font-black">{format(parseISO(evento.data_inicio), 'MMM', { locale: ptBR })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-foreground truncate transition-colors leading-tight">{evento.nome}</h4>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-bold">
                      <MapPin className="w-3 h-3 text-primary" /> {evento.local}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted/30 group-hover:text-primary transition-colors" />
                </Link>
              ))}
              {upcomingEvents.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-[10px] font-black uppercase tracking-widest">Nenhum evento programado.</div>
              )}
            </div>

            {/* Próximos feriados */}
            {showHolidays && upcomingHolidays.length > 0 && (
              <div className="border-t border-border/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 px-5 pt-4 pb-2 flex items-center gap-1.5">
                  <PartyPopper className="w-3 h-3" /> Feriados próximos
                </p>
                <div className="divide-y divide-border/30">
                  {upcomingHolidays.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex flex-col items-center justify-center shrink-0 border border-amber-100">
                        <span className="text-sm font-black leading-none text-amber-700">{format(h.date, 'dd')}</span>
                        <span className="text-[9px] uppercase font-black text-amber-500">{format(h.date, 'MMM', { locale: ptBR })}</span>
                      </div>
                      <p className="text-xs font-semibold text-foreground leading-tight">{h.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          {eventos.length > 0 && (
            <div className="p-5 bg-muted/30 border-t border-border mt-auto">
              <p className="text-[10px] text-center text-muted-foreground font-black uppercase tracking-widest">Total de {eventos.length} eventos</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
