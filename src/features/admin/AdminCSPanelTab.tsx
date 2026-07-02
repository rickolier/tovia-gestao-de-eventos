import React, { useEffect, useState } from 'react';
import { listDocuments } from '~/services/firestore';
import { UserProfile } from '~/types';
import { Clock, ArrowUpCircle, UserX, RefreshCw, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminCSPanelTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listDocuments<UserProfile>('users');
      setUsers(data.filter(u => !u.isDemo));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pendingCheckout = users.filter(u => u.planoPendente && !u.desativado);
  const noplan = users.filter(u => !u.plano && !u.planoPendente && !u.desativado);
  const deactivated = users.filter(u => u.desativado);

  const alerts = [
    {
      label: 'Checkout abandonado',
      desc: 'Iniciaram upgrade mas não concluíram o pagamento',
      users: pendingCheckout,
      bg: 'bg-yellow-50 border-yellow-100',
      titleColor: 'text-yellow-700',
      Icon: Clock,
      iconColor: 'text-yellow-500',
    },
    {
      label: 'Sem plano ativo',
      desc: 'Usuários sem plano associado — potencial de conversão',
      users: noplan,
      bg: 'bg-blue-50 border-blue-100',
      titleColor: 'text-blue-700',
      Icon: ArrowUpCircle,
      iconColor: 'text-blue-500',
    },
    {
      label: 'Contas desativadas',
      desc: 'Acesso bloqueado — oportunidade de reativação',
      users: deactivated,
      bg: 'bg-red-50 border-red-100',
      titleColor: 'text-red-700',
      Icon: UserX,
      iconColor: 'text-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-foreground">Painel de Customer Success</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Alertas proativos para acompanhamento de clientes</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-3xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => {
            const { Icon } = alert;
            return (
              <div key={alert.label} className={cn('rounded-3xl border p-6', alert.bg)}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-2xl bg-white/60 flex items-center justify-center shrink-0">
                    <Icon className={cn('w-4 h-4', alert.iconColor)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={cn('font-bold text-sm', alert.titleColor)}>{alert.label}</h3>
                      <span className={cn('text-xl font-black', alert.titleColor)}>{alert.users.length}</span>
                    </div>
                    <p className="text-xs opacity-70 mt-0.5">{alert.desc}</p>
                  </div>
                </div>

                {alert.users.length > 0 ? (
                  <div className="space-y-2">
                    {alert.users.slice(0, 5).map(u => (
                      <div key={u.uid} className="flex items-center justify-between bg-white/50 rounded-2xl px-4 py-2.5">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{u.nome || '—'}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                        <a
                          href={`mailto:${u.email}`}
                          className="w-7 h-7 rounded-xl bg-white flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          title="Enviar e-mail"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                    {alert.users.length > 5 && (
                      <p className="text-xs text-center opacity-60 pt-1">+ {alert.users.length - 5} mais</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-center opacity-50">Nenhum alerta no momento</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
