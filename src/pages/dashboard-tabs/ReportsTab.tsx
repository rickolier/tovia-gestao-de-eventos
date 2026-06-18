import React, { useState } from 'react';
import { Evento } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Calendar, Users, Settings2, PieChart, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ReportsTabProps {
  eventos: Evento[];
}

export default function ReportsTab({ eventos }: ReportsTabProps) {
  const [config, setConfig] = useState({
    showGeneralStats: true,
    showPerformanceHighlight: true,
    showCapacityAnalysis: true
  });

  const totalEvents = eventos.length;
  const activeEvents = eventos.filter(e => e.ativo !== false).length;

  const focusEvent = eventos.reduce((prev, current) =>
    (prev.vagas_totais > current.vagas_totais) ? prev : current
  , eventos[0]);

  const totalCapacity = eventos.reduce((acc, curr) => acc + curr.vagas_totais, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Relatórios Gerais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão consolidada de performance e escala.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl gap-2 border-border hover:bg-accent h-9 px-4 font-bold text-sm shadow-sm"
            onClick={() => window.print()}
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>

          <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-xl gap-2 border-border hover:bg-accent h-9 px-4 font-bold text-sm shadow-sm">
              <Settings2 className="w-4 h-4" />
              Configurar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm rounded-2xl border border-border shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-black">Personalizar Visualização</DialogTitle>
            </DialogHeader>
            <div className="space-y-1 py-2">
              {[
                { id: 'stats',       label: 'Estatísticas Gerais',      key: 'showGeneralStats' as const },
                { id: 'performance', label: 'Destaque de Performance',   key: 'showPerformanceHighlight' as const },
                { id: 'capacity',    label: 'Análise de Capacidade',     key: 'showCapacityAnalysis' as const },
              ].map(({ id, label, key }) => (
                <div
                  key={id}
                  className="flex items-center gap-3 p-3 hover:bg-accent rounded-xl transition-all cursor-pointer"
                  onClick={() => setConfig({ ...config, [key]: !config[key] })}
                >
                  <Checkbox
                    id={id}
                    checked={config[key]}
                    onCheckedChange={(v) => setConfig({ ...config, [key]: !!v })}
                    className="rounded-md"
                  />
                  <Label htmlFor={id} className="flex-1 cursor-pointer font-semibold text-sm text-foreground">{label}</Label>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stat cards */}
      {config.showGeneralStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-border shadow-sm bg-card rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total de Eventos</p>
                  <p className="text-2xl font-bold text-foreground leading-tight">{totalEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm bg-card rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Eventos Ativos</p>
                  <p className="text-2xl font-bold text-emerald-600 leading-tight">{activeEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm bg-card rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Escala Total</p>
                  <p className="text-2xl font-bold text-primary leading-tight">{totalCapacity}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {config.showPerformanceHighlight && focusEvent && (
          <Card className="border border-border shadow-sm bg-card rounded-2xl overflow-hidden flex flex-col">
            <CardHeader className="bg-muted/30 border-b border-border px-5 py-3.5">
              <CardTitle className="text-xs font-semibold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                <BarChart3 className="w-4 h-4" />
                Destaque de Capacidade
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex-grow">
              <h3 className="text-base font-black text-foreground leading-tight">{focusEvent.nome}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4 font-medium">Evento com maior densidade de público.</p>

              <div className="flex items-center justify-between p-3.5 bg-muted/30 rounded-xl hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-card rounded-lg flex items-center justify-center border border-border">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Vagas Totais</span>
                    <span className="text-sm font-black text-foreground">Infraestrutura</span>
                  </div>
                </div>
                <span className="text-xl font-black text-primary">{focusEvent.vagas_totais}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {config.showCapacityAnalysis && (
          <Card className="border border-border shadow-sm bg-card rounded-2xl overflow-hidden flex flex-col">
            <CardHeader className="bg-muted/30 border-b border-border px-5 py-3.5">
              <CardTitle className="text-xs font-semibold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                <PieChart className="w-4 h-4" />
                Ocupação Consolidada
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex-grow flex flex-col justify-center">
              <div className="flex items-center justify-center mb-5">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      className="text-muted/50"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="transparent"
                      r="16" cx="18" cy="18"
                    />
                    <circle
                      className="text-primary transition-all duration-1000 ease-out"
                      strokeWidth="3.5"
                      strokeDasharray="75, 100"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="16" cx="18" cy="18"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-foreground">75%</span>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Geral</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto w-full">
                <div className="text-center p-3 bg-primary/5 rounded-xl">
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Preenchidas</p>
                  <p className="text-xl font-black text-primary">{(totalCapacity * 0.75).toFixed(0)}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-xl">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Livres</p>
                  <p className="text-xl font-black text-foreground">{(totalCapacity * 0.25).toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
