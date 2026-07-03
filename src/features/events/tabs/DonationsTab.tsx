import React, { useEffect, useState } from 'react';
import { listDocuments, createDocument, updateDocument, removeDocument, getDocument } from '~/services/firestore';
import { Donation, Inscricao, Pessoa, FinancialTransaction, Pagamento, Ticket, Evento } from '~/types';
import { notifOnce } from '~/utils/notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Heart, Plus, User, Target, Wallet, ArrowRight, Trash2, Edit2, Info, Check, X, Share2, DollarSign, TrendingUp, Undo2, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '~/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';

export default function DonationsTab({ eventoId }: { eventoId: string }) {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [registrations, setRegistrations] = useState<(Inscricao & { pessoa?: Pessoa })[]>([]);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAllocationOpen, setIsAllocationOpen] = useState(false);
  const [allocationForm, setAllocationForm] = useState({
    doacaoId: '',
    inscritoId: '',
    valor: 0
  });

  const [formData, setFormData] = useState({
    valor: 0,
    taxaAdm: 0,
    formaPagamento: 'pix',
    dataPagamento: new Date().toISOString().split('T')[0],
    inscritoId: '',
    doadorNome: '',
    destino: 'livre' as 'inscrito' | 'livre',
    finalidade: '',
    data: new Date().toISOString().split('T')[0]
  });

  const [allocations, setAllocations] = useState<any[]>([]);

  const fetchData = async () => {
    const [donData, regData, peopleData, allocData, ticketsData, eventData] = await Promise.all([
      listDocuments<Donation>(`eventos/${eventoId}/doacoes`),
      listDocuments<Inscricao>(`eventos/${eventoId}/inscricoes`),
      listDocuments<Pessoa>(`eventos/${eventoId}/pessoas`),
      listDocuments<any>(`eventos/${eventoId}/alocacoes_doacoes`),
      listDocuments<Ticket>(`eventos/${eventoId}/tickets`),
      getDocument<Evento>('eventos', eventoId),
    ]);

    const enrichedRegs = regData.map(reg => ({
      ...reg,
      pessoa: peopleData.find(p => p.id === reg.pessoaId)
    }));

    setDonations(donData);
    setRegistrations(enrichedRegs);
    setAllocations(allocData);
    setEvento(eventData);
    setLoading(false);

    if (eventData?.criado_por) {
      const adminId = eventData.criado_por;
      donData
        .filter(d => d.status === 'pendente')
        .forEach(d =>
          notifOnce(`dp_${d.id}`, {
            userId: adminId,
            eventoId,
            tipo: 'doacao_pendente',
            titulo: 'Doação pendente de vinculação',
            mensagem: `Doação de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.valor)} de ${d.doadorNome || 'Anônimo'} aguarda vinculação.`,
            data: d.data || new Date().toISOString(),
            lida: false,
            acao_requirida: false,
            dados_acao: { donationId: d.id },
          }).catch(() => {})
        );
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventoId]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  const confirmDelete = (id: string) => {
    setIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (!eventoId) {
      toast.error('ID do evento não encontrado.');
      return;
    }

    if (formData.valor <= 0) {
      toast.error('O valor da doação deve ser maior que zero.');
      return;
    }

    if (formData.destino === 'inscrito' && !formData.inscritoId) {
      toast.error('Por favor, selecione um inscrito para vincular a doação.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const valorLiquido = Number(formData.valor);
      
      let finalDestino = formData.destino;
      let finalInscritoId = formData.destino === 'inscrito' ? (formData.inscritoId || null) : null;

      const donationStatus = finalDestino === 'livre' ? 'aprovada' : 'pendente';

      if (finalDestino === 'inscrito' && finalInscritoId && !editingId) {
        const inscricao = await getDocument<Inscricao>(`eventos/${eventoId}/inscricoes`, finalInscritoId);
        if (inscricao && inscricao.valor_pago >= inscricao.valor_total) {
          finalDestino = 'livre';
          finalInscritoId = null;
          toast.info('Inscrito já estava com pagamento quitado. Doação convertida para livre.');
        }
      }

      const donationData: any = {
        ...formData,
        id: editingId || uuidv4(),
        eventoId,
        valor: Number(formData.valor),
        valorLiquido,
        destino: finalDestino,
        inscritoId: finalInscritoId,
        status: editingId ? (donations.find(d => d.id === editingId)?.status || donationStatus) : donationStatus,
        valorRestante: editingId ? (donations.find(d => d.id === editingId)?.valorRestante ?? valorLiquido) : valorLiquido
      };

      // Remove any undefined fields just in case
      Object.keys(donationData).forEach(key => {
        if (donationData[key] === undefined) {
          delete donationData[key];
        }
      });

        if (editingId) {
          await updateDocument(`eventos/${eventoId}/doacoes`, editingId, donationData);
          toast.success('Doação atualizada!');
        } else {
          await createDocument(`eventos/${eventoId}/doacoes`, donationData.id, donationData);
          
          // Create Financial Transaction ONLY if it's a FREE donation
          // Directed donations will become registrations payments after approval
          if (finalDestino === 'livre') {
            const transId = uuidv4();
            await createDocument(`eventos/${eventoId}/transacoes`, transId, {
              id: transId,
              eventoId,
              tipo: 'entrada',
              categoria: 'Doação',
              valor: valorLiquido,
              descricao: `Doação Livre: ${formData.doadorNome || 'Anônimo'}${formData.finalidade ? ` (${formData.finalidade})` : ''}`,
              data: formData.dataPagamento
            } as FinancialTransaction);
          }
  
          if (evento?.criado_por) {
            notifOnce(`dp_${donationData.id}`, {
              userId: evento.criado_por,
              eventoId,
              tipo: 'doacao_pendente',
              titulo: 'Doação pendente de vinculação',
              mensagem: `Doação de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorLiquido)} de ${formData.doadorNome || 'Anônimo'} aguarda vinculação.`,
              data: new Date().toISOString(),
              lida: false,
              acao_requirida: false,
              dados_acao: { donationId: donationData.id },
            }).catch(() => {});
          }
          toast.success('Doação registrada!');
        }

      setEditingId(null);
      await fetchData();
      resetForm();
      setIsDonationDialogOpen(false);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error('Erro ao processar doação. Verifique sua conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!idToDelete) return;

    setDeleteConfirmOpen(false);
    setIsSubmitting(true);
    const toastId = toast.loading('Excluindo doação...');
    
    try {
      await removeDocument(`eventos/${eventoId}/doacoes`, idToDelete);
      
      toast.success('Doação excluída!', { id: toastId });
      await fetchData();
    } catch (error) {
      console.error('[Donations] Error deleting donation:', error);
      toast.error('Erro ao excluir doação. Verifique as permissões.', { id: toastId });
    } finally {
      setIsSubmitting(false);
      setIdToDelete(null);
    }
  };

  const handleApprove = async (don: Donation) => {
    try {
      await updateDocument(`eventos/${eventoId}/doacoes`, don.id, {
        status: 'aprovada'
      });

      // If it is directed to a subscriber, register as a payment
      if (don.destino === 'inscrito' && don.inscritoId) {
        const payId = uuidv4();
        await createDocument(`eventos/${eventoId}/pagamentos`, payId, {
          id: payId,
          eventoId,
          inscricaoId: don.inscritoId,
          valor: don.valor,
          metodo: (don.formaPagamento || 'pix') as any,
          status: 'pago',
          data_pagamento: new Date().toISOString(),
          origem: 'manual'
        } as Pagamento);

        // Update registration balance
        const inscricao = registrations.find(r => r.id === don.inscritoId);
        if (inscricao) {
          const newValorPagoTotal = (inscricao.valor_pago || 0) + don.valor;
          let newStatus = inscricao.status;
          if (newValorPagoTotal >= (inscricao.valor_total || 0)) {
            newStatus = 'pago';
          } else if (newValorPagoTotal > 0) {
            newStatus = 'pagamento_iniciado';
          }

          await updateDocument(`eventos/${eventoId}/inscricoes`, inscricao.id, {
            valor_pago: newValorPagoTotal,
            status: newStatus
          });
        }
      } 
      // If it's livre, it would already create a transaction in handleSubmit
      // But if it was pending and became approved, we might need a transaction if it's now livre
      else if (don.destino === 'livre') {
        const transId = uuidv4();
        await createDocument(`eventos/${eventoId}/transacoes`, transId, {
          id: transId,
          eventoId,
          tipo: 'entrada',
          categoria: 'Doação',
          valor: don.valorLiquido || don.valor,
          descricao: `Doação Livre (Aprovada): ${don.doadorNome || 'Anônimo'}`,
          data: don.dataPagamento || don.data
        } as FinancialTransaction);
      }

      toast.success('Doação aprovada e registrada!');
      fetchData();
    } catch (error) {
      console.error('Error approving donation:', error);
      toast.error('Erro ao aprovar doação.');
    }
  };

  const handleRejectToFree = async (don: Donation) => {
    try {
      await updateDocument(`eventos/${eventoId}/doacoes`, don.id, {
        destino: 'livre',
        inscritoId: null,
        status: 'aprovada'
      });

      // Create Financial Transaction since it's now a free donation
      const transId = uuidv4();
      await createDocument(`eventos/${eventoId}/transacoes`, transId, {
        id: transId,
        eventoId,
        tipo: 'entrada',
        categoria: 'Doação',
        valor: don.valorLiquido || don.valor,
        descricao: `Doação Convertida em Livre: ${don.doadorNome || 'Anônimo'}`,
        data: new Date().toISOString().split('T')[0]
      } as FinancialTransaction);

      toast.info('Doação vinculada como Livre/Geral.');
      fetchData();
    } catch (error) {
      toast.error('Erro ao converter doação.');
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    const don = donations.find(d => d.id === allocationForm.doacaoId);
    if (!don) return;

    if (allocationForm.valor > don.valorRestante) {
      toast.error(`Saldo insuficiente na doação. Disponível: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(don.valorRestante)}`);
      return;
    }

    try {
      const allocationId = uuidv4();
      const valorAlocado = Number(allocationForm.valor);

      await createDocument(`eventos/${eventoId}/alocacoes_doacoes`, allocationId, {
        id: allocationId,
        doacaoId: don.id,
        inscritoId: allocationForm.inscritoId,
        valor: valorAlocado,
        data: new Date().toISOString(),
        eventoId
      });

      // Update donation balance
      await updateDocument(`eventos/${eventoId}/doacoes`, don.id, {
        valorRestante: don.valorRestante - valorAlocado
      });

      // Update subscriber payment record
      const inscricao = registrations.find(r => r.id === allocationForm.inscritoId);
      if (inscricao) {
        // Create payment record for the subscriber
        const payId = uuidv4();
        await createDocument(`eventos/${eventoId}/pagamentos`, payId, {
          id: payId,
          eventoId,
          inscricaoId: inscricao.id,
          valor: valorAlocado,
          metodo: 'dinheiro',
          status: 'pago',
          data_pagamento: new Date().toISOString(),
          origem: 'manual',
          isDonation: true,
          doadorNome: don.doadorNome || 'Anônimo'
        } as Pagamento);

        const novoValorPago = (inscricao.valor_pago || 0) + valorAlocado;
        let novoStatus = inscricao.status;
        if (novoValorPago >= (inscricao.valor_total || 0)) {
          novoStatus = 'pago';
        } else if (novoValorPago > 0) {
          novoStatus = 'pagamento_iniciado';
        }

        await updateDocument(`eventos/${eventoId}/inscricoes`, inscricao.id, {
          valor_pago: novoValorPago,
          status: novoStatus
        });
      }

      toast.success('Doação destinada com sucesso!');
      setIsAllocationOpen(false);
      setAllocationForm({ doacaoId: '', inscritoId: '', valor: 0 });
      fetchData();
    } catch (error) {
      toast.error('Erro ao destinar doação.');
    }
  };

  const handleEdit = (don: Donation) => {
    setFormData({
      valor: don.valor,
      taxaAdm: don.taxaAdm || 0,
      formaPagamento: don.formaPagamento || 'pix',
      dataPagamento: don.dataPagamento || don.data,
      inscritoId: don.inscritoId || '',
      doadorNome: don.doadorNome || '',
      destino: don.destino || 'livre',
      finalidade: don.finalidade || '',
      data: don.data
    });
    setEditingId(don.id);
    setIsDonationDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      valor: 0,
      taxaAdm: 0,
      formaPagamento: 'pix',
      dataPagamento: new Date().toISOString().split('T')[0],
      inscritoId: '',
      doadorNome: '',
      destino: 'livre',
      finalidade: '',
      data: new Date().toISOString().split('T')[0]
    });
  };

  const totalArrecadado = donations.filter(d => d.status === 'aprovada').reduce((acc, curr) => acc + curr.valor, 0);
  const totalLiquido = donations.filter(d => d.status === 'aprovada').reduce((acc, curr) => acc + (curr.valorLiquido || curr.valor), 0);
  const totalDestinadoInscritos = donations.filter(d => d.status === 'aprovada' && d.destino === 'inscrito').reduce((acc, curr) => acc + curr.valor, 0);
  const totalValoresNaoDestinados = donations.filter(d => d.status === 'aprovada' && d.destino === 'livre').reduce((acc, curr) => acc + curr.valorRestante, 0);

  return (
    <div className="space-y-8 text-foreground pb-20 pt-4">
      <div className="tab-page-header">
        <div><h2>Doações</h2><p>Gestão de ofertas e destinação de recursos.</p></div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setIsAllocationOpen(true)}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/5 gap-2 rounded-2xl flex-none font-bold h-11 px-6 transition-all active:scale-95"
          >
            <TrendingUp className="w-4 h-4" />
            Destinar Doação
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setEditingId(null);
              setIsDonationDialogOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-2xl flex-none font-black h-11 px-6 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nova Doação
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-card rounded-[2rem] transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em]">Total Bruto</p>
              <Wallet className="w-4 h-4 text-primary opacity-50" />
            </div>
            <p className="text-xl font-black text-primary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalArrecadado)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card rounded-[2rem] transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em]">Total Líquido</p>
              <Info className="w-4 h-4 text-blue-500 opacity-50" />
            </div>
            <p className="text-xl font-black text-blue-600 dark:text-blue-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalLiquido)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card rounded-[2rem] transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em]">Destinado a Inscritos</p>
              <Target className="w-4 h-4 text-emerald-500 opacity-50" />
            </div>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDestinadoInscritos)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl shadow-primary/20 bg-primary text-white rounded-[2rem] transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] text-primary-foreground/70 uppercase font-black tracking-[0.2em]">Valores Não Destinados</p>
              <Coins className="w-4 h-4 text-primary-foreground/70" />
            </div>
            <p className="text-xl font-black">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValoresNaoDestinados)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para Nova Doação */}
      <Dialog open={isDonationDialogOpen} onOpenChange={setIsDonationDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-xl rounded-[2.5rem] border-none shadow-2xl p-8 bg-card transition-colors">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Heart className="w-6 h-6 shrink-0" />
              </div>
              {editingId ? 'Editar Doação' : 'Registrar Doação'}
            </DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground pt-1">
              Registre uma nova oferta ou doação para o evento.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Valor Bruto (R$)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={formData.valor || ''} 
                  onChange={e => setFormData({...formData, valor: Number(e.target.value)})}
                  className="rounded-xl bg-muted/50 border-none h-12 font-black focus-visible:ring-primary shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Forma de Pagamento</Label>
                <Select value={formData.formaPagamento} onValueChange={v => setFormData({...formData, formaPagamento: v})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Data do Pagamento</Label>
                <Input 
                  type="date"
                  value={formData.dataPagamento} 
                  onChange={e => setFormData({...formData, dataPagamento: e.target.value})}
                  className="rounded-xl bg-muted/50 border-none h-12 font-bold focus-visible:ring-primary shadow-sm font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-border/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Doador (Identificação)</Label>
                  <Input 
                    placeholder="Nome do doador" 
                    value={formData.doadorNome} 
                    onChange={e => setFormData({...formData, doadorNome: e.target.value})}
                    className="rounded-xl bg-muted/50 border-none h-12 font-bold focus-visible:ring-primary shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Tipo de Destino</Label>
                  <Select value={formData.destino} onValueChange={(v: 'inscrito' | 'livre') => setFormData({...formData, destino: v})}>
                    <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="livre">Livre / Geral</SelectItem>
                    <SelectItem value="inscrito">Inscrito Específico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.destino === 'inscrito' ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Vincular a Inscrito</Label>
                <Select value={formData.inscritoId} onValueChange={v => setFormData({...formData, inscritoId: v})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm">
                    <SelectValue placeholder="Selecione o inscrito" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl max-h-[200px]">
                    {registrations.map(r => (
                      <SelectItem key={r.id} value={r.id} className="font-medium">
                        {r.pessoa?.nome} {r.pessoa?.sobrenome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Finalidade / Observação</Label>
                <Input 
                  placeholder="Ex: Compra de Som, Fundo de Reserva..." 
                  value={formData.finalidade} 
                  onChange={e => setFormData({...formData, finalidade: e.target.value})}
                  className="rounded-xl bg-muted/50 border-none h-12 font-bold focus-visible:ring-primary shadow-sm"
                />
              </div>
            )}
            </div>

            <DialogFooter className="pt-6 flex flex-col md:flex-row gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => { setIsDonationDialogOpen(false); setEditingId(null); resetForm(); }}
                className="rounded-2xl h-12 px-8 font-black text-muted-foreground hover:bg-muted"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-10 font-black shadow-xl shadow-primary/20 transition-all active:scale-95 flex-1"
              >
                {isSubmitting ? 'Processando...' : (editingId ? 'Salvar Alterações' : 'Confirmar Doação')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      <Card className="border-none shadow-sm rounded-[2rem] bg-card overflow-hidden transition-colors">
        <CardHeader className="bg-muted/30 border-b border-border p-6">
          <CardTitle className="text-xs font-semibold text-primary flex items-center gap-2 uppercase tracking-widest">
            <Heart className="w-5 h-5" />
            Histórico de Doações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-foreground">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="py-5 font-semibold uppercase text-xs tracking-widest text-muted-foreground px-6">Data Pag.</TableHead>
                  <TableHead className="py-5 font-semibold uppercase text-xs tracking-widest text-muted-foreground">Doador</TableHead>
                  <TableHead className="py-5 font-semibold uppercase text-xs tracking-widest text-muted-foreground">Destino</TableHead>
                  <TableHead className="py-5 font-semibold uppercase text-xs tracking-widest text-muted-foreground">Forma</TableHead>
                  <TableHead className="py-5 font-semibold uppercase text-xs tracking-widest text-muted-foreground">Bruto</TableHead>
                  <TableHead className="py-5 font-semibold uppercase text-xs tracking-widest text-muted-foreground">Líquido</TableHead>
                  <TableHead className="py-5 font-semibold uppercase text-xs tracking-widest text-muted-foreground">Status</TableHead>
                  <TableHead className="py-5 text-right font-black uppercase text-[10px] tracking-widest text-muted-foreground px-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2">
                        <Heart className="w-8 h-8 text-muted-foreground/30" />
                        <p className="font-bold text-sm text-muted-foreground">Nenhuma doação registrada ainda</p>
                        <p className="text-xs text-muted-foreground/60">Use o botão acima para registrar a primeira doação.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  donations.sort((a, b) => new Date(b.dataPagamento || b.data).getTime() - new Date(a.dataPagamento || a.data).getTime()).map(don => (
                    <TableRow key={don.id} className="hover:bg-muted/30 border-border/50 transition-colors">
                      <TableCell className="text-xs font-bold px-6">
                        {new Date(don.dataPagamento || don.data).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-bold">
                        <div className="flex flex-col">
                          <span className="text-foreground">{don.doadorNome || 'Anônimo'}</span>
                          {don.destino === 'inscrito' && don.inscritoId && (
                            <span className="text-[10px] text-primary flex items-center gap-1 font-black">
                              <User className="w-2.5 h-2.5" />
                              Para: {registrations.find(r => r.id === don.inscritoId)?.pessoa?.nome}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <Target className="w-3.5 h-3.5 text-primary" />
                            {don.destino === 'inscrito' ? 'Inscrito' : (
                              allocations.some(a => a.doacaoId === don.id) 
                              ? (don.valorRestante <= 0 ? 'Totalmente Destinada' : 'Parcialmente Destinada')
                              : (don.finalidade || 'Livre')
                            )}
                          </div>
                          {allocations.filter(a => a.doacaoId === don.id).map(a => {
                            const p = registrations.find(r => r.id === a.inscritoId)?.pessoa;
                            return (
                              <div key={a.id} className="text-[10px] text-emerald-600 font-black flex items-center gap-1 pl-5 bg-emerald-50 dark:bg-emerald-950/20 rounded px-1.5 py-0.5 w-fit">
                                <ArrowRight className="w-2 h-2" />
                                {p?.nome || 'Inscrito'}: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(a.valor)}
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">
                        {don.formaPagamento || 'PIX'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(don.valor)}
                      </TableCell>
                      <TableCell className="font-black text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(don.valorLiquido || don.valor)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={don.status === 'aprovada' ? 'default' : don.status === 'cancelada' ? 'destructive' : 'secondary'} className="capitalize font-black text-[9px] tracking-wider h-5 border-none">
                          {don.status || 'pendente'}
                        </Badge>
                        {don.status === 'aprovada' && don.valorRestante > 0 && (
                          <p className="text-[9px] text-primary font-black mt-1.5 px-1 bg-primary/10 rounded w-fit italic">Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(don.valorRestante)}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-1">
                          {don.status === 'pendente' && (
                            <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleApprove(don)} 
                            disabled={isSubmitting}
                            className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl transition-all"
                            title="Aprovar para Inscrito"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRejectToFree(don)} 
                            disabled={isSubmitting}
                            className="h-9 w-9 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-xl transition-all"
                            title="Tornar Livre"
                          >
                            <Undo2 className="w-4 h-4" />
                          </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEdit(don);
                            }} 
                            disabled={isSubmitting}
                            className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              confirmDelete(don.id);
                            }} 
                            disabled={isSubmitting}
                            className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                            title="Excluir Doação"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Allocation Dialog */}
      <Dialog open={isAllocationOpen} onOpenChange={setIsAllocationOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-lg border-none shadow-2xl p-8 bg-card transition-colors">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl font-black text-foreground tracking-tight">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <TrendingUp className="w-6 h-6 shrink-0" />
              </div>
              Destinar Doação
            </DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground pt-1">
              Distribua o saldo de uma doação vinda de terceiros para abater no valor de inscrição de um participante.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAllocate} className="space-y-6 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Escolher Doação Disponível</Label>
              <Select value={allocationForm.doacaoId} onValueChange={v => setAllocationForm({...allocationForm, doacaoId: v})}>
                <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm">
                  {allocationForm.doacaoId
                    ? <span className="truncate">{(() => { const d = donations.find(d => d.id === allocationForm.doacaoId); return d ? `${d.doadorNome || 'Anônima'} — ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.valorRestante)} (Disp.)` : 'Selecione uma doação com saldo'; })()}</span>
                    : <span className="text-muted-foreground font-normal">Selecione uma doação com saldo</span>
                  }
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  {donations
                    .filter(d => d.status === 'aprovada' && d.valorRestante > 0)
                    .map(d => (
                      <SelectItem key={d.id} value={d.id} className="font-medium">
                        {d.doadorNome || 'Anônima'} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.valorRestante)} (Disp.)
                      </SelectItem>
                    ))
                  }
                  {donations.filter(d => d.status === 'aprovada' && d.valorRestante > 0).length === 0 && (
                    <p className="p-4 text-xs text-muted-foreground text-center italic font-bold">Nenhuma doação com saldo disponível.</p>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Inscrito Destinatário</Label>
              <Select value={allocationForm.inscritoId} onValueChange={v => setAllocationForm({...allocationForm, inscritoId: v})}>
                <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm">
                  {allocationForm.inscritoId
                    ? <span className="truncate">{(() => { const r = registrations.find(r => r.id === allocationForm.inscritoId); return r ? `${r.pessoa?.nome || ''}${r.pessoa?.sobrenome ? ' ' + r.pessoa.sobrenome : ''}`.trim() || 'Inscrito' : 'Selecione o inscrito'; })()}</span>
                    : <span className="text-muted-foreground font-normal">Selecione o inscrito</span>
                  }
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  {registrations
                    .filter(r => r.valor_pago < r.valor_total)
                    .map(r => (
                      <SelectItem key={r.id} value={r.id} className="font-medium">
                        {r.pessoa?.nome} {r.pessoa?.sobrenome} (Falta: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valor_total - r.valor_pago)})
                      </SelectItem>
                    ))
                  }
                  {registrations.filter(r => r.valor_pago < r.valor_total).length === 0 && (
                    <p className="p-4 text-xs text-muted-foreground text-center italic font-bold">Todos os inscritos já estão quitados.</p>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Valor a Destinar (R$)</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  value={allocationForm.valor || ''}
                  onFocus={e => e.target.select()}
                  onChange={e => setAllocationForm({...allocationForm, valor: Number(e.target.value)})}
                  placeholder="Ex: 50.00"
                  className="rounded-xl border-none bg-muted/50 h-12 font-black shadow-sm pl-10"
                />
                <DollarSign className="w-5 h-5 text-primary absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {allocationForm.doacaoId && (
                <p className="text-[10px] text-primary font-black uppercase tracking-wider px-1 pt-1 italic">
                  Saldo disponível nesta doação: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(donations.find(d => d.id === allocationForm.doacaoId)?.valorRestante || 0)}
                </p>
              )}
            </div>

            <DialogFooter className="pt-6 flex flex-col md:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsAllocationOpen(false)} className="rounded-2xl h-12 px-8 font-bold text-muted-foreground hover:bg-muted">
                Cancelar
              </Button>
              <Button type="submit" disabled={!allocationForm.doacaoId || !allocationForm.inscritoId || allocationForm.valor <= 0} className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-12 h-12 font-black shadow-xl shadow-primary/20 transition-all active:scale-95">
                Confirmar Destinação
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-sm border-none shadow-2xl p-8 bg-card transition-colors">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive">
                <Trash2 className="w-6 h-6 shrink-0" />
              </div>
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground pt-2">
              Esta ação não pode ser desfeita. A doação será removida permanentemente do histórico.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-6 flex flex-col md:flex-row gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setDeleteConfirmOpen(false)} 
              className="rounded-2xl h-12 px-8 font-bold text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-white rounded-2xl px-8 h-12 font-black shadow-xl shadow-destructive/20 transition-all active:scale-95 flex-1"
            >
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
