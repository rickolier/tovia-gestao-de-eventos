import React, { useEffect, useState } from 'react';
import { listDocuments, createDocument, updateDocument, removeDocument } from '~/services/firestore';
import { Ticket } from '~/types';
import { where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Ticket as TicketIcon, Trash2, Edit2, AlertCircle, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import CuponsTab from './CuponsTab';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '~/context/AuthContext';
import { getPlanConfig } from '~/utils/plan-limits';

export default function TicketsTab({ eventoId }: { eventoId: string }) {
  const { profile } = useAuth();
  const [subTab, setSubTab] = useState<'ingressos' | 'cupons'>('ingressos');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const plan = getPlanConfig(profile?.plano);
  const onlyFreeTickets = !plan.modules.manualPayments;
  const gatewayConnected = profile?.gateway_connected === true;
  const reachedTicketLimit = tickets.length >= plan.maxTicketsPerEvent;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);

  const defaultMetodos = plan.modules.autoPayments ? ['pix', 'boleto', 'credito'] : [];

  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'pago' as 'pago' | 'gratuito' | 'doacao',
    valor: 0,
    limite_vagas: 0,
    data_limite: '',
    permite_parcelamento: false,
    metodos_pagamento: defaultMetodos,
    max_parcelas_credito: 1,
    max_parcelas_recorrente: 2,
    installment_logic: 'free' as 'free' | 'limited',
    exibir_preco: true,
    valor_livre: false,
    permite_patrocinio: false,
    valor_patrocinio: 0,
  });

  const fetchTickets = async () => {
    const data = await listDocuments<Ticket>(`eventos/${eventoId}/tickets`);
    setTickets(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, [eventoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicketId && reachedTicketLimit) {
      toast.error(`Seu plano (${plan.name}) permite no máximo ${plan.maxTicketsPerEvent} ingressos por evento.`);
      return;
    }
    if (formData.tipo === 'pago') {
      if (!formData.valor || formData.valor <= 0) {
        toast.error('O valor do ingresso pago deve ser maior que zero.');
        return;
      }
      if (formData.valor > 99999.99) {
        toast.error('O valor do ingresso não pode exceder R$ 99.999,99.');
        return;
      }
      if ((formData.metodos_pagamento || []).length === 0) {
        toast.error('Selecione ao menos uma forma de pagamento.');
        return;
      }
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
        limite_vagas: formData.tipo === 'doacao' ? 0 : Number(formData.limite_vagas)
      };

      if (editingTicketId) {
        await updateDocument(`eventos/${eventoId}/tickets`, editingTicketId, ticketData);
        toast.success('Ingresso atualizado com sucesso!');
      } else {
        const id = uuidv4();
        await createDocument(`eventos/${eventoId}/tickets`, id, {
          ...ticketData,
          id
        });
        toast.success('Ingresso criado com sucesso!');
      }
      
      setIsDialogOpen(false);
      setEditingTicketId(null);
      setFormData({
        nome: '',
        tipo: 'pago',
        valor: 0,
        limite_vagas: 0,
        data_limite: '',
        permite_parcelamento: false,
        metodos_pagamento: defaultMetodos,
        max_parcelas_credito: 1,
        max_parcelas_recorrente: 2,
        installment_logic: 'free' as 'free' | 'limited',
        exibir_preco: true,
        valor_livre: false,
        permite_patrocinio: false,
        valor_patrocinio: 0,
      });
      fetchTickets();
    } catch (error) {
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
      max_parcelas_recorrente: ticket.max_parcelas_recorrente ?? 2,
      installment_logic: (ticket as any).installment_logic ?? 'free',
      exibir_preco: ticket.exibir_preco !== false,
      valor_livre: ticket.valor_livre || false,
      permite_patrocinio: ticket.permite_patrocinio || false,
      valor_patrocinio: ticket.valor_patrocinio || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!ticketToDelete) return;
    try {
      await removeDocument(`eventos/${eventoId}/tickets`, ticketToDelete);
      toast.success('Ingresso excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setTicketToDelete(null);
      fetchTickets();
    } catch (error) {
      toast.error('Erro ao excluir ingresso.');
    }
  };

  const confirmDelete = (id: string) => {
    setTicketToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-8 text-foreground">
      <div className="tab-page-header">
        <div><h2>Ingressos</h2><p>Configure os tipos de ingresso e cupons de desconto.</p></div>
      </div>
      {/* Sub-tab nav + actions row */}
      <div className="border-b border-border flex items-center justify-between -mt-4">
        <div className="flex gap-1">
          {([
            { id: 'ingressos', label: 'Ingressos', icon: TicketIcon },
            { id: 'cupons',    label: 'Cupons',    icon: Tag },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors',
                subTab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>
        {subTab === 'ingressos' && (
          <div className="flex items-center gap-3 pb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">Plano {plan.name}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">{tickets.length}/{plan.maxTicketsPerEvent} ingressos</span>
            <Button
              disabled={reachedTicketLimit}
              onClick={() => {
                if (reachedTicketLimit) {
                  toast.error("Limite de ingressos atingido para seu plano.");
                  return;
                }
                setEditingTicketId(null);
                setFormData({
                  nome: '',
                  tipo: onlyFreeTickets ? 'gratuito' : 'pago',
                  valor: 0,
                  limite_vagas: 0,
                  data_limite: '',
                  permite_parcelamento: false,
                  metodos_pagamento: ['pix', 'boleto', 'credito'],
                  max_parcelas_credito: 1,
                  max_parcelas_recorrente: 2,
                  installment_logic: 'free' as 'free' | 'limited',
                  exibir_preco: true,
                });
                setIsDialogOpen(true);
              }}
              className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl h-10 px-5 font-black shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Criar Novo Ingresso
            </Button>
          </div>
        )}
      </div>

      {subTab === 'cupons' && <CuponsTab eventoId={eventoId} />}

      {subTab === 'ingressos' && <>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTicketId(null);
        }}>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-8 bg-card transition-colors max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <TicketIcon className="w-6 h-6 shrink-0" />
                </div>
                {editingTicketId ? 'Editar Ingresso' : 'Novo Ingresso'}
              </DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground">
                Configure os detalhes do ingresso para seus participantes.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-2">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Nome do Ingresso</Label>
                <Input 
                  id="nome" 
                  required 
                  value={formData.nome}
                  onChange={e => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: Lote Promocional, VIP, etc"
                  className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={v => !onlyFreeTickets && setFormData({...formData, tipo: v as 'pago' | 'gratuito' | 'doacao'})}
                    disabled={onlyFreeTickets}
                  >
                    <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm focus:ring-primary">
                      <SelectValue>
                        {formData.tipo === 'pago' ? 'Pago' : formData.tipo === 'gratuito' ? 'Gratuito' : 'Doação'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="gratuito" className="font-medium">Gratuito</SelectItem>
                      {!onlyFreeTickets && <SelectItem value="pago" className="font-medium">Pago</SelectItem>}
                      {!onlyFreeTickets && <SelectItem value="doacao" className="font-medium">Doação</SelectItem>}
                    </SelectContent>
                  </Select>
                  {onlyFreeTickets && (
                    <p className="text-xs text-muted-foreground mt-1">Ingressos pagos disponíveis no plano Pétach ou superior.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    min={0}
                    max={99999.99}
                    step={0.01}
                    disabled={formData.tipo === 'gratuito' || formData.tipo === 'doacao' || onlyFreeTickets}
                    value={formData.valor || ''}
                    onChange={e => setFormData({...formData, valor: Number(e.target.value)})}
                    className="rounded-xl border-none bg-muted/50 h-12 font-black tracking-tight focus-visible:ring-primary transition-colors disabled:opacity-30"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {formData.tipo !== 'doacao' && (
                  <div className="space-y-2">
                    <Label htmlFor="limite" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Limite de Vagas</Label>
                    <Input
                      id="limite"
                      type="number"
                      min={0}
                      max={100000}
                      value={formData.limite_vagas || ''}
                      onFocus={e => e.target.select()}
                      onChange={e => setFormData({...formData, limite_vagas: Number(e.target.value)})}
                      className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors"
                      placeholder="0 = Ilimitado"
                    />
                  </div>
                )}
                {formData.tipo === 'doacao' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Limite de Vagas</Label>
                    <div className="rounded-xl bg-muted/30 h-12 flex items-center px-3 text-sm text-muted-foreground border border-dashed border-border">
                      Ilimitado — doações não ocupam vagas
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="data_limite" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Data Limite</Label>
                  <Input
                    id="data_limite"
                    type="datetime-local"
                    value={formData.data_limite}
                    onChange={e => setFormData({...formData, data_limite: e.target.value})}
                    className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors font-sans"
                  />
                </div>
              </div>
                {/* Exibir valor — sempre visível */}
                <label className="flex items-center gap-3 cursor-pointer select-none bg-muted/30 rounded-xl px-4 py-3">
                  <input
                    type="checkbox"
                    checked={formData.exibir_preco}
                    onChange={e => setFormData({ ...formData, exibir_preco: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-xs font-bold text-foreground">Exibir valor no ingresso</p>
                    <p className="text-[11px] text-muted-foreground">Quando desmarcado, o valor/tipo não aparece para o participante.</p>
                  </div>
                </label>

                {/* Opções exclusivas de doação */}
                {formData.tipo === 'doacao' && (
                  <div className="space-y-3 border border-pink-100 bg-pink-50/50 rounded-xl p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-pink-600">Opções de Doação</p>

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.valor_livre}
                        onChange={e => setFormData({ ...formData, valor_livre: e.target.checked })}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="text-xs font-bold text-foreground">Permitir valor livre</p>
                        <p className="text-[11px] text-muted-foreground">O participante digita o valor que deseja doar.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.permite_patrocinio}
                        onChange={e => setFormData({ ...formData, permite_patrocinio: e.target.checked })}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="text-xs font-bold text-foreground">Patrocinar inscrições</p>
                        <p className="text-[11px] text-muted-foreground">O participante escolhe quantas inscrições quer pagar.</p>
                      </div>
                    </label>

                    {formData.permite_patrocinio && (
                      <div className="space-y-1.5 pt-1">
                        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Valor por inscrição patrocinada (R$)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={99999.99}
                          step={0.01}
                          value={formData.valor_patrocinio || ''}
                          onChange={e => setFormData({ ...formData, valor_patrocinio: Number(e.target.value) })}
                          className="rounded-xl border-none bg-white h-11 font-bold focus-visible:ring-primary"
                          placeholder="0.00"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Formas de pagamento — comportamento varia por plano */}
                {!onlyFreeTickets && formData.tipo === 'pago' && (
                  plan.modules.autoPayments && !gatewayConnected ? (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-800">Gateway não conectado</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          Conecte o Asaas no <strong>Dashboard → Gateway</strong> para definir as formas de pagamento.
                        </p>
                      </div>
                    </div>
                  ) : plan.modules.autoPayments ? (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Formas de Pagamento (Asaas)</Label>
                      <div className="p-4 bg-muted/30 rounded-xl space-y-3">
                        {[
                          { id: 'pix', label: 'PIX' },
                          { id: 'boleto', label: 'Boleto' },
                          { id: 'credito', label: 'Cartão (parcelado)' },
                          { id: 'recorrente', label: 'Recorrente' },
                        ].map(method => (
                          <div key={method.id} className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={(formData.metodos_pagamento || []).includes(method.id)}
                                onChange={(e) => {
                                  const current = formData.metodos_pagamento || [];
                                  if (e.target.checked) {
                                    setFormData({...formData, metodos_pagamento: [...current, method.id]});
                                  } else {
                                    setFormData({...formData, metodos_pagamento: current.filter(m => m !== method.id)});
                                  }
                                }}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                              />
                              <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">{method.label}</span>
                            </label>
                            {method.id === 'credito' && (formData.metodos_pagamento || []).includes('credito') && (
                              <div className="ml-6 flex items-center gap-2">
                                <span className="text-[11px] text-muted-foreground">Máx. parcelas:</span>
                                <select
                                  value={formData.max_parcelas_credito || 1}
                                  onChange={e => setFormData({...formData, max_parcelas_credito: Number(e.target.value)})}
                                  className="text-xs font-bold rounded-lg border border-border bg-background px-2 py-1 focus:ring-primary focus:outline-none"
                                >
                                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                                    <option key={n} value={n}>{n === 1 ? 'Somente à vista' : `até ${n}x`}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {method.id === 'recorrente' && (formData.metodos_pagamento || []).includes('recorrente') && (
                              <div className="ml-6 flex items-center gap-2">
                                <span className="text-[11px] text-muted-foreground">Parcelas disponíveis:</span>
                                <select
                                  value={formData.max_parcelas_recorrente || 2}
                                  onChange={e => setFormData({...formData, max_parcelas_recorrente: Number(e.target.value)})}
                                  className="text-xs font-bold rounded-lg border border-border bg-background px-2 py-1 focus:ring-primary focus:outline-none"
                                >
                                  {[2,3,4,5,6,7,8,9,10,11,12].map(n => (
                                    <option key={n} value={n}>até {n}x</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Lógica de parcelamento — exibir se credito ou recorrente estão ativos */}
                        {((formData.metodos_pagamento || []).includes('credito') || (formData.metodos_pagamento || []).includes('recorrente')) && (
                          <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                            <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Lógica de Parcelamento</p>
                            {[
                              { value: 'free', label: 'Parcelamento Livre', desc: 'Disponível em qualquer momento, até o limite definido acima.' },
                              { value: 'limited', label: 'Limitado pela data do evento', desc: 'Nº de parcelas calculado automaticamente pela data do evento.' },
                            ].map(opt => (
                              <label key={opt.value} className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="installment_logic"
                                  value={opt.value}
                                  checked={formData.installment_logic === opt.value}
                                  onChange={() => setFormData({ ...formData, installment_logic: opt.value as 'free' | 'limited' })}
                                  className="mt-0.5 w-3.5 h-3.5 text-primary focus:ring-primary"
                                />
                                <div>
                                  <p className="text-xs font-bold text-foreground">{opt.label}</p>
                                  <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground px-1">
                        A cobrança será gerada automaticamente no Asaas no momento da inscrição.
                        O campo <strong>CPF</strong> é solicitado obrigatoriamente no formulário.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-blue-800">Pagamento manual</p>
                        <p className="text-[11px] text-blue-700 mt-0.5">
                          O participante se inscreve e você confirma o pagamento manualmente no módulo financeiro do evento.
                        </p>
                      </div>
                    </div>
                  )
                )}

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98] mt-4">
                <TicketIcon className="w-5 h-5" />
                Salvar Categoria de Ingresso
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] border-none shadow-2xl p-8 bg-card transition-colors">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight">Excluir Ingresso?</DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground pt-2">
                Tem certeza que deseja remover esta categoria? Participantes já inscritos com este ingresso não serão afetados, mas novas inscrições não poderão ser feitas.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3 pt-6">
              <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl h-11 font-bold flex-1 text-muted-foreground hover:bg-muted">
                Manter Ingresso
              </Button>
              <Button variant="destructive" onClick={handleDelete} className="rounded-xl h-11 font-black flex-1 shadow-lg shadow-destructive/20 transform transition-all active:scale-95">
                Excluir Agora
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {reachedTicketLimit && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-[2rem] p-6 flex gap-4 items-center animate-in zoom-in-95 duration-500">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <AlertCircle className="h-6 w-6 text-amber-500" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-amber-600 mb-1">Limite de ingressos atingido</h4>
            <p className="text-xs text-amber-700/80 leading-relaxed">
              O plano <strong>{plan.name}</strong> permite até <strong>{plan.maxTicketsPerEvent}</strong> tipo{plan.maxTicketsPerEvent !== 1 ? 's' : ''} de ingresso por evento.
            </p>
          </div>
          <a
            href="/plans"
            className="shrink-0 text-xs font-black bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition-colors"
          >
            Fazer upgrade →
          </a>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-black text-[10px] uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando ingressos...</span>
        </div>
      ) : tickets.length === 0 ? (
        <Card className="border-2 border-dashed border-border/50 py-24 text-center bg-muted/5 rounded-[3rem] transition-all hover:bg-muted/10">
          <CardContent>
            <div className="w-20 h-20 bg-muted/30 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <TicketIcon className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Sem ingressos ativos</h3>
            <p className="text-muted-foreground font-medium max-w-xs mx-auto">
              Sua vitrine de ingressos está vazia. Comece criando o seu primeiro lote agora mesmo!
            </p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="mt-8 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-black px-8"
            >
              Criar Primeiro Ingresso
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map(ticket => (
            <Card key={ticket.id} className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-card border border-border/50 group hover:shadow-2xl transition-all relative">
              <div className={`h-2 w-full absolute top-0 left-0 ${ticket.tipo === 'gratuito' ? 'bg-blue-400' : ticket.tipo === 'doacao' ? 'bg-pink-400' : 'bg-primary'}`} />
              <CardHeader className="pb-2 pt-7 px-6 relative z-10">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-bold text-foreground">{ticket.nome}</CardTitle>
                  <Badge variant="secondary" className={`font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg ${
                    ticket.tipo === 'gratuito' ? 'bg-blue-500/10 text-blue-500' : ticket.tipo === 'doacao' ? 'bg-pink-500/10 text-pink-500' : 'bg-primary/10 text-primary'
                  }`}>
                    {ticket.tipo === 'doacao' ? 'Doação' : ticket.tipo}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-5 relative z-10">
                <div className="space-y-3">
                  <p className="text-3xl font-black text-foreground tracking-tighter">
                    {ticket.exibir_preco === false
                      ? <span className="text-lg text-muted-foreground font-medium">Valor oculto</span>
                      : ticket.tipo === 'gratuito' ? 'Grátis'
                      : ticket.tipo === 'doacao' ? 'Doação'
                      : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticket.valor)
                    }
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 p-2.5 rounded-xl border border-border/50">
                      <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60 mb-0.5">Limite</p>
                      <p className="text-sm font-black text-foreground">{ticket.limite_vagas || 'Sem limite'}</p>
                    </div>
                    <div className="bg-muted/30 p-2.5 rounded-xl border border-border/50">
                      <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60 mb-0.5">Expira em</p>
                      <p className="text-sm font-black text-foreground">{ticket.data_limite ? new Date(ticket.data_limite).toLocaleDateString('pt-BR') : 'Indeterminado'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl font-black h-9 transition-all active:scale-95"
                      onClick={() => handleEdit(ticket)}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                      Ajustar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 bg-muted/50 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-xl font-black h-9 transition-all active:scale-95"
                      onClick={() => confirmDelete(ticket.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Remover
                    </Button>
                  </div>
                </div>
              </CardContent>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors" />
            </Card>
          ))}
        </div>
      )}
      </>}
    </div>
  );
}
