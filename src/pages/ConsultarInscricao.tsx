import { ToviaLogo } from '~/components/ToviaLogo';
import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search, CheckCircle2, Clock, XCircle, AlertCircle,
  CalendarDays, MapPin, Ticket, CreditCard, Mail, Loader2,
  ArrowLeft, ShieldCheck, QrCode,
} from 'lucide-react';

interface InscricaoResult {
  inscricaoId: string;
  eventoId: string;
  eventoNome: string;
  eventoData: string;
  eventoDataFim: string;
  eventoLocal: string;
  ticketNome: string;
  status: string;
  statusLabel: string;
  valorTotal: number;
  valorPago: number;
  formaPagamento: string;
  nome: string;
  dataInscricao: string;
  presenca: boolean;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  pago:               { icon: CheckCircle2, color: 'text-primary', bg: 'bg-orange-50',  border: 'border-primary/20' },
  pendente:           { icon: Clock,        color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200'   },
  pagamento_iniciado: { icon: CreditCard,   color: 'text-blue-700',   bg: 'bg-blue-50',     border: 'border-blue-200'    },
  ajuda_solicitada:   { icon: AlertCircle,  color: 'text-purple-700', bg: 'bg-purple-50',   border: 'border-purple-200'  },
  analise:            { icon: AlertCircle,  color: 'text-orange-700', bg: 'bg-orange-50',   border: 'border-orange-200'  },
  cancelada:          { icon: XCircle,      color: 'text-red-700',    bg: 'bg-red-50',      border: 'border-red-200'     },
};

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
const METODO_LABELS: Record<string, string> = {
  pix: 'PIX', boleto: 'Boleto', credito: 'Cartão de crédito', recorrente: 'Recorrente',
};

// ─── OTP Input ────────────────────────────────────────────────────────────────

function OtpInput({
  value, onChange, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, ' ').split('').slice(0, 6);

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = digits
      .map((d, idx) => (idx === i ? digit : d === ' ' ? '' : d))
      .join('')
      .padEnd(6, ' ');
    onChange(next.trimEnd());
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i].trim() && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      inputs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          className="w-12 h-14 text-center text-2xl font-black rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none bg-white text-gray-900 transition-colors disabled:opacity-50 caret-transparent"
        />
      ))}
    </div>
  );
}

// ─── Card de inscrição ────────────────────────────────────────────────────────

function eventoFuturo(dataFim: string): boolean {
  if (!dataFim) return false;
  return new Date(dataFim) > new Date();
}

function InscricaoCard({ insc }: { insc: InscricaoResult }) {
  const cfg = STATUS_CONFIG[insc.status] ?? STATUS_CONFIG['pendente'];
  const Icon = cfg.icon;
  const isCancelled = insc.status === 'cancelada';
  const isPaid = insc.status === 'pago';
  const showQr = isPaid && !insc.presenca && eventoFuturo(insc.eventoDataFim);

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isCancelled ? 'border-red-200' : 'border-gray-100'}`}>
      <div className={`h-1.5 ${isPaid ? 'bg-orange-500' : isCancelled ? 'bg-red-400' : 'bg-amber-400'}`} />
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black text-gray-900 text-base">{insc.nome || '—'}</p>
            {insc.ticketNome && (
              <div className="flex items-center gap-1.5 mt-1">
                <Ticket className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">{insc.ticketNome}</p>
              </div>
            )}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${cfg.bg} ${cfg.color} ${cfg.border} shrink-0`}>
            <Icon className="w-3.5 h-3.5" />
            {insc.statusLabel}
          </div>
        </div>

        <div className="space-y-1.5 text-sm text-gray-600">
          <p className="font-bold text-gray-800">{insc.eventoNome}</p>
          {insc.eventoData && (
            <div className="flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-xs">{fmtDate(insc.eventoData)}</span>
            </div>
          )}
          {insc.eventoLocal && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-xs">{insc.eventoLocal}</span>
            </div>
          )}
        </div>

        {insc.valorTotal > 0 && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5 text-xs">
            <div className="flex justify-between font-semibold text-gray-700">
              <span>Valor total</span><span>{fmt(insc.valorTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Valor pago</span><span>{fmt(insc.valorPago)}</span>
            </div>
            {insc.formaPagamento && (
              <div className="flex justify-between text-gray-500">
                <span>Método</span>
                <span>{METODO_LABELS[insc.formaPagamento] || insc.formaPagamento}</span>
              </div>
            )}
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 space-y-2">
            <p className="text-xs font-bold text-red-700">Inscrição cancelada</p>
            <p className="text-xs text-red-600 leading-relaxed">
              Sua inscrição foi cancelada, possivelmente por falta de confirmação do pagamento.
              Se desejar participar, realize uma nova inscrição.
            </p>
          </div>
        )}

        {(insc.status === 'pendente' || insc.status === 'pagamento_iniciado') && insc.valorTotal > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-700 leading-relaxed">
              <span className="font-bold">Pagamento pendente.</span> Conclua o pagamento para confirmar sua participação.
              Em caso de dúvidas, entre em contato com o organizador do evento.
            </p>
          </div>
        )}

        {isPaid && !showQr && (
          <div className="bg-orange-50 border border-primary/10 rounded-xl px-4 py-3">
            <p className="text-xs text-primary font-medium">
              Inscrição confirmada! Sua participação está garantida.
            </p>
          </div>
        )}

        {showQr && (
          <div className="border border-primary/20 rounded-xl overflow-hidden">
            <div className="bg-orange-50 px-4 py-2.5 flex items-center gap-2 border-b border-primary/10">
              <QrCode className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-xs font-black text-primary">QR Code do ingresso</p>
                <p className="text-[10px] text-primary">Mostre na entrada para fazer check-in</p>
              </div>
            </div>
            <div className="bg-white flex justify-center items-center p-6">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 inline-block">
                <QRCodeSVG
                  value={insc.inscricaoId}
                  size={160}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#0c0e14"
                />
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-2 text-center">
              <p className="text-[10px] text-gray-400 font-mono tracking-widest">
                {insc.inscricaoId.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Passos do fluxo ─────────────────────────────────────────────────────────

type Step = 'email' | 'code' | 'results';

export default function ConsultarInscricao() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<InscricaoResult[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown para reenvio
  const startCooldown = () => {
    setResendCooldown(60);
    const id = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.includes('@')) { setError('Informe um e-mail válido.'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth?action=enviarCodigoInscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar.');
      setCode('');
      setStep('code');
      startCooldown();
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth?action=enviarCodigoInscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao reenviar.');
      setCode('');
      startCooldown();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const codeClean = code.replace(/\s/g, '');
    if (codeClean.length < 6) { setError('Digite os 6 dígitos do código.'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth?action=confirmarCodigoInscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: codeClean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Código inválido.');
      setResults(data.inscricoes || []);
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'Código inválido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit quando todos os 6 dígitos são preenchidos
  const handleCodeChange = (v: string) => {
    setCode(v);
    setError(null);
    if (v.replace(/\s/g, '').length === 6) {
      setTimeout(() => handleConfirmCode(), 0);
    }
  };

  const handleReset = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setError(null);
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <a href="/" className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity">
            <span className="text-sm font-light text-gray-400 tracking-tight">feito com</span>
            <ToviaLogo className="h-7 w-auto text-primary" />
          </a>
          <span className="hidden sm:block text-xs font-semibold text-gray-500">
            Consultar inscrição
          </span>
          <a href="/" className="text-xs font-black text-primary hover:underline whitespace-nowrap">
            Crie o seu evento →
          </a>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-xl space-y-8">

          {/* ── Passo 1: E-mail ── */}
          {step === 'email' && (
            <>
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Consultar minha inscrição</h1>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Informe o e-mail usado na inscrição. Enviaremos um código de 6 dígitos para verificar sua identidade.
                </p>
              </div>

              <form onSubmit={handleSendCode} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">E-mail usado na inscrição</label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null); }}
                    className="h-12 rounded-xl border-gray-200 text-gray-900 text-base"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading || !email.includes('@')}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-sm shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando...</>
                    : <><Mail className="w-4 h-4 mr-2" /> Enviar código de acesso</>}
                </Button>
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  Enviaremos um código seguro para o e-mail informado. Válido por 10 minutos.
                </p>
              </form>
            </>
          )}

          {/* ── Passo 2: Código ── */}
          {step === 'code' && (
            <>
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Verifique seu e-mail</h1>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Enviamos um código de 6 dígitos para{' '}
                  <strong className="text-gray-700">{email}</strong>.
                  <br />Digite-o abaixo para acessar suas inscrições.
                </p>
              </div>

              <form onSubmit={handleConfirmCode} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <OtpInput value={code} onChange={handleCodeChange} disabled={loading} />

                {error && (
                  <p className="text-xs text-red-600 font-medium text-center">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading || code.replace(/\s/g, '').length < 6}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-sm shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verificando...</>
                    : 'Confirmar código'}
                </Button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1 text-gray-400 hover:text-gray-600 font-semibold transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Trocar e-mail
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="text-primary font-bold disabled:text-gray-400 disabled:cursor-default hover:underline transition-colors"
                  >
                    {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar código'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── Passo 3: Resultados ── */}
          {step === 'results' && (
            <>
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Ticket className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Suas inscrições</h1>
                <p className="text-sm text-gray-500">{email}</p>
              </div>

              {results.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="font-bold text-gray-700">Nenhuma inscrição encontrada</p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Não encontramos inscrições vinculadas a este e-mail.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest text-center">
                    {results.length} {results.length !== 1 ? 'inscrições' : 'inscrição'} encontrada{results.length !== 1 ? 's' : ''}
                  </p>
                  {results.map(insc => <InscricaoCard key={insc.inscricaoId} insc={insc} />)}
                </div>
              )}

              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 font-semibold transition-colors mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Consultar outro e-mail
              </button>
            </>
          )}

        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white px-6 py-6 mt-auto">
        <div className="max-w-xl mx-auto space-y-3">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            Os dados exibidos pertencem ao titular e são acessados após verificação por e-mail.
            Para alterações, cancelamentos ou exclusão dos seus dados, entre em contato com o
            organizador do evento ou com o Tovia em{' '}
            <a href="mailto:suporte@toviaapp.com.br" className="text-primary font-semibold hover:underline">
              suporte@toviaapp.com.br
            </a>.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <a href="/privacidade" className="hover:text-gray-600 hover:underline transition-colors">
              Política de Privacidade
            </a>
            <span>·</span>
            <a href="/termos" className="hover:text-gray-600 hover:underline transition-colors">
              Termos de Uso
            </a>
            <span>·</span>
            <span>© {new Date().getFullYear()} Tovia</span>
          </div>
          <p className="text-[10px] text-gray-300 text-center">
            Dados tratados em conformidade com a Lei nº 13.709/2020 (LGPD)
          </p>
        </div>
      </footer>
    </div>
  );
}
