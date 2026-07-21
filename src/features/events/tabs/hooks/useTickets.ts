import { useEffect, useState } from 'react';
import { listDocuments, createDocument, updateDocument, removeDocument } from '~/services/firestore';
import { Ticket } from '~/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '~/context/AuthContext';
import { getPlanConfig } from '~/utils/plan-limits';

function emptyForm(defaultMetodos: string[]) {
  return {
    nome: '',
    tipo: 'pago' as 'pago' | 'gratuito' | 'doacao',
    valor: 0,
    limite_vagas: 0,
    data_limite: '',
    permite_parcelamento: false,
    metodos_pagamento: defaultMetodos,
    max_parcelas_credito: 1,
    max_parcelas_boleto: 1,
    max_parcelas_recorrente: 2,
    installment_logic: 'free' as 'free' | 'limited',
    exibir_preco: true,
    valor_livre: false,
    permite_direcionada: false,
    permite_patrocinio: false,
    valor_patrocinio: 0,
  };
}

export function useTickets(eventoId: string) {
  const { profile } = useAuth();

  const plan = getPlanConfig(profile?.plano);
  const onlyFreeTickets = !plan.modules.manualPayments;
  const gatewayConnected = profile?.gateway_connected === true;
  const defaultMetodos = plan.modules.autoPayments ? ['pix', 'boleto', 'credito'] : [];

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm(defaultMetodos));

  const reachedTicketLimit = tickets.length >= plan.maxTicketsPerEvent;

  const fetchTickets = async () => {
    const data = await listDocuments<Ticket>(`eventos/${eventoId}/tickets`);
    setTickets(data);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [eventoId]);

  const resetForm = () => setFormData(emptyForm(defaultMetodos));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicketId && reachedTicketLimit) {
      toast.error(`Seu plano (${plan.name}) permite no máximo ${plan.maxTicketsPerEvent} ingressos por evento.`);
      return;
    }
    if (formData.tipo === 'pago') {
      if (!formData.valor || formData.valor <= 0) { toast.error('O valor do ingresso pago deve ser maior que zero.'); return; }
      if (formData.valor > 99999.99) { toast.error('O valor do ingresso não pode exceder R$ 99.999,99.'); return; }
      if ((formData.metodos_pagamento || []).length === 0) { toast.error('Selecione ao menos uma forma de pagamento.'); return; }
    }
    if (formData.data_limite && new Date(formData.data_limite) <= new Date()) {
      toast.error('A data limite deve ser uma data futura.');
      return;
    }
    try {
      const ticketData = {
        ...formData,
        eventoId,
        valor: (formData.tipo === 'gratuito' || formData.tipo === 'doacao') ? 0 : Number(formData.valor),
        limite_vagas: formData.tipo === 'doacao' ? 0 : Number(formData.limite_vagas),
      };
      if (editingTicketId) {
        await updateDocument(`eventos/${eventoId}/tickets`, editingTicketId, ticketData);
        toast.success('Ingresso atualizado com sucesso!');
      } else {
        const id = uuidv4();
        await createDocument(`eventos/${eventoId}/tickets`, id, { ...ticketData, id });
        toast.success('Ingresso criado com sucesso!');
      }
      setIsDialogOpen(false);
      setEditingTicketId(null);
      resetForm();
      fetchTickets();
    } catch {
      toast.error('Erro ao salvar ingresso.');
    }
  };

  const handleEdit = (ticket: Ticket) => {
    setEditingTicketId(ticket.id);
    setFormData({
      nome: ticket.nome,
      tipo: ticket.tipo as 'pago' | 'gratuito' | 'doacao',
      valor: ticket.valor,
      limite_vagas: ticket.limite_vagas || 0,
      data_limite: ticket.data_limite || '',
      permite_parcelamento: ticket.permite_parcelamento || false,
      metodos_pagamento: ticket.metodos_pagamento || defaultMetodos,
      max_parcelas_credito: ticket.max_parcelas_credito ?? 1,
      max_parcelas_boleto: (ticket as any).max_parcelas_boleto ?? 1,
      max_parcelas_recorrente: ticket.max_parcelas_recorrente ?? 2,
      installment_logic: (ticket as any).installment_logic ?? 'free',
      exibir_preco: ticket.exibir_preco !== false,
      valor_livre: ticket.valor_livre || false,
      permite_direcionada: ticket.permite_direcionada || false,
      permite_patrocinio: ticket.permite_patrocinio || false,
      valor_patrocinio: ticket.valor_patrocinio || 0,
    });
    setIsDialogOpen(true);
  };

  const confirmDelete = (id: string) => {
    setTicketToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!ticketToDelete) return;
    try {
      await removeDocument(`eventos/${eventoId}/tickets`, ticketToDelete);
      toast.success('Ingresso excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setTicketToDelete(null);
      fetchTickets();
    } catch {
      toast.error('Erro ao excluir ingresso.');
    }
  };

  return {
    tickets, loading, plan, onlyFreeTickets, gatewayConnected, reachedTicketLimit, defaultMetodos,
    isDialogOpen, setIsDialogOpen,
    isDeleteDialogOpen, setIsDeleteDialogOpen,
    ticketToDelete, editingTicketId, setEditingTicketId,
    formData, setFormData,
    handleSubmit, handleEdit, handleDelete, confirmDelete, resetForm,
  };
}
