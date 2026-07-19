import { useEffect, useState } from 'react';
import { listDocuments, createDocument, updateDocument, removeDocument, getDocument } from '~/services/firestore';
import { Donation, Inscricao, Pessoa, FinancialTransaction, Pagamento, Ticket, Evento } from '~/types';
import { notifOnce } from '~/utils/notifications';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '~/context/AuthContext';

function emptyForm() {
  return {
    valor: 0,
    taxaAdm: 0,
    formaPagamento: 'pix',
    dataPagamento: new Date().toISOString().split('T')[0],
    inscritoId: '',
    doadorNome: '',
    destino: 'livre' as 'inscrito' | 'livre',
    finalidade: '',
    data: new Date().toISOString().split('T')[0],
  };
}

export function useDonations(eventoId: string) {
  const { user } = useAuth();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [registrations, setRegistrations] = useState<(Inscricao & { pessoa?: Pessoa })[]>([]);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAllocationOpen, setIsAllocationOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  const [allocationForm, setAllocationForm] = useState({ doacaoId: '', inscritoId: '', valor: 0 });
  const [formData, setFormData] = useState(emptyForm());

  const fetchData = async () => {
    const [donData, regData, peopleData, allocData, , eventData] = await Promise.all([
      listDocuments<Donation>(`eventos/${eventoId}/doacoes`),
      listDocuments<Inscricao>(`eventos/${eventoId}/inscricoes`),
      listDocuments<Pessoa>(`eventos/${eventoId}/pessoas`),
      listDocuments<any>(`eventos/${eventoId}/alocacoes_doacoes`),
      listDocuments<Ticket>(`eventos/${eventoId}/tickets`),
      getDocument<Evento>('eventos', eventoId),
    ]);

    const enrichedRegs = regData.map(reg => ({ ...reg, pessoa: peopleData.find(p => p.id === reg.pessoaId) }));
    setDonations(donData);
    setRegistrations(enrichedRegs);
    setAllocations(allocData);
    setEvento(eventData);
    setLoading(false);

    if (eventData?.criado_por) {
      const adminId = eventData.criado_por;
      donData.filter(d => d.status === 'pendente').forEach(d =>
        notifOnce(`dp_${d.id}`, {
          userId: adminId, eventoId, tipo: 'doacao_pendente',
          titulo: 'Doação pendente de vinculação',
          mensagem: `Doação de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.valor)} de ${d.doadorNome || 'Anônimo'} aguarda vinculação.`,
          data: d.data || new Date().toISOString(), lida: false, acao_requirida: false,
          dados_acao: { donationId: d.id },
        }).catch(() => {})
      );
    }
  };

  useEffect(() => { fetchData(); }, [eventoId]);

  const resetForm = () => setFormData(emptyForm());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (formData.valor <= 0) { toast.error('O valor da doação deve ser maior que zero.'); return; }
    if (formData.destino === 'inscrito' && !formData.inscritoId) { toast.error('Por favor, selecione um inscrito para vincular a doação.'); return; }

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
        ...formData, id: editingId || uuidv4(), eventoId,
        valor: Number(formData.valor), valorLiquido,
        destino: finalDestino, inscritoId: finalInscritoId,
        status: editingId ? (donations.find(d => d.id === editingId)?.status || donationStatus) : donationStatus,
        valorRestante: editingId ? (donations.find(d => d.id === editingId)?.valorRestante ?? valorLiquido) : valorLiquido,
      };
      Object.keys(donationData).forEach(key => { if (donationData[key] === undefined) delete donationData[key]; });

      if (editingId) {
        await updateDocument(`eventos/${eventoId}/doacoes`, editingId, donationData);
        toast.success('Doação atualizada!');
      } else {
        await createDocument(`eventos/${eventoId}/doacoes`, donationData.id, donationData);
        if (finalDestino === 'livre') {
          const transId = uuidv4();
          await createDocument(`eventos/${eventoId}/transacoes`, transId, {
            id: transId, eventoId, tipo: 'entrada', categoria: 'Doação', valor: valorLiquido,
            descricao: `Doação Livre: ${formData.doadorNome || 'Anônimo'}${formData.finalidade ? ` (${formData.finalidade})` : ''}`,
            data: formData.dataPagamento,
          } as FinancialTransaction);
        }
        if (evento?.criado_por) {
          notifOnce(`dp_${donationData.id}`, {
            userId: evento.criado_por, eventoId, tipo: 'doacao_pendente',
            titulo: 'Doação pendente de vinculação',
            mensagem: `Doação de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorLiquido)} de ${formData.doadorNome || 'Anônimo'} aguarda vinculação.`,
            data: new Date().toISOString(), lida: false, acao_requirida: false, dados_acao: { donationId: donationData.id },
          }).catch(() => {});
        }
        toast.success('Doação registrada!');
      }

      setEditingId(null);
      await fetchData();
      resetForm();
      setIsDonationDialogOpen(false);
    } catch {
      toast.error('Erro ao processar doação. Verifique sua conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id: string) => { setIdToDelete(id); setDeleteConfirmOpen(true); };

  const handleDelete = async () => {
    if (!idToDelete) return;
    setDeleteConfirmOpen(false);
    setIsSubmitting(true);
    const toastId = toast.loading('Excluindo doação...');
    try {
      await removeDocument(`eventos/${eventoId}/doacoes`, idToDelete);
      toast.success('Doação excluída!', { id: toastId });
      await fetchData();
    } catch {
      toast.error('Erro ao excluir doação. Verifique as permissões.', { id: toastId });
    } finally {
      setIsSubmitting(false);
      setIdToDelete(null);
    }
  };

  const handleApprove = async (don: Donation) => {
    try {
      await updateDocument(`eventos/${eventoId}/doacoes`, don.id, { status: 'aprovada' });
      if (don.destino === 'inscrito' && don.inscritoId) {
        const payId = uuidv4();
        await createDocument(`eventos/${eventoId}/pagamentos`, payId, {
          id: payId, eventoId, inscricaoId: don.inscritoId, valor: don.valor,
          metodo: (don.formaPagamento || 'pix') as any, status: 'pago',
          data_pagamento: new Date().toISOString(), origem: 'manual',
        } as Pagamento);
        const inscricao = registrations.find(r => r.id === don.inscritoId);
        if (inscricao) {
          const newValorPagoTotal = (inscricao.valor_pago || 0) + don.valor;
          let newStatus = inscricao.status;
          if (newValorPagoTotal >= (inscricao.valor_total || 0)) newStatus = 'pago';
          else if (newValorPagoTotal > 0) newStatus = 'pagamento_iniciado';
          await updateDocument(`eventos/${eventoId}/inscricoes`, inscricao.id, { valor_pago: newValorPagoTotal, status: newStatus });
        }
      } else if (don.destino === 'livre') {
        const transId = uuidv4();
        await createDocument(`eventos/${eventoId}/transacoes`, transId, {
          id: transId, eventoId, tipo: 'entrada', categoria: 'Doação',
          valor: don.valorLiquido || don.valor,
          descricao: `Doação Livre (Aprovada): ${don.doadorNome || 'Anônimo'}`,
          data: don.dataPagamento || don.data,
        } as FinancialTransaction);
      }
      toast.success('Doação aprovada e registrada!');
      fetchData();
    } catch {
      toast.error('Erro ao aprovar doação.');
    }
  };

  const handleRejectToFree = async (don: Donation) => {
    try {
      await updateDocument(`eventos/${eventoId}/doacoes`, don.id, { destino: 'livre', inscritoId: null, status: 'aprovada' });
      const transId = uuidv4();
      await createDocument(`eventos/${eventoId}/transacoes`, transId, {
        id: transId, eventoId, tipo: 'entrada', categoria: 'Doação',
        valor: don.valorLiquido || don.valor,
        descricao: `Doação Convertida em Livre: ${don.doadorNome || 'Anônimo'}`,
        data: new Date().toISOString().split('T')[0],
      } as FinancialTransaction);
      toast.info('Doação vinculada como Livre/Geral.');
      fetchData();
    } catch {
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
        id: allocationId, doacaoId: don.id, inscritoId: allocationForm.inscritoId,
        valor: valorAlocado, data: new Date().toISOString(), eventoId,
      });
      await updateDocument(`eventos/${eventoId}/doacoes`, don.id, { valorRestante: don.valorRestante - valorAlocado });
      const inscricao = registrations.find(r => r.id === allocationForm.inscritoId);
      if (inscricao) {
        const payId = uuidv4();
        await createDocument(`eventos/${eventoId}/pagamentos`, payId, {
          id: payId, eventoId, inscricaoId: inscricao.id, valor: valorAlocado,
          metodo: 'dinheiro', status: 'pago', data_pagamento: new Date().toISOString(),
          origem: 'manual', isDonation: true, doadorNome: don.doadorNome || 'Anônimo',
        } as Pagamento);
        const novoValorPago = (inscricao.valor_pago || 0) + valorAlocado;
        let novoStatus = inscricao.status;
        if (novoValorPago >= (inscricao.valor_total || 0)) novoStatus = 'pago';
        else if (novoValorPago > 0) novoStatus = 'pagamento_iniciado';
        await updateDocument(`eventos/${eventoId}/inscricoes`, inscricao.id, { valor_pago: novoValorPago, status: novoStatus });
      }
      toast.success('Doação destinada com sucesso!');
      setIsAllocationOpen(false);
      setAllocationForm({ doacaoId: '', inscritoId: '', valor: 0 });
      fetchData();
    } catch {
      toast.error('Erro ao destinar doação.');
    }
  };

  const handleEdit = (don: Donation) => {
    setFormData({
      valor: don.valor, taxaAdm: don.taxaAdm || 0,
      formaPagamento: don.formaPagamento || 'pix',
      dataPagamento: don.dataPagamento || don.data,
      inscritoId: don.inscritoId || '', doadorNome: don.doadorNome || '',
      destino: don.destino || 'livre', finalidade: don.finalidade || '',
      data: don.data,
    });
    setEditingId(don.id);
    setIsDonationDialogOpen(true);
  };

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const requestSort = (key: string) => {
    const direction: 'asc' | 'desc' = sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const sortedDonations = [...donations].sort((a, b) => {
    if (!sortConfig) return new Date(b.dataPagamento || b.data).getTime() - new Date(a.dataPagamento || a.data).getTime();
    let aVal: any = '';
    let bVal: any = '';
    switch (sortConfig.key) {
      case 'data': aVal = new Date(a.dataPagamento || a.data).getTime(); bVal = new Date(b.dataPagamento || b.data).getTime(); break;
      case 'doador': aVal = (a.doadorNome || '').toLowerCase(); bVal = (b.doadorNome || '').toLowerCase(); break;
      case 'forma': aVal = (a.formaPagamento || '').toLowerCase(); bVal = (b.formaPagamento || '').toLowerCase(); break;
      case 'bruto': aVal = a.valor; bVal = b.valor; break;
      case 'liquido': aVal = a.valorLiquido || a.valor; bVal = b.valorLiquido || b.valor; break;
      case 'status': aVal = a.status || 'pendente'; bVal = b.status || 'pendente'; break;
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalArrecadado = donations.filter(d => d.status === 'aprovada').reduce((acc, curr) => acc + curr.valor, 0);
  const totalLiquido = donations.filter(d => d.status === 'aprovada').reduce((acc, curr) => acc + (curr.valorLiquido || curr.valor), 0);
  const totalDestinadoInscritos = donations.filter(d => d.status === 'aprovada' && d.destino === 'inscrito').reduce((acc, curr) => acc + curr.valor, 0);
  const totalValoresNaoDestinados = donations.filter(d => d.status === 'aprovada' && d.destino === 'livre').reduce((acc, curr) => acc + curr.valorRestante, 0);

  return {
    donations: sortedDonations, registrations, evento, loading, allocations, isSubmitting,
    sortConfig, requestSort,
    isDonationDialogOpen, setIsDonationDialogOpen,
    editingId, setEditingId,
    isAllocationOpen, setIsAllocationOpen,
    deleteConfirmOpen, setDeleteConfirmOpen,
    idToDelete,
    allocationForm, setAllocationForm,
    formData, setFormData,
    totalArrecadado, totalLiquido, totalDestinadoInscritos, totalValoresNaoDestinados,
    fetchData, resetForm,
    handleSubmit, handleDelete, confirmDelete,
    handleApprove, handleRejectToFree, handleAllocate, handleEdit,
  };
}
