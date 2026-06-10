import React, { useState } from 'react';
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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface CalendarTabProps {
  eventos: Evento[];
}

export default function CalendarTab({ eventos }: CalendarTabProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black tracking-tight text-foreground">Agenda de Eventos</h2>
        <p className="text-sm text-muted-foreground">Visualize seus eventos programados no calendário e lista.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendar Section */}
        <Card className="xl:col-span-3 border-none shadow-sm bg-card rounded-3xl overflow-hidden transition-colors">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black capitalize text-foreground">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h3>
            </div>
            <div className="flex gap-2">
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
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div 
                    key={idx} 
                    className={`min-h-[120px] p-2 border-r border-b border-border/50 flex flex-col gap-1 transition-colors hover:bg-accent/30 ${
                      !isCurrentMonth ? 'bg-muted/30 opacity-30 shadow-inner' : ''
                    }`}
                  >
                    <span className={`text-[10px] font-black mb-1 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                      isToday ? 'bg-primary text-white shadow-md shadow-primary/20 scale-110' : 'text-muted-foreground'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    
                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] no-scrollbar">
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
                <div className="p-12 text-center text-muted-foreground text-[10px] font-black uppercase tracking-widest">Nenhum evento programado.</div>
              )}
            </div>
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
