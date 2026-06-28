import React, { useEffect, useState } from 'react';
import { listDocuments, createDocument, updateDocument } from '../../lib/firebase-utils';
import { Pagamento, Inscricao, Pessoa, Ticket } from '../../types';
import { where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Plus, CheckCircle, Clock, XCircle, CreditCard, QrCode, FileText, Eye, Edit2, Search, ArrowUp, ArrowDown, ArrowUpAZ, ArrowDownZA, Filter, X, PlugZap, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { useAuth } from '../../lib/AuthContext';
import { getPlanConfig } from '../../lib/plan-limits';
import { FinancialTransaction } from '../../types';

import { Progress } from '@/components/ui/progress';

export default function FinancialTab({ eventoId }: { eventoId: string }) {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Pagamento[]>([]);
  const [registrations, setRegistrations] = useState<(Inscricao & { pessoa?: Pessoa })[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const plan = getPlanConfig(profile?.plano);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedRegId, setSelectedRegId] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting and Filtering State
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    nome: '',
    celula: '',
    total: '',
    pago: '',
    saldo: '',
    status: ''
  });

  const [formData, setFormData] = useState({
    inscricaoId: '',
    valor: 0,
    metodo: 'pix' as const,
    status: 'pago' as const,
    data_vencimento: new Date().toISOString().split('T')[0],
    data_pagamento: new Date().toISOString().split('T')[0],
    comprovante_url: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payData, regData, peopleData, transData, ticketData] = await Promise.all([
        listDocuments<Pagamento>(`eventos/${eventoId}/pagamentos`),
        listDocuments<Inscricao>(`eventos/${eventoId}/inscricoes`),
        listDocuments<Pessoa>(`eventos/${eventoId}/pessoas`),
        listDocuments<FinancialTransaction>(`eventos/${eventoId}/transacoes`),
        listDocuments<Ticket>(`eventos/${eventoId}/tickets`),
      ]);

      const doacaoIds = new Set(ticketData.filter(t => t.tipo === 'doacao').map(t => t.id));
      const enrichedRegs = regData
        .filter(reg => !doacaoIds.has(reg.ticketId))
        .map(reg => ({
          ...reg,
          pessoa: peopleData.find(p => p.id === reg.pessoaId)
        }));

      setPayments(payData);
      setRegistrations(enrichedRegs);
      setTransactions(transData);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      toast.error('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventoId]);

  const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const MAX_RECEIPT_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
      toast.error('Formato inválido. Use JPEG, PNG, WebP ou PDF.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_RECEIPT_SIZE) {
      toast.error('Arquivo muito grande. Máximo permitido: 5MB.');
      e.target.value = '';
      return;
    }

    setUploadingReceipt(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const fileRef = ref(storage, `eventos/${eventoId}/comprovantes/${uuidv4()}.${ext}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setFormData(prev => ({ ...prev, comprovante_url: url }));
      toast.success('Comprovante anexado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao fazer upload do comprovante.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedReg = registrations.find(r => r.id === formData.inscricaoId);
      if (!selectedReg) return;

      const remainingBefore = selectedReg.valor_total - selectedReg.valor_pago;
      if (Number(formData.valor) > remainingBefore && formData.status === 'pago' && !editingPaymentId) {
        if (!confirm(`O valor informado (R$ ${formData.valor}) é maior que o saldo devedor (R$ ${remainingBefore}). Deseja continuar?`)) return;
      }

      if (editingPaymentId) {
        const oldPayment = payments.find(p => p.id === editingPaymentId);
        if (!oldPayment) return;

        await updateDocument(`eventos/${eventoId}/pagamentos`, editingPaymentId, {
          valor: Number(formData.valor),
          metodo: formData.metodo,
          status: formData.status,
          data_pagamento: formData.status === 'pago' ? new Date(formData.data_pagamento).toISOString() : undefined,
          comprovante_url: formData.comprovante_url
        });

        // Re-calculate valor_pago and status for registration
        const allPayments = await listDocuments<Pagamento>(`eventos/${eventoId}/pagamentos`, [
          where('inscricaoId', '==', selectedReg.id)
        ]);
        
        const newValorPagoTotal = allPayments
          .filter(p => p.status === 'pago')
          .reduce((sum, p) => sum + p.valor, 0);

        let newStatus: Inscricao['status'] = 'pendente';
        if (selectedReg.precisa_ajuda) {
          newStatus = 'ajuda_solicitada';
        } else if (newValorPagoTotal >= selectedReg.valor_total) {
          newStatus = 'pago';
        } else if (newValorPagoTotal > 0) {
          newStatus = 'pagamento_iniciado';
        }

        await updateDocument(`eventos/${eventoId}/inscricoes`, selectedReg.id, {
          valor_pago: newValorPagoTotal,
          status: newStatus
        });

        toast.success('Pagamento atualizado!');
      } else {
        const id = uuidv4();
        await createDocument(`eventos/${eventoId}/pagamentos`, id, {
          ...formData,
          id,
          eventoId,
          valor: Number(formData.valor),
          data_pagamento: formData.status === 'pago' ? new Date(formData.data_pagamento).toISOString() : undefined,
          origem: 'manual'
        });

        // Update registration valor_pago
        if (formData.status === 'pago') {
          const newValorPago = selectedReg.valor_pago + Number(formData.valor);
          
          let newStatus: Inscricao['status'] = selectedReg.status;
          if (selectedReg.precisa_ajuda) {
            newStatus = 'ajuda_solicitada';
          } else if (newValorPago >= selectedReg.valor_total) {
            newStatus = 'pago';
          } else if (newValorPago > 0) {
            newStatus = 'pagamento_iniciado';
          }

          await updateDocument(`eventos/${eventoId}/inscricoes`, selectedReg.id, {
            valor_pago: newValorPago,
            status: newStatus
          });
        }
        toast.success('Pagamento registrado!');
      }

      setIsPayDialogOpen(false);
      setEditingPaymentId(null);
      fetchData();
      setFormData({ ...formData, valor: 0, inscricaoId: '', comprovante_url: '' });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar pagamento.');
    }
  };

  const handleEditPayment = (pay: Pagamento) => {
    setFormData({
      inscricaoId: pay.inscricaoId,
      valor: pay.valor,
      metodo: pay.metodo as any,
      status: pay.status as any,
      data_vencimento: pay.data_vencimento,
      data_pagamento: pay.data_pagamento ? pay.data_pagamento.split('T')[0] : new Date().toISOString().split('T')[0],
      comprovante_url: pay.comprovante_url || ''
    });
    setEditingPaymentId(pay.id);
    setIsHistoryDialogOpen(false); // Close history to open pay dialog
    setIsPayDialogOpen(true);
  };

  const getMethodIcon = (metodo: string) => {
    switch (metodo) {
      case 'pix': return <QrCode className="w-4 h-4 mr-2 text-primary" />;
      case 'cartao': return <CreditCard className="w-4 h-4 mr-2 text-blue-600" />;
      case 'boleto': return <FileText className="w-4 h-4 mr-2 text-amber-600" />;
      default: return <DollarSign className="w-4 h-4 mr-2" />;
    }
  };

  const selectedReg = registrations.find(r => r.id === selectedRegId);
  const regPayments = payments.filter(p => p.inscricaoId === selectedRegId);

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = searchTerm === '' || 
      reg.pessoa?.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      reg.pessoa?.celula?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesNome = columnFilters.nome === '' || 
      reg.pessoa?.nome.toLowerCase().includes(columnFilters.nome.toLowerCase());

    const matchesCelula = columnFilters.celula === '' || 
      (reg.pessoa?.celula || '').toLowerCase().includes(columnFilters.celula.toLowerCase());

    const matchesStatus = columnFilters.status === '' || 
      (reg.valor_pago >= reg.valor_total ? 'pago' : reg.valor_pago > 0 ? 'andamento' : 'pendente').includes(columnFilters.status.toLowerCase());

    const matchesTotal = columnFilters.total === '' || 
      (reg.valor_total || 0).toString().includes(columnFilters.total);

    const matchesPago = columnFilters.pago === '' || 
      (reg.valor_pago || 0).toString().includes(columnFilters.pago);

    const matchesSaldo = columnFilters.saldo === '' || 
      ((reg.valor_total || 0) - (reg.valor_pago || 0)).toString().includes(columnFilters.saldo);

    return matchesSearch && matchesNome && matchesCelula && matchesStatus && matchesTotal && matchesPago && matchesSaldo;
  }).sort((a, b) => {
    if (!sortConfig) return 0;
    
    let aVal: any = '';
    let bVal: any = '';

    const saldoA = a.valor_total - a.valor_pago;
    const saldoB = b.valor_total - b.valor_pago;

    switch (sortConfig.key) {
      case 'nome':
        aVal = a.pessoa?.nome || '';
        bVal = b.pessoa?.nome || '';
        break;
      case 'celula':
        aVal = a.pessoa?.celula || '';
        bVal = b.pessoa?.celula || '';
        break;
      case 'total':
        aVal = a.valor_total || 0;
        bVal = b.valor_total || 0;
        break;
      case 'pago':
        aVal = a.valor_pago || 0;
        bVal = b.valor_pago || 0;
        break;
      case 'saldo':
        aVal = saldoA;
        bVal = saldoB;
        break;
      case 'status':
        aVal = a.valor_pago >= a.valor_total ? 2 : a.valor_pago > 0 ? 1 : 0;
        bVal = b.valor_pago >= b.valor_total ? 2 : b.valor_pago > 0 ? 1 : 0;
        break;
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpAZ className="w-3 h-3 ml-2 opacity-20 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-2 text-primary" /> 
      : <ArrowDown className="w-3 h-3 ml-2 text-primary" />;
  };

  const FilterHeader = ({ 
    label, 
    filterKey, 
    columnKey,
    className = ""
  }: { 
    label: string, 
    filterKey: string, 
    columnKey: string,
    className?: string
  }) => (
    <TableHead className={`font-semibold text-xs uppercase tracking-widest text-muted-foreground h-14 group ${className}`}>
      <div className="flex items-center">
        <button 
          onClick={() => requestSort(columnKey)}
          className="flex items-center hover:text-primary transition-colors focus:outline-none"
        >
          {label}
          <SortIcon columnKey={columnKey} />
        </button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className={`h-6 w-6 ml-1 transition-all rounded-md ${columnFilters[filterKey] ? 'text-primary bg-primary/10' : 'opacity-20 group-hover:opacity-100'}`}>
              <Filter className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 rounded-xl border-none shadow-2xl bg-card">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtrar {label}</p>
                {columnFilters[filterKey] && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 text-destructive"
                    onClick={() => setColumnFilters(prev => ({ ...prev, [filterKey]: '' }))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <Input 
                placeholder={`Filtrar por ${label}...`}
                value={columnFilters[filterKey]}
                onChange={e => setColumnFilters(prev => ({ ...prev, [filterKey]: e.target.value }))}
                className="h-9 rounded-lg border-none bg-muted font-bold text-xs focus-visible:ring-primary"
                autoFocus
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </TableHead>
  );

  const totalArrecadado = payments.filter(p => p.status === 'pago').reduce((acc, curr) => acc + curr.valor, 0);
  const totalEsperado = registrations.reduce((acc, curr) => acc + curr.valor_total, 0);

  const totalSaidas = transactions.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);
  const totalInscritos = registrations.length;
  const custoPorInscrito = totalInscritos > 0 ? totalSaidas / totalInscritos : 0;
  const margemPorInscrito = totalInscritos > 0 ? (totalArrecadado - totalSaidas) / totalInscritos : 0;

  const isAutoPay = plan.modules.autoPayments;
  const gatewayConnected = profile?.gateway_connected === true;

  return (
    <div className="space-y-6 text-foreground">
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
            <a href="/dashboard?tab=gateway" className="shrink-0">
              <button className="text-xs font-black text-amber-800 underline underline-offset-2 whitespace-nowrap">Conectar gateway</button>
            </a>
          </div>
        )
      )}

      <div className="tab-page-header">
        <h2>Pagamentos</h2>
        <div className="flex flex-wrap gap-3">
          {(!isAutoPay || !gatewayConnected) && (
            <Button
              onClick={() => setIsPayDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-2xl h-11 px-6 font-black shadow-lg shadow-primary/20 flex-none transition-all active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Novo Pagamento
            </Button>
          )}
        </div>
      </div>

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
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className={`h-6 w-6 ml-1 transition-all rounded-md ${columnFilters.nome ? 'text-primary bg-primary/10' : 'opacity-20 group-hover:opacity-100'}`}>
                          <Filter className="w-3 h-3" />
                        </Button>
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
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
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
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Selecione o Inscrito</Label>
              <Select value={formData.inscricaoId} onValueChange={v => setFormData({...formData, inscricaoId: v})}>
                <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm focus:ring-primary">
                  <SelectValue placeholder="Selecione o inscrito" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  {registrations.map(r => (
                    <SelectItem key={r.id} value={r.id} className="font-medium">
                      {r.pessoa?.nome || r.nome || r.email || r.id} (Faltam {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valor_total - r.valor_pago)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor_pay" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Valor (R$)</Label>
                <Input id="valor_pay" type="number" step="0.01" value={formData.valor} onChange={e => setFormData({...formData, valor: Number(e.target.value)})} className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors" />
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
            {formData.status === 'pago' && (
              <div className="space-y-2">
                <Label htmlFor="comprovante" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Anexar Comprovante (Opcional)</Label>
                <div className="flex items-center gap-3">
                  <Input 
                    id="comprovante" 
                    type="file" 
                    accept="image/*,.pdf"
                    onChange={handleFileUpload} 
                    className="rounded-xl bg-muted/50 border-none h-12 flex-1 font-medium file:font-black file:text-xs file:bg-primary/10 file:text-primary file:border-none file:rounded-lg file:px-3 file:mr-3" 
                    disabled={uploadingReceipt}
                  />
                  {uploadingReceipt && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                  {formData.comprovante_url && !uploadingReceipt && <CheckCircle className="w-6 h-6 text-primary shrink-0" />}
                </div>
              </div>
            )}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98] mt-4" disabled={uploadingReceipt}>
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
                              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">Sinal / Reserva</span>
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
                            <Button variant="ghost" size="icon" onClick={() => handleEditPayment(pay)} className="h-8 w-8 hover:bg-primary/10 text-primary rounded-lg">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex flex-col md:flex-row justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setIsHistoryDialogOpen(false)} className="rounded-2xl h-12 px-8 font-black text-muted-foreground hover:bg-muted">Ver Mais Tarde</Button>
              <Button 
                onClick={() => {
                  setFormData({ ...formData, inscricaoId: selectedRegId || '' });
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
