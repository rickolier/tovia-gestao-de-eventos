import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDocument, listDocuments, createDocument, updateDocument } from '~/services/firestore';
import { Cupom } from '~/types';
import { Tag, X, Loader2 } from 'lucide-react';
import { Evento, Ticket } from '~/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  MapPin,
  User,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  AlertCircle,
  Plus,
  Minus,
  Clock,
  Info,
  ChevronRight,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import Logo from '~/components/Logo';
import { motion, AnimatePresence } from 'motion/react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '~/services/firebase';

interface RegistrationFlowProps {
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

function RegistrationFlow({ eventoId, initialEvento, isSimulation = false }: RegistrationFlowProps) {
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

          // Verifica se o organizador tem gateway conectado (coleção pública, sem expor dados sensíveis)
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
  const totalTax = totalAmount * 0.1; // Simulating 10% tax like in the image

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
        // Calculate months between now and limit date
        // 02/01 to 02/06 => 6 installments
        const months = (limitDate.getFullYear() - now.getFullYear()) * 12 + (limitDate.getMonth() - now.getMonth()) + 1;
        if (months > 0 && months < minInstallments) {
          minInstallments = months;
        } else if (months <= 0) {
          minInstallments = 1; // At least cash
        }
      }
    });

    return Math.max(1, Math.min(12, minInstallments));
  };

  const maxInstallments = calculateMaxInstallments();

  // Allowed payment methods based on selected tickets
  const getAllowedMethods = () => {
    if (selectedTickets.length === 0) return [];
    // Intersection of allowed methods (only methods allowed by ALL selected tickets)
    // Actually, usually it's better to show only what's common or union? 
    // The request implies the ticket defines what can be used. If I buy two tickets, one allows PIX and other doesn't, PIX shouldn't be available for the whole order.
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

      // Incrementa usos do cupom
      if (cupomAplicado) {
        await updateDocument(`eventos/${evento.id}/cupons`, cupomAplicado.id, {
          usos: cupomAplicado.usos + 1,
        });
      }

      setNumeroPedido(registrationId.slice(0, 8).toUpperCase());

      // BYOG: cria cobrança real no gateway do organizador
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

      // Modo manual (sem gateway)
      setStep('success');
      toast.success('Inscrição realizada! O organizador vai confirmar o pagamento.');
    } catch (error: any) {
      console.error('Error creating registration:', error);
      toast.error(error?.message || 'Erro ao processar inscrição');
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 'landing') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!evento && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Evento não encontrado</h3>
          <p className="text-sm text-muted-foreground">Não foi possível carregar as informações deste evento.</p>
        </div>
      </div>
    );
  }

  if (evento && evento.ativo === false && !isSimulation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center space-y-4 p-4">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-10 h-10 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-foreground mb-2">Evento Indisponível</h3>
          <p className="text-base text-muted-foreground max-w-md mx-auto">As inscrições para este evento estão encerradas no momento, ou o evento foi desativado pelo organizador.</p>
        </div>
      </div>
    );
  }

  if (!evento) return null;

  return (
    <div className={isSimulation ? "" : "min-h-screen bg-[#f8f9fa]"}>
      {/* Header */}
      <header className="bg-[#2d3238] text-white py-3 px-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground/70 hidden sm:inline">Fale com o produtor: {evento.instituicao}</span>
          </div>
          <div className="flex items-center gap-2">
            <Logo showTagline={false} className="scale-50 brightness-0 invert" />
          </div>
          <div className="flex items-center gap-4">
            {step === 'info' && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span className="font-bold">14:21</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={isSimulation ? "w-full" : "max-w-6xl mx-auto py-8 px-4"}>
        <AnimatePresence mode="wait">
          {step === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Hero Section */}
              <div className="bg-[#2d3238] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
                <div className="flex-1 p-8 md:p-12 space-y-6">
                  <h1 className="text-3xl md:text-4xl font-black text-white uppercase leading-tight">
                    {evento.nome}
                  </h1>
                  <div className="space-y-3 text-muted-foreground/50">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span>{new Date(evento.data_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(evento.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span>{evento.local}</span>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-[#1a4d2e]/30 text-primary px-3 py-1.5 rounded-full text-xs font-bold border border-primary/20">
                    <CreditCard className="w-3.5 h-3.5" />
                    Parcele em até 12x
                  </div>
                </div>
                <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                  <img 
                    src={evento.imagem_url || `https://picsum.photos/seed/${evento.id}/800/600`} 
                    alt={evento.nome}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#2d3238] to-transparent md:block hidden" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Content */}
                <div className="lg:col-span-2 space-y-12">
                  <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground border-b pb-2">Descrição do evento</h2>
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      <p className="font-bold text-primary">O {evento.nome} acontecerá dia {new Date(evento.data_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}.</p>
                      <p>Este encontro é para você que está iniciando sua caminhada com Jesus, buscando um encontro com Deus. Se você quer se batizar esse curso também é para você. Passaremos o dia juntos, com ministrações, testemunhos, tempos de conversa e momentos de oração.</p>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground border-b pb-2">Política do evento</h2>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <div>
                        <p className="font-bold text-foreground">Cancelamento de pedidos pagos</p>
                        <p>Cancelamentos de pedidos serão aceitos até 7 dias após a compra, desde que a solicitação seja enviada até 48 horas antes do início do evento.</p>
                        <button className="text-primary font-bold hover:underline mt-1">Saiba mais sobre o cancelamento</button>
                      </div>
                      <div>
                        <p className="font-bold text-foreground">Edição de participantes</p>
                        <p>Você poderá editar o participante de um ingresso apenas uma vez. Essa opção ficará disponível até 24 horas antes do início do evento.</p>
                        <button className="text-primary font-bold hover:underline mt-1">Saiba como editar participantes</button>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground border-b pb-2">Local</h2>
                    <div className="space-y-2">
                      <p className="font-bold text-foreground">{evento.local}</p>
                      <p className="text-sm text-muted-foreground">Avenida Principal, 500 • Atibaia, SP</p>
                      <Button variant="outline" size="sm" className="rounded-xl border-primary text-primary hover:bg-primary/5">
                        <MapPin className="w-4 h-4 mr-2" />
                        VER NO MAPA
                      </Button>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground border-b pb-2">Sobre o produtor</h2>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center overflow-hidden border">
                        <Logo showTagline={false} className="scale-50" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold text-foreground">{evento.instituicao}</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-xl">Seguir</Button>
                          <Button variant="outline" size="sm" className="rounded-xl border-primary text-primary">Fale com o produtor</Button>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right Sidebar - Ticket Selection */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-24 border-none shadow-xl rounded-3xl overflow-hidden">
                    <div className="p-6 bg-background border-b border-border">
                      <h3 className="font-bold text-foreground">Escolha uma opção</h3>
                    </div>
                    <CardContent className="p-6 space-y-6">
                      <div className="space-y-4">
                        {tickets.map(ticket => (
                          <div key={ticket.id} className="p-4 rounded-2xl border border-border space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <p className="font-bold text-foreground leading-tight">{ticket.nome}</p>
                                <p className="text-sm font-bold text-foreground">R$ {ticket.valor.toFixed(2)} <span className="text-xs font-normal text-muted-foreground/70">(+R$ {(ticket.valor * 0.1).toFixed(2)} taxa)</span></p>
                                {ticket.permite_parcelamento && (
                                  <div className="inline-block bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                    em até {evento.config_pagamento?.installmentLogic === 'free' ? '12x' : `${maxInstallments}x`}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => updateQuantity(ticket.id, -1)}
                                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-background disabled:opacity-30"
                                  disabled={!ticketQuantities[ticket.id]}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-bold w-4 text-center">{ticketQuantities[ticket.id] || 0}</span>
                                <button 
                                  onClick={() => updateQuantity(ticket.id, 1)}
                                  className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground/70 italic">Inscrições até {new Date(evento.data_inicio).toLocaleDateString('pt-BR')}</p>
                          </div>
                        ))}
                      </div>

                      <Button 
                        onClick={handleLandingSubmit}
                        className="w-full bg-[#34b37e] hover:bg-[#2d9a6c] text-white h-12 rounded-xl font-bold text-base shadow-lg shadow-green-200"
                        disabled={selectedTickets.length === 0}
                      >
                        Selecione uma Inscrição
                      </Button>
                      
                      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground/70">
                        <Info className="w-3 h-3" />
                        <button className="hover:underline">Entenda nossa taxa</button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Form Content */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="bg-white border-b border-border flex flex-row items-center gap-4 py-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">1</div>
                    <CardTitle className="text-xl">Informações dos participantes</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
                      <p className="text-sm text-blue-800">Compra mais rápida e mais segura</p>
                      <Button variant="ghost" size="sm" className="text-blue-600 font-bold hover:bg-blue-100">Acessar de outro jeito</Button>
                    </div>

                    <form onSubmit={handleInfoSubmit} className="space-y-8">
                      {selectedTickets.map((ticket, idx) => (
                        <div key={ticket.id} className="space-y-6">
                          <h3 className="text-sm font-bold text-muted-foreground/70 uppercase tracking-wider">Inscrição nº{idx + 1}: {ticket.nome}</h3>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="font-bold">Nome *</Label>
                              <Input 
                                required 
                                className="rounded-lg h-12 border-gray-300 focus:border-primary"
                                value={formData.nome}
                                onChange={e => setFormData({...formData, nome: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="font-bold">Sobrenome *</Label>
                              <Input 
                                required 
                                className="rounded-lg h-12 border-gray-300 focus:border-primary"
                                value={formData.sobrenome}
                                onChange={e => setFormData({...formData, sobrenome: e.target.value})}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="font-bold">E-mail *</Label>
                            <Input 
                              type="email"
                              required 
                              className="rounded-lg h-12 border-gray-300 focus:border-primary"
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                          </div>

                          <div className="space-y-4">
                            <Label className="font-bold">Gênero *</Label>
                            <div className="flex gap-6">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="gender" className="w-4 h-4 accent-primary" required />
                                <span className="text-sm">Homem</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="gender" className="w-4 h-4 accent-primary" required />
                                <span className="text-sm">Mulher</span>
                              </label>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label className="font-bold">Estado Civil *</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              {['Solteiro (a)', 'Casado (a)', 'Divorciado (a)', 'Viúvo (a)'].map(status => (
                                <label key={status} className="flex items-center gap-2 cursor-pointer">
                                  <input type="radio" name="marital" className="w-4 h-4 accent-primary" required />
                                  <span className="text-sm">{status}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="font-bold">Data de Nascimento *</Label>
                            <Input
                              type="date"
                              required
                              className="rounded-lg h-12 border-gray-300 focus:border-primary max-w-xs"
                              value={formData.dataNascimento}
                              onChange={e => setFormData({...formData, dataNascimento: e.target.value})}
                            />
                          </div>

                          {participanteEhMenor && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-5">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-bold text-amber-800">Participante menor de 18 anos</p>
                                  <p className="text-xs text-amber-700 mt-0.5">Por exigência da LGPD (Lei 13.709/18, Art. 14), é obrigatório informar um responsável legal para participantes menores de idade.</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                  <Label className="font-bold text-amber-900">Nome do Responsável *</Label>
                                  <Input
                                    required
                                    placeholder="Nome completo do responsável"
                                    className="rounded-lg h-12 border-amber-300 focus:border-amber-500 bg-white"
                                    value={formData.nomeResponsavel}
                                    onChange={e => setFormData({...formData, nomeResponsavel: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="font-bold text-amber-900">Telefone do Responsável *</Label>
                                  <Input
                                    required
                                    type="tel"
                                    placeholder="(00) 00000-0000"
                                    className="rounded-lg h-12 border-amber-300 focus:border-amber-500 bg-white"
                                    value={formData.telefoneResponsavel}
                                    onChange={e => setFormData({...formData, telefoneResponsavel: e.target.value})}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="pt-6 border-t space-y-4">
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={lgpdConsent}
                            onChange={e => setLgpdConsent(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-primary shrink-0"
                          />
                          <span className="text-xs text-muted-foreground leading-relaxed">
                            Li e aceito a{' '}
                            <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 font-semibold hover:text-primary/80">
                              Política de Privacidade
                            </a>{' '}
                            e autorizo o uso dos meus dados para participação neste evento, conforme a LGPD (Lei 13.709/18).
                          </span>
                        </label>
                        <div className="flex justify-between items-center">
                          <Button variant="ghost" onClick={() => setStep('landing')} className="text-muted-foreground">Voltar</Button>
                          <Button type="submit" disabled={!lgpdConsent} className="bg-primary hover:bg-primary/90 text-white px-8 h-12 rounded-xl font-bold disabled:opacity-40">
                            Continuar
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="space-y-6 sticky top-24">
                  <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-20 h-12 bg-muted rounded-lg overflow-hidden shrink-0">
                        <img src={evento.imagem_url || `https://picsum.photos/seed/${evento.id}/200/120`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground truncate uppercase">{evento.nome}</p>
                        <p className="text-[10px] text-muted-foreground">Sábado, {new Date(evento.data_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {new Date(evento.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="p-6 border-b border-border">
                      <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-muted-foreground/70 uppercase">Ingressos</p>
                        {selectedTickets.map(ticket => (
                          <div key={ticket.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground"><span className="font-bold">{ticketQuantities[ticket.id]}</span> {ticket.nome}</span>
                            <span className="font-bold text-foreground">R$ {(ticket.valor * ticketQuantities[ticket.id]).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="pt-4 border-t border-border space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">Taxas <Info className="w-3 h-3" /></span>
                          <span className="font-bold text-foreground">R$ {totalTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-black pt-2">
                          <span>Total</span>
                          <div className="text-right">
                            <span className="text-primary block">R$ {(totalAmount + totalTax).toFixed(2)}</span>
                            <span className="text-[10px] text-muted-foreground/70 font-normal">({selectedTickets.reduce((s, t) => s + ticketQuantities[t.id], 0)} item)</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto"
            >
              <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                <div className="h-2 bg-primary" />
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle>{gatewayConnected ? 'Pagamento' : 'Confirmar Inscrição'}</CardTitle>
                  <CardDescription>
                    {gatewayConnected ? 'Escolha como deseja pagar' : 'O organizador entrará em contato para confirmar o pagamento'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-background p-6 rounded-2xl space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Total a Pagar</p>
                    {cupomAplicado && (
                      <p className="text-sm text-muted-foreground line-through">R$ {totalAmount.toFixed(2)}</p>
                    )}
                    <span className="text-4xl font-black text-primary tracking-tighter">
                      R$ {totalComDesconto.toFixed(2)}
                    </span>
                    {cupomAplicado && (
                      <p className="text-xs font-black text-emerald-600">
                        − R$ {desconto.toFixed(2)} de desconto aplicado
                      </p>
                    )}
                  </div>

                  {/* Cupom */}
                  {!cupomAplicado ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-1.5">
                        <Tag className="w-3 h-3" /> Cupom de desconto
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Código do cupom"
                          value={codigoCupom}
                          onChange={e => setCodigoCupom(e.target.value.toUpperCase())}
                          onKeyDown={e => e.key === 'Enter' && handleValidarCupom()}
                          className="rounded-xl h-11 font-bold tracking-wider uppercase"
                          maxLength={20}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleValidarCupom}
                          disabled={cupomLoading || !codigoCupom.trim()}
                          className="rounded-xl h-11 px-4 font-black shrink-0"
                        >
                          {cupomLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                      <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-black text-emerald-700">{cupomAplicado.codigo}</p>
                        <p className="text-xs text-emerald-600">
                          {cupomAplicado.tipo === 'porcentagem' ? `${cupomAplicado.valor}% de desconto` : `R$ ${cupomAplicado.valor.toFixed(2)} de desconto`}
                        </p>
                      </div>
                      <button onClick={handleRemoverCupom} className="text-emerald-400 hover:text-red-500 transition-colors p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {gatewayConnected ? (
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Forma de Pagamento</Label>
                      {allowedMethods.length === 0 && (
                        <p className="text-xs text-red-500 font-bold px-1">Nenhuma forma disponível para estes ingressos.</p>
                      )}
                      {allowedMethods.map(method => {
                        const methodLabels: Record<string, string> = {
                          pix: 'PIX',
                          boleto: 'Boleto Bancário',
                          credito: 'Cartão de Crédito',
                          debito: 'Cartão de Débito',
                          dinheiro: 'Dinheiro',
                        };
                        const isSelected = selectedMethod === method;
                        return (
                          <button
                            key={method}
                            onClick={() => setSelectedMethod(method)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-transparent bg-muted/30 hover:border-primary/20'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                {method === 'pix' && <span className="font-black text-xs text-primary">PIX</span>}
                                {method === 'boleto' && <span className="font-black text-xs text-amber-600">BOL</span>}
                                {(method === 'credito' || method === 'debito') && <CreditCard className="w-5 h-5 text-blue-600" />}
                                {method === 'dinheiro' && <span className="font-black text-xs text-emerald-600">$</span>}
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-sm">{methodLabels[method] ?? method}</p>
                                {method === 'pix' && <p className="text-[10px] text-muted-foreground">Aprovação imediata</p>}
                                {method === 'boleto' && <p className="text-[10px] text-muted-foreground">Vence em 3 dias úteis</p>}
                                {method === 'credito' && <p className="text-[10px] text-muted-foreground">Em até {maxInstallments}x</p>}
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary' : 'border-muted-foreground/30'}`}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 border border-blue-100 bg-blue-50 rounded-2xl text-sm text-blue-800">
                      <Info className="w-4 h-4 mb-1" />
                      <p className="font-bold">Pagamento manual</p>
                      <p className="text-xs mt-1 text-blue-700">O organizador vai receber sua inscrição e entrar em contato com as instruções de pagamento.</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep('info')}
                      className="flex-1 rounded-xl h-12"
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={handlePaymentSubmit}
                      disabled={loading || (gatewayConnected && !selectedMethod)}
                      className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold disabled:opacity-40"
                    >
                      {loading ? 'Processando...' : gatewayConnected ? 'Gerar cobrança' : 'Confirmar inscrição'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'checkout' && checkoutResult && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto"
            >
              <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                <div className="h-2 bg-primary" />
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {selectedMethod === 'pix' ? (
                      <span className="font-black text-primary text-lg">PIX</span>
                    ) : (
                      <CreditCard className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <CardTitle>
                    {selectedMethod === 'pix' ? 'Pague via PIX' : selectedMethod === 'boleto' ? 'Boleto gerado' : 'Pagamento online'}
                  </CardTitle>
                  <CardDescription>Pedido #{numeroPedido}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* PIX: show QR code or copy key */}
                  {selectedMethod === 'pix' && checkoutResult.pixQrCode ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <img
                          src={`data:image/png;base64,${checkoutResult.pixQrCode.encodedImage}`}
                          alt="QR Code PIX"
                          className="w-48 h-48 rounded-2xl border border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Chave PIX (copia e cola)</Label>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={checkoutResult.pixQrCode.payload}
                            className="font-mono text-xs rounded-xl border-none bg-muted/40 h-10"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            className="rounded-xl h-10 w-10 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(checkoutResult.pixQrCode!.payload);
                              toast.success('Chave PIX copiada!');
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Após pagar, sua inscrição será confirmada automaticamente.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground text-center">
                        {selectedMethod === 'boleto'
                          ? 'Seu boleto foi gerado. Clique abaixo para visualizar e pagar.'
                          : 'Clique abaixo para completar o pagamento com segurança.'}
                      </p>
                      <a
                        href={checkoutResult.bankSlipUrl ?? checkoutResult.paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Button className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                          {selectedMethod === 'boleto' ? 'Ver e pagar boleto' : 'Ir para pagamento'}
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </a>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => setStep('success')}
                  >
                    Já realizei o pagamento
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center"
            >
              <Card className="border-none shadow-2xl rounded-[2.5rem] p-10">
                <CardContent className="pt-6 space-y-8">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-14 h-14 text-green-600" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-foreground">Inscrição Confirmada!</h2>
                    <p className="text-muted-foreground">
                      Parabéns, <strong>{formData.nome}</strong>! Sua vaga no evento <strong>{evento.nome}</strong> está garantida.
                    </p>
                  </div>
                  <div className="bg-background p-6 rounded-3xl text-left text-sm space-y-3 border border-border">
                    <p className="flex justify-between"><strong>E-mail:</strong> <span className="text-muted-foreground">{formData.email}</span></p>
                    <p className="flex justify-between"><strong>Pedido:</strong> <span className="text-muted-foreground">#{numeroPedido}</span></p>
                    <p className="text-[10px] text-muted-foreground/70 mt-4 text-center">Um comprovante foi enviado para o seu e-mail (simulado).</p>
                  </div>
                  <Button 
                    onClick={() => {
                      setStep('landing');
                      setFormData({ nome: '', sobrenome: '', email: '', telefone: '', genero: '', estadoCivil: '', dataNascimento: '', nomeResponsavel: '', telefoneResponsavel: '' });
                      setSelectedMethod('');
                      setCheckoutResult(null);
                      setTicketQuantities({});
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 font-bold text-lg shadow-lg shadow-primary/20"
                  >
                    Fazer outra inscrição
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-4">
          <Logo showTagline={false} className="scale-50 opacity-30 grayscale mx-auto" />
          <div className="flex justify-center gap-6 text-xs text-muted-foreground/70">
            <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="hover:underline">Política de Privacidade e Termos</a>
            <button className="hover:underline">Denunciar este evento</button>
          </div>
          <p className="text-[10px] text-muted-foreground/50">© 2026 Plataforma de Eventos. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default function PublicRegistration() {
  const { id } = useParams<{ id: string }>();
  return <RegistrationFlow eventoId={id} />;
}

export function PublicRegistrationByCodigo() {
  const { eventoCodigo } = useParams<{ orgCodigo: string; eventoCodigo: string }>();
  const [eventoId, setEventoId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!eventoCodigo) { setNotFound(true); return; }
    import('~/services/firestore').then(({ listDocuments }) =>
      import('firebase/firestore').then(({ where }) =>
        listDocuments<{ id: string }>('eventos', [where('codigo', '==', eventoCodigo)])
      )
    ).then(results => {
      if (results.length === 0) setNotFound(true);
      else setEventoId(results[0].id);
    }).catch(() => setNotFound(true));
  }, [eventoCodigo]);

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-2">
        <p className="text-2xl font-black text-foreground">Evento não encontrado</p>
        <p className="text-sm text-muted-foreground">Verifique o link e tente novamente.</p>
      </div>
    </div>
  );
  if (!eventoId) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return <RegistrationFlow eventoId={eventoId} />;
}
