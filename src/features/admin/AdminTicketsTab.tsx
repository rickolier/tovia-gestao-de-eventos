import React, { useEffect, useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '~/services/firebase';
import { listDocuments, updateDocument } from '~/services/firestore';
import { LifeBuoy, Plus, RefreshCw, Clock, CheckCircle2, Circle, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TicketItem {
  id?: string;
  titulo: string;
  descricao: string;
  status: 'aberto' | 'em_andamento' | 'resolvido' | 'fechado';
  prioridade: 'baixa' | 'media' | 'alta';
  categoria: 'problema' | 'duvida' | 'sugestao' | 'outro';
  responsavel?: string;
  cliente_email?: string;
  criado_em?: string;
}

const STATUS_CONFIG: Record<TicketItem['status'], { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  aberto:       { label: 'Aberto',       color: 'text-blue-600 bg-blue-50',    Icon: Circle },
  em_andamento: { label: 'Em andamento', color: 'text-orange-600 bg-orange-50', Icon: Clock },
  resolvido:    { label: 'Resolvido',    color: 'text-green-600 bg-green-50',   Icon: CheckCircle2 },
  fechado:      { label: 'Fechado',      color: 'text-gray-500 bg-gray-100',    Icon: X },
};

const PRIORIDADE_COLORS: Record<TicketItem['prioridade'], string> = {
  baixa: 'text-gray-500',
  media: 'text-yellow-600',
  alta:  'text-red-600',
};

const PRIORIDADE_LABELS: Record<TicketItem['prioridade'], string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta:  'Alta',
};

const CATEGORIA_LABELS: Record<TicketItem['categoria'], string> = {
  problema: 'Problema',
  duvida:   'Dúvida',
  sugestao: 'Sugestão',
  outro:    'Outro',
};

const EMPTY: Omit<TicketItem, 'id' | 'criado_em'> = {
  titulo: '',
  descricao: '',
  status: 'aberto',
  prioridade: 'media',
  categoria: 'problema',
  cliente_email: '',
};

export default function AdminTicketsTab() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | TicketItem['status']>('all');

  const load = async () => {
    setLoading(true);
    try {
      const data = await listDocuments<TicketItem>('tickets');
      setTickets(data.sort((a, b) => (b.criado_em || '').localeCompare(a.criado_em || '')));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.titulo.trim()) return toast.error('Título obrigatório');
    setSaving(true);
    try {
      const ticket = { ...form, criado_em: new Date().toISOString() };
      const ref = await addDoc(collection(db, 'tickets'), ticket);
      setTickets(prev => [{ ...ticket, id: ref.id }, ...prev]);
      setForm({ ...EMPTY });
      setShowForm(false);
      toast.success('Ticket criado!');
    } catch {
      toast.error('Erro ao criar ticket.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (ticket: TicketItem, status: TicketItem['status']) => {
    if (!ticket.id) return;
    try {
      await updateDocument('tickets', ticket.id, { status });
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status } : t));
      toast.success('Status atualizado!');
    } catch {
      toast.error('Erro ao atualizar status.');
    }
  };

  const filtered = tickets.filter(t => filterStatus === 'all' || t.status === filterStatus);
  const counts = {
    aberto: tickets.filter(t => t.status === 'aberto').length,
    em_andamento: tickets.filter(t => t.status === 'em_andamento').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'all' as const, label: 'Todos' },
            { id: 'aberto' as const, label: `Abertos${counts.aberto > 0 ? ` (${counts.aberto})` : ''}` },
            { id: 'em_andamento' as const, label: `Em andamento${counts.em_andamento > 0 ? ` (${counts.em_andamento})` : ''}` },
            { id: 'resolvido' as const, label: 'Resolvidos' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                filterStatus === f.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <Button onClick={() => setShowForm(v => !v)} className="rounded-xl gap-2 text-sm">
            <Plus className="w-4 h-4" /> Novo ticket
          </Button>
        </div>
      </div>

      {/* New ticket form */}
      {showForm && (
        <div className="bg-card rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">Novo ticket</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <Input
            placeholder="Título do ticket"
            value={form.titulo}
            onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            className="rounded-xl bg-muted/50 border-none"
          />
          <Textarea
            placeholder="Descrição..."
            value={form.descricao}
            onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
            className="rounded-xl bg-muted/50 border-none min-h-[80px]"
          />
          <Input
            placeholder="E-mail do cliente (opcional)"
            value={form.cliente_email || ''}
            onChange={e => setForm(f => ({ ...f, cliente_email: e.target.value }))}
            className="rounded-xl bg-muted/50 border-none"
          />
          <div className="flex gap-3">
            <select
              value={form.prioridade}
              onChange={e => setForm(f => ({ ...f, prioridade: e.target.value as TicketItem['prioridade'] }))}
              className="flex-1 rounded-xl bg-muted/50 border-none px-3 py-2 text-sm text-foreground"
            >
              <option value="baixa">Prioridade: Baixa</option>
              <option value="media">Prioridade: Média</option>
              <option value="alta">Prioridade: Alta</option>
            </select>
            <select
              value={form.categoria}
              onChange={e => setForm(f => ({ ...f, categoria: e.target.value as TicketItem['categoria'] }))}
              className="flex-1 rounded-xl bg-muted/50 border-none px-3 py-2 text-sm text-foreground"
            >
              <option value="problema">Problema</option>
              <option value="duvida">Dúvida</option>
              <option value="sugestao">Sugestão</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving} className="rounded-xl">
              {saving ? 'Criando...' : 'Criar ticket'}
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-card rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            <LifeBuoy className="w-8 h-8 mx-auto mb-3 opacity-30" />
            Nenhum ticket encontrado.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(ticket => {
              const cfg = STATUS_CONFIG[ticket.status];
              const StatusIcon = cfg.Icon;
              const isOpen = expanded === ticket.id;
              return (
                <div key={ticket.id}>
                  <div
                    className="px-6 py-4 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : (ticket.id ?? null))}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <StatusIcon className={cn('w-4 h-4 shrink-0', cfg.color.split(' ')[0])} />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{ticket.titulo}</p>
                          <p className="text-xs text-muted-foreground">
                            {ticket.cliente_email || 'Interno'} · {CATEGORIA_LABELS[ticket.categoria]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn('text-xs font-bold', PRIORIDADE_COLORS[ticket.prioridade])}>
                          {PRIORIDADE_LABELS[ticket.prioridade]}
                        </span>
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.color)}>
                          {cfg.label}
                        </span>
                        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                      </div>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="px-6 pb-4 pt-1 bg-muted/10">
                      {ticket.descricao && (
                        <p className="text-sm text-foreground mb-4 whitespace-pre-wrap leading-relaxed">{ticket.descricao}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground mr-1">Mover para:</span>
                        {(Object.entries(STATUS_CONFIG) as [TicketItem['status'], typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, c]) =>
                          key !== ticket.status ? (
                            <button
                              key={key}
                              onClick={() => handleUpdateStatus(ticket, key)}
                              className={cn('text-xs font-semibold px-3 py-1 rounded-full transition-all', c.color, 'hover:opacity-80')}
                            >
                              {c.label}
                            </button>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="px-6 py-3 bg-muted/20 border-t border-border text-xs text-muted-foreground">
          {filtered.length} ticket(s)
        </div>
      </div>
    </div>
  );
}
