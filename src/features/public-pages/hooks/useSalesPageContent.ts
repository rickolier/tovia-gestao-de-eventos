import { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '~/services/firebase';
import { getDocument, createDocument, listDocuments, updateDocument } from '~/services/firestore';
import { Evento, Ticket, PaginaVenda, UserProfile, Donation, Cupom } from '~/types';
import { validateEmail, validateTelefone, validateCPF } from '~/utils/validators';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Email } from '~/services/email';

export type Step = 'ticket' | 'form' | 'checkout' | 'success';

export interface CheckoutResult {
  paymentUrl: string | null;
  pixQrCode?: { encodedImage: string; payload: string; expirationDate: string } | null;
  bankSlipUrl?: string | null;
  identificationField?: string | null;
  chargeId: string;
  installmentValue?: number | null;
  installmentCount?: number | null;
}

interface Props {
  evento: Evento;
  pagina: PaginaVenda;
  tickets: Ticket[];
  eventoId: string;
  onSuccess?: (inscricaoId: string) => void;
}

export function useSalesPageContent({ evento, pagina, tickets, eventoId, onSuccess }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [doacaoValores, setDoacaoValores] = useState<Record<string, number>>({});
  const [step, setStep] = useState<Step>('ticket');
  const [submitting, setSubmitting] = useState(false);
  const [inscricaoId, setInscricaoId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [organizador, setOrganizador] = useState<UserProfile | null>(null);
  const [isDoacaoSubmission, setIsDoacaoSubmission] = useState(false);
  const [gatewayConnected, setGatewayConnected] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [cpf, setCpf] = useState('');
  const [card, setCard] = useState({ holderName: '', number: '', expiry: '', ccv: '' });
  const [installments, setInstallments] = useState(1);
  const [codigoCupom, setCodigoCupom] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<Cupom | null>(null);
  const [cupomLoading, setCupomLoading] = useState(false);
  const [doacaoDestino, setDoacaoDestino] = useState<'livre' | 'inscrito'>('livre');
  const [doacaoNomeInscrito, setDoacaoNomeInscrito] = useState('');

  useEffect(() => {
    if (evento.criado_por) {
      getDocument<UserProfile>('users', evento.criado_por)
        .then(u => {
          if (u) setOrganizador(u);
          setGatewayConnected(u?.gateway_connected === true && !!u?.gateway?.encrypted_api_key);
        })
        .catch(() => {});
    }
  }, [evento.criado_por]);

  const selectedTickets = tickets.filter(t => (quantities[t.id] || 0) > 0 || (t.valor_livre && (doacaoValores[t.id] || 0) > 0));
  const allDoacao = selectedTickets.length > 0 && selectedTickets.every(t => t.tipo === 'doacao');

  const getTicketTotal = (t: Ticket) => {
    if (t.tipo === 'doacao' && t.valor_livre) return doacaoValores[t.id] || 0;
    if (t.tipo === 'doacao' && t.permite_patrocinio) return (t.valor_patrocinio || 0) * (quantities[t.id] || 0);
    return t.valor * (quantities[t.id] || 0);
  };

  const subtotal = selectedTickets.reduce((s, t) => s + getTicketTotal(t), 0);
  const desconto = cupomAplicado
    ? cupomAplicado.tipo === 'porcentagem'
      ? subtotal * (cupomAplicado.valor / 100)
      : Math.min(cupomAplicado.valor, subtotal)
    : 0;
  const total = Math.max(0, subtotal - desconto);
  const totalQty: number = selectedTickets.reduce((sum, t) => {
    if (t.tipo === 'doacao' && t.valor_livre) return sum + ((doacaoValores[t.id] || 0) > 0 ? 1 : 0);
    return sum + (quantities[t.id] || 0);
  }, 0);

  const updateQty = (id: string, delta: number) =>
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));

  const handleValidarCupom = async () => {
    if (!codigoCupom.trim()) return;
    setCupomLoading(true);
    try {
      const cupons = await listDocuments<Cupom>(`eventos/${eventoId}/cupons`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const campo of pagina.campos_formulario) {
      const val = String(formValues[campo.id] || '').trim();
      if (campo.obrigatorio && !val) {
        toast.error(`O campo "${campo.label}" é obrigatório.`);
        return;
      }
      if (val) {
        if (campo.tipo === 'email' && !validateEmail(val)) {
          toast.error(`E-mail inválido no campo "${campo.label}".`);
          return;
        }
        if (campo.tipo === 'telefone' && !validateTelefone(val)) {
          toast.error(`Telefone inválido no campo "${campo.label}". Use (00) 00000-0000.`);
          return;
        }
        if (campo.label.toLowerCase().includes('cpf') && val.replace(/\D/g, '').length === 11 && !validateCPF(val)) {
          toast.error(`CPF inválido no campo "${campo.label}".`);
          return;
        }
      }
    }
    const needsCpf = gatewayConnected && total > 0;
    if (needsCpf && !validateCPF(cpf)) {
      toast.error('Informe um CPF válido para continuar.');
      return;
    }
    setSubmitting(true);
    try {
      const respostas: Record<string, string | boolean> = {};
      pagina.campos_formulario.forEach(c => { respostas[c.label] = formValues[c.id] || ''; });

      const nomeField = pagina.campos_formulario.find(c => c.label.toLowerCase().includes('nome'));
      const emailField = pagina.campos_formulario.find(c => c.tipo === 'email' || c.label.toLowerCase().includes('e-mail'));
      const telefoneField = pagina.campos_formulario.find(c => c.tipo === 'telefone' || c.label.toLowerCase().includes('telefone'));

      const nome = nomeField ? String(formValues[nomeField.id] || '') : '';
      const email = emailField ? String(formValues[emailField.id] || '') : '';
      const telefone = telefoneField ? String(formValues[telefoneField.id] || '') : '';

      const pessoaId = uuidv4();
      const cpfDigits = cpf.replace(/\D/g, '');
      await createDocument(`eventos/${eventoId}/pessoas`, pessoaId, {
        id: pessoaId, nome, email, telefone,
        ...(cpfDigits ? { cpf: cpfDigits } : {}),
      });

      if (allDoacao) {
        const doacaoId = uuidv4();
        const ticket = selectedTickets[0];
        let finalidade = ticket?.nome || '';
        if (ticket?.permite_patrocinio) {
          finalidade = `${ticket.nome} — ${quantities[ticket.id] || 0} inscrição(ões) patrocinadas`;
        }
        const useDonationGateway = gatewayConnected && !!selectedMethod && total > 0;
        const doacaoData: Omit<Donation, 'id'> & { id: string; pessoaId: string; email?: string; telefone?: string; respostas_formulario?: Record<string, string | boolean> } = {
          id: doacaoId,
          eventoId,
          valor: total,
          valorLiquido: total,
          taxaAdm: 0,
          formaPagamento: useDonationGateway ? selectedMethod : '',
          dataPagamento: new Date().toISOString(),
          doadorNome: nome,
          pessoaId,
          email,
          telefone,
          destino: doacaoDestino === 'inscrito' ? 'inscrito' : 'livre',
          ...(doacaoDestino === 'inscrito' && doacaoNomeInscrito ? { nomeInscrito: doacaoNomeInscrito } : {}),
          finalidade,
          data: new Date().toISOString(),
          status: 'pendente',
          valorRestante: total,
          respostas_formulario: respostas,
        };
        await createDocument(`eventos/${eventoId}/doacoes`, doacaoId, doacaoData as any);
        setIsDoacaoSubmission(true);
        setInscricaoId(doacaoId);

        if (useDonationGateway) {
          const fns = getFunctions(app, 'us-central1');
          const createCharge = httpsCallable(fns, 'createEventCharge');
          const [expiryMonth, expiryYear] = card.expiry.split('/');
          const result = await createCharge({
            eventoId,
            inscricaoId: doacaoId,
            isDonation: true,
            paymentMethod: selectedMethod,
            attendeeName: nome,
            attendeeEmail: email,
            attendeeCpf: cpf.replace(/\D/g, ''),
            attendeePhone: telefone,
            installments: installments > 1 ? installments : undefined,
            creditCard: (selectedMethod === 'credito' || selectedMethod === 'recorrente') ? {
              holderName: card.holderName,
              number: card.number.replace(/\s/g, ''),
              expiryMonth: expiryMonth ?? '',
              expiryYear: expiryYear ? `20${expiryYear}` : '',
              ccv: card.ccv,
            } : undefined,
            valor: total,
          });
          setCheckoutResult(result.data as CheckoutResult);
          setStep('checkout');
          return;
        }

        setStep('success');
        onSuccess?.(doacaoId);
      } else {
        const id = uuidv4();
        const ticket = selectedTickets[0];
        const valorFinal = ticket ? getTicketTotal(ticket) : total;
        const useGateway = gatewayConnected && selectedMethod && valorFinal > 0;
        await createDocument(`eventos/${eventoId}/inscricoes`, id, {
          id, eventoId,
          pessoaId,
          ticketId: ticket?.id || '',
          ticket_nome: ticket?.nome || '',
          nome,
          email,
          telefone,
          ...(cpfDigits ? { cpf: cpfDigits } : {}),
          respostas_formulario: respostas,
          quantidades: quantities,
          valor_total: valorFinal,
          valor_pago: 0,
          status: valorFinal === 0 ? 'pago' : useGateway ? 'pagamento_iniciado' : 'pendente',
          data_inscricao: new Date().toISOString(),
          precisa_ajuda: false,
          validada_manual: false,
          pagina_venda_id: pagina.id,
          pagina_venda_slug: pagina.slug,
        } as any);
        setInscricaoId(id);

        if (cupomAplicado) {
          await updateDocument(`eventos/${eventoId}/cupons`, cupomAplicado.id, { usos: cupomAplicado.usos + 1 });
        }

        if (email) {
          Email.confirmacaoInscricao(
            email,
            nome || email,
            evento?.nome || '',
            evento?.data_inicio || '',
            evento?.local || '',
            `${window.location.origin}/consultar`,
          ).catch(() => {});
        }

        if (useGateway) {
          const fns = getFunctions(app, 'us-central1');
          const createCharge = httpsCallable(fns, 'createEventCharge');
          const [expiryMonth, expiryYear] = card.expiry.split('/');
          const result = await createCharge({
            eventoId,
            inscricaoId: id,
            paymentMethod: selectedMethod,
            attendeeName: nome,
            attendeeEmail: email,
            attendeeCpf: cpf.replace(/\D/g, ''),
            attendeePhone: telefone,
            installments: installments > 1 ? installments : undefined,
            creditCard: (selectedMethod === 'credito' || selectedMethod === 'recorrente') ? {
              holderName: card.holderName,
              number: card.number.replace(/\s/g, ''),
              expiryMonth: expiryMonth ?? '',
              expiryYear: expiryYear ? `20${expiryYear}` : '',
              ccv: card.ccv,
            } : undefined,
            valor: valorFinal,
          });
          setCheckoutResult(result.data as CheckoutResult);
          setStep('checkout');
          return;
        }

        setStep('success');
        onSuccess?.(id);
      }
    } catch (err: any) {
      console.error('[SalesPage] handleSubmit error:', err?.code, err?.message, err);
      toast.error('Erro ao enviar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    quantities, setQuantities,
    doacaoValores, setDoacaoValores,
    step, setStep,
    submitting,
    inscricaoId,
    formValues, setFormValues,
    organizador,
    isDoacaoSubmission,
    gatewayConnected,
    selectedMethod, setSelectedMethod,
    checkoutResult,
    cpf, setCpf,
    card, setCard,
    installments, setInstallments,
    codigoCupom, setCodigoCupom,
    cupomAplicado, cupomLoading,
    desconto, subtotal,
    handleValidarCupom, handleRemoverCupom,
    doacaoDestino, setDoacaoDestino,
    doacaoNomeInscrito, setDoacaoNomeInscrito,
    selectedTickets, allDoacao,
    getTicketTotal,
    total, totalQty,
    updateQty,
    handleSubmit,
  };
}
