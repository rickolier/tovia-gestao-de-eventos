import React, { useState } from 'react';
import { Evento } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Calendar, DollarSign, Users, Settings2, CheckCircle2, PieChart, Activity } from 'lucide-react';
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
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black tracking-tight text-foreground">Relatórios Gerais</h2>
          <p className="text-sm text-muted-foreground font-medium">Visão consolidada de performance e escala.</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-2xl gap-2 border-border hover:bg-accent h-12 px-6 font-bold shadow-sm">
              <Settings2 className="w-4 h-4" />
              Configurar Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Personalizar Visualização</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-6">
              <div className="flex items-center space-x-3 p-4 hover:bg-accent rounded-2xl transition-all cursor-pointer group" onClick={() => setConfig({...config, showGeneralStats: !config.showGeneralStats})}>
                <Checkbox id="stats" checked={config.showGeneralStats} onCheckedChange={(v) => setConfig({...config, showGeneralStats: !!v})} className="rounded-md" />
                <Label htmlFor="stats" className="flex-1 cursor-pointer font-bold text-sm text-foreground group-hover:translate-x-1 transition-transform">Estatísticas Gerais</Label>
              </div>
              <div className="flex items-center space-x-3 p-4 hover:bg-accent rounded-2xl transition-all cursor-pointer group" onClick={() => setConfig({...config, showPerformanceHighlight: !config.showPerformanceHighlight})}>
                <Checkbox id="performance" checked={config.showPerformanceHighlight} onCheckedChange={(v) => setConfig({...config, showPerformanceHighlight: !!v})} className="rounded-md" />
                <Label htmlFor="performance" className="flex-1 cursor-pointer font-bold text-sm text-foreground group-hover:translate-x-1 transition-transform">Destaque de Performance</Label>
              </div>
              <div className="flex items-center space-x-3 p-4 hover:bg-accent rounded-2xl transition-all cursor-pointer group" onClick={() => setConfig({...config, showCapacityAnalysis: !config.showCapacityAnalysis})}>
                <Checkbox id="capacity" checked={config.showCapacityAnalysis} onCheckedChange={(v) => setConfig({...config, showCapacityAnalysis: !!v})} className="rounded-md" />
                <Label htmlFor="capacity" className="flex-1 cursor-pointer font-bold text-sm text-foreground group-hover:translate-x-1 transition-transform">Análise de Capacidade</Label>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {config.showGeneralStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-none shadow-xl shadow-primary/[0.03] bg-card rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Total de Eventos</p>
                  <p className="text-3xl font-black text-foreground">{totalEvents}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-emerald-500/[0.03] bg-card rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Eventos Ativos</p>
                  <p className="text-3xl font-black text-emerald-600">{activeEvents}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-primary/[0.03] bg-card rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Escala Total</p>
                  <p className="text-3xl font-black text-primary">{totalCapacity}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/30 rounded-xl flex items-center justify-center text-primary shadow-inner">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {config.showPerformanceHighlight && focusEvent && (
          <Card className="border-none shadow-2xl shadow-black/[0.02] bg-card rounded-3xl overflow-hidden flex flex-col">
            <CardHeader className="bg-muted/30 border-b border-border/50 p-6">
              <CardTitle className="text-xs font-semibold flex items-center gap-3 uppercase tracking-widest text-muted-foreground">
                <BarChart3 className="w-4 h-4" />
                Destaque de Capacidade
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex-grow">
              <h3 className="text-xl font-black text-foreground mb-2 leading-tight">{focusEvent.nome}</h3>
              <p className="text-xs text-muted-foreground mb-8 font-medium">Evento com maior densidade de público até agora.</p>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl group hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center shadow-lg shadow-black/[0.02]">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-0.5">Vagas Totais</span>
                        <span className="text-lg font-black text-foreground">Infraestrutura</span>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-primary">{focusEvent.vagas_totais}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {config.showCapacityAnalysis && (
          <Card className="border-none shadow-2xl shadow-black/[0.02] bg-card rounded-3xl overflow-hidden flex flex-col">
            <CardHeader className="bg-muted/30 border-b border-border/50 p-6">
              <CardTitle className="text-xs font-semibold flex items-center gap-3 uppercase tracking-widest text-muted-foreground">
                <PieChart className="w-4 h-4" />
                Ocupação Consolidada
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex-grow flex flex-col justify-center">
              <div className="flex items-center justify-center mb-8">
                <div className="relative w-40 h-40">
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
                    <span className="text-4xl font-black text-foreground">75%</span>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Geral</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8 max-w-sm mx-auto w-full">
                <div className="text-center p-4 bg-primary/5 dark:bg-primary/20 rounded-2xl">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Preenchidas</p>
                  <p className="text-2xl font-black text-primary">{(totalCapacity * 0.75).toFixed(0)}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-2xl">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Livres</p>
                  <p className="text-2xl font-black text-foreground">{(totalCapacity * 0.25).toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
