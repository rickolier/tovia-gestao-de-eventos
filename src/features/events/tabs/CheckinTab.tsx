import React, { useEffect, useState } from 'react';
import { listDocuments, updateDocument } from '~/services/firestore';
import { limit } from 'firebase/firestore';
import { Inscricao } from '~/types';
import { Button } from '@/components/ui/button';
import { UserCheck, UserX, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  eventoId: string;
}

export default function CheckinTab({ eventoId }: Props) {
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    listDocuments<Inscricao>(`eventos/${eventoId}/inscricoes`, [limit(500)])
      .then(data => {
        const pagas = data
          .filter(i => i.status === 'pago')
          .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'));
        setInscricoes(pagas);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eventoId]);

  const presentes = inscricoes.filter(i => i.presenca);
  const ausentes  = inscricoes.filter(i => !i.presenca);

  const togglePresenca = async (insc: Inscricao) => {
    setUpdating(insc.id);
    const novoValor = !insc.presenca;
    try {
      await updateDocument(`eventos/${eventoId}/inscricoes`, insc.id, {
        presenca: novoValor,
        ...(novoValor ? { checkin_at: new Date().toISOString() } : { checkin_at: null }),
      });
      setInscricoes(prev =>
        prev.map(i => i.id === insc.id ? { ...i, presenca: novoValor, checkin_at: novoValor ? new Date().toISOString() : undefined } : i)
      );
    } catch {
      toast.error('Erro ao atualizar presença.');
    } finally {
      setUpdating(null);
    }
  };

  const exportCSV = () => {
    const header = 'Nome,Ingresso,Presença,Horário Checkin\n';
    const rows = inscricoes.map(i =>
      `"${i.nome ?? ''}","${i.ticket_nome ?? ''}","${i.presenca ? 'Presente' : 'Ausente'}","${i.checkin_at ? new Date(i.checkin_at).toLocaleString('pt-BR') : ''}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkin-${eventoId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="tab-page-header">
        <div>
          <h2>Check-in</h2>
          <p>Lista de presença dos participantes confirmados.</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="rounded-xl h-10 px-5 font-bold gap-2 shrink-0">
          <Download className="w-4 h-4" /> Exportar CSV
        </Button>
      </div>

      {/* Stat boxes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-700 leading-none">{presentes.length}</p>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">Presentes</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <UserX className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-600 leading-none">{ausentes.length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Ausentes</p>
          </div>
        </div>
      </div>

      {/* List */}
      {inscricoes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 flex flex-col items-center gap-2 text-center">
          <UserCheck className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-muted-foreground">Nenhum inscrito confirmado ainda</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          {inscricoes.map((insc, idx) => (
            <div
              key={insc.id}
              className={cn(
                'flex items-center gap-4 px-5 py-3.5 transition-colors',
                idx !== inscricoes.length - 1 && 'border-b border-border/60',
                insc.presenca ? 'bg-emerald-50/40' : 'bg-background',
              )}
            >
              {/* Checkbox */}
              <button
                onClick={() => togglePresenca(insc)}
                disabled={updating === insc.id}
                className={cn(
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                  insc.presenca
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-border hover:border-primary',
                )}
              >
                {updating === insc.id
                  ? <Loader2 className="w-3 h-3 animate-spin text-white" />
                  : insc.presenca && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )
                }
              </button>

              {/* Name + ticket */}
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold truncate', insc.presenca ? 'text-emerald-700' : 'text-foreground')}>
                  {insc.nome ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{insc.ticket_nome ?? '—'}</p>
              </div>

              {/* Checkin time */}
              {insc.presenca && insc.checkin_at ? (
                <span className="text-[11px] font-black text-emerald-600 shrink-0">
                  {new Date(insc.checkin_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-muted-foreground/50 shrink-0">Ausente</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
