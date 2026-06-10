import React, { useEffect, useState } from 'react';
import { listDocuments, createDocument, removeDocument, updateDocument } from '../../lib/firebase-utils';
import { FinancialTransaction, Evento, Inscricao } from '../../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export default function InternalManagementTab({ evento }: { evento: Evento }) {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [registrations, setRegistrations] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    tipo: 'saida' as 'entrada' | 'saida',
    categoria: '',
    valor: 0,
    descricao: '',
    data: new Date().toISOString().split('T')[0]
  });

  const fetchTransactions = async () => {
    const data = await listDocuments<FinancialTransaction>(`eventos/${evento.id}/transacoes`);
    setTransactions(data.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
  };

  const fetchRegistrations = async () => {
    const data = await listDocuments<Inscricao>(`eventos/${evento.id}/inscricoes`);
    setRegistrations(data.filter(r => r.status === 'pago' || r.validada_manual));
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTransactions(), fetchRegistrations()]);
      setLoading(false);
    };
    loadData();
  }, [evento.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = uuidv4();
      await createDocument(`eventos/${evento.id}/transacoes`, id, {
        ...formData,
        id,
        eventoId: evento.id,
        valor: Number(formData.valor)
      });
      toast.success('Transação registrada!');
      setShowForm(false);
      fetchTransactions();
      setFormData({
        tipo: 'saida',
        categoria: '',
        valor: 0,
        descricao: '',
        data: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast.error('Erro ao registrar transação.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeDocument(`eventos/${evento.id}/transacoes`, id);
      toast.success('Transação removida!');
      fetchTransactions();
    } catch (error) {
      toast.error('Erro ao remover transação.');
    }
  };

  const totalEntradas = transactions.filter(t => t.tipo === 'entrada').reduce((acc, curr) => acc + curr.valor, 0);
  const totalSaidas = transactions.filter(t => t.tipo === 'saida').reduce((acc, curr) => acc + curr.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="space-y-8 text-foreground">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-card rounded-[2rem] border border-border/50 group hover:shadow-xl transition-all">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest px-1">Entradas</p>
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-primary tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEntradas)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card rounded-[2rem] border border-border/50 group hover:shadow-xl transition-all">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest px-1">Saídas</p>
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-red-600 tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSaidas)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-primary text-white rounded-[2rem] shadow-primary/20 group hover:shadow-2xl transition-all overflow-hidden relative">
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-primary-foreground/70 uppercase font-black tracking-widest px-1">Saldo do Evento</p>
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldo)}
            </p>
          </CardContent>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        </Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Fluxo de Caixa Interno</h2>
          <p className="text-sm text-muted-foreground font-medium">Controle todas as movimentações financeiras do evento.</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary/90 text-white gap-3 rounded-2xl h-12 px-8 font-black shadow-lg shadow-primary/20 transition-all active:scale-95 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Nova Transação
        </Button>
      </div>

      {showForm && (
        <Card className="border-none shadow-2xl bg-card rounded-[2.5rem] p-8 border border-border/50 animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Tipo</Label>
              <Select value={formData.tipo} onValueChange={v => setFormData({...formData, tipo: v as any})}>
                <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm focus:ring-primary transition-colors">
                  <SelectValue>
                    {formData.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="entrada" className="font-medium">Entrada</SelectItem>
                  <SelectItem value="saida" className="font-medium">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Categoria</Label>
              <Input 
                placeholder="Ex: Brindes, Local..." 
                value={formData.categoria} 
                onChange={e => setFormData({...formData, categoria: e.target.value})}
                className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Valor (R$)</Label>
              <Input 
                type="number" 
                value={formData.valor || ''} 
                onChange={e => setFormData({...formData, valor: Number(e.target.value)})}
                className="rounded-xl border-none bg-muted/50 h-12 font-black tracking-tight focus-visible:ring-primary transition-colors"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Descrição</Label>
              <Input 
                placeholder="Opcional" 
                value={formData.descricao} 
                onChange={e => setFormData({...formData, descricao: e.target.value})}
                className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-black shadow-lg shadow-primary/20 transition-all active:scale-95">Salvar</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="rounded-xl h-12 font-black text-muted-foreground hover:bg-muted">Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-card border border-border/50 transition-colors">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-b border-border/50">
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14 px-8">Data</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14">Tipo</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14">Categoria</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14">Descrição</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14">Valor</TableHead>
                <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14 px-8">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Sincronizando transações...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-black text-[10px] uppercase tracking-widest">
                    Nenhuma transação registrada no sistema.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map(t => (
                  <TableRow key={t.id} className="hover:bg-muted/30 transition-colors border-b border-border/10 group">
                    <TableCell className="px-8 py-5 text-sm font-bold text-muted-foreground">
                      {new Date(t.data).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {t.tipo === 'entrada' ? (
                        <span className="text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-lg w-fit">
                          <TrendingUp className="w-3.5 h-3.5" /> Entrada
                        </span>
                      ) : (
                        <span className="text-red-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 bg-red-500/10 px-3 py-1 rounded-lg w-fit">
                          <TrendingDown className="w-3.5 h-3.5" /> Saída
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-black text-foreground tracking-tight">{t.categoria}</TableCell>
                    <TableCell className="text-muted-foreground font-medium max-w-[200px] truncate">{t.descricao || '-'}</TableCell>
                    <TableCell className={`font-black text-lg tracking-tight ${t.tipo === 'entrada' ? 'text-primary' : 'text-red-600'}`}>
                      {t.tipo === 'entrada' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor)}
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(t.id)}
                        className="text-muted-foreground/30 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
