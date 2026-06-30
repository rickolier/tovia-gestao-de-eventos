import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { maskCPF, validateCPF } from '~/utils/validators';
import {
  Search, CheckCircle2, Clock, XCircle, AlertCircle,
  CalendarDays, MapPin, Ticket, CreditCard, ArrowRight, Loader2,
} from 'lucide-react';

interface InscricaoResult {
  inscricaoId: string;
  eventoId: string;
  eventoNome: string;
  eventoData: string;
  eventoLocal: string;
  ticketNome: string;
  status: string;
  statusLabel: string;
  valorTotal: number;
  valorPago: number;
  formaPagamento: string;
  nome: string;
  dataInscricao: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  pago:               { icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  pendente:           { icon: Clock,        color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200'   },
  pagamento_iniciado: { icon: CreditCard,   color: 'text-blue-700',   bg: 'bg-blue-50',     border: 'border-blue-200'    },
  ajuda_solicitada:   { icon: AlertCircle,  color: 'text-purple-700', bg: 'bg-purple-50',   border: 'border-purple-200'  },
  analise:            { icon: AlertCircle,  color: 'text-orange-700', bg: 'bg-orange-50',   border: 'border-orange-200'  },
  cancelada:          { icon: XCircle,      color: 'text-red-700',    bg: 'bg-red-50',       border: 'border-red-200'     },
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

export default function ConsultarInscricao() {
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<InscricaoResult[] | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cpf.replace(/\D/g, '');
    if (!validateCPF(digits)) {
      setError('CPF inválido. Verifique os dígitos e tente novamente.');
      return;
    }
    if (!dataNascimento) {
      setError('Informe sua data de nascimento.');
      return;
    }
    setLoading(true);
    setError(null);
    setResults(null);
    setSearched(false);
    try {
      const res = await fetch('/api/buscarInscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: digits, dataNascimento }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao consultar.');
      setResults(data.inscricoes);
      setSearched(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao consultar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <a href="/" className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity">
            <span className="text-sm font-light text-gray-400 tracking-tight">feito com</span>
            <span className="font-logo font-bold text-2xl tracking-tight text-primary leading-none">tovia</span>
          </a>
          <span className="hidden sm:block text-xs font-semibold text-gray-500 text-center">
            Consultar inscrição
          </span>
          <a href="/" className="text-xs font-black text-primary hover:underline whitespace-nowrap">
            Crie o seu evento →
          </a>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-xl space-y-8">

          {/* Hero */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Consultar minha inscrição</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Informe seu CPF para verificar o status da sua inscrição e do pagamento.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">CPF</label>
              <Input
                placeholder="000.000.000-00"
                value={cpf}
                onChange={e => { setCpf(maskCPF(e.target.value)); setError(null); }}
                maxLength={14}
                className="h-12 rounded-xl border-gray-200 text-gray-900 text-base font-bold tracking-widest"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Data de nascimento</label>
              <Input
                type="date"
                value={dataNascimento}
                onChange={e => { setDataNascimento(e.target.value); setError(null); }}
                className="h-12 rounded-xl border-gray-200 text-gray-900 text-base"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            <Button
              type="submit"
              disabled={loading || cpf.replace(/\D/g, '').length < 11 || !dataNascimento}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-sm shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Consultando...</>
                : <><Search className="w-4 h-4 mr-2" /> Consultar</>}
            </Button>
          </form>

          {/* Results */}
          {searched && results !== null && (
            results.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="font-bold text-gray-700">Nenhuma inscrição encontrada</p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Não encontramos inscrições vinculadas a este CPF.<br />
                  Se você se inscreveu recentemente, aguarde alguns minutos e tente novamente.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest text-center">
                  {results.length} inscrição{results.length !== 1 ? 'ões' : ''} encontrada{results.length !== 1 ? 's' : ''}
                </p>
                {results.map(insc => {
                  const cfg = STATUS_CONFIG[insc.status] ?? STATUS_CONFIG['pendente'];
                  const Icon = cfg.icon;
                  const isCancelled = insc.status === 'cancelada';
                  const isPaid = insc.status === 'pago';

                  return (
                    <div
                      key={insc.inscricaoId}
                      className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isCancelled ? 'border-red-200' : 'border-gray-100'}`}
                    >
                      {/* Status bar */}
                      <div className={`h-1.5 ${isPaid ? 'bg-emerald-500' : isCancelled ? 'bg-red-400' : 'bg-amber-400'}`} />

                      <div className="p-6 space-y-4">
                        {/* Nome + status badge */}
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

                        {/* Event info */}
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

                        {/* Payment info */}
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

                        {/* CTA for cancelled */}
                        {isCancelled && (
                          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 space-y-2">
                            <p className="text-xs font-bold text-red-700">Inscrição cancelada</p>
                            <p className="text-xs text-red-600 leading-relaxed">
                              Sua inscrição foi cancelada, possivelmente por falta de confirmação do pagamento.
                              Se desejar participar, realize uma nova inscrição.
                            </p>
                          </div>
                        )}

                        {/* CTA for pending payment */}
                        {(insc.status === 'pendente' || insc.status === 'pagamento_iniciado') && insc.valorTotal > 0 && (
                          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                            <p className="text-xs text-amber-700 leading-relaxed">
                              <span className="font-bold">Pagamento pendente.</span> Conclua o pagamento para confirmar sua participação. Em caso de dúvidas, entre em contato com o organizador do evento.
                            </p>
                          </div>
                        )}

                        {/* Success message */}
                        {isPaid && (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                            <p className="text-xs text-emerald-700 font-medium">
                              Inscrição confirmada! Sua participação está garantida.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 pb-4">
            Dados exibidos apenas para consulta. Para alterações, entre em contato com o organizador.
          </p>
        </div>
      </main>
    </div>
  );
}
