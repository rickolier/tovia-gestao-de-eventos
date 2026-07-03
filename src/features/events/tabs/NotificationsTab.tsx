import React, { useEffect, useState } from 'react';
import { useAuth } from '~/context/AuthContext';
import { listDocuments, updateDocument, getDocument, createDocument } from '~/services/firestore';
import { AppNotification, Donation, Inscricao } from '~/types';
import { where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Check, X, Bell, Clock, Heart, Users, Trophy, Gift, Star } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface NotificationsTabProps {
  eventoId: string;
}

const TIPO_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  doacao_direcionada: { label: 'Aprovação Pendente', icon: <Heart className="w-3 h-3" />, color: 'text-amber-600 bg-amber-500/10' },
  doacao_pendente:   { label: 'Doação',             icon: <Gift className="w-3 h-3" />,  color: 'text-orange-600 bg-orange-500/10' },
  resumo_diario:     { label: 'Resumo Diário',       icon: null,                           color: 'text-primary bg-primary/10' },
  primeira_inscricao:{ label: 'Primeira Inscrição',  icon: <Star className="w-3 h-3" />,  color: 'text-green-600 bg-green-500/10' },
  meta_inscricoes:   { label: 'Meta Atingida',       icon: <Trophy className="w-3 h-3" />,color: 'text-blue-600 bg-blue-500/10' },
  equipe_novo_membro:{ label: 'Novo Membro',         icon: <Users className="w-3 h-3" />, color: 'text-purple-600 bg-purple-500/10' },
};

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
      ]);
      // Unread first, then by date desc within each group
      data.sort((a, b) => {
        if (a.lida !== b.lida) return a.lida ? 1 : -1;
        return new Date(b.data).getTime() - new Date(a.data).getTime();
      });
      setNotifications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [user, eventoId]);

  const handleApproveDonation = async (notif: AppNotification) => {
    if (!notif.dados_acao?.donationId || !notif.dados_acao?.inscritoId || !notif.eventoId) return;
    try {
      const donationId = notif.dados_acao.donationId;
      const inscritoId = notif.dados_acao.inscritoId;
      const evId = notif.eventoId;

      const donation = await getDocument<Donation>(`eventos/${evId}/doacoes`, donationId);
      if (!donation) { toast.error('Doação não encontrada.'); return; }

      const inscricao = await getDocument<Inscricao>(`eventos/${evId}/inscricoes`, inscritoId);
      if (!inscricao) { toast.error('Inscrição não encontrada.'); return; }

      if (inscricao.valor_pago >= inscricao.valor_total) {
        await updateDocument(`eventos/${evId}/doacoes`, donationId, { destino: 'livre', inscritoId: null });
        toast.info('Inscrito já estava quitado. Doação convertida para livre.');
      } else {
        const newValorPago = inscricao.valor_pago + donation.valorLiquido;
        const newStatus = newValorPago >= inscricao.valor_total ? 'confirmada' : inscricao.status;
        await updateDocument(`eventos/${evId}/inscricoes`, inscritoId, { valor_pago: newValorPago, status: newStatus });
        const pagamentoId = uuidv4();
        await createDocument(`eventos/${evId}/pagamentos`, pagamentoId, {
          id: pagamentoId, inscricaoId: inscritoId, eventoId: evId,
          valor: donation.valorLiquido, status: 'pago',
          metodo: donation.formaPagamento as any,
          data_vencimento: new Date().toISOString().split('T')[0],
          data_pagamento: new Date().toISOString(),
          isDonation: true, doadorNome: donation.doadorNome,
        });
        toast.success('Doação aprovada e aplicada ao inscrito!');
      }

      await updateDocument('notificacoes', notif.id, { lida: true, acao_requirida: false });
      fetchNotifications();
    } catch { toast.error('Erro ao aprovar doação.'); }
  };

  const handleRejectDonation = async (notif: AppNotification) => {
    if (!notif.dados_acao?.donationId || !notif.eventoId) return;
    try {
      await updateDocument(`eventos/${notif.eventoId}/doacoes`, notif.dados_acao.donationId, { destino: 'livre', inscritoId: null });
      await updateDocument('notificacoes', notif.id, { lida: true, acao_requirida: false });
      toast.success('Doação convertida para livre.');
      fetchNotifications();
    } catch { toast.error('Erro ao rejeitar doação.'); }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDocument('notificacoes', id, { lida: true });
      fetchNotifications();
    } catch { /* ignore */ }
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="tab-page-header">
        <div>
          <h2 className="flex items-center gap-2">
            Notificações
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black">{unreadCount}</span>
            )}
          </h2>
          <p>Aprovações e histórico de avisos deste evento.</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-bold"
            onClick={async () => {
              await Promise.all(notifications.filter(n => !n.lida).map(n => updateDocument('notificacoes', n.id, { lida: true })));
              fetchNotifications();
            }}
          >
            <Check className="w-3.5 h-3.5 mr-1.5" /> Marcar todas como lidas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border/50 py-14 text-center">
          <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">Nenhuma notificação para este evento.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto] items-center px-4 py-2 bg-muted/40 border-b border-border/50">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notificação</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Ação</span>
          </div>

          <div className="divide-y divide-border/40">
            {notifications.map((notif, idx) => {
              const tipo = TIPO_CONFIG[notif.tipo] ?? { label: notif.tipo, icon: null, color: 'text-muted-foreground bg-muted' };
              const isRead = notif.lida;
              const needsAction = notif.acao_requirida && notif.tipo === 'doacao_direcionada';

              return (
                <div
                  key={notif.id}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    !isRead
                      ? 'bg-primary/[0.03] border-l-2 border-l-primary'
                      : 'opacity-50 hover:opacity-70 border-l-2 border-l-transparent'
                  }`}
                >
                  {/* Dot */}
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${!isRead ? 'bg-primary' : 'bg-transparent'}`} />

                  {/* Badge */}
                  <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${tipo.color}`}>
                    {tipo.icon}{tipo.label}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isRead ? 'text-muted-foreground' : 'text-foreground'}`}>{notif.titulo}</p>
                    <p className="text-xs text-muted-foreground truncate">{notif.mensagem}</p>
                  </div>

                  {/* Date */}
                  <span className="hidden md:flex items-center gap-1 text-[10px] text-muted-foreground shrink-0 font-medium whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    {new Date(notif.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {needsAction ? (
                      <>
                        <Button onClick={() => handleApproveDonation(notif)} size="sm" className="h-7 px-3 text-xs font-bold rounded-lg bg-primary hover:bg-primary/90 text-white">
                          <Check className="w-3 h-3 mr-1" /> Aprovar
                        </Button>
                        <Button onClick={() => handleRejectDonation(notif)} size="sm" variant="outline" className="h-7 px-3 text-xs font-bold rounded-lg text-destructive border-destructive/20 hover:bg-destructive hover:text-white">
                          <X className="w-3 h-3 mr-1" /> Recusar
                        </Button>
                      </>
                    ) : !isRead ? (
                      <Button onClick={() => markAsRead(notif.id)} size="sm" variant="ghost" className="h-7 px-2 text-xs font-bold rounded-lg text-muted-foreground hover:text-primary">
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <span className="w-7 h-7" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
