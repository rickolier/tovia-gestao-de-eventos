import React, { useEffect, useState } from 'react';
import { listDocuments, createDocument, updateDocument, removeDocument } from '../../lib/firebase-utils';
import { Ticket } from '../../types';
import { where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Ticket as TicketIcon, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../lib/AuthContext';
import { getPlanConfig } from '../../lib/plan-limits';

export default function TicketsTab({ eventoId }: { eventoId: string }) {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const plan = getPlanConfig(profile?.plano);
  const reachedTicketLimit = tickets.length >= plan.maxTicketsPerEvent;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'pago' as 'pago' | 'gratuito' | 'doacao',
    valor: 0,
    limite_vagas: 0,
    data_limite: '',
    permite_parcelamento: false,
    metodos_pagamento: ['pix', 'boleto', 'credito']
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
    try {
      const ticketData = {
        ...formData,
        eventoId,
        valor: (formData.tipo === 'gratuito' || formData.tipo === 'doacao') ? 0 : Number(formData.valor),
        limite_vagas: Number(formData.limite_vagas)
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
        metodos_pagamento: ['pix', 'boleto', 'credito']
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
      metodos_pagamento: ticket.metodos_pagamento || ['pix', 'boleto', 'credito']
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Categorias de Ingressos</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">Plano {plan.name}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">{tickets.length}/{plan.maxTicketsPerEvent} ingressos</span>
          </div>
        </div>
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
              tipo: 'pago',
              valor: 0,
              limite_vagas: 0,
              data_limite: '',
              permite_parcelamento: false,
              metodos_pagamento: ['pix', 'boleto', 'credito']
            });
            setIsDialogOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 text-white gap-3 rounded-2xl h-14 px-8 font-black shadow-xl shadow-primary/20 transition-all active:scale-95 w-full md:w-auto"
        >
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5" />
          </div>
          Criar Novo Ingresso
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTicketId(null);
        }}>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-8 bg-card transition-colors">
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
                <Label htmlFor="nome" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Nome do Ingresso</Label>
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
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={v => setFormData({...formData, tipo: v as 'pago' | 'gratuito' | 'doacao'})}
                  >
                    <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm focus:ring-primary">
                      <SelectValue>
                        {formData.tipo === 'pago' ? 'Pago' : formData.tipo === 'gratuito' ? 'Gratuito' : 'Doação'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="pago" className="font-medium">Pago</SelectItem>
                      <SelectItem value="gratuito" className="font-medium">Gratuito</SelectItem>
                      <SelectItem value="doacao" className="font-medium">Doação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Valor (R$)</Label>
                  <Input 
                    id="valor" 
                    type="number" 
                    disabled={formData.tipo === 'gratuito' || formData.tipo === 'doacao'}
                    value={formData.valor || ''}
                    onChange={e => setFormData({...formData, valor: Number(e.target.value)})}
                    className="rounded-xl border-none bg-muted/50 h-12 font-black tracking-tight focus-visible:ring-primary transition-colors disabled:opacity-30"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="limite" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Limite de Vagas</Label>
                  <Input 
                    id="limite" 
                    type="number" 
                    value={formData.limite_vagas || ''}
                    onChange={e => setFormData({...formData, limite_vagas: Number(e.target.value)})}
                    className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors"
                    placeholder="0 = Ilimitado"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_limite" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Data Limite</Label>
                  <Input 
                    id="data_limite" 
                    type="datetime-local" 
                    value={formData.data_limite}
                    onChange={e => setFormData({...formData, data_limite: e.target.value})}
                    className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors font-sans" 
                  />
                </div>
              </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Formas de Pagamento Aceitas</Label>
                  <div className="grid grid-cols-2 gap-2 p-4 bg-muted/30 rounded-xl">
                    {[
                      { id: 'pix', label: 'PIX' },
                      { id: 'boleto', label: 'Boleto' },
                      { id: 'credito', label: 'Crédito' },
                      { id: 'credito_recorrente', label: 'Crédito Recorrente' },
                      { id: 'debito', label: 'Débito' },
                      { id: 'dinheiro', label: 'Dinheiro' },
                    ].map(method => (
                      <label key={method.id} className="flex items-center gap-2 cursor-pointer group">
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
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98] mt-4">
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
              <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl h-12 font-black flex-1 text-muted-foreground hover:bg-muted">
                Manter Ingresso
              </Button>
              <Button variant="destructive" onClick={handleDelete} className="rounded-xl h-12 font-black flex-1 shadow-lg shadow-destructive/20 transform transition-all active:scale-95">
                Excluir Agora
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {reachedTicketLimit && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-[2rem] p-6 flex gap-4 items-center animate-in zoom-in-95 duration-500">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <AlertCircle className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-1">Capacidade Esgotada</h4>
            <p className="text-xs font-medium opacity-80 leading-relaxed max-w-lg">
              Seu plano atual ({plan.name}) está com o limite de {plan.maxTicketsPerEvent} categorias de ingressos preenchido. 
              Para expandir suas opções de venda, considere um upgrade de plano.
            </p>
          </div>
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
              <CardHeader className="pb-4 pt-10 px-8 relative z-10">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-2xl font-black text-foreground tracking-tight">{ticket.nome}</CardTitle>
                  <Badge variant="secondary" className={`font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg ${
                    ticket.tipo === 'gratuito' ? 'bg-blue-500/10 text-blue-500' : ticket.tipo === 'doacao' ? 'bg-pink-500/10 text-pink-500' : 'bg-primary/10 text-primary'
                  }`}>
                    {ticket.tipo === 'doacao' ? 'Doação' : ticket.tipo}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8 relative z-10">
                <div className="space-y-6">
                  <p className="text-4xl font-black text-foreground tracking-tighter">
                    {ticket.tipo === 'gratuito' ? 'Lote Livre' : ticket.tipo === 'doacao' ? 'Doação' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticket.valor)}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-3 rounded-2xl border border-border/50">
                      <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60 mb-1">Limite</p>
                      <p className="text-sm font-black text-foreground">{ticket.limite_vagas || 'Sem limite'}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-2xl border border-border/50">
                      <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60 mb-1">Expira em</p>
                      <p className="text-sm font-black text-foreground">{ticket.data_limite ? new Date(ticket.data_limite).toLocaleDateString('pt-BR') : 'Indeterminado'}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl font-black h-12 transition-all active:scale-95"
                      onClick={() => handleEdit(ticket)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Ajustar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 bg-muted/50 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-xl font-black h-12 transition-all active:scale-95"
                      onClick={() => confirmDelete(ticket.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
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
    </div>
  );
}
