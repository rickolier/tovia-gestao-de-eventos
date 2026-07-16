import { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '~/services/firebase';
import { getDocument, listDocuments, createDocument, updateDocument } from '~/services/firestore';
import { Evento, Ticket, Cupom } from '~/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export interface RegistrationFlowProps {
  eventoId?: string;
  initialEvento?: Evento;
  isSimulation?: boolean;
}

interface CheckoutResult {
  paymentUrl: string;
  pixQrCode?: { encodedImage: string; payload: string; expirationDate: string } | null;
  bankSlipUrl?: string | null;
  chargeId: string;
}

export function useRegistrationFlow({ eventoId, initialEvento, isSimulation = false }: RegistrationFlowProps) {
  const [evento, setEvento] = useState<Evento | null>(initialEvento || null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(!initialEvento);
  const [step, setStep] = useState<'landing' | 'info' | 'payment' | 'checkout' | 'success'>('landing');
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [numeroPedido, setNumeroPedido] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [gatewayConnected, setGatewayConnected] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [codigoCupom, setCodigoCupom] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<Cupom | null>(null);
  const [cupomLoading, setCupomLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    telefone: '',
    genero: '',
    estadoCivil: '',
    dataNascimento: '',
    nomeResponsavel: '',
    telefoneResponsavel: '',
  });

  const isMinor = (dob: string): boolean => {
    if (!dob) return false;
    const birth = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear() -
      (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    return age < 18;
  };

  const participanteEhMenor = isMinor(formData.dataNascimento);

  useEffect(() => {
    const targetId = eventoId || initialEvento?.id;
    if (targetId) {
      const fetchData = async () => {
        if (!initialEvento) setLoading(true);
        try {
          let eventData = initialEvento;
          if (!initialEvento) {
            const fetched = await getDocument<Evento>('eventos', targetId);
            if (!fetched) {
              toast.error('Evento não encontrado');
              setLoading(false);
              return;
            }
            eventData = { ...fetched, id: targetId };
            setEvento(eventData);
          }

          const ticketsData = await listDocuments<Ticket>(`eventos/${targetId}/tickets`);
          setTickets(ticketsData);

          if (eventData?.criado_por) {
            const orgMeta = await getDocument<{ gateway_connected?: boolean }>('organizer_public', eventData.criado_por);
            setGatewayConnected(orgMeta?.gateway_connected === true);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          toast.error('Erro ao carregar dados do evento');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setLoading(false);
    }
  }, [eventoId, initialEvento]);

  const updateQuantity = (ticketId: string, delta: number) => {
    setTicketQuantities(prev => {
      const current = prev[ticketId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [ticketId]: next };
    });
  };

  const selectedTickets = tickets.filter(t => ticketQuantities[t.id] > 0);
  const totalAmount = selectedTickets.reduce((sum, t) => sum + (t.valor * (ticketQuantities[t.id] || 0)), 0);
  const desconto = cupomAplicado
    ? cupomAplicado.tipo === 'porcentagem'
      ? totalAmount * (cupomAplicado.valor / 100)
      : Math.min(cupomAplicado.valor, totalAmount)
    : 0;
  const totalComDesconto = Math.max(0, totalAmount - desconto);
  const totalTax = totalAmount * 0.1;

  const calculateMaxInstallments = () => {
    if (!evento || !evento.config_pagamento || evento.config_pagamento.installmentLogic === 'free') {
      return 12;
    }
    if (selectedTickets.length === 0) return 12;
    const now = new Date();
    let minInstallments = 12;
    selectedTickets.forEach(ticket => {
      if (ticket.data_limite) {
        const limitDate = new Date(ticket.data_limite);
        const months = (limitDate.getFullYear() - now.getFullYear()) * 12 + (limitDate.getMonth() - now.getMonth()) + 1;
        if (months > 0 && months < minInstallments) {
          minInstallments = months;
        } else if (months <= 0) {
          minInstallments = 1;
        }
      }
    });
    return Math.max(1, Math.min(12, minInstallments));
  };

  const maxInstallments = calculateMaxInstallments();

  const getAllowedMethods = () => {
    if (selectedTickets.length === 0) return [];
    let allowed = selectedTickets[0].metodos_pagamento || ['pix', 'boleto', 'credito'];
    selectedTickets.forEach(t => {
      const methods = t.metodos_pagamento || ['pix', 'boleto', 'credito'];
      allowed = allowed.filter(m => methods.includes(m));
    });
    return allowed;
  };

  const allowedMethods = getAllowedMethods();

  const handleLandingSubmit = () => {
    if (selectedTickets.length === 0) {
      toast.error('Por favor, selecione pelo menos um ingresso');
      return;
    }
    setStep('info');
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handleValidarCupom = async () => {
    if (!evento || !codigoCupom.trim()) return;
    setCupomLoading(true);
    try {
      const cupons = await listDocuments<Cupom>(`eventos/${evento.id}/cupons`);
      const cupom = cupons.find(c => c.codigo === codigoCupom.trim().toUpperCase());
      if (!cupom) { toast.error('Cupom não encontrado.'); return; }
      if (!cupom.ativo) { toast.error('Este cupom não está ativo.'); return; }
      if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) { toast.error('Este cupom está expirado.'); return; }
      if (cupom.limite_usos && cupom.usos >= cupom.limite_usos) { toast.error('Este cupom atingiu o limite de usos.'); return; }
      setCupomAplicado(cupom);
      toast.success(`Cupom aplicado! ${cupom.tipo === 'porcentagem' ? `${cupom.valor}% de desconto` : `R$ ${cupom.valor.toFixed(2)} de desconto`}`);
    } catch {
      toast.error('Erro ao validar cupom.');
    } finally {
      setCupomLoading(false);
    }
  };

  const handleRemoverCupom = () => {
    setCupomAplicado(null);
    setCodigoCupom('');
  };

  const handlePaymentSubmit = async () => {
    if (!evento || selectedTickets.length === 0) return;
    if (gatewayConnected && !selectedMethod) {
      toast.error('Selecione uma forma de pagamento.');
      return;
    }

    setLoading(true);
    try {
      const registrationId = uuidv4();
      const total = totalComDesconto;

      const inscricaoData: Record<string, unknown> = {
        nome: formData.nome,
        sobrenome: formData.sobrenome,
        email: formData.email,
        telefone: formData.telefone,
        genero: formData.genero,
        estadoCivil: formData.estadoCivil,
        data_nascimento: formData.dataNascimento,
        id: registrationId,
        eventoId: evento.id,
        ticketId: selectedTickets[0].id,
        ticket_nome: selectedTickets[0].nome,
        valor_total: total,
        valor_pago: 0,
        status: gatewayConnected ? 'pagamento_iniciado' : 'pendente',
        data_inscricao: new Date().toISOString(),
        quantidades: ticketQuantities,
        precisa_ajuda: false,
        validada_manual: false,
        userId: '',
      };
      if (participanteEhMenor) {
        inscricaoData.nome_responsavel = formData.nomeResponsavel;
        inscricaoData.telefone_responsavel = formData.telefoneResponsavel;
      }
      await createDocument(`eventos/${evento.id}/inscricoes`, registrationId, inscricaoData as any);

      if (cupomAplicado) {
        await updateDocument(`eventos/${evento.id}/cupons`, cupomAplicado.id, {
          usos: cupomAplicado.usos + 1,
        });
      }

      setNumeroPedido(registrationId.slice(0, 8).toUpperCase());

      if (gatewayConnected && selectedMethod) {
        const fns = getFunctions(app, 'us-central1');
        const createCharge = httpsCallable(fns, 'createEventCharge');
        const result = await createCharge({
          eventoId: evento.id,
          inscricaoId: registrationId,
          paymentMethod: selectedMethod,
          attendeeName: `${formData.nome} ${formData.sobrenome}`.trim(),
          attendeeEmail: formData.email,
          valor: total,
        });
        const data = result.data as CheckoutResult;
        setCheckoutResult(data);
        setStep('checkout');
        return;
      }

      setStep('success');
      toast.success('Inscrição realizada! O organizador vai confirmar o pagamento.');
    } catch (error: any) {
      console.error('Error creating registration:', error);
      toast.error(error?.message || 'Erro ao processar inscrição');
    } finally {
      setLoading(false);
    }
  };

  return {
    evento, tickets, loading, step, setStep,
    ticketQuantities, setTicketQuantities, lgpdConsent, setLgpdConsent,
    numeroPedido, selectedMethod, setSelectedMethod,
    gatewayConnected, checkoutResult, setCheckoutResult,
    codigoCupom, setCodigoCupom,
    cupomAplicado, cupomLoading,
    formData, setFormData,
    participanteEhMenor,
    selectedTickets, totalAmount, desconto, totalComDesconto, totalTax,
    maxInstallments, allowedMethods,
    updateQuantity,
    handleLandingSubmit, handleInfoSubmit,
    handleValidarCupom, handleRemoverCupom,
    handlePaymentSubmit,
  };
}
