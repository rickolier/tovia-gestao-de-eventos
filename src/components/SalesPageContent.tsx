import React, { useState, useEffect } from 'react';
import { Evento, Ticket, PaginaVenda, CampoFormulario, UserProfile } from '../types';
import { createDocument, getDocument } from '../lib/firebase-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar, MapPin, Clock, Plus, Minus, CheckCircle2, ArrowLeft,
  Ticket as TicketIcon, Shield, Lock, HeadphonesIcon, Instagram, Globe, Mail, Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import Logo from './Logo';

type Step = 'ticket' | 'form' | 'success';

function safeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url;
  } catch {}
  return undefined;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function formatPrice(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface Props {
  evento: Evento;
  pagina: PaginaVenda;
  tickets: Ticket[];
  eventoId: string;
  onSuccess?: (inscricaoId: string) => void;
}

const SalesPageContent: React.FC<Props> = ({ evento, pagina, tickets, eventoId, onSuccess }) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [step, setStep] = useState<Step>('ticket');
  const [submitting, setSubmitting] = useState(false);
  const [inscricaoId, setInscricaoId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [organizador, setOrganizador] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (evento.criado_por) {
      getDocument<UserProfile>('users', evento.criado_por)
        .then(u => { if (u) setOrganizador(u); })
        .catch(() => {});
    }
  }, [evento.criado_por]);

  const selectedTickets = tickets.filter(t => (quantities[t.id] || 0) > 0);
  const total = selectedTickets.reduce((s, t) => s + t.valor * (quantities[t.id] || 0), 0);
  const totalQty: number = (Object.values(quantities) as number[]).reduce((a, b) => a + b, 0);

  const updateQty = (id: string, delta: number) =>
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const campo of pagina.campos_formulario) {
      if (campo.obrigatorio && !formValues[campo.id]) {
        toast.error(`O campo "${campo.label}" é obrigatório.`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const id = uuidv4();
      const respostas: Record<string, string | boolean> = {};
      pagina.campos_formulario.forEach(c => { respostas[c.label] = formValues[c.id] || ''; });

      const nomeField = pagina.campos_formulario.find(c => c.label.toLowerCase().includes('nome'));
      const emailField = pagina.campos_formulario.find(c => c.tipo === 'email' || c.label.toLowerCase().includes('e-mail'));
      const telefoneField = pagina.campos_formulario.find(c => c.tipo === 'telefone' || c.label.toLowerCase().includes('telefone'));
      const ticket = selectedTickets[0];

      const nome = nomeField ? String(formValues[nomeField.id] || '') : '';
      const email = emailField ? String(formValues[emailField.id] || '') : '';
      const telefone = telefoneField ? String(formValues[telefoneField.id] || '') : '';

      // Cria registro em pessoas para aparecer no painel do organizador
      const pessoaId = uuidv4();
      await createDocument(`eventos/${eventoId}/pessoas`, pessoaId, {
        id: pessoaId,
        nome,
        email,
        telefone,
      });

      await createDocument(`eventos/${eventoId}/inscricoes`, id, {
        id, eventoId,
        pessoaId,
        ticketId: ticket?.id || '',
        ticket_nome: ticket?.nome || '',
        nome,
        email,
        telefone,
        respostas_formulario: respostas,
        quantidades: quantities,
        valor_total: total,
        valor_pago: 0,
        status: total === 0 ? 'pago' : 'pendente',
        data_inscricao: new Date().toISOString(),
        precisa_ajuda: false,
        validada_manual: false,
        pagina_venda_id: pagina.id,
        pagina_venda_slug: pagina.slug,
      } as any);

      setInscricaoId(id);
      setStep('success');
      onSuccess?.(id);
    } catch {
      toast.error('Erro ao enviar inscrição. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="border-b border-gray-100 px-6 py-4">
          <Logo showTagline={false} />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Inscrição realizada!</h1>
            <p className="text-gray-500 mt-2 max-w-sm">
              Sua inscrição em <strong>{evento.nome}</strong> foi recebida com sucesso.
            </p>
          </div>
          {inscricaoId && (
            <p className="text-xs text-gray-400 font-mono bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
              Protocolo: {inscricaoId.slice(0, 8).toUpperCase()}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Logo showTagline={false} />
            <span className="text-xs text-gray-400">Powered by Tovia</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          {/* Esquerda: feito com tovia */}
          <a href="/" className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity">
            <span className="text-sm font-light text-gray-400 tracking-tight">feito com</span>
            <span className="font-logo font-bold text-2xl tracking-tight text-primary leading-none">tovia</span>
          </a>

          {/* Centro: nome do organizador */}
          {organizador && (
            <span className="hidden sm:block text-xs font-semibold text-gray-500 truncate max-w-[200px] text-center">
              {organizador.instituicao || organizador.nome}
            </span>
          )}

          {/* Direita: CTA */}
          <a
            href="/"
            className="text-xs font-black text-primary hover:underline whitespace-nowrap"
          >
            Crie o seu evento →
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative w-full h-56 sm:h-72 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
        {evento.imagem_url && (
          <img src={evento.imagem_url} alt={evento.nome} className="w-full h-full object-cover object-center" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 sm:px-10">
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">{evento.nome}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2">
            <span className="flex items-center gap-1.5 text-white/80 text-sm">
              <Calendar className="w-4 h-4" />
              {formatDate(evento.data_inicio)} · {formatTime(evento.data_inicio)}
              {evento.data_fim && evento.data_fim !== evento.data_inicio && (
                <> → {formatDate(evento.data_fim)} · {formatTime(evento.data_fim)}</>
              )}
            </span>
            {evento.local && (
              <span className="flex items-center gap-1.5 text-white/80 text-sm">
                <MapPin className="w-4 h-4" /> {evento.local}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* ── LEFT: description + organizer ── */}
        <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">

          {/* Description */}
          {(evento.descricao || pagina.descricao) && (
            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 pb-3 border-b border-gray-100">Descrição do evento</h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line text-sm space-y-3">
                {evento.descricao || pagina.descricao}
              </div>
            </section>
          )}

          {/* Organizer */}
          {organizador && (
            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 pb-3 border-b border-gray-100">Sobre o organizador</h2>
              <div className="flex items-start gap-4">
                {organizador.imagem_url ? (
                  <img src={organizador.imagem_url} alt={organizador.nome} className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xl font-black text-primary">{(organizador.instituicao || organizador.nome || '?')[0].toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900">{organizador.instituicao || organizador.nome}</p>
                  {organizador.cargo && <p className="text-sm text-gray-500">{organizador.cargo}</p>}
                  {(organizador.bio || organizador.descricao) && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{organizador.bio || organizador.descricao}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-3">
                    {organizador.contato_email && (
                      <a href={`mailto:${organizador.contato_email}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <Mail className="w-3.5 h-3.5" /> {organizador.contato_email}
                      </a>
                    )}
                    {organizador.telefone && (
                      <a href={`tel:${organizador.telefone}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <Phone className="w-3.5 h-3.5" /> {organizador.telefone}
                      </a>
                    )}
                    {safeUrl(organizador.site) && (
                      <a href={safeUrl(organizador.site)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <Globe className="w-3.5 h-3.5" /> Site
                      </a>
                    )}
                    {organizador.redes_social?.instagram && (
                      <a href={`https://instagram.com/${organizador.redes_social.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <Instagram className="w-3.5 h-3.5" /> @{organizador.redes_social.instagram.replace('@', '')}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* ── RIGHT: ticket panel (sticky) ── */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <div className="sticky top-20">

            {/* Ticket selection */}
            {step === 'ticket' && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
                <div className="px-5 pt-5 pb-3 border-b border-gray-100">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">Escolha uma opção</p>
                </div>

                <div className="divide-y divide-gray-100">
                  {tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center px-5">
                      <TicketIcon className="w-10 h-10 text-gray-200" />
                      <p className="text-sm font-semibold text-gray-400">Nenhum ingresso disponível</p>
                    </div>
                  ) : tickets.map(ticket => {
                    const qty = quantities[ticket.id] || 0;
                    const isGratuito = ticket.tipo === 'gratuito' || ticket.tipo === 'doacao' || ticket.valor === 0;
                    const expired = ticket.data_limite ? new Date(ticket.data_limite) < new Date() : false;
                    return (
                      <div key={ticket.id} className={`px-5 py-4 flex items-center gap-4 transition-colors ${expired ? 'opacity-50' : qty > 0 ? 'bg-primary/5' : 'hover:bg-gray-50'}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">{ticket.nome}</p>
                          <p className="text-base font-black mt-0.5" style={{ color: isGratuito ? '#16a34a' : 'inherit' }}>
                            {isGratuito ? 'Gratuito' : formatPrice(ticket.valor)}
                          </p>
                          {ticket.data_limite && !expired && (
                            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Inscrições até {formatDate(ticket.data_limite)}
                            </p>
                          )}
                          {expired && <p className="text-[11px] text-red-400 mt-0.5 font-semibold">Encerrado</p>}
                        </div>
                        {!expired && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => updateQty(ticket.id, -1)}
                              disabled={qty === 0}
                              className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-5 text-center font-black text-gray-900 text-sm">{qty}</span>
                            <button
                              onClick={() => updateQty(ticket.id, 1)}
                              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-all active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Total + CTA */}
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-3">
                  {totalQty > 0 && (
                    <div className="space-y-1">
                      {selectedTickets.map(t => (
                        <div key={t.id} className="flex justify-between text-sm text-gray-600">
                          <span>{quantities[t.id]}× {t.nome}</span>
                          <span className="font-semibold">{formatPrice(t.valor * quantities[t.id])}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-black text-gray-900 pt-2 border-t border-gray-200 text-sm">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(total)}</span>
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={() => {
                      if (totalQty === 0) { toast.error('Selecione pelo menos um ingresso'); return; }
                      setStep('form');
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-11 font-black shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                  >
                    {totalQty === 0 ? 'Selecione uma Inscrição' : `Continuar · ${totalQty} ingresso(s)`}
                  </Button>
                </div>
              </div>
            )}

            {/* Form */}
            {step === 'form' && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
                <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center gap-3">
                  <button onClick={() => setStep('ticket')} className="text-gray-400 hover:text-gray-700 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">Seus dados</p>
                </div>

                {/* Resumo */}
                <div className="px-5 py-3 bg-primary/5 border-b border-primary/10">
                  {selectedTickets.map(t => (
                    <div key={t.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{quantities[t.id]}× {t.nome}</span>
                      <span className="font-bold text-gray-900">{formatPrice(t.valor * quantities[t.id])}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-black text-sm pt-2 border-t border-primary/10 mt-2">
                    <span className="text-gray-700">Total</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
                  {pagina.campos_formulario.map(campo => (
                    <FormField
                      key={campo.id}
                      campo={campo}
                      value={formValues[campo.id]}
                      onChange={v => setFormValues(prev => ({ ...prev, [campo.id]: v }))}
                    />
                  ))}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-11 font-black shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-2"
                  >
                    {submitting ? 'Enviando...' : 'Confirmar inscrição'}
                  </Button>
                  <p className="text-center text-xs text-gray-400">Ao confirmar, você concorda com os termos do evento.</p>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Security footer ── */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-10">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <Shield className="w-7 h-7 text-primary/60" />
            <p className="text-sm font-bold text-gray-800">Compre com segurança</p>
            <p className="text-xs text-gray-500">Seus dados são protegidos e não são compartilhados sem autorização.</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Lock className="w-7 h-7 text-primary/60" />
            <p className="text-sm font-bold text-gray-800">Dados criptografados</p>
            <p className="text-xs text-gray-500">Todas as informações são transmitidas com protocolo seguro (HTTPS).</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <HeadphonesIcon className="w-7 h-7 text-primary/60" />
            <p className="text-sm font-bold text-gray-800">Fale com o organizador</p>
            {organizador?.contato_email ? (
              <a href={`mailto:${organizador.contato_email}`} className="text-xs text-primary hover:underline">{organizador.contato_email}</a>
            ) : organizador?.whatsapp ? (
              <a href={`https://wa.me/${organizador.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Enviar mensagem</a>
            ) : (
              <p className="text-xs text-gray-500">Entre em contato pelo organizador do evento.</p>
            )}
          </div>
        </div>
        <div className="bg-[var(--sidebar)] px-6 py-8 mt-0">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-2xl font-black text-white tracking-tight">tovia</span>
            <p className="text-white/30 text-xs">Todos os direitos reservados · BIGLAB Solutions © 2026</p>
            <a href="/" className="text-xs text-white/40 hover:text-white/70 transition-colors">tovia.app</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SalesPageContent;

// ─── Form field renderer ──────────────────────────────────────────────────────
const FormField: React.FC<{
  campo: CampoFormulario;
  value: string | boolean | undefined;
  onChange: (v: string | boolean) => void;
}> = ({ campo, value, onChange }) => {
  const inputClass = "rounded-lg border border-gray-200 bg-white h-10 text-gray-900 focus:ring-primary focus:border-primary text-sm";
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
        {campo.label}
        {campo.obrigatorio && <span className="text-red-500">*</span>}
      </Label>
      {campo.tipo === 'textarea' && (
        <Textarea required={campo.obrigatorio} placeholder={campo.placeholder} value={String(value || '')}
          onChange={e => onChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white resize-none text-sm text-gray-900" rows={3} />
      )}
      {campo.tipo === 'select' && campo.opcoes && (
        <Select value={String(value || '')} onValueChange={onChange}>
          <SelectTrigger className={inputClass}>
            <SelectValue placeholder={campo.placeholder || 'Selecione...'} />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-gray-200 shadow-xl">
            {campo.opcoes.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      {campo.tipo === 'checkbox' && (
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox checked={!!value} onCheckedChange={onChange}
            className="rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5" />
          <span className="text-sm text-gray-600">{campo.placeholder || campo.label}</span>
        </label>
      )}
      {!['textarea', 'select', 'checkbox'].includes(campo.tipo) && (
        <Input
          type={campo.tipo === 'email' ? 'email' : campo.tipo === 'numero' ? 'number' : campo.tipo === 'data' ? 'date' : 'text'}
          required={campo.obrigatorio} placeholder={campo.placeholder} value={String(value || '')}
          onChange={e => onChange(e.target.value)} className={inputClass} />
      )}
    </div>
  );
}
