import React, { useState } from 'react';
import { Evento, Ticket, PaginaVenda, CampoFormulario } from '../types';
import { createDocument } from '../lib/firebase-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar, MapPin, Clock, Plus, Minus, CheckCircle2, ArrowRight, ArrowLeft,
  Ticket as TicketIcon, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import Logo from './Logo';

type Step = 'ticket' | 'form' | 'success';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
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
  /** Called when the user finishes (success screen shown) or needs to dismiss */
  onSuccess?: (inscricaoId: string) => void;
}

export default function SalesPageContent({ evento, pagina, tickets, eventoId, onSuccess }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [step, setStep] = useState<Step>('ticket');
  const [submitting, setSubmitting] = useState(false);
  const [inscricaoId, setInscricaoId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});

  const selectedTickets = tickets.filter(t => (quantities[t.id] || 0) > 0);
  const total = selectedTickets.reduce((s, t) => s + t.valor * (quantities[t.id] || 0), 0);
  const totalQty = Object.values(quantities).reduce((a, b) => a + b, 0);

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

      await createDocument(`eventos/${eventoId}/inscricoes`, id, {
        id,
        eventoId,
        ticketId: ticket?.id || '',
        ticket_nome: ticket?.nome || '',
        nome: nomeField ? String(formValues[nomeField.id] || '') : '',
        email: emailField ? String(formValues[emailField.id] || '') : '',
        telefone: telefoneField ? String(formValues[telefoneField.id] || '') : '',
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

  const hasImage = !!evento.imagem_url;

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-8 text-center min-h-[400px]">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Inscrição realizada!</h1>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Sua inscrição em <strong>{evento.nome}</strong> foi recebida com sucesso.
          </p>
        </div>
        {inscricaoId && (
          <p className="text-xs text-muted-foreground/60 font-mono">Protocolo: {inscricaoId.slice(0, 8).toUpperCase()}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Logo showTagline={false} />
          <span className="text-xs text-muted-foreground">Powered by Ekko</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f0f0f] min-h-full">

      {/* Hero */}
      <div className="relative">
        {hasImage ? (
          <div className="relative h-48 sm:h-64 overflow-hidden">
            <img src={evento.imagem_url} alt={evento.nome} className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          </div>
        ) : (
          <div className="h-36 sm:h-48 bg-gradient-to-br from-[var(--sidebar)] via-primary/80 to-primary/40 relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,white_1px,transparent_1px)] bg-[length:20px_20px]" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 sm:px-6">
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-lg">{evento.nome}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            <span className="flex items-center gap-1 text-white/80 text-xs">
              <Calendar className="w-3.5 h-3.5" /> {formatDate(evento.data_inicio)} · {formatTime(evento.data_inicio)}
            </span>
            {evento.local && (
              <span className="flex items-center gap-1 text-white/80 text-xs">
                <MapPin className="w-3.5 h-3.5" /> {evento.local}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-card border-b border-border sticky top-0 z-20">
        <div className="px-4 sm:px-6 py-2.5 flex items-center gap-3">
          {(['ticket', 'form'] as const).map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${step === s ? 'text-primary' : s === 'ticket' && step === 'form' ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${step === s ? 'border-primary bg-primary text-white' : s === 'ticket' && step === 'form' ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
                  {i + 1}
                </span>
                {s === 'ticket' ? 'Escolha o ingresso' : 'Seus dados'}
              </div>
              {i === 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 space-y-4 max-w-2xl mx-auto">

        {/* Step 1: ticket selection */}
        {step === 'ticket' && (
          <>
            {pagina.descricao && (
              <p className="text-muted-foreground text-sm bg-card border border-border rounded-2xl px-4 py-3">{pagina.descricao}</p>
            )}
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="text-center py-10 bg-card rounded-2xl border border-border">
                  <TicketIcon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-semibold">Nenhum ingresso disponível</p>
                </div>
              ) : tickets.map(ticket => {
                const qty = quantities[ticket.id] || 0;
                const isGratuito = ticket.tipo === 'gratuito' || ticket.tipo === 'doacao' || ticket.valor === 0;
                const expired = ticket.data_limite ? new Date(ticket.data_limite) < new Date() : false;
                return (
                  <div key={ticket.id} className={`bg-card border rounded-2xl p-4 flex items-center gap-4 transition-all ${qty > 0 ? 'border-primary/40 shadow-sm shadow-primary/10' : 'border-border'} ${expired ? 'opacity-60' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-foreground">{ticket.nome}</p>
                        {expired && <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Encerrado</Badge>}
                      </div>
                      <p className="text-lg font-black text-foreground mt-0.5">
                        {isGratuito ? <span className="text-green-600">Gratuito</span> : formatPrice(ticket.valor)}
                      </p>
                      {ticket.data_limite && !expired && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Até {formatDate(ticket.data_limite)}
                        </p>
                      )}
                    </div>
                    {!expired && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => updateQty(ticket.id, -1)} disabled={qty === 0}
                          className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center font-black text-foreground">{qty}</span>
                        <button onClick={() => updateQty(ticket.id, 1)}
                          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-all active:scale-95">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 sticky bottom-3">
              {totalQty > 0 && (
                <div className="space-y-1">
                  {selectedTickets.map(t => (
                    <div key={t.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{quantities[t.id]}× {t.nome}</span>
                      <span className="font-semibold text-foreground">{formatPrice(t.valor * quantities[t.id])}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between font-black text-foreground text-sm pt-2 border-t border-border mt-1">
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
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-11 font-black shadow-lg shadow-primary/20 transition-all active:scale-[0.98] gap-2"
              >
                {totalQty === 0 ? 'Selecione um ingresso' : `Continuar · ${totalQty} ingresso(s)`}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {/* Step 2: form */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button type="button" onClick={() => setStep('ticket')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-semibold">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Resumo</p>
              {selectedTickets.map(t => (
                <div key={t.id} className="flex justify-between text-sm">
                  <span className="text-foreground">{quantities[t.id]}× {t.nome}</span>
                  <span className="font-bold text-foreground">{formatPrice(t.valor * quantities[t.id])}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-foreground pt-2 border-t border-primary/20 mt-1 text-sm">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Seus dados</p>
              {pagina.campos_formulario.map(campo => (
                <FormField
                  key={campo.id}
                  campo={campo}
                  value={formValues[campo.id]}
                  onChange={v => setFormValues(prev => ({ ...prev, [campo.id]: v }))}
                />
              ))}
            </div>

            <Button type="submit" disabled={submitting}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-11 font-black shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
              {submitting ? 'Enviando...' : 'Confirmar inscrição'}
            </Button>
            <p className="text-center text-xs text-muted-foreground/60">Ao confirmar, você concorda com os termos do evento.</p>
          </form>
        )}
      </div>

      <div className="text-center py-6 flex items-center justify-center gap-2 border-t border-border/30 mt-4">
        <Logo showTagline={false} />
        <span className="text-xs text-muted-foreground">Powered by Ekko</span>
      </div>
    </div>
  );
}

// ─── Form field renderer ──────────────────────────────────────────────────────
function FormField({ campo, value, onChange }: {
  campo: CampoFormulario;
  value: string | boolean | undefined;
  onChange: (v: string | boolean) => void;
}) {
  const inputClass = "rounded-xl border border-border bg-muted/30 h-11 text-foreground focus:ring-primary focus:border-primary text-sm";
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-foreground flex items-center gap-1">
        {campo.label}
        {campo.obrigatorio && <span className="text-destructive">*</span>}
      </Label>
      {campo.tipo === 'textarea' && (
        <Textarea required={campo.obrigatorio} placeholder={campo.placeholder} value={String(value || '')}
          onChange={e => onChange(e.target.value)}
          className="rounded-xl border border-border bg-muted/30 resize-none focus:ring-primary focus:border-primary text-sm" rows={3} />
      )}
      {campo.tipo === 'select' && campo.opcoes && (
        <Select value={String(value || '')} onValueChange={onChange}>
          <SelectTrigger className={inputClass}>
            <SelectValue placeholder={campo.placeholder || 'Selecione...'} />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border shadow-xl">
            {campo.opcoes.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      {campo.tipo === 'checkbox' && (
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox checked={!!value} onCheckedChange={onChange}
            className="rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5" />
          <span className="text-sm text-muted-foreground">{campo.placeholder || campo.label}</span>
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
