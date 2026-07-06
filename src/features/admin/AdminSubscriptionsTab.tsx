import React, { useEffect, useState } from 'react';
import { listDocuments } from '~/services/firestore';
import { UserProfile } from '~/types';
import { Search, ExternalLink, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const PLAN_LABELS: Record<string, string> = { chinam: 'Chinám', petach: 'Pétach', koach: 'Koách', chalem: 'Chalém', start: 'Chinám', essencial: 'Pétach', pro: 'Koách', personalizado: 'Chalém' };
const PLAN_COLORS: Record<string, string> = {
  chinam: 'bg-gray-100 text-gray-600', start: 'bg-gray-100 text-gray-600',
  petach: 'bg-blue-100 text-blue-700', essencial: 'bg-blue-100 text-blue-700',
  koach: 'bg-violet-100 text-violet-700', pro: 'bg-violet-100 text-violet-700',
  chalem: 'bg-primary/10 text-primary',
};

type Filter = 'all' | 'chalem' | 'koach' | 'petach' | 'chinam' | 'pending' | 'none';

export default function AdminSubscriptionsTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

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

  const filtered = users.filter(u => {
    const matchSearch =
      !search ||
      u.nome?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === 'all' ||
      (filter === 'pending' && !!u.planoPendente) ||
      (filter === 'none' && !u.plano && !u.planoPendente) ||
      u.plano === filter;

    return matchSearch && matchFilter;
  });

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'chalem', label: 'Chalém' },
    { id: 'koach', label: 'Koách' },
    { id: 'petach', label: 'Pétach' },
    { id: 'chinam', label: 'Chinám' },
    { id: 'pending', label: 'Pendente' },
    { id: 'none', label: 'Sem plano' },
  ];

  return (
    <div className="space-y-5">
      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
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

      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
              filter === f.id
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-3xl overflow-hidden shadow-sm border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Usuário</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Plano</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Asaas ID</th>
                <th className="px-4 py-4" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-4 bg-muted animate-pulse rounded-full w-3/4" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground text-sm">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.uid} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">{u.nome || '—'}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      {u.plano ? (
                        <span className={cn('text-xs font-bold px-2 py-1 rounded-full', PLAN_COLORS[u.plano])}>
                          {PLAN_LABELS[u.plano] || u.plano}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {u.planoPendente ? (
                        <span className="flex items-center gap-1 text-xs text-yellow-600 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                          Pendente ({PLAN_LABELS[u.planoPendente] || u.planoPendente})
                        </span>
                      ) : u.plano ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Ativo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          Sem plano
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-mono text-muted-foreground">
                        {u.asaasCustomerId ? u.asaasCustomerId.slice(0, 20) + '…' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {u.asaasCustomerId && (
                        <a
                          href={`https://sandbox.asaas.com/customers/${u.asaasCustomerId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          Asaas <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-muted/20 border-t border-border text-xs text-muted-foreground">
          {filtered.length} usuário(s) exibido(s)
        </div>
      </div>
    </div>
  );
}
