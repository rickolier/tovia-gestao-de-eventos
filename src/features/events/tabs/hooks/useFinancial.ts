import { useEffect, useRef, useState } from 'react';
import { listDocuments, createDocument, updateDocument, removeDocument } from '~/services/firestore';
import { Pagamento, Inscricao, Pessoa, Ticket } from '~/types';
import { FinancialTransaction } from '~/types';
import { where, limit } from 'firebase/firestore';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '~/context/AuthContext';
import { getPlanConfig } from '~/utils/plan-limits';
import { hasTourBeenSeen } from '~/features/dashboard/OnboardingTour';

export function useFinancial(eventoId: string, isActive?: boolean) {
  const { user, profile } = useAuth();
  const skipFirstActiveRef = useRef(true);

  const plan = getPlanConfig(profile?.plano);

  const [payments, setPayments] = useState<Pagamento[]>([]);
  const [registrations, setRegistrations] = useState<(Inscricao & { pessoa?: Pessoa })[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [financialTourOpen, setFinancialTourOpen] = useState(false);

  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedRegId, setSelectedRegId] = useState<string | null>(null);
  const [lockedInscricaoId, setLockedInscricaoId] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    nome: '', celula: '', total: '', pago: '', saldo: '', status: '',
  });

  const [formData, setFormData] = useState({
    inscricaoId: '',
    valor: 0,
    metodo: 'pix' as const,
    status: 'pago' as const,
    data_vencimento: new Date().toISOString().split('T')[0],
    data_pagamento: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payData, regData, peopleData, transData, ticketData] = await Promise.all([
        listDocuments<Pagamento>(`eventos/${eventoId}/pagamentos`, [limit(500)]),
        listDocuments<Inscricao>(`eventos/${eventoId}/inscricoes`, [limit(500)]),
        listDocuments<Pessoa>(`eventos/${eventoId}/pessoas`, [limit(500)]),
        listDocuments<FinancialTransaction>(`eventos/${eventoId}/transacoes`, [limit(500)]),
        listDocuments<Ticket>(`eventos/${eventoId}/tickets`),
      ]);

      const doacaoIds = new Set(ticketData.filter(t => t.tipo === 'doacao').map(t => t.id));
      const enrichedRegs = regData
        .filter(reg => !doacaoIds.has(reg.ticketId))
        .map(reg => ({ ...reg, pessoa: peopleData.find(p => p.id === reg.pessoaId) }));

      setPayments(payData);
      setRegistrations(enrichedRegs);
      setTransactions(transData);
    } catch {
      toast.error('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    skipFirstActiveRef.current = true;
    fetchData();
  }, [eventoId]);

  useEffect(() => {
    if (skipFirstActiveRef.current) { skipFirstActiveRef.current = false; return; }
    if (isActive) fetchData();
  }, [isActive]);

  useEffect(() => {
    if (user && !hasTourBeenSeen(user.uid, 'financeiro')) {
      const timer = setTimeout(() => setFinancialTourOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [user]);

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
        });

        const allPayments = await listDocuments<Pagamento>(`eventos/${eventoId}/pagamentos`, [
          where('inscricaoId', '==', selectedReg.id),
        ]);
        const newValorPagoTotal = allPayments.filter(p => p.status === 'pago').reduce((sum, p) => sum + p.valor, 0);
        let newStatus: Inscricao['status'] = 'pendente';
        if (selectedReg.precisa_ajuda) newStatus = 'ajuda_solicitada';
        else if (newValorPagoTotal >= selectedReg.valor_total) newStatus = 'pago';
        else if (newValorPagoTotal > 0) newStatus = 'pagamento_iniciado';

        await updateDocument(`eventos/${eventoId}/inscricoes`, selectedReg.id, { valor_pago: newValorPagoTotal, status: newStatus });
        toast.success('Pagamento atualizado!');
      } else {
        const id = uuidv4();
        await createDocument(`eventos/${eventoId}/pagamentos`, id, {
          ...formData,
          id,
          eventoId,
          valor: Number(formData.valor),
          data_pagamento: formData.status === 'pago' ? new Date(formData.data_pagamento).toISOString() : undefined,
          origem: 'manual',
        });

        if (formData.status === 'pago') {
          const newValorPago = selectedReg.valor_pago + Number(formData.valor);
          let newStatus: Inscricao['status'] = selectedReg.status;
          if (selectedReg.precisa_ajuda) newStatus = 'ajuda_solicitada';
          else if (newValorPago >= selectedReg.valor_total) newStatus = 'pago';
          else if (newValorPago > 0) newStatus = 'pagamento_iniciado';
          await updateDocument(`eventos/${eventoId}/inscricoes`, selectedReg.id, { valor_pago: newValorPago, status: newStatus });
        }
        toast.success('Pagamento registrado!');
      }

      setIsPayDialogOpen(false);
      setEditingPaymentId(null);
      fetchData();
      setFormData({ ...formData, valor: 0, inscricaoId: '' });
    } catch {
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
    });
    setEditingPaymentId(pay.id);
    setIsHistoryDialogOpen(false);
    setIsPayDialogOpen(true);
  };

  const handleDeletePayment = async (pay: Pagamento) => {
    if (!confirm(`Excluir pagamento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pay.valor)}? Essa ação não pode ser desfeita.`)) return;
    try {
      await removeDocument(`eventos/${eventoId}/pagamentos`, pay.id);
      const reg = registrations.find(r => r.id === pay.inscricaoId);
      if (reg) {
        const remaining = payments.filter(p => p.id !== pay.id && p.inscricaoId === reg.id);
        const newValorPago = remaining.filter(p => p.status === 'pago').reduce((sum, p) => sum + p.valor, 0);
        let newStatus: Inscricao['status'] = 'pendente';
        if (reg.precisa_ajuda) newStatus = 'ajuda_solicitada';
        else if (newValorPago >= reg.valor_total) newStatus = 'pago';
        else if (newValorPago > 0) newStatus = 'pagamento_iniciado';
        await updateDocument(`eventos/${eventoId}/inscricoes`, reg.id, { valor_pago: newValorPago, status: newStatus });
      }
      toast.success('Pagamento excluído.');
      fetchData();
    } catch {
      toast.error('Erro ao excluir pagamento.');
    }
  };

  const getInscritoNome = (r: Inscricao & { pessoa?: Pessoa }): string => {
    if (r.pessoa?.nome?.trim()) return r.pessoa.nome.trim();
    if (r.nome?.trim()) return r.nome.trim();
    if (r.email?.trim()) return r.email.trim();
    const respostas = r.respostas_formulario;
    if (respostas) {
      const entry = Object.entries(respostas).find(([k]) => k.toLowerCase().includes('nome') || k.toLowerCase().includes('name'));
      if (entry && typeof entry[1] === 'string' && entry[1].trim()) return entry[1].trim();
    }
    return `Participante #${r.id.slice(0, 8)}`;
  };

  const requestSort = (key: string) => {
    const direction: 'asc' | 'desc' = sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = searchTerm === '' ||
      reg.pessoa?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.pessoa?.celula?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNome = columnFilters.nome === '' || reg.pessoa?.nome.toLowerCase().includes(columnFilters.nome.toLowerCase());
    const matchesCelula = columnFilters.celula === '' || (reg.pessoa?.celula || '').toLowerCase().includes(columnFilters.celula.toLowerCase());
    const matchesStatus = columnFilters.status === '' || (reg.valor_pago >= reg.valor_total ? 'pago' : reg.valor_pago > 0 ? 'andamento' : 'pendente').includes(columnFilters.status.toLowerCase());
    const matchesTotal = columnFilters.total === '' || (reg.valor_total || 0).toString().includes(columnFilters.total);
    const matchesPago = columnFilters.pago === '' || (reg.valor_pago || 0).toString().includes(columnFilters.pago);
    const matchesSaldo = columnFilters.saldo === '' || ((reg.valor_total || 0) - (reg.valor_pago || 0)).toString().includes(columnFilters.saldo);
    return matchesSearch && matchesNome && matchesCelula && matchesStatus && matchesTotal && matchesPago && matchesSaldo;
  }).sort((a, b) => {
    if (!sortConfig) return 0;
    let aVal: any = '';
    let bVal: any = '';
    switch (sortConfig.key) {
      case 'nome': aVal = a.pessoa?.nome || ''; bVal = b.pessoa?.nome || ''; break;
      case 'celula': aVal = a.pessoa?.celula || ''; bVal = b.pessoa?.celula || ''; break;
      case 'total': aVal = a.valor_total || 0; bVal = b.valor_total || 0; break;
      case 'pago': aVal = a.valor_pago || 0; bVal = b.valor_pago || 0; break;
      case 'saldo': aVal = a.valor_total - a.valor_pago; bVal = b.valor_total - b.valor_pago; break;
      case 'status': aVal = a.valor_pago >= a.valor_total ? 2 : a.valor_pago > 0 ? 1 : 0; bVal = b.valor_pago >= b.valor_total ? 2 : b.valor_pago > 0 ? 1 : 0; break;
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const selectedReg = registrations.find(r => r.id === selectedRegId);
  const regPayments = payments.filter(p => p.inscricaoId === selectedRegId);

  return {
    payments, registrations, transactions, loading, plan,
    financialTourOpen, setFinancialTourOpen,
    isPayDialogOpen, setIsPayDialogOpen,
    isHistoryDialogOpen, setIsHistoryDialogOpen,
    selectedRegId, setSelectedRegId,
    lockedInscricaoId, setLockedInscricaoId,
    editingPaymentId, setEditingPaymentId,
    searchTerm, setSearchTerm,
    sortConfig, setSortConfig,
    columnFilters, setColumnFilters,
    formData, setFormData,
    filteredRegistrations, selectedReg, regPayments,
    fetchData, requestSort,
    handleSubmit, handleEditPayment, handleDeletePayment,
    getInscritoNome,
  };
}
