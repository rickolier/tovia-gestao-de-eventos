import React from 'react';
import { Pagamento, Inscricao, Pessoa } from '~/types';
import { Button } from '@/components/ui/button';
import { useFinancial } from './hooks/useFinancial';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Plus, CheckCircle, Clock, XCircle, CreditCard, QrCode, FileText, Eye, Edit2, Trash2, Search, ArrowUp, ArrowDown, ArrowUpAZ, ArrowDownZA, Filter, X, PlugZap, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinancialTransaction } from '~/types';
import OnboardingTour from '~/features/dashboard/OnboardingTour';
import { useAuth } from '~/context/AuthContext';
import { Progress } from '@/components/ui/progress';

export default function FinancialTab({ eventoId, isActive }: { eventoId: string; isActive?: boolean }) {
  const { user, profile } = useAuth();
  const {
    payments, registrations, transactions, loading, plan,
    financialTourOpen, setFinancialTourOpen,
    isPayDialogOpen, setIsPayDialogOpen,
    isHistoryDialogOpen, setIsHistoryDialogOpen,
    selectedRegId, setSelectedRegId,
    lockedInscricaoId, setLockedInscricaoId,
    editingPaymentId, setEditingPaymentId,
    searchTerm, setSearchTerm,
    sortConfig, columnFilters, setColumnFilters,
    formData, setFormData,
    filteredRegistrations, selectedReg, regPayments,
    fetchData, requestSort,
    handleSubmit, handleEditPayment, handleDeletePayment,
    getInscritoNome,
  } = useFinancial(eventoId, isActive);

  const totalArrecadado = payments.filter(p => p.status === 'pago').reduce((acc, curr) => acc + curr.valor, 0);
  const totalEsperado = registrations.reduce((acc, curr) => acc + curr.valor_total, 0);
  const totalSaidas = transactions.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);
  const totalInscritos = registrations.length;
  const custoPorInscrito = totalInscritos > 0 ? totalSaidas / totalInscritos : 0;
  const margemPorInscrito = totalInscritos > 0 ? (totalArrecadado - totalSaidas) / totalInscritos : 0;
  const isAutoPay = plan.modules.autoPayments;
  const gatewayConnected = profile?.gateway_connected === true;

  const getMethodIcon = (metodo: string) => {
    switch (metodo) {
      case 'pix': return <QrCode className="w-4 h-4 mr-2 text-primary" />;
      case 'cartao': return <CreditCard className="w-4 h-4 mr-2 text-blue-600" />;
      case 'boleto': return <FileText className="w-4 h-4 mr-2 text-amber-600" />;
      default: return <DollarSign className="w-4 h-4 mr-2" />;
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpAZ className="w-3 h-3 ml-2 opacity-20 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-2 text-primary" />
      : <ArrowDown className="w-3 h-3 ml-2 text-primary" />;
  };

  const FilterHeader = ({
    label, filterKey, columnKey, className = '',
  }: { label: string; filterKey: string; columnKey: string; className?: string }) => (
    <TableHead className={`font-semibold text-xs uppercase tracking-widest text-muted-foreground h-14 group ${className}`}>
      <div className="flex items-center">
        <button onClick={() => requestSort(columnKey)} className="flex items-center hover:text-primary transition-colors focus:outline-none">
          {label}
          <SortIcon columnKey={columnKey} />
        </button>
        <Popover>
          <PopoverTrigger className={`h-6 w-6 ml-1 transition-all rounded-md inline-flex items-center justify-center ${columnFilters[filterKey] ? 'text-primary bg-primary/10' : 'opacity-20 group-hover:opacity-100'}`}>
            <Filter className="w-3 h-3" />
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 rounded-xl border-none shadow-2xl bg-card">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtrar {label}</p>
                {columnFilters[filterKey] && (
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => setColumnFilters(prev => ({ ...prev, [filterKey]: '' }))}>
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <Input placeholder={`Filtrar por ${label}...`} value={columnFilters[filterKey]} onChange={e => setColumnFilters(prev => ({ ...prev, [filterKey]: e.target.value }))} className="h-9 rounded-lg border-none bg-muted font-bold text-xs focus-visible:ring-primary" autoFocus />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-6 text-foreground">
      {financialTourOpen && user && (
        <OnboardingTour
          userId={user.uid}
          plan={profile?.plano || 'chinam'}
          tourId="financeiro"
          onClose={() => setFinancialTourOpen(false)}
        />
      )}
      <div className="tab-page-header">
        <div><h2>Pagamentos</h2><p>Controle de pagamentos dos inscritos.</p></div>
        <div className="flex flex-wrap gap-3">
          {(!isAutoPay || !gatewayConnected) && (
            <Button
              onClick={() => { setLockedInscricaoId(null); setFormData(f => ({ ...f, inscricaoId: '' })); setIsPayDialogOpen(true); }}
              className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl h-10 px-5 font-black shadow-lg shadow-primary/20 flex-none transition-all active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Novo Pagamento
            </Button>
          )}
        </div>
      </div>

      {/* Banner de modo de pagamento */}
      {isAutoPay && (
        gatewayConnected ? (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-200">
            <PlugZap className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-black text-green-900">Pagamentos automáticos via Asaas</p>
              <p className="text-xs text-green-700 mt-0.5">As cobranças são geradas automaticamente na hora da inscrição. O participante paga na página do evento.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-black text-amber-900">Gateway não conectado</p>
                <p className="text-xs text-amber-700 mt-0.5">Conecte seu Asaas para ativar cobranças automáticas. Enquanto isso, o controle é manual.</p>
              </div>
            </div>
            <a href="/dashboard?tab=configuracoes&sub=gateway" className="shrink-0">
              <button className="text-xs font-black text-amber-800 underline underline-offset-2 whitespace-nowrap">Conectar gateway</button>
            </a>
          </div>
        )
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Card className="border-none shadow-sm bg-card rounded-2xl border border-border/50 py-3 px-6 h-12 flex items-center justify-center shrink-0">
          <div className="flex items-center gap-3">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Inscritos</p>
            <p className="text-lg font-black text-primary tracking-tight">{totalInscritos}</p>
          </div>
        </Card>

        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Buscar por nome ou célula..." 
            className="pl-11 rounded-2xl border-none bg-card h-12 font-bold shadow-sm focus-visible:ring-primary transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-card transition-colors border border-border/50">
        <CardHeader className="bg-muted/50 border-b border-border/50 px-8 py-6">
          <CardTitle className="text-base font-bold text-foreground">Gestão de Pagamentos por Inscrito</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-border/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-xs uppercase tracking-widest text-muted-foreground h-14 px-8 group">
                  <div className="flex items-center">
                    <button 
                      onClick={() => requestSort('nome')}
                      className="flex items-center hover:text-primary transition-colors focus:outline-none"
                    >
                      Inscrito
                      <SortIcon columnKey="nome" />
                    </button>
                    <Popover>
                      <PopoverTrigger className={`h-6 w-6 ml-1 transition-all rounded-md inline-flex items-center justify-center ${columnFilters.nome ? 'text-primary bg-primary/10' : 'opacity-20 group-hover:opacity-100'}`}>
                        <Filter className="w-3 h-3" />
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3 rounded-xl border-none shadow-2xl bg-card">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtrar Nome</p>
                            {columnFilters.nome && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5 text-destructive"
                                onClick={() => setColumnFilters(prev => ({ ...prev, nome: '' }))}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          <Input 
                            placeholder="Filtrar por nome..."
                            value={columnFilters.nome}
                            onChange={e => setColumnFilters(prev => ({ ...prev, nome: e.target.value }))}
                            className="h-9 rounded-lg border-none bg-muted font-bold text-xs focus-visible:ring-primary"
                            autoFocus
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
                <FilterHeader label="Valor Total" filterKey="total" columnKey="total" />
                <FilterHeader label="Valor Pago" filterKey="pago" columnKey="pago" />
                <FilterHeader label="Saldo Devedor" filterKey="saldo" columnKey="saldo" />
                <TableHead className="font-semibold text-xs uppercase tracking-widest text-muted-foreground h-14">Progresso</TableHead>
                <FilterHeader label="Status" filterKey="status" columnKey="status" />
                <TableHead className="text-right font-semibold text-xs uppercase tracking-widest text-muted-foreground h-14 px-8">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Carregando dados...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign className="w-8 h-8 text-muted-foreground/30" />
                      <p className="font-bold text-sm text-muted-foreground">Nenhum pagamento registrado ainda</p>
                      <p className="text-xs text-muted-foreground/60">Quando inscrições forem realizadas, elas aparecerão aqui.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-muted-foreground font-black text-[10px] uppercase tracking-widest">
                    Nenhuma inscrição encontrada na busca.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRegistrations.map(reg => {
                  const saldo = reg.valor_total - reg.valor_pago;
                  const percentualPago = Math.min(Math.round((reg.valor_pago / reg.valor_total) * 100) || 0, 100);
                  
                  let statusLabel = "Não iniciado";
                  let statusColor = "bg-red-500/10 text-red-600";
 
                  if (reg.valor_pago >= reg.valor_total) {
                    statusLabel = "Pago";
                    statusColor = "bg-primary/10 text-primary";
                  } else if (reg.valor_pago > 0) {
                    statusLabel = "Em Andamento";
                    statusColor = "bg-amber-500/10 text-amber-600";
                  }
 
                  return (
                    <TableRow key={reg.id} className="hover:bg-muted/30 transition-colors border-b border-border/10 group">
                      <TableCell className="py-5 px-8">
                        <div className="flex flex-col">
                          <span className="font-black text-foreground tracking-tight">{reg.pessoa?.nome}</span>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase">{reg.pessoa?.celula || 'Sem célula'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reg.valor_total)}
                      </TableCell>
                      <TableCell className="text-primary font-black">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reg.valor_pago)}
                      </TableCell>
                      <TableCell className={`font-black ${saldo > 0 ? 'text-red-600' : 'text-muted-foreground/40'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldo)}
                      </TableCell>
                      <TableCell className="w-40">
                        <div className="flex flex-col gap-2">
                          <Progress value={percentualPago} className="h-1.5 bg-muted" />
                          <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60 tracking-wider font-mono">{percentualPago}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColor} border-none shadow-none font-black text-[9px] uppercase px-3 py-1 rounded-lg`}>
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedRegId(reg.id);
                            setIsHistoryDialogOpen(true);
                          }}
                          className="text-primary hover:bg-primary/10 gap-2 rounded-xl font-bold transition-all px-4 h-10"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Dialog para Novo Pagamento */}
      <Dialog open={isPayDialogOpen} onOpenChange={v => { setIsPayDialogOpen(v); if (!v) setLockedInscricaoId(null); }}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-8 bg-card transition-colors">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Plus className="w-6 h-6 shrink-0" />
              </div>
              Registrar Pagamento
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Inscrito</Label>
              {lockedInscricaoId ? (
                <div className="flex items-center gap-3 rounded-xl bg-primary/8 border border-primary/20 h-12 px-4">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <span className="font-bold text-foreground flex-1 truncate">
                    {(() => { const r = registrations.find(r => r.id === lockedInscricaoId); return r ? getInscritoNome(r) : '—'; })()}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md shrink-0">Fixado</span>
                </div>
              ) : (
                <Select value={formData.inscricaoId} onValueChange={v => setFormData({...formData, inscricaoId: v ?? ''})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm focus:ring-primary">
                    {formData.inscricaoId
                      ? <span className="truncate">{(() => { const r = registrations.find(r => r.id === formData.inscricaoId); return r ? getInscritoNome(r) : 'Selecione o inscrito'; })()}</span>
                      : <span className="text-muted-foreground font-normal">Selecione o inscrito</span>
                    }
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    {registrations.map(r => (
                      <SelectItem key={r.id} value={r.id} className="font-medium">
                        {getInscritoNome(r)}{r.valor_total > r.valor_pago ? ` — faltam ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valor_total - r.valor_pago)}` : ' ✓ quitado'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor_pay" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Valor (R$)</Label>
                <Input id="valor_pay" type="number" step="0.01" value={formData.valor || ''} onFocus={e => e.target.select()} onChange={e => setFormData({...formData, valor: Number(e.target.value)})} className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Método</Label>
                <Select value={formData.metodo} onValueChange={v => setFormData({...formData, metodo: v as any})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="pix" className="font-medium">PIX</SelectItem>
                    <SelectItem value="cartao" className="font-medium">Cartão de Crédito</SelectItem>
                    <SelectItem value="boleto" className="font-medium">Boleto Bancário</SelectItem>
                    <SelectItem value="dinheiro" className="font-medium">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v as any})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="pago" className="font-medium">Pago / Confirmado</SelectItem>
                    <SelectItem value="pendente" className="font-medium">Pendente / Aguardando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.status === 'pago' && (
                <div className="space-y-2">
                  <Label htmlFor="data_pagamento" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Data do Pagamento</Label>
                  <Input 
                    id="data_pagamento" 
                    type="date" 
                    value={formData.data_pagamento} 
                    onChange={e => setFormData({...formData, data_pagamento: e.target.value})} 
                    className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors hover:bg-muted font-medium" 
                  />
                </div>
              )}
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98] mt-4">
              <CheckCircle className="w-5 h-5" />
              Confirmar Pagamento
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Histórico de Pagamentos */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-8 bg-card transition-colors max-h-[85vh] overflow-y-auto scrollbar-hide">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Eye className="w-6 h-6 shrink-0" />
              </div>
              Histórico: <span className="text-primary">{selectedReg?.pessoa?.nome}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/30 p-5 rounded-2xl border border-border/50 transition-all hover:bg-muted/40">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Valor Total</p>
                <p className="text-xl font-black text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedReg?.valor_total || 0)}</p>
              </div>
              <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20 transition-all hover:bg-primary/30">
                <p className="text-[10px] text-primary uppercase font-black tracking-widest mb-1">Total Pago</p>
                <p className="text-xl font-black text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedReg?.valor_pago || 0)}</p>
              </div>
              <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20 transition-all hover:bg-red-500/15">
                <p className="text-[10px] text-red-600 uppercase font-black tracking-widest mb-1">Saldo Devedor</p>
                <p className="text-xl font-black text-red-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((selectedReg?.valor_total || 0) - (selectedReg?.valor_pago || 0))}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 overflow-hidden bg-muted/10">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-xs uppercase tracking-widest text-muted-foreground h-12 px-6">Data</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-widest text-muted-foreground h-12">Método</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-widest text-muted-foreground h-12">Valor</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-widest text-muted-foreground h-12">Status</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-widest text-muted-foreground h-12">Anexo</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-widest text-muted-foreground h-12 px-6 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground font-black text-[10px] uppercase tracking-widest">Nenhum pagamento registrado ainda.</TableCell>
                    </TableRow>
                  ) : (
                    regPayments.sort((a, b) => new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime()).map(pay => (
                      <TableRow key={pay.id} className="hover:bg-muted/20 transition-colors border-b border-border/10">
                        <TableCell className="text-sm font-bold text-foreground py-4 px-6">{new Date(pay.data_pagamento || pay.data_vencimento).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center text-sm font-black text-foreground">
                              {getMethodIcon(pay.metodo)}
                              <span className="capitalize">{pay.metodo}</span>
                            </div>
                            {pay.isSignal && (
                              <span className="text-[9px] font-black text-primary uppercase tracking-widest mt-1">Sinal / Reserva</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-black text-sm text-primary">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pay.valor)}
                        </TableCell>
                        <TableCell>
                          {pay.status === 'pago' ? (
                            <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase px-2 py-1 rounded-md">Confirmado</Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-600 border-none font-black text-[9px] uppercase px-2 py-1 rounded-md">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {pay.comprovante_url ? (
                            <a href={pay.comprovante_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/70 transition-colors flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest">
                              <Eye className="w-3.5 h-3.5" /> Ver Recibo
                            </a>
                          ) : (
                            <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">-</span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 text-right">
                          {pay.origem === 'manual' && (
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditPayment(pay)} className="h-8 w-8 hover:bg-primary/10 text-primary rounded-lg">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeletePayment(pay)} className="h-8 w-8 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex flex-col md:flex-row justify-end gap-3 pt-2">
              <Button
                onClick={() => {
                  setLockedInscricaoId(selectedRegId);
                  setFormData(f => ({ ...f, inscricaoId: selectedRegId || '' }));
                  setIsHistoryDialogOpen(false);
                  setIsPayDialogOpen(true);
                }}
                className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-10 font-black shadow-xl shadow-primary/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Registrar Pagamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
