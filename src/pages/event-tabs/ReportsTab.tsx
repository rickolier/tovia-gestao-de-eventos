import React, { useEffect, useState } from 'react';
import { listDocuments } from '../../lib/firebase-utils';
import { Inscricao, Pagamento, Donation, Evento, Ticket, FinancialTransaction } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, Heart, TrendingUp, PieChart as PieChartIcon, CheckCircle, Download, UserCheck, UserX, Loader2, TicketIcon, ArrowDownRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtCompact = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(v);

const COLORS = ['#22c55e', '#fbbf24', '#3b82f6', '#ef4444', '#8b5cf6'];

export default function ReportsTab({ evento }: { evento: Evento }) {
  const [inscricoes, setInscricoes]   = useState<Inscricao[]>([]);
  const [tickets, setTickets]         = useState<Ticket[]>([]);
  const [saidas, setSaidas]           = useState<FinancialTransaction[]>([]);
  const [totalDoacoes, setTotalDoacoes] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [presencaExpandida, setPresencaExpandida] = useState(false);

  const PRESENCA_LIMIT = 5;

  useEffect(() => {
    Promise.all([
      listDocuments<Inscricao>(`eventos/${evento.id}/inscricoes`),
      listDocuments<Ticket>(`eventos/${evento.id}/tickets`),
      listDocuments<FinancialTransaction>(`eventos/${evento.id}/transacoes`),
      listDocuments<Donation>(`eventos/${evento.id}/doacoes`),
    ]).then(([insc, tks, trans, dons]) => {
      setInscricoes(insc);
      setTickets(tks);
      setSaidas(trans.filter(t => t.tipo === 'saida'));
      setTotalDoacoes(dons.reduce((s, d) => s + d.valor, 0));
      setLoading(false);
    });
  }, [evento.id]);

  // Derived stats
  const pagas      = inscricoes.filter(i => i.status === 'pago');
  const presentes  = pagas.filter(i => i.presenca);
  const pendentes  = inscricoes.filter(i => i.status === 'pendente');
  const taxaPresenca = pagas.length > 0 ? Math.round((presentes.length / pagas.length) * 100) : 0;

  const totalArrecadado = pagas.reduce((s, i) => s + (i.valor_pago ?? 0), 0);
  const totalSaidas     = saidas.reduce((s, t) => s + t.valor, 0);
  const saldo           = totalArrecadado - totalSaidas;

  const byTicket = tickets.map(t => {
    const regs = pagas.filter(i => i.ticketId === t.id);
    return { nome: t.nome, vendidos: regs.length, receita: regs.reduce((s, i) => s + (i.valor_pago ?? 0), 0) };
  }).filter(t => t.vendidos > 0);

  const statusData = Object.entries(
    inscricoes.reduce((acc: Record<string, number>, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const statusLabel: Record<string, string> = {
    pago: 'Pago', pendente: 'Pendente', cancelada: 'Cancelada',
    analise: 'Em análise', pagamento_iniciado: 'Iniciado',
  };

  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      const [{ pdf }, { default: RelatorioPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../../components/RelatorioPDF'),
      ]);
      const blob = await pdf(
        <RelatorioPDF
          evento={evento}
          inscricoes={inscricoes}
          tickets={tickets}
          saidas={saidas}
          geradoEm={new Date().toLocaleString('pt-BR')}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${evento.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Carregando relatório…</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-foreground">

      <div className="tab-page-header">
        <h2>Relatórios</h2>
        <Button
          onClick={handleExportPDF}
          disabled={exportLoading}
          className="rounded-2xl font-black gap-2 h-11 px-5 shrink-0"
        >
          {exportLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando…</>
            : <><Download className="w-4 h-4" /> Exportar PDF</>
          }
        </Button>
      </div>

      {/* ── Stat chips ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: Users,      label: 'Inscrições',    value: inscricoes.length,    color: 'text-foreground' },
          { icon: CheckCircle,label: 'Confirmadas',   value: pagas.length,         color: 'text-primary' },
          { icon: UserCheck,  label: 'Presentes',     value: presentes.length,     color: 'text-emerald-600' },
          { icon: UserX,      label: 'Ausentes',      value: pagas.length - presentes.length, color: 'text-muted-foreground' },
          { icon: TrendingUp, label: 'Pendentes',     value: pendentes.length,     color: 'text-amber-600' },
          { icon: DollarSign, label: 'Arrecadado',    value: fmtCompact(totalArrecadado), color: 'text-primary', isText: true },
        ].map(s => (
          <Card key={s.label} className="border border-border/50 shadow-none rounded-2xl bg-card">
            <CardContent className="p-4">
              <s.icon className={cn('w-4 h-4 mb-2', s.color)} />
              <p className={cn('text-2xl font-black tracking-tight', s.color)}>{s.value}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Presença ── */}
      <Card className="border border-border/50 shadow-none rounded-3xl">
        <CardHeader className="px-7 pt-6 pb-3">
          <CardTitle className="text-base font-black flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" /> Presença
            <span className="ml-auto text-sm font-bold text-muted-foreground">{presentes.length} / {pagas.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-7 pb-6 space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs font-bold text-muted-foreground mb-1.5">
              <span>Taxa de comparecimento</span>
              <span className="text-primary font-black">{taxaPresenca}%</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${taxaPresenca}%` }} />
            </div>
          </div>

          {/* Presence list */}
          {pagas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum inscrito confirmado ainda.</p>
          ) : (
            <>
              <div className="divide-y divide-border/50 rounded-xl border border-border/30 overflow-hidden">
                {(presencaExpandida ? pagas : pagas.slice(0, PRESENCA_LIMIT)).map(insc => (
                  <div key={insc.id} className={cn('flex items-center gap-3 px-4 py-2.5 text-sm', insc.presenca ? 'bg-emerald-50/50' : '')}>
                    <div className={cn('w-2 h-2 rounded-full shrink-0', insc.presenca ? 'bg-emerald-500' : 'bg-muted-foreground/30')} />
                    <span className={cn('font-bold flex-1 truncate', insc.presenca ? 'text-emerald-700' : 'text-foreground')}>
                      {insc.nome ?? '—'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{insc.ticket_nome}</span>
                    {insc.presenca && insc.checkin_at && (
                      <span className="text-[10px] font-black text-emerald-600 shrink-0">
                        {new Date(insc.checkin_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {!insc.presenca && (
                      <span className="text-[10px] font-black text-muted-foreground/50 shrink-0">Ausente</span>
                    )}
                  </div>
                ))}
              </div>
              {pagas.length > PRESENCA_LIMIT && (
                <button
                  onClick={() => setPresencaExpandida(e => !e)}
                  className="w-full text-xs font-black text-primary hover:text-primary/80 py-2 transition-colors"
                >
                  {presencaExpandida
                    ? 'Mostrar menos ↑'
                    : `Ver todos (${pagas.length}) ↓`}
                </button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── By ticket + Financial ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* By ticket */}
        <Card className="border border-border/50 shadow-none rounded-3xl">
          <CardHeader className="px-7 pt-6 pb-3">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <TicketIcon className="w-5 h-5 text-primary" /> Vendas por ingresso
            </CardTitle>
          </CardHeader>
          <CardContent className="px-7 pb-6">
            {byTicket.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma venda confirmada.</p>
            ) : (
              <div className="space-y-3">
                {byTicket.map((t, i) => (
                  <div key={t.nome} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/30">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{t.nome}</p>
                      <p className="text-xs text-muted-foreground">{t.vendidos} vendido{t.vendidos !== 1 ? 's' : ''}</p>
                    </div>
                    <p className="font-black text-primary text-sm shrink-0">{fmt(t.receita)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial summary */}
        <Card className="border border-border/50 shadow-none rounded-3xl">
          <CardHeader className="px-7 pt-6 pb-3">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" /> Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="px-7 pb-6 space-y-3">
            {[
              { label: 'Arrecadado (ingressos)', value: totalArrecadado, color: 'text-primary', bg: 'bg-primary/5 border-primary/10' },
              { label: 'Doações recebidas',      value: totalDoacoes,    color: 'text-rose-500', bg: 'bg-rose-50 border-rose-100' },
              { label: 'Total saídas',            value: totalSaidas,     color: 'text-muted-foreground', bg: 'bg-muted/40 border-border/30', prefix: '−' },
            ].map(r => (
              <div key={r.label} className={cn('flex items-center justify-between p-4 rounded-2xl border', r.bg)}>
                <span className="text-sm font-bold text-foreground">{r.label}</span>
                <span className={cn('font-black text-base', r.color)}>{r.prefix}{fmt(r.value)}</span>
              </div>
            ))}
            <div className={cn(
              'flex items-center justify-between p-5 rounded-2xl border-2',
              saldo >= 0 ? 'bg-primary/5 border-primary/30' : 'bg-red-50 border-red-200'
            )}>
              <span className="text-sm font-black uppercase tracking-wide">Saldo líquido</span>
              <span className={cn('font-black text-2xl', saldo >= 0 ? 'text-primary' : 'text-red-500')}>{fmt(saldo)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Status pie ── */}
      {statusData.length > 0 && (
        <Card className="border border-border/50 shadow-none rounded-3xl">
          <CardHeader className="px-7 pt-6 pb-3">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" /> Status das inscrições
            </CardTitle>
          </CardHeader>
          <CardContent className="px-7 pb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-48 h-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,.1)', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-foreground">{inscricoes.length}</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">total</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {statusData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs font-bold text-foreground">{statusLabel[entry.name] ?? entry.name}</span>
                    <span className="text-xs font-black text-muted-foreground">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
