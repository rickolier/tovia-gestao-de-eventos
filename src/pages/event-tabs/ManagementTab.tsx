import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  FileText,
  Plus,
  Trash2,
  PieChart,
  Target,
  Coins,
  Activity,
  ChevronRight,
  Users
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
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';

export default function ManagementTab({ evento, onUpdate }: { evento: Evento, onUpdate?: () => void }) {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [registrations, setRegistrations] = useState<Inscricao[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const totalEntradasOutras = transactions.filter(t => t.tipo === 'entrada' && t.categoria !== 'Doação').reduce((acc, t) => acc + t.valor, 0);
  const totalSaldosDoacoes = donations.filter(d => d.status === 'aprovada' && d.destino === 'livre').reduce((acc, d) => acc + (d.valorRestante ?? d.valorLiquido ?? d.valor), 0);
  const totalSaidas = transactions.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);
  const totalArrecadadoInscricoes = registrations.reduce((acc, r) => acc + (r.valor_pago || 0), 0);
  
  const totalBruto = totalEntradasOutras + totalSaldosDoacoes + totalArrecadadoInscricoes;
  const saldoLivre = totalBruto - totalSaidas;

  const totalInscritos = registrations.length;
  const custoPorInscrito = totalInscritos > 0 ? totalSaidas / totalInscritos : 0;
  const margemPorInscrito = totalInscritos > 0 ? (totalArrecadadoInscricoes - totalSaidas) / totalInscritos : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Gestão do Evento</h2>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-2xl h-12 px-6 font-black shadow-lg shadow-primary/20 flex-1 md:flex-none transition-all active:scale-95">
            <Plus className="w-5 h-5 stroke-[3px]" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-xl shadow-black/[0.02] bg-card rounded-[2rem] group hover:shadow-2xl transition-all">
              <CardContent className="p-8">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-4">Saldo de Doações</p>
                <div className="flex items-center gap-3 text-emerald-600">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                    <Coins className="w-5 h-5" />
                  </div>
                  <span className="text-3xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSaldosDoacoes)}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-xl shadow-black/[0.02] bg-card rounded-[2rem] group hover:shadow-2xl transition-all">
              <CardContent className="p-8">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-4">Outras Entradas</p>
                <div className="flex items-center gap-3 text-primary">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <span className="text-3xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEntradasOutras)}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-xl shadow-black/[0.02] bg-card rounded-[2rem] group hover:shadow-2xl transition-all">
              <CardContent className="p-8">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-4">Saídas / Despesas</p>
                <div className="flex items-center gap-3 text-red-600">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                  <span className="text-3xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSaidas)}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-2xl shadow-primary/20 bg-primary text-white rounded-[2rem] overflow-hidden relative group">
              <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full">
                <div>
                    <p className="text-[10px] text-white/70 uppercase font-black tracking-[0.2em] mb-4">Saldo Livre (Projeção)</p>
                    <span className="text-3xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoLivre)}</span>
                </div>
              </CardContent>
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
              <DollarSign className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
            </Card>
            <Card className="border-none shadow-xl shadow-black/[0.02] bg-card rounded-[2rem] group hover:shadow-2xl transition-all">
              <CardContent className="p-8">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-4">Inscritos Pagos</p>
                <div className="flex items-center gap-3 text-foreground">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">{registrations.filter(r => r.valor_pago > 0).length}</span>
                    <span className="text-xs text-muted-foreground font-bold tracking-tight">ativos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl shadow-black/[0.02] bg-card rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-sm font-black flex items-center gap-3 uppercase tracking-widest text-primary">
                  <Target className="w-5 h-5" />
                  Performance por Participante
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2 p-6 bg-muted/40 rounded-[1.5rem] border border-border/10">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Custo de Aquisição</span>
                        <span className="text-2xl font-black text-red-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoPorInscrito)}
                        </span>
                    </div>
                    <div className="flex flex-col gap-2 p-6 bg-primary/5 rounded-[1.5rem] border border-primary/10">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Margem Líquida</span>
                        <span className={`text-2xl font-black ${margemPorInscrito >= 0 ? 'text-primary' : 'text-red-500'}`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(margemPorInscrito)}
                        </span>
                    </div>
                </div>
                
                <div className="p-6 bg-muted/20 rounded-[1.5rem] border border-border/50">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-bold text-foreground">Eficiência de Conversão</span>
                        <span className="text-sm font-black text-primary">72%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '72%' }} />
                    </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-black/[0.02] bg-card rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-3 uppercase tracking-widest text-primary">
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
                <Label className="text-[10px] font-black uppercase tracking-widest px-1">Tipo de Operação</Label>
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
                <Label className="text-[10px] font-black uppercase tracking-widest px-1">Categoria</Label>
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
                <Label htmlFor="val_lan" className="text-[10px] font-black uppercase tracking-widest px-1">Valor (R$)</Label>
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
                <Label htmlFor="dat_lan" className="text-[10px] font-black uppercase tracking-widest px-1">Data</Label>
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
              <Label htmlFor="des_lan" className="text-[10px] font-black uppercase tracking-widest px-1">Descrição Detalhada</Label>
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
