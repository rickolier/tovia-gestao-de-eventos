import React, { useEffect, useState } from 'react';
import { listDocuments, updateDocument } from '../../lib/firebase-utils';
import { UserProfile } from '../../types';
import { Search, RefreshCw, ShieldOff, ArrowUpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PLAN_CONFIGS } from '../../lib/plan-limits';
import { PlanLevel } from '../../types';

const PLAN_OPTIONS: PlanLevel[] = ['start', 'essencial', 'pro'];

export default function AdminUsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await listDocuments<UserProfile>('users');
    setUsers(data.filter(u => !u.isDemo).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

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
                  <tr key={u.uid} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">{u.nome || '—'}</p>
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
                        u.plano === 'pro' ? 'bg-primary/10 text-primary' :
                        u.plano === 'essencial' ? 'bg-blue-100 text-blue-700' :
                        u.plano === 'start' ? 'bg-gray-100 text-gray-600' :
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
                      <div className="flex gap-2">
                        {u.plano && (
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
                        {!u.plano && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={saving === u.uid}
                            onClick={() => handleChangePlan(u.uid!, 'start')}
                            className="text-primary hover:bg-primary/5 rounded-xl h-8 text-xs gap-1"
                          >
                            <ArrowUpCircle className="w-3 h-3" />
                            Ativar Start
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
