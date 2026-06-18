import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { listDocuments, updateDocument, getDocument, createDocument } from '../../lib/firebase-utils';
import { AppNotification, Donation, Inscricao } from '../../types';
import { where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Bell, Clock, Heart, Users, Trophy, Gift, Star } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface NotificationsTabProps {
  eventoId: string;
}

export default function NotificationsTab({ eventoId }: NotificationsTabProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user || !eventoId) return;
    setLoading(true);
    try {
      const data = await listDocuments<AppNotification>('notificacoes', [
        where('userId', '==', user.uid),
        where('eventoId', '==', eventoId),
        where('lida', '==', false)
      ]);
      // Sort by date descending in memory
      data.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      setNotifications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user, eventoId]);

  const handleApproveDonation = async (notif: AppNotification) => {
    if (!notif.dados_acao?.donationId || !notif.dados_acao?.inscritoId || !notif.eventoId) return;
    
    try {
      const donationId = notif.dados_acao.donationId;
      const inscritoId = notif.dados_acao.inscritoId;
      const evId = notif.eventoId;

      // 1. Get the donation
      const donation = await getDocument<Donation>(`eventos/${evId}/doacoes`, donationId);
      if (!donation) {
        toast.error('Doação não encontrada.');
        return;
      }

      // 2. Get the registration
      const inscricao = await getDocument<Inscricao>(`eventos/${evId}/inscricoes`, inscritoId);
      if (!inscricao) {
        toast.error('Inscrição não encontrada.');
        return;
      }

      // 3. Check if subscriber is already fully paid
      if (inscricao.valor_pago >= inscricao.valor_total) {
        // Already paid, convert to free donation
        await updateDocument(`eventos/${evId}/doacoes`, donationId, {
          destino: 'livre',
          inscritoId: null
        });
        toast.info('Inscrito já estava com pagamento quitado. Doação convertida para livre.');
      } else {
        // Apply to subscriber
        const newValorPago = inscricao.valor_pago + donation.valorLiquido;
        const newStatus = newValorPago >= inscricao.valor_total ? 'confirmada' : inscricao.status;
        
        await updateDocument(`eventos/${evId}/inscricoes`, inscritoId, {
          valor_pago: newValorPago,
          status: newStatus
        });

        // Create a payment record for this donation
        const pagamentoId = uuidv4();
        await createDocument(`eventos/${evId}/pagamentos`, pagamentoId, {
          id: pagamentoId,
          inscricaoId: inscritoId,
          eventoId: evId,
          valor: donation.valorLiquido,
          status: 'pago',
          metodo: donation.formaPagamento as any,
          data_vencimento: new Date().toISOString().split('T')[0],
          data_pagamento: new Date().toISOString(),
          isDonation: true,
          doadorNome: donation.doadorNome
        });

        toast.success('Doação aprovada e aplicada ao inscrito!');
      }

      // 4. Mark notification as read and action completed
      await updateDocument('notificacoes', notif.id, {
        lida: true,
        acao_requirida: false
      });
      
      fetchNotifications();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao aprovar doação.');
    }
  };

  const handleRejectDonation = async (notif: AppNotification) => {
    if (!notif.dados_acao?.donationId || !notif.eventoId) return;

    try {
      const donationId = notif.dados_acao.donationId;
      const evId = notif.eventoId;

      // Convert to free donation
      await updateDocument(`eventos/${evId}/doacoes`, donationId, {
        destino: 'livre',
        inscritoId: null
      });

      // Mark notification as read and action completed
      await updateDocument('notificacoes', notif.id, {
        lida: true,
        acao_requirida: false
      });

      toast.success('Doação convertida para livre.');
      fetchNotifications();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao rejeitar doação.');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDocument('notificacoes', id, { lida: true });
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Notificações do Evento</h1>
        <p className="text-sm text-muted-foreground">Gerencie aprovações e avisos deste evento.</p>
      </div>

      {notifications.length === 0 ? (
        <Card className="border-none shadow-sm rounded-2xl bg-card text-center py-12 transition-colors">
          <CardContent className="flex flex-col items-center justify-center text-muted-foreground">
            <Bell className="w-12 h-12 mb-4 text-muted/30" />
            <p>Nenhuma notificação para este evento no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {notifications.map(notif => (
            <Card key={notif.id} className={`border-none shadow-sm rounded-2xl overflow-hidden transition-colors ${!notif.lida ? 'bg-primary/5 border-l-4 border-l-primary' : 'bg-card'}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {notif.tipo === 'doacao_direcionada' && <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Heart className="w-3 h-3" />Aprovação Pendente</span>}
                      {notif.tipo === 'doacao_pendente' && <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Gift className="w-3 h-3" />Doação</span>}
                      {notif.tipo === 'resumo_diario' && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">Resumo Diário</span>}
                      {notif.tipo === 'primeira_inscricao' && <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Star className="w-3 h-3" />Primeira Inscrição</span>}
                      {notif.tipo === 'meta_inscricoes' && <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Trophy className="w-3 h-3" />Meta Atingida</span>}
                      {notif.tipo === 'equipe_novo_membro' && <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Users className="w-3 h-3" />Novo Membro</span>}
                      <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.data).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <h3 className={`text-lg font-black tracking-tight ${!notif.lida ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.titulo}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">{notif.mensagem}</p>
                  </div>
                  
                  <div className="flex flex-col gap-2 min-w-[120px]">
                    {notif.acao_requirida && notif.tipo === 'doacao_direcionada' ? (
                      <>
                        <Button 
                          onClick={() => handleApproveDonation(notif)}
                          className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-9 text-xs font-bold"
                        >
                          <Check className="w-4 h-4 mr-1" /> Aprovar
                        </Button>
                        <Button 
                          onClick={() => handleRejectDonation(notif)}
                          variant="outline"
                          className="w-full text-destructive hover:text-white hover:bg-destructive border-destructive/20 rounded-xl h-9 text-xs font-bold"
                        >
                          <X className="w-4 h-4 mr-1" /> Tornar Livre
                        </Button>
                      </>
                    ) : (
                      !notif.lida && (
                        <Button 
                          onClick={() => markAsRead(notif.id)}
                          variant="ghost"
                          className="w-full text-primary hover:text-primary hover:bg-primary/10 rounded-xl h-9 text-xs font-bold"
                        >
                          Marcar como lida
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
