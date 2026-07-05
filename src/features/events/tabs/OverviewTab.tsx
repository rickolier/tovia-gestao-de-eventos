import React, { useEffect, useState } from 'react';
import { Evento, Inscricao, Ticket } from '~/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Users, Info, DollarSign, Edit2, Clock } from 'lucide-react';
import { listDocuments } from '~/services/firestore';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

function getCountdown(dataInicio: string) {
  const now = new Date();
  const target = new Date(dataInicio);
  if (target <= now) return null;

  let years  = target.getFullYear()  - now.getFullYear();
  let months = target.getMonth()     - now.getMonth();
  let days   = target.getDate()      - now.getDate();

  if (days < 0) {
    months -= 1;
    const prev = new Date(target.getFullYear(), target.getMonth(), 0);
    days += prev.getDate();
  }
  if (months < 0) { years -= 1; months += 12; }

  return { years, months, days };
}

export default function OverviewTab({ evento }: { evento: Evento }) {
  const [occupiedSlots, setOccupiedSlots] = useState(0);
  const [paidCount, setPaidCount]         = useState(0);
  const [totalRevenue, setTotalRevenue]   = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const [regs, tickets] = await Promise.all([
        listDocuments<Inscricao>(`eventos/${evento.id}/inscricoes`),
        listDocuments<Ticket>(`eventos/${evento.id}/tickets`),
      ]);
      const doacaoIds = new Set(tickets.filter(t => t.tipo === 'doacao').map(t => t.id));
      const confirmed = regs.filter(r =>
        (r.status === 'pago' || r.validada_manual) && !doacaoIds.has(r.ticketId)
      );
      setOccupiedSlots(confirmed.length);

      const paid = regs.filter(r => r.status === 'pago' || r.validada_manual);
      setPaidCount(paid.length);
      setTotalRevenue(paid.reduce((sum, r) => sum + (r.valor_pago || 0), 0));
    };
    fetchData();
  }, [evento.id]);

  const pct       = evento.vagas_totais > 0 ? Math.round((occupiedSlots / evento.vagas_totais) * 100) : 0;
  const countdown = getCountdown(evento.data_inicio);
  const eventStarted = countdown === null;

  return (
    <div className="space-y-4">
      {/* ── Informações do Evento ── */}
      <Card className="border-none shadow-sm rounded-2xl bg-card transition-colors">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-5">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Info className="w-5 h-5 text-primary" />
            Informações do Evento
          </CardTitle>
          <Link to={`/eventos/${evento.id}/editar`}>
            <Button variant="outline" size="sm" className="rounded-xl border-border text-muted-foreground hover:bg-accent hover:text-foreground">
              <Edit2 className="w-4 h-4 mr-2" />
              Editar Evento
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-5 pb-4">
            <div className="p-3 bg-muted rounded-xl transition-colors">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Data e Hora</p>
              <div className="flex items-start gap-2 text-foreground font-bold">
                <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span>{new Date(evento.data_inicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  <span className="text-muted-foreground font-semibold text-xs">até {new Date(evento.data_fim).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-muted rounded-xl transition-colors">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Local</p>
              <div className="flex items-center gap-2 text-foreground font-bold">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{evento.local}</span>
              </div>
            </div>
            <div className="p-3 bg-muted rounded-xl transition-colors">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Capacidade</p>
              <div className="flex items-center gap-2 text-foreground font-bold">
                <Users className="w-4 h-4 text-primary shrink-0" />
                {evento.vagas_totais} pessoas
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Cards de stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Vagas (merged) */}
        <Card className="border-none shadow-xl rounded-3xl bg-primary text-primary-foreground">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-lg font-black">Ocupação de Vagas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-0">
            <div>
              <p className="text-primary-foreground/60 text-[10px] uppercase font-black tracking-widest mb-2">Inscrições confirmadas</p>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-black leading-none">{occupiedSlots}</p>
                <p className="text-primary-foreground/40 text-base font-bold mb-0.5">/ {evento.vagas_totais}</p>
                <span className="mb-0.5 ml-auto text-xl font-black text-primary-foreground/70">{pct}%</span>
              </div>
              <div className="w-full bg-primary-foreground/10 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-primary-foreground h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
            <div className="pt-3 border-t border-primary-foreground/10">
              <p className="text-xs font-medium opacity-80">
                {Math.max(0, evento.vagas_totais - occupiedSlots)} vagas restantes para a capacidade máxima.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Financeiro */}
        <Card className="border-none shadow-sm rounded-2xl bg-card transition-colors">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
              <DollarSign className="w-4 h-4 text-primary" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-5 pt-0">
            <div className="p-3 bg-muted rounded-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Total Arrecadado</p>
              <p className="text-2xl font-black text-foreground">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Inscrições Pagas</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-foreground">{paidCount}</p>
                <p className="text-sm text-muted-foreground font-semibold mb-0.5">inscrição{paidCount !== 1 ? 'ões' : ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Countdown */}
        <Card className="border-none shadow-sm rounded-2xl bg-card transition-colors overflow-hidden">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
              <Clock className="w-4 h-4 text-primary" />
              {eventStarted ? 'Status do Evento' : 'Tempo para o Evento'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {eventStarted ? (
              <div className="flex flex-col items-center justify-center py-4 gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <p className="text-lg font-black text-foreground text-center">Evento em andamento</p>
                <p className="text-xs text-muted-foreground text-center">
                  Iniciou em {new Date(evento.data_inicio).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: countdown!.years,  label: countdown!.years  === 1 ? 'ano'  : 'anos'  },
                    { value: countdown!.months, label: countdown!.months === 1 ? 'mês'  : 'meses' },
                    { value: countdown!.days,   label: countdown!.days   === 1 ? 'dia'  : 'dias'  },
                  ].map(({ value, label }) => (
                    <div key={label} className="flex flex-col items-center bg-muted rounded-xl py-3 px-2">
                      <span className={`font-black leading-none ${value > 0 ? 'text-3xl text-foreground' : 'text-2xl text-muted-foreground/30'}`}>
                        {value}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {new Date(evento.data_inicio).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
