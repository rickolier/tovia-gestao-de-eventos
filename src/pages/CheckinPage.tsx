import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '~/context/AuthContext';
import { getDocument, listDocuments, updateDocument } from '~/services/firestore';
import { where, limit } from 'firebase/firestore';
import { Evento, Inscricao } from '~/types';
import { CheckCircle2, XCircle, AlertCircle, Search, QrCode, List, ArrowLeft, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '~/components/Logo';
import QrScanner from 'qr-scanner';

type ScanResult = { type: 'success'; nome: string; ticket: string; inscricaoId: string }
                | { type: 'already'; nome: string; checkin_at: string }
                | { type: 'invalid'; msg: string };

export default function CheckinPage() {
  const { id: eventoId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [activeTab, setActiveTab] = useState<'camera' | 'lista'>('camera');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const processingRef = useRef(false);

  // Load event + inscriptions
  useEffect(() => {
    if (!eventoId || !user) return;
    (async () => {
      const ev = await getDocument<Evento>('eventos', eventoId);
      if (!ev) { navigate('/desenvolvimento/dashboard'); return; }

      const isOwner = ev.criado_por === user.uid;
      const isTeam  = (ev.equipeIds ?? []).includes(user.uid);
      if (!isOwner && !isTeam) { navigate('/desenvolvimento/dashboard'); return; }

      setEvento(ev);
      setAuthorized(true);

      const all = await listDocuments<Inscricao>(`eventos/${eventoId}/inscricoes`, [where('status', '==', 'pago'), limit(500)]);
      setInscricoes(all.filter(i => i.status === 'pago'));
      setLoading(false);
    })();
  }, [eventoId, user]);

  // Start/stop scanner when tab changes
  useEffect(() => {
    if (activeTab !== 'camera' || !authorized || loading) return;

    let mounted = true;

    const startScanner = async () => {
      if (!videoRef.current) return;
      try {
        const scanner = new QrScanner(
          videoRef.current,
          result => {
            if (!mounted || processingRef.current) return;
            handleScan(result.data);
          },
          {
            preferredCamera: 'environment',
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );
        scannerRef.current = scanner;
        await scanner.start();
        if (mounted) setScanning(true);
      } catch (err) {
        console.error('Camera error:', err);
      }
    };

    startScanner();

    return () => {
      mounted = false;
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
      scannerRef.current = null;
      setScanning(false);
    };
  }, [activeTab, authorized, loading]);

  const handleScan = useCallback(async (data: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    scannerRef.current?.pause();

    const inscricaoId = data.trim();

    try {
      const insc = await getDocument<Inscricao>(`eventos/${eventoId}/inscricoes`, inscricaoId);

      if (!insc || insc.status !== 'pago') {
        setScanResult({ type: 'invalid', msg: 'Inscrição não encontrada ou não confirmada.' });
      } else if (insc.presenca) {
        setScanResult({
          type: 'already',
          nome: insc.nome ?? '—',
          checkin_at: insc.checkin_at ?? '',
        });
      } else {
        const now = new Date().toISOString();
        await updateDocument(`eventos/${eventoId}/inscricoes`, inscricaoId, {
          presenca: true,
          checkin_at: now,
        });
        // update local list
        setInscricoes(prev => prev.map(i =>
          i.id === inscricaoId ? { ...i, presenca: true, checkin_at: now } : i
        ));
        setScanResult({
          type: 'success',
          nome: insc.nome ?? '—',
          ticket: insc.ticket_nome ?? '',
          inscricaoId,
        });
      }
    } catch {
      setScanResult({ type: 'invalid', msg: 'Erro ao validar. Tente novamente.' });
    }

    // Auto-reset after 2.5s
    setTimeout(() => {
      setScanResult(null);
      processingRef.current = false;
      scannerRef.current?.resume();
    }, 2500);
  }, [eventoId]);

  const handleManualCheckin = async (insc: Inscricao) => {
    if (insc.presenca) return;
    const now = new Date().toISOString();
    await updateDocument(`eventos/${eventoId}/inscricoes`, insc.id, {
      presenca: true,
      checkin_at: now,
    });
    setInscricoes(prev => prev.map(i =>
      i.id === insc.id ? { ...i, presenca: true, checkin_at: now } : i
    ));
  };

  const checkins  = inscricoes.filter(i => i.presenca).length;
  const total     = inscricoes.length;
  const filtered  = inscricoes.filter(i =>
    !search || (i.nome ?? '').toLowerCase().includes(search.toLowerCase())
  );

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
      <header className="bg-[var(--sidebar)] px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-30">
        <Link to={`/desenvolvimento/eventos/${eventoId}`} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Checkin</p>
          <p className="text-sm font-black text-white truncate">{evento?.nome}</p>
        </div>
        <Logo variant="white" className="scale-75 origin-right shrink-0" />
      </header>

      {/* Counter */}
      <div className="bg-[var(--sidebar)] px-4 pb-4">
        <div className="bg-white/10 rounded-2xl px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-white/70" />
            <span className="text-sm font-black text-white">Presenças confirmadas</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">{checkins}</span>
            <span className="text-sm text-white/50 font-bold">/ {total}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card">
        {([
          { id: 'camera', label: 'Câmera QR', icon: QrCode },
          { id: 'lista',  label: 'Lista manual', icon: List },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Camera tab */}
      {activeTab === 'camera' && (
        <div className="flex-1 flex flex-col items-center justify-start p-4 gap-4">
          <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden bg-black shadow-2xl">
            <video ref={videoRef} className="w-full h-full object-cover" />

            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center text-white space-y-2">
                  <QrCode className="w-10 h-10 mx-auto opacity-60" />
                  <p className="text-sm font-semibold opacity-60">Iniciando câmera…</p>
                </div>
              </div>
            )}

            {/* Scan result overlay */}
            {scanResult && (
              <div className={cn(
                'absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center transition-all',
                scanResult.type === 'success' ? 'bg-emerald-600/95' :
                scanResult.type === 'already' ? 'bg-amber-500/95' :
                'bg-red-600/95'
              )}>
                {scanResult.type === 'success' && (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-white" />
                    <div>
                      <p className="text-xl font-black text-white">{scanResult.nome}</p>
                      {scanResult.ticket && <p className="text-sm text-white/80 mt-1">{scanResult.ticket}</p>}
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-white/70 bg-white/20 px-3 py-1 rounded-full">Presença confirmada</span>
                  </>
                )}
                {scanResult.type === 'already' && (
                  <>
                    <AlertCircle className="w-16 h-16 text-white" />
                    <div>
                      <p className="text-xl font-black text-white">{scanResult.nome}</p>
                      <p className="text-sm text-white/80 mt-1">Checkin às {fmtTime(scanResult.checkin_at)}</p>
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-white/70 bg-white/20 px-3 py-1 rounded-full">Já validado</span>
                  </>
                )}
                {scanResult.type === 'invalid' && (
                  <>
                    <XCircle className="w-16 h-16 text-white" />
                    <p className="text-base font-black text-white">{scanResult.msg}</p>
                  </>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Aponte a câmera para o QR Code do ingresso.<br />A validação é automática.
          </p>
        </div>
      )}

      {/* Lista tab */}
      {activeTab === 'lista' && (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border bg-card">
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

          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {filtered.length === 0 && (
              <div className="py-16 text-center text-muted-foreground text-sm">
                Nenhum participante encontrado.
              </div>
            )}
            {filtered.map(insc => (
              <button
                key={insc.id}
                disabled={insc.presenca}
                onClick={() => handleManualCheckin(insc)}
                className={cn(
                  'w-full flex items-center gap-4 px-4 py-4 text-left transition-colors',
                  insc.presenca
                    ? 'bg-emerald-50/60 cursor-default'
                    : 'hover:bg-muted/40 active:bg-muted/70'
                )}
              >
                {/* Check indicator */}
                <div className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                  insc.presenca
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-border bg-background'
                )}>
                  {insc.presenca && <CheckCircle2 className="w-5 h-5 text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn('font-bold text-sm truncate', insc.presenca ? 'text-emerald-700' : 'text-foreground')}>
                    {insc.nome ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {insc.ticket_nome}
                    {insc.presenca && insc.checkin_at && (
                      <span className="text-emerald-600 font-semibold"> · {fmtTime(insc.checkin_at)}</span>
                    )}
                  </p>
                </div>

                {!insc.presenca && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 shrink-0">
                    Marcar
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
