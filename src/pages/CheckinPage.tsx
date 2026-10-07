import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '~/context/AuthContext';
import { getDocument, listDocuments, updateDocument } from '~/services/firestore';
import { where, limit } from 'firebase/firestore';
import { Evento, Inscricao } from '~/types';
import { CheckCircle2, Search, ArrowLeft, Users, UserCheck, UserX, Camera, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '~/components/Logo';
import QrScanner from '~/components/QrScanner';
import SwipeRow from '~/components/SwipeRow';

export default function CheckinPage() {
  const { id: eventoId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [search, setSearch] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error' | 'already'; nome: string } | null>(null);

  useEffect(() => {
    if (!eventoId || !user) return;
    (async () => {
      const ev = await getDocument<Evento>('eventos', eventoId);
      if (!ev) { navigate('/dashboard'); return; }

      const isOwner = ev.criado_por === user.uid;
      const isTeam  = (ev.equipeIds ?? []).includes(user.uid);
      if (!isOwner && !isTeam) { navigate('/dashboard'); return; }

      setEvento(ev);
      setAuthorized(true);

      const all = await listDocuments<Inscricao>(`eventos/${eventoId}/inscricoes`, [where('status', '==', 'pago'), limit(500)]);
      setInscricoes(all.filter(i => i.status === 'pago').sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR')));
      setLoading(false);
    })();
  }, [eventoId, user]);

  const handleQrScan = useCallback(async (inscricaoId: string) => {
    const insc = inscricoes.find(i => i.id === inscricaoId);
    if (!insc) {
      setScanFeedback({ type: 'error', nome: 'Inscrição não encontrada neste evento.' });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }
    if (insc.presenca) {
      setScanFeedback({ type: 'already', nome: insc.nome ?? 'Participante' });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }
    const now = new Date().toISOString();
    await updateDocument(`eventos/${eventoId}/inscricoes`, insc.id, { presenca: true, checkin_at: now });
    setInscricoes(prev => prev.map(i => i.id === insc.id ? { ...i, presenca: true, checkin_at: now } : i));
    setScanFeedback({ type: 'success', nome: insc.nome ?? 'Participante' });
    setTimeout(() => setScanFeedback(null), 3000);
  }, [inscricoes, eventoId]);

  const handleCheckin = async (insc: Inscricao) => {
    if (insc.presenca) return;
    const now = new Date().toISOString();
    await updateDocument(`eventos/${eventoId}/inscricoes`, insc.id, { presenca: true, checkin_at: now });
    setInscricoes(prev => prev.map(i => i.id === insc.id ? { ...i, presenca: true, checkin_at: now } : i));
  };

  const handleUncheckin = async (insc: Inscricao) => {
    if (!insc.presenca) return;
    await updateDocument(`eventos/${eventoId}/inscricoes`, insc.id, { presenca: false, checkin_at: null });
    setInscricoes(prev => prev.map(i => i.id === insc.id ? { ...i, presenca: false, checkin_at: undefined } : i));
  };

  const checkins = inscricoes.filter(i => i.presenca).length;
  const ausentes = inscricoes.length - checkins;
  const filtered = inscricoes.filter(i => !search || (i.nome ?? '').toLowerCase().includes(search.toLowerCase()));

  const fmtTime = (iso: string) =>
    iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-sidebar px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-30">
        <Link to={`/eventos/${eventoId}`} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Check-in</p>
          <p className="text-sm font-black text-white truncate">{evento?.nome}</p>
        </div>
        <Logo variant="white" className="scale-75 origin-right shrink-0" />
      </header>

      {/* Stats */}
      <div className="bg-sidebar px-4 pb-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-2xl px-4 py-3 flex flex-col items-center gap-1">
            <Users className="w-4 h-4 text-white/60" />
            <span className="text-2xl font-black text-white">{inscricoes.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Total</span>
          </div>
          <div className="bg-orange-500/20 border border-primary/20 rounded-2xl px-4 py-3 flex flex-col items-center gap-1">
            <UserCheck className="w-4 h-4 text-primary/80" />
            <span className="text-2xl font-black text-white">{checkins}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Presentes</span>
          </div>
          <div className="bg-white/5 rounded-2xl px-4 py-3 flex flex-col items-center gap-1">
            <UserX className="w-4 h-4 text-white/40" />
            <span className="text-2xl font-black text-white/70">{ausentes}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Ausentes</span>
          </div>
        </div>
      </div>

      {/* QR Scanner */}
      <div className="mx-4 mt-4 space-y-3">
        {!scannerOpen ? (
          <button
            onClick={() => setScannerOpen(true)}
            className="w-full rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 flex items-center justify-center gap-3 hover:bg-primary/10 transition-colors"
          >
            <Camera className="w-6 h-6 text-primary" />
            <span className="text-sm font-black text-primary">Escanear QR Code</span>
          </button>
        ) : (
          <QrScanner scanning={scannerOpen} onScan={handleQrScan} onClose={() => setScannerOpen(false)} />
        )}

        {scanFeedback && (
          <div className={cn(
            'rounded-xl px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200',
            scanFeedback.type === 'success' && 'bg-green-50 border border-green-200 text-green-800',
            scanFeedback.type === 'already' && 'bg-amber-50 border border-amber-200 text-amber-800',
            scanFeedback.type === 'error' && 'bg-red-50 border border-red-200 text-red-800',
          )}>
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">
              {scanFeedback.type === 'success' && `✓ ${scanFeedback.nome} — check-in realizado!`}
              {scanFeedback.type === 'already' && `${scanFeedback.nome} já fez check-in.`}
              {scanFeedback.type === 'error' && scanFeedback.nome}
            </p>
          </div>
        )}
      </div>

      {/* Lista manual */}
      <div className="flex-1 flex flex-col mt-4">
        <div className="px-4 pb-3">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Lista de presença</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 h-11 rounded-xl border border-border bg-muted/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border-t border-border">
          {filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-sm">
              Nenhum participante encontrado.
            </div>
          )}
          {filtered.map(insc => (
            <SwipeRow
              key={insc.id}
              onSwipeRight={!insc.presenca ? () => handleCheckin(insc) : undefined}
              onSwipeLeft={insc.presenca ? () => handleUncheckin(insc) : undefined}
              rightLabel="Confirmar"
              leftLabel="Desmarcar"
              rightColor="bg-green-500"
              leftColor="bg-red-500"
            >
              <div
                className={cn(
                  'flex items-center gap-4 px-4 py-4 border-b border-border/50',
                  insc.presenca ? 'bg-orange-50/60 dark:bg-primary/10' : 'bg-background'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                  insc.presenca ? 'bg-primary border-primary' : 'border-border bg-background'
                )}>
                  {insc.presenca && <CheckCircle2 className="w-5 h-5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('font-bold text-sm truncate', insc.presenca ? 'text-primary' : 'text-foreground')}>
                    {insc.nome ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {insc.ticket_nome}
                    {insc.presenca && insc.checkin_at && (
                      <span className="text-primary font-semibold"> · {fmtTime(insc.checkin_at)}</span>
                    )}
                  </p>
                </div>
                {!insc.presenca ? (
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 shrink-0">← Arraste</span>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/40 shrink-0">Arraste →</span>
                )}
              </div>
            </SwipeRow>
          ))}
        </div>
      </div>
    </div>
  );
}
