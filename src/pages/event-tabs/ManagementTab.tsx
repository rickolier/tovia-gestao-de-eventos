import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Plus,
  Trash2,
  Coins,
  Activity,
  Users,
  Heart,
  Pencil,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listDocuments, createDocument, removeDocument, updateDocument } from '../../lib/firebase-utils';
import { FinancialTransaction, Evento, Inscricao, Donation } from '../../types';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function ManagementTab({ evento, onUpdate }: { evento: Evento, onUpdate?: () => void }) {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [registrations, setRegistrations] = useState<Inscricao[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Margem por inscrição
  const [margem, setMargem] = useState<number>(evento.margem_por_inscricao ?? 0);
  const [margemInput, setMargemInput] = useState<string>(String(evento.margem_por_inscricao ?? ''));
  const [editingMargem, setEditingMargem] = useState(false);
  const [savingMargem, setSavingMargem] = useState(false);

  const [formData, setFormData] = useState({
    tipo: 'saida' as 'entrada' | 'saida',
    categoria: '',
    valor: 0,
    descricao: '',
    data: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    const [transData, regData, donData] = await Promise.all([
      listDocuments<FinancialTransaction>(`eventos/${evento.id}/transacoes`),
      listDocuments<Inscricao>(`eventos/${evento.id}/inscricoes`),
      listDocuments<Donation>(`eventos/${evento.id}/doacoes`)
    ]);
    setTransactions(transData);
    setRegistrations(regData);
    setDonations(donData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [evento.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = uuidv4();
      await createDocument(`eventos/${evento.id}/transacoes`, id, {
        ...formData,
        id,
        eventoId: evento.id,
        valor: Number(formData.valor),
        data: new Date(formData.data).toISOString()
      });
      toast.success('Lançamento realizado!');
      setIsDialogOpen(false);
      setFormData({
        tipo: 'saida',
        categoria: '',
        valor: 0,
        descricao: '',
        data: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar lançamento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza?')) return;
    try {
      await removeDocument(`eventos/${evento.id}/transacoes`, id);
      toast.success('Lançamento removido');
      fetchData();
    } catch (error) {
      console.error('Erro ao remover lançamento:', error);
      toast.error('Erro ao remover');
    }
  };

  const handleSaveMargem = async () => {
    const val = Number(margemInput);
    if (isNaN(val) || val < 0) { toast.error('Valor inválido.'); return; }
    setSavingMargem(true);
    try {
      await updateDocument('eventos', evento.id, { margem_por_inscricao: val });
      setMargem(val);
      setEditingMargem(false);
      onUpdate?.();
      toast.success('Margem salva!');
    } catch { toast.error('Erro ao salvar.'); }
    finally { setSavingMargem(false); }
  };

  const totalEntradasOutras = transactions.filter(t => t.tipo === 'entrada' && t.categoria !== 'Doação').reduce((acc, t) => acc + t.valor, 0);
  const totalSaldosDoacoes = donations.filter(d => d.status === 'aprovada' && d.destino === 'livre').reduce((acc, d) => acc + (d.valorRestante ?? d.valorLiquido ?? d.valor), 0);
  const totalSaidas = transactions.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);

  // Doações direcionadas a inscritos somam no valor_pago das inscrições mas
  // não representam caixa livre do organizador — devem ser excluídas do saldo.
  const totalDoacoesDirecionadas = donations
    .filter(d => d.status === 'aprovada' && d.destino === 'inscrito')
    .reduce((acc, d) => acc + d.valor, 0);

  const totalArrecadadoInscricoes = Math.max(
    0,
    registrations.reduce((acc, r) => acc + (r.valor_pago || 0), 0) - totalDoacoesDirecionadas
  );

  const totalBruto = totalEntradasOutras + totalSaldosDoacoes + totalArrecadadoInscricoes;
  const saldoLivre = totalBruto - totalSaidas;

  const totalInscritos = registrations.length;
  const inscritosPagos = registrations.filter(r => (r.valor_pago ?? 0) > 0).length;
  const orcamentoMargem = margem * inscritosPagos;
  const saldoMargem = orcamentoMargem - totalSaidas;
  const saudePct = orcamentoMargem > 0 ? Math.max(0, (saldoMargem / orcamentoMargem) * 100) : null;
  const saudeColor = saudePct === null ? null : saudePct >= 20 ? 'emerald' : saudePct > 0 ? 'amber' : 'red';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">Recursos</h2>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-2xl h-12 px-6 font-black shadow-lg shadow-primary/20 flex-1 md:flex-none transition-all active:scale-95">
            <Plus className="w-5 h-5 stroke-[3px]" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* ── Painel de Saúde Financeira da Margem ── */}
      <div className={cn(
        'rounded-3xl border p-6 space-y-4',
        saudeColor === 'emerald' ? 'bg-emerald-50 border-emerald-200' :
        saudeColor === 'amber'   ? 'bg-amber-50 border-amber-200' :
        saudeColor === 'red'     ? 'bg-red-50 border-red-200' :
        'bg-card border-border'
      )}>
        {/* Margem config row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
              saudeColor === 'emerald' ? 'bg-emerald-500 text-white' :
              saudeColor === 'amber'   ? 'bg-amber-500 text-white' :
              saudeColor === 'red'     ? 'bg-red-500 text-white' :
              'bg-primary/10 text-primary'
            )}>
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Saúde Financeira da Margem</p>
              <p className={cn('text-sm font-semibold',
                saudeColor === 'emerald' ? 'text-emerald-700' :
                saudeColor === 'amber'   ? 'text-amber-700' :
                saudeColor === 'red'     ? 'text-red-700' :
                'text-muted-foreground'
              )}>
                {saudeColor === null ? 'Configure a margem por inscrição para acompanhar a saúde do evento.' :
                 saudeColor === 'emerald' ? `Saudável — ${fmt(saldoMargem)} disponíveis` :
                 saudeColor === 'amber'   ? `Atenção — apenas ${fmt(saldoMargem)} restantes` :
                 `Orçamento estourado em ${fmt(Math.abs(saldoMargem))}`}
              </p>
            </div>
          </div>

          {/* Margem per inscricao input */}
          <div className="flex items-center gap-2 shrink-0">
            {editingMargem ? (
              <>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    autoFocus
                    value={margemInput}
                    onChange={e => setMargemInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveMargem()}
                    className="w-36 pl-8 pr-3 h-9 rounded-xl border border-border bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="0,00"
                  />
                </div>
                <button
                  onClick={handleSaveMargem}
                  disabled={savingMargem}
                  className="h-9 w-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => { setMargemInput(String(margem || '')); setEditingMargem(true); }}
                className="flex items-center gap-2 px-4 h-9 rounded-xl border border-border bg-white hover:bg-muted/50 transition-colors text-sm font-semibold text-foreground"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                {margem > 0 ? `${fmt(margem)} / inscrição` : 'Definir margem'}
              </button>
            )}
          </div>
        </div>

        {/* Health bar + numbers — only when margem is set */}
        {margem > 0 && (
          <div className="space-y-3">
            <div className="h-3 rounded-full bg-black/10 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500',
                  saudeColor === 'emerald' ? 'bg-emerald-500' :
                  saudeColor === 'amber'   ? 'bg-amber-400' :
                  'bg-red-500'
                )}
                style={{ width: `${Math.min(100, saudePct ?? 0)}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Orçamento</p>
                <p className="text-base font-black text-foreground">{fmt(orcamentoMargem)}</p>
                <p className="text-[10px] text-muted-foreground">{fmt(margem)} × {inscritosPagos} pagos</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Comprometido</p>
                <p className="text-base font-black text-foreground">{fmt(totalSaidas)}</p>
                <p className="text-[10px] text-muted-foreground">lançamentos de saída</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Saldo</p>
                <p className={cn('text-base font-black',
                  saudeColor === 'emerald' ? 'text-emerald-600' :
                  saudeColor === 'amber'   ? 'text-amber-600' :
                  'text-red-600'
                )}>{fmt(saldoMargem)}</p>
                <p className="text-[10px] text-muted-foreground">{(saudePct ?? 0).toFixed(0)}% livre</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Card className="border-none shadow-xl shadow-black/[0.02] bg-card rounded-2xl group hover:shadow-2xl transition-all">
              <CardContent className="p-4">
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-2">Saldo de Doações</p>
                <div className="flex items-center gap-2 text-emerald-600">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4" />
                  </div>
                  <span className="text-lg font-black truncate">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSaldosDoacoes)}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-xl shadow-black/[0.02] bg-card rounded-2xl group hover:shadow-2xl transition-all">
              <CardContent className="p-4">
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-2">Outras Entradas</p>
                <div className="flex items-center gap-2 text-primary">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <span className="text-lg font-black truncate">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEntradasOutras)}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-xl shadow-black/[0.02] bg-card rounded-2xl group hover:shadow-2xl transition-all">
              <CardContent className="p-4">
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-2">Saídas / Despesas</p>
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <span className="text-lg font-black truncate">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSaidas)}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-2xl shadow-primary/20 bg-primary text-white rounded-2xl overflow-hidden relative group">
              <CardContent className="p-4 relative z-10">
                <p className="text-[9px] text-white/70 uppercase font-black tracking-[0.2em] mb-2">Saldo Livre (Projeção)</p>
                <span className="text-lg font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoLivre)}</span>
              </CardContent>
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform" />
            </Card>
            <Card className="border-none shadow-xl shadow-black/[0.02] bg-card rounded-2xl group hover:shadow-2xl transition-all">
              <CardContent className="p-4">
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-2">Inscritos Pagos</p>
                <div className="flex items-center gap-2 text-foreground">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black">{registrations.filter(r => r.valor_pago > 0).length}</span>
                    <span className="text-xs text-muted-foreground font-bold tracking-tight">ativos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-none shadow-xl shadow-black/[0.02] bg-card rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-3 text-foreground">
                  <Activity className="w-5 h-5" />
                  Movimentação Financeira
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
                    Ver Todos
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[320px] overflow-y-auto px-8 pb-8 custom-scrollbar">
                  <table className="w-full">
                    <tbody className="divide-y divide-border/50">
                      {transactions.slice(0, 10).map(t => (
                        <tr key={t.id} className="group hover:bg-muted/30 transition-colors">
                          <td className="py-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.tipo === 'entrada' ? 'bg-primary/10 text-primary' : 'bg-red-50 text-red-600 dark:bg-red-950/30'}`}>
                                    {t.tipo === 'entrada' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-foreground leading-tight mb-1">{t.descricao}</p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider py-0 px-2 h-4 border-muted-foreground/20 text-muted-foreground bg-transparent">
                                            {t.categoria}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground font-bold">{new Date(t.data).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                          </td>
                          <td className={`py-4 text-right font-black text-sm ${t.tipo === 'entrada' ? 'text-primary' : 'text-red-600'}`}>
                            {t.tipo === 'entrada' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor)}
                          </td>
                          <td className="py-4 text-right pl-4">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="h-9 w-9 text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-16 text-center">
                            <div className="flex flex-col items-center gap-3 opacity-20 grayscale">
                                <Coins className="w-12 h-12" />
                                <p className="text-sm font-black uppercase tracking-widest">Nenhum registro encontrado</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-10 max-w-lg">
          <DialogHeader className="mb-6 text-center">
            <DialogTitle className="text-2xl font-black tracking-tight">Novo Lançamento</DialogTitle>
            <DialogDescription className="font-medium">Registre entradas e saídas extras para manter o controle absoluto.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest px-1">Tipo de Operação</Label>
                <Select value={formData.tipo} onValueChange={v => setFormData({...formData, tipo: v as any})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="saida" className="text-red-500 font-bold">🔴 Despesa/Saída</SelectItem>
                    <SelectItem value="entrada" className="text-primary font-bold">🟢 Receita/Entrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest px-1">Categoria</Label>
                <Select value={formData.categoria} onValueChange={v => setFormData({...formData, categoria: v})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="Alimentação">☕ Alimentação</SelectItem>
                    <SelectItem value="Locação">🏢 Locação</SelectItem>
                    <SelectItem value="Limpeza">🧹 Limpeza</SelectItem>
                    <SelectItem value="Som/Luz">🔊 Som/Luz</SelectItem>
                    <SelectItem value="Marketing">📢 Marketing</SelectItem>
                    <SelectItem value="Equipe">👥 Equipe</SelectItem>
                    <SelectItem value="Outros">📦 Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="val_lan" className="text-xs font-semibold uppercase tracking-widest px-1">Valor (R$)</Label>
                <Input 
                    id="val_lan" 
                    type="number" 
                    step="0.01" 
                    required 
                    value={formData.valor || ''} 
                    onChange={e => setFormData({...formData, valor: Number(e.target.value)})} 
                    className="rounded-xl border-none bg-muted/50 h-12 font-black shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dat_lan" className="text-xs font-semibold uppercase tracking-widest px-1">Data</Label>
                <Input 
                    id="dat_lan" 
                    type="date" 
                    required 
                    value={formData.data} 
                    onChange={e => setFormData({...formData, data: e.target.value})} 
                    className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="des_lan" className="text-xs font-semibold uppercase tracking-widest px-1">Descrição Detalhada</Label>
              <Input 
                id="des_lan" 
                required 
                placeholder="Ex: Pagamento do buffet para coffee break" 
                value={formData.descricao} 
                onChange={e => setFormData({...formData, descricao: e.target.value})} 
                className="rounded-xl border-none bg-muted/50 h-12 font-medium shadow-sm"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white rounded-[1.25rem] h-14 font-black shadow-xl shadow-primary/20 mt-4 transition-all active:scale-95">
              Confirmar Lançamento
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
