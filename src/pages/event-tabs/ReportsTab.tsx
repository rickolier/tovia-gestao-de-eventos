import React, { useEffect, useState } from 'react';
import { listDocuments } from '../../lib/firebase-utils';
import { Inscricao, Pagamento, Donation, Evento } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, Heart, TrendingUp, PieChart as PieChartIcon, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function ReportsTab({ evento }: { evento: Evento }) {
  const [stats, setStats] = useState({
    totalInscritos: 0,
    totalPago: 0,
    totalPendente: 0,
    totalDoacoes: 0,
    occupiedSlots: 0,
    statusData: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [regData, payData, donData] = await Promise.all([
        listDocuments<Inscricao>(`eventos/${evento.id}/inscricoes`),
        listDocuments<Pagamento>(`eventos/${evento.id}/pagamentos`),
        listDocuments<Donation>(`eventos/${evento.id}/doacoes`)
      ]);

      const totalPago = payData.filter(p => p.status === 'pago').reduce((acc, curr) => acc + curr.valor, 0);
      const totalPendente = regData.reduce((acc, curr) => acc + (curr.valor_total - curr.valor_pago), 0);
      const totalDoacoes = donData.reduce((acc, curr) => acc + curr.valor, 0);
      const occupied = regData.filter(r => r.status === 'pago' || r.validada_manual).length;

      const statusCount = regData.reduce((acc: any, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      }, {});

      const statusData = Object.keys(statusCount).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: statusCount[key]
      }));

      setStats({
        totalInscritos: regData.length,
        totalPago,
        totalPendente,
        totalDoacoes,
        occupiedSlots: occupied,
        statusData
      });
      setLoading(false);
    };

    fetchData();
  }, [evento.id]);

  // Green theme colors adapted for dark mode visibility
  const COLORS = ['#22c55e', '#fbbf24', '#3b82f6', '#ef4444'];

  return (
    <div className="space-y-8 text-foreground">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card className="border-none shadow-sm rounded-[2rem] bg-card border border-border/50 group hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Total Inscritos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-foreground tracking-tighter">{stats.totalInscritos}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-[2rem] bg-card border border-border/50 group hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              Vagas Ocupadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-foreground tracking-tighter">{stats.occupiedSlots}</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase opacity-60">De {evento.vagas_totais} vagas totais</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-[2rem] bg-card border border-border/50 group hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Total Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-primary tracking-tighter">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(stats.totalPago)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-[2rem] bg-card border border-border/50 group hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Total Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-amber-500 tracking-tighter">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(stats.totalPendente)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-[2rem] bg-card border border-border/50 group hover:shadow-xl transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Total Doações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-red-500 tracking-tighter">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(stats.totalDoacoes)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm rounded-[2.5rem] bg-card border border-border/50">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-base font-bold flex items-center gap-3 text-foreground">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <PieChartIcon className="w-6 h-6" />
              </div>
              Status das Inscrições
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[380px] px-8 relative flex flex-col justify-center items-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Processando gráficos...</span>
              </div>
            ) : stats.statusData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground font-semibold text-xs uppercase tracking-widest opacity-40">Sem dados para exibir</div>
            ) : (
              <div className="w-full h-full relative">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={stats.statusData}
                      cx="50%"
                      cy="55%"
                      innerRadius={85}
                      outerRadius={105}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                      animationBegin={0}
                      animationDuration={1200}
                    >
                      {stats.statusData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none hover:opacity-90 transition-opacity" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '20px', 
                        border: 'none', 
                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        padding: '12px 16px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Label */}
                <div className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-4xl font-black text-foreground">
                    {stats.totalInscritos}
                  </p>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mt-1">Inscrições</p>
                </div>

                {/* Legend Area */}
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-4">
                  {stats.statusData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2.5rem] bg-card border border-border/50 p-10 flex flex-col justify-center relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-base font-bold mb-8 text-foreground">Resumo Financeiro</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-6 bg-primary/5 hover:bg-primary/10 transition-colors rounded-2xl border border-primary/10">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">Receita Bruta</span>
                  <span className="font-bold text-primary">Ingressos + Doações</span>
                </div>
                <span className="text-3xl font-black text-primary tracking-tighter">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalPago + stats.totalDoacoes)}
                </span>
              </div>
              <div className="flex justify-between items-center p-6 bg-amber-500/5 hover:bg-amber-500/10 transition-colors rounded-2xl border border-amber-500/10">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-widest text-amber-600/70 mb-1">Receita Prevista</span>
                  <span className="font-bold text-amber-600">Total Potencial</span>
                </div>
                <span className="text-3xl font-black text-amber-600 tracking-tighter">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalPago + stats.totalPendente + stats.totalDoacoes)}
                </span>
              </div>
            </div>
            
            <div className="mt-10 p-6 bg-primary/5 rounded-2xl border border-primary/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <PieChartIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-0.5">Eficiência de Arrecadação</p>
                  <p className="text-xl font-black text-foreground">
                    {Math.round((stats.totalPago / (stats.totalPago + stats.totalPendente)) * 100) || 0}% dos ingressos quitados
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-500" />
        </Card>
      </div>
    </div>
  );
}
