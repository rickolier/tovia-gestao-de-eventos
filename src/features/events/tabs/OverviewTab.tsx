import React, { useEffect, useState } from 'react';
import { Evento, Inscricao, Ticket } from '~/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Users, Info, TrendingUp, DollarSign, Edit2 } from 'lucide-react';
import { listDocuments } from '~/services/firestore';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function OverviewTab({ evento }: { evento: Evento }) {
  const [occupiedSlots, setOccupiedSlots] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
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

      const revenue = regs
        .filter(r => r.status === 'pago' || r.validada_manual)
        .reduce((sum, r) => sum + (r.valor_pago || 0), 0);
      setTotalRevenue(revenue);
    };
    fetchData();
  }, [evento.id]);

  return (
    <div className="space-y-6">
      {/* Informações do Evento — full width, 3 itens lado a lado */}
      <Card className="border-none shadow-sm rounded-2xl bg-card transition-colors">
        <CardHeader className="flex flex-row items-center justify-between">
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
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-xl transition-colors">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Data e Hora</p>
              <div className="flex items-start gap-2 text-foreground font-bold">
                <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span>{new Date(evento.data_inicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  <span className="text-muted-foreground font-semibold text-xs">até {new Date(evento.data_fim).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-muted rounded-xl transition-colors">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Local</p>
              <div className="flex items-center gap-2 text-foreground font-bold">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{evento.local}</span>
              </div>
            </div>
            <div className="p-4 bg-muted rounded-xl transition-colors">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Capacidade</p>
              <div className="flex items-center gap-2 text-foreground font-bold">
                <Users className="w-4 h-4 text-primary shrink-0" />
                {evento.vagas_totais} pessoas
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de stats — 3 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-2xl bg-card transition-colors">
          <CardHeader className="p-6">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
              <TrendingUp className="w-4 h-4 text-primary" />
              Ocupação de Vagas
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] p-6 pt-0 relative flex flex-col justify-center items-center">
              <div className="w-full h-full relative">
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Preenchidas', value: occupiedSlots },
                        { name: 'Disponíveis', value: Math.max(0, evento.vagas_totais - occupiedSlots) }
                      ]}
                      cx="50%"
                      cy="55%"
                      innerRadius={70}
                      outerRadius={85}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                      animationBegin={0}
                      animationDuration={1200}
                    >
                      <Cell fill="hsl(var(--primary))" className="hover:opacity-90 transition-opacity" />
                      <Cell fill="hsl(var(--muted))" className="hover:opacity-90 transition-opacity" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: '1px solid hsl(var(--border))', 
                        boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', 
                        backgroundColor: 'hsl(var(--card))', 
                        color: 'hsl(var(--foreground))',
                        padding: '12px'
                      }}
                      itemStyle={{ fontWeight: '600' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Label */}
                <div className="absolute top-[46.5%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-3xl font-black text-foreground">
                    {evento.vagas_totais > 0 ? Math.round((occupiedSlots / evento.vagas_totais) * 100) : 0}%
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">Ocupação</p>
                </div>

                {/* Custom Legend */}
                <div className="flex justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Preenchidas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-muted" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Disponíveis</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-card transition-colors">
          <CardHeader className="p-6">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
              <DollarSign className="w-4 h-4 text-primary" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-0">
            <div className="p-4 bg-muted rounded-xl transition-colors">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Total Arrecadado</p>
              <p className="text-2xl font-black text-foreground">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-3xl bg-primary text-primary-foreground">
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-black">Resumo de Vagas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8 pt-0">
            <div>
              <p className="text-primary-foreground/60 text-[10px] uppercase font-black tracking-widest mb-2">Vagas Ocupadas</p>
              <div className="flex items-end gap-2">
                <p className="text-5xl font-black">{occupiedSlots}</p>
                <p className="text-primary-foreground/40 text-lg font-bold mb-1">/ {evento.vagas_totais}</p>
              </div>
              <div className="w-full bg-primary-foreground/10 h-3 rounded-full mt-6 overflow-hidden">
                <div
                  className="bg-primary-foreground h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  style={{ width: `${Math.min(100, (occupiedSlots / evento.vagas_totais) * 100)}%` }}
                />
              </div>
            </div>
            <div className="pt-4 border-t border-primary-foreground/10">
              <p className="text-xs font-medium opacity-80">
                {Math.max(0, evento.vagas_totais - occupiedSlots)} vagas restantes para a capacidade máxima.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
