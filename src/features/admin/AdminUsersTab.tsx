import React, { useEffect, useState } from 'react';
import { listDocuments, updateDocument } from '~/services/firestore';
import { limit } from 'firebase/firestore';
import { UserProfile } from '~/types';
import { Search, RefreshCw, ShieldOff, ArrowUpCircle, UserX, UserCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PLAN_CONFIGS } from '~/utils/plan-limits';
import { PlanLevel } from '~/types';
import { auth } from '~/services/firebase';

const PLAN_OPTIONS: PlanLevel[] = ['chinam', 'petach', 'koach', 'chalem'];

export default function AdminUsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await listDocuments<UserProfile>('users', [limit(200)]);
    setUsers(data.filter(u => !u.isDemo).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDeactivate = async (u: UserProfile) => {
    if (!u.uid) return;
    if (!window.confirm(`Desativar conta de ${u.nome || u.email}? O acesso será bloqueado e a assinatura cancelada.`)) return;
    setSuspending(u.uid);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const suspRes = await fetch('/api/suspendUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({ userId: u.uid }),
      });
      if (!suspRes.ok) { const d = await suspRes.json(); throw new Error(d.error || 'Erro ao desativar.'); }
      setUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, desativado: true, plano: null, asaasSubscriptionId: null, planoPendente: null } : x));
      toast.success(`Conta de ${u.nome || u.email} desativada.`);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao desativar usuário.');
    } finally {
      setSuspending(null);
    }
  };

  const handleReactivate = async (u: UserProfile) => {
    if (!u.uid) return;
    if (!window.confirm(`Reativar conta de ${u.nome || u.email}?`)) return;
    setSuspending(u.uid);
    try {
      await updateDocument('users', u.uid, { desativado: false });
      setUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, desativado: false } : x));
      toast.success(`Conta de ${u.nome || u.email} reativada. Atribua um plano para liberar o acesso.`);
    } catch {
      toast.error('Erro ao reativar usuário.');
    } finally {
      setSuspending(null);
    }
  };

  const handleChangePlan = async (uid: string, plano: PlanLevel | null) => {
    setSaving(uid);
    try {
      await updateDocument('users', uid, { plano, planoPendente: null });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, plano, planoPendente: null } : u));
      toast.success('Plano atualizado!');
    } catch {
      toast.error('Erro ao atualizar plano.');
    } finally {
      setSaving(null);
    }
  };

  const filtered = users.filter(u =>
    !search ||
    u.nome?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuário..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl bg-muted/50 border-none focus-visible:ring-primary"
          />
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Atualizar
        </button>
      </div>

      <div className="bg-card rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Usuário</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Plano atual</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Alterar plano</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td colSpan={4} className="px-6 py-4">
                      <div className="h-4 bg-muted animate-pulse rounded-full w-2/3" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground text-sm">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.uid} className={cn('border-b border-border/50 hover:bg-muted/20 transition-colors', u.desativado && 'bg-red-50/40')}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{u.nome || '—'}</p>
                        {u.desativado && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">Desativado</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                      {u.planoPendente && (
                        <span className="text-[10px] text-yellow-600 font-semibold">
                          ⏳ Pendente: {u.planoPendente}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        'text-xs font-bold px-2 py-1 rounded-full',
                        (u.plano === 'chalem') ? 'bg-primary/10 text-primary' :
                        (u.plano === 'koach') ? 'bg-violet-100 text-violet-700' :
                        (u.plano === 'petach') ? 'bg-blue-100 text-blue-700' :
                        (u.plano === 'chinam') ? 'bg-gray-100 text-gray-600' :
                        'bg-red-100 text-red-600'
                      )}>
                        {u.plano ? (PLAN_CONFIGS[u.plano as PlanLevel]?.name || u.plano) : 'Sem plano'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        {PLAN_OPTIONS.map(plan => (
                          <button
                            key={plan}
                            disabled={u.plano === plan || saving === u.uid}
                            onClick={() => handleChangePlan(u.uid!, plan)}
                            className={cn(
                              'text-[10px] font-bold px-2 py-1 rounded-lg border transition-all',
                              u.plano === plan
                                ? 'bg-primary text-white border-primary'
                                : 'bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary'
                            )}
                          >
                            {PLAN_CONFIGS[plan].name}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {u.plano && !u.desativado && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={saving === u.uid}
                            onClick={() => {
                              if (window.confirm(`Remover plano de ${u.nome || u.email}?`)) {
                                handleChangePlan(u.uid!, null);
                              }
                            }}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-8 text-xs gap-1"
                          >
                            <ShieldOff className="w-3 h-3" />
                            Cancelar
                          </Button>
                        )}
                        {!u.plano && !u.desativado && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={saving === u.uid}
                            onClick={() => handleChangePlan(u.uid!, 'chinam')}
                            className="text-primary hover:bg-primary/5 rounded-xl h-8 text-xs gap-1"
                          >
                            <ArrowUpCircle className="w-3 h-3" />
                            Ativar Chinám
                          </Button>
                        )}
                        {!u.desativado ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={suspending === u.uid}
                            onClick={() => handleDeactivate(u)}
                            className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl h-8 text-xs gap-1"
                          >
                            <UserX className="w-3 h-3" />
                            {suspending === u.uid ? '...' : 'Desativar'}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={suspending === u.uid}
                            onClick={() => handleReactivate(u)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl h-8 text-xs gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            {suspending === u.uid ? '...' : 'Reativar'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-muted/20 border-t border-border text-xs text-muted-foreground">
          {filtered.length} usuário(s) · alterações salvas imediatamente no Firestore
        </div>
      </div>
    </div>
  );
}
