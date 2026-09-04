import React, { useEffect, useState } from 'react';
import { listDocuments, updateDocument } from '~/services/firestore';
import { UserProfile, PlanLevel, Evento } from '~/types';
import { PLAN_CONFIGS } from '~/utils/plan-limits';
import { auth } from '~/services/firebase';
import {
  Search, RefreshCw, X, ExternalLink, ChevronRight,
  ShieldOff, ArrowUpCircle, UserX, UserCheck, Mail, MailCheck, CalendarPlus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PLAN_LABELS: Record<string, string> = { chinam: 'Plano 1 - Chinám', petach: 'Plano 2 - Pétach', koach: 'Plano 3 - Koách', chalem: 'Plano 4 - Chalém', start: 'Plano 1 - Chinám', essencial: 'Plano 2 - Pétach', pro: 'Plano 3 - Koách', personalizado: 'Plano 4 - Chalém' };
const PLAN_COLORS: Record<string, string> = {
  chinam: 'bg-gray-100 text-gray-600', start: 'bg-gray-100 text-gray-600',
  petach: 'bg-blue-100 text-blue-700', essencial: 'bg-blue-100 text-blue-700',
  koach: 'bg-violet-100 text-violet-700', pro: 'bg-violet-100 text-violet-700',
  chalem: 'bg-primary/10 text-primary',
};
const PLAN_OPTIONS: PlanLevel[] = ['chinam', 'petach', 'koach', 'chalem'];

type Filter = 'all' | 'chalem' | 'koach' | 'petach' | 'chinam' | 'pending' | 'none' | 'deactivated';

export default function AdminClientesTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [detailTab, setDetailTab] = useState<'cadastro' | 'financeiro'>('cadastro');
  const [saving, setSaving] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<string | null>(null);
  const [eventCountMap, setEventCountMap] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [data, eventos] = await Promise.all([
        listDocuments<UserProfile>('users'),
        listDocuments<Evento>('eventos'),
      ]);
      setUsers(data.filter(u => !u.isDemo).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
      const map: Record<string, number> = {};
      for (const e of eventos) {
        map[e.criado_por] = (map[e.criado_por] || 0) + 1;
      }
      setEventCountMap(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const patchUsers = (uid: string, patch: Partial<UserProfile>) => {
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...patch } : u));
    setSelected(prev => prev?.uid === uid ? { ...prev, ...patch } : prev);
  };

  const handleChangePlan = async (uid: string, plano: PlanLevel | null) => {
    setSaving(uid);
    try {
      await updateDocument('users', uid, { plano, planoPendente: null });
      patchUsers(uid, { plano, planoPendente: null });
      toast.success('Plano atualizado!');
    } catch {
      toast.error('Erro ao atualizar plano.');
    } finally {
      setSaving(null);
    }
  };

  const handleDeactivate = async (u: UserProfile) => {
    if (!u.uid || !window.confirm(`Desativar conta de ${u.nome || u.email}?`)) return;
    setSuspending(u.uid);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const suspRes = await fetch('/api/admin?action=suspendUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({ userId: u.uid }),
      });
      if (!suspRes.ok) { const d = await suspRes.json(); throw new Error(d.error || 'Erro ao desativar.'); }
      patchUsers(u.uid, { desativado: true, plano: null, asaasSubscriptionId: null, planoPendente: null });
      toast.success('Conta desativada.');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao desativar.');
    } finally {
      setSuspending(null);
    }
  };

  const handleReactivate = async (u: UserProfile) => {
    if (!u.uid || !window.confirm(`Reativar conta de ${u.nome || u.email}?`)) return;
    setSuspending(u.uid);
    try {
      await updateDocument('users', u.uid, { desativado: false });
      patchUsers(u.uid, { desativado: false });
      toast.success('Conta reativada.');
    } catch {
      toast.error('Erro ao reativar.');
    } finally {
      setSuspending(null);
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !search || u.nome?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchFilter =
      filter === 'all' ||
      (filter === 'pending' && !!u.planoPendente) ||
      (filter === 'none' && !u.plano && !u.planoPendente && !u.desativado) ||
      (filter === 'deactivated' && !!u.desativado) ||
      u.plano === filter;
    return matchSearch && matchFilter;
  });

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'chalem', label: 'Plano 4 - Chalém' },
    { id: 'koach',  label: 'Plano 3 - Koách'  },
    { id: 'petach', label: 'Plano 2 - Pétach' },
    { id: 'chinam', label: 'Plano 1 - Chinám' },
    { id: 'pending', label: 'Pendente' },
    { id: 'none', label: 'Sem plano' },
    { id: 'deactivated', label: 'Desativados' },
  ];

  return (
    <div className="flex gap-5">
      {/* List */}
      <div className={cn('flex-1 min-w-0 space-y-4', selected && 'hidden lg:block')}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-xl bg-muted/50 border-none focus-visible:ring-primary"
            />
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
                filter === f.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="bg-card rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Cliente</th>
                  <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Plano</th>
                  <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Progresso</th>
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
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map(u => (
                    <tr
                      key={u.uid}
                      onClick={() => { setSelected(u); setDetailTab('cadastro'); }}
                      className={cn(
                        'border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer',
                        selected?.uid === u.uid && 'bg-primary/5',
                        u.desativado && 'opacity-60'
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary shrink-0">
                            {(u.nome || u.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{u.nome || '—'}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {u.plano ? (
                          <span className={cn('text-xs font-bold px-2 py-1 rounded-full', PLAN_COLORS[u.plano] || 'bg-gray-100 text-gray-600')}>
                            {PLAN_LABELS[u.plano] || u.plano}
                          </span>
                        ) : u.planoPendente ? (
                          <span className="text-xs font-semibold text-yellow-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                            Pendente
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {u.desativado ? (
                          <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Desativado
                          </span>
                        ) : u.plano ? (
                          <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Ativo
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" /> Sem plano
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span title={u.email_verificado ? 'E-mail verificado' : 'E-mail não verificado'}>
                            {u.email_verificado
                              ? <MailCheck className="w-4 h-4 text-green-500" />
                              : <Mail className="w-4 h-4 text-muted-foreground/40" />}
                          </span>
                          <span title={eventCountMap[u.uid] ? `${eventCountMap[u.uid]} evento(s)` : 'Nenhum evento criado'}>
                            <CalendarPlus className={cn('w-4 h-4', eventCountMap[u.uid] ? 'text-green-500' : 'text-muted-foreground/40')} />
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-muted/20 border-t border-border text-xs text-muted-foreground">
            {filtered.length} cliente(s)
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-full lg:w-96 shrink-0 bg-card rounded-3xl shadow-sm overflow-hidden flex flex-col self-start">
          {/* Header */}
          <div className="p-5 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-black text-primary shrink-0">
                  {(selected.nome || selected.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-foreground">{selected.nome || '—'}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">{selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground shrink-0 ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {(['cadastro', 'financeiro'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setDetailTab(tab)}
                className={cn(
                  'flex-1 py-3 text-sm font-semibold capitalize transition-colors',
                  detailTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {detailTab === 'cadastro' ? (
              <>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Informações</p>
                  <div className="bg-muted/30 rounded-2xl p-4 space-y-2.5 text-sm">
                    {[
                      { label: 'Nome', value: selected.nome },
                      { label: 'E-mail', value: selected.email },
                      { label: 'WhatsApp', value: selected.whatsapp },
                      { label: 'Instituição', value: selected.instituicao },
                      { label: 'Cargo', value: selected.cargo },
                      { label: 'Cidade', value: selected.cidade },
                    ].map(({ label, value }) => value ? (
                      <div key={label} className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{label}</span>
                        <span className="font-medium text-foreground text-right truncate max-w-[180px]">{value}</span>
                      </div>
                    ) : null)}
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground shrink-0">UID</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{selected.uid?.slice(0, 14)}…</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Ativação</p>
                  <div className="bg-muted/30 rounded-2xl p-4 space-y-2.5 text-sm">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        {selected.email_verificado ? <MailCheck className="w-3.5 h-3.5 text-green-500" /> : <Mail className="w-3.5 h-3.5 text-muted-foreground/50" />}
                        E-mail verificado
                      </span>
                      <span className={cn('text-xs font-semibold', selected.email_verificado ? 'text-green-600' : 'text-amber-500')}>
                        {selected.email_verificado ? 'Sim' : 'Não'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <CalendarPlus className={cn('w-3.5 h-3.5', eventCountMap[selected.uid] ? 'text-green-500' : 'text-muted-foreground/50')} />
                        Eventos criados
                      </span>
                      <span className={cn('text-xs font-semibold', eventCountMap[selected.uid] ? 'text-green-600' : 'text-amber-500')}>
                        {eventCountMap[selected.uid] || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Ações</p>
                  {!selected.desativado ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={suspending === selected.uid}
                      onClick={() => handleDeactivate(selected)}
                      className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl gap-2"
                    >
                      <UserX className="w-4 h-4" />
                      {suspending === selected.uid ? 'Desativando...' : 'Desativar conta'}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={suspending === selected.uid}
                      onClick={() => handleReactivate(selected)}
                      className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      {suspending === selected.uid ? 'Reativando...' : 'Reativar conta'}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Assinatura</p>
                  <div className="bg-muted/30 rounded-2xl p-4 space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plano</span>
                      {selected.plano ? (
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', PLAN_COLORS[selected.plano] || 'bg-gray-100 text-gray-600')}>
                          {PLAN_LABELS[selected.plano] || selected.plano}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </div>
                    {selected.planoPendente && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pendente</span>
                        <span className="text-xs font-semibold text-yellow-600">{PLAN_LABELS[selected.planoPendente] || selected.planoPendente}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Asaas ID</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {selected.asaasCustomerId ? `${selected.asaasCustomerId.slice(0, 16)}…` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gateway</span>
                      <span className={cn('text-xs font-semibold', selected.gateway_connected ? 'text-green-600' : 'text-muted-foreground')}>
                        {selected.gateway_connected ? 'Conectado' : 'Não conectado'}
                      </span>
                    </div>
                  </div>
                  {selected.asaasCustomerId && (
                    <a
                      href={`https://sandbox.asaas.com/customers/${selected.asaasCustomerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Ver no Asaas
                    </a>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Alterar plano</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PLAN_OPTIONS.map(plan => (
                      <button
                        key={plan}
                        disabled={selected.plano === plan || saving === selected.uid}
                        onClick={() => handleChangePlan(selected.uid, plan)}
                        className={cn(
                          'py-2 rounded-xl text-xs font-bold border transition-all',
                          selected.plano === plan
                            ? 'bg-primary text-white border-primary'
                            : 'bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary'
                        )}
                      >
                        {PLAN_CONFIGS[plan]?.name ?? plan}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {selected.plano && !selected.desativado && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={saving === selected.uid}
                        onClick={() => { if (window.confirm(`Remover plano de ${selected.nome || selected.email}?`)) handleChangePlan(selected.uid, null); }}
                        className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl gap-1.5 text-xs"
                      >
                        <ShieldOff className="w-3 h-3" /> Cancelar plano
                      </Button>
                    )}
                    {!selected.plano && !selected.desativado && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={saving === selected.uid}
                        onClick={() => handleChangePlan(selected.uid, 'chinam')}
                        className="flex-1 text-primary hover:bg-primary/5 rounded-xl gap-1.5 text-xs"
                      >
                        <ArrowUpCircle className="w-3 h-3" /> Ativar Chinám
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
