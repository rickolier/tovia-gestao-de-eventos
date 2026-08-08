import { ToviaLogo } from '~/components/ToviaLogo';
import React from 'react';
import { Evento, Ticket, PaginaVenda, CampoFormulario, UserProfile } from '~/types';
import { maskTelefone, maskCPF } from '~/utils/validators';
import { Button } from '@/components/ui/button';
import { useSalesPageContent, Step, CheckoutResult } from './hooks/useSalesPageContent';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar, MapPin, Clock, Plus, Minus, CheckCircle2, ArrowLeft,
  Ticket as TicketIcon, Shield, Lock, HeadphonesIcon, Instagram, Globe, Mail, Phone,
  CreditCard, Copy, ExternalLink, Tag, Loader2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import Logo from '~/components/Logo';

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

// ─── Derived data for the "form" step ─────────────────────────────────────────
type SalesPageState = ReturnType<typeof useSalesPageContent>;

function getFormStepData(state: SalesPageState) {
  const { selectedTickets, allDoacao, gatewayConnected, total } = state;
  const paidTickets = selectedTickets.filter(t => t.tipo === 'pago');
  let allowedMethods: string[];
  if (allDoacao) {
    // Doações: usar métodos configurados no ingresso ou padrão (exceto recorrente)
    const donationTicket = selectedTickets[0];
    const configured = (donationTicket?.metodos_pagamento || []).filter(m => ['pix', 'boleto', 'credito', 'debito'].includes(m));
    allowedMethods = configured.length > 0 ? configured : ['pix', 'boleto', 'credito'];
  } else {
    allowedMethods = paidTickets[0]?.metodos_pagamento || ['pix', 'boleto', 'credito'];
    paidTickets.forEach(t => {
      const m = t.metodos_pagamento || ['pix', 'boleto', 'credito'];
      allowedMethods = allowedMethods.filter(x => m.includes(x));
    });
  }
  allowedMethods = allowedMethods.filter(m => ['pix', 'boleto', 'credito', 'debito', 'recorrente'].includes(m));

  const firstTicket = allDoacao ? selectedTickets[0] : paidTickets[0];
  const maxParcelasCredito = firstTicket?.max_parcelas_credito ?? 1;
  const maxParcelasBoleto = (firstTicket as any)?.max_parcelas_boleto ?? 1;
  const maxParcelasRecorrente = firstTicket?.max_parcelas_recorrente ?? 2;

  const needsCard = state.selectedMethod === 'credito' || state.selectedMethod === 'recorrente';
  const isGatewayPaid = gatewayConnected && total > 0;
  const canSubmit = !state.submitting && (!isGatewayPaid || (
    !!state.selectedMethod &&
    state.cpf.replace(/\D/g, '').length === 11 &&
    (!needsCard || (state.card.number.replace(/\s/g, '').length >= 13 && !!state.card.holderName && !!state.card.expiry && !!state.card.ccv))
  ));

  const methodLabels: Record<string, string> = {
    pix: 'PIX',
    boleto: 'Boleto',
    credito: 'Cartão de crédito',
    debito: 'Cartão de débito',
    recorrente: 'Recorrente',
  };
  const methodDescs: Record<string, string> = {
    pix: 'Confirmação imediata após o pagamento',
    boleto: maxParcelasBoleto > 1 ? `À vista ou em até ${maxParcelasBoleto}x — boletos mensais` : 'Boleto bancário — vence em 3 dias',
    credito: maxParcelasCredito > 1 ? `À vista ou em até ${maxParcelasCredito}x — reserva o total do limite` : 'Débito imediato no cartão',
    debito: 'Pagamento à vista no cartão de débito',
    recorrente: `Cobranças mensais de ${maxParcelasRecorrente}x — reserva apenas a parcela do mês`,
  };

  return { allowedMethods, maxParcelasCredito, maxParcelasBoleto, maxParcelasRecorrente, needsCard, isGatewayPaid, canSubmit, methodLabels, methodDescs };
}

// ─── Checkout result screen ────────────────────────────────────────────────────
const CheckoutResultBody: React.FC<{
  selectedMethod: string;
  checkoutResult: CheckoutResult;
  total: number;
  installments: number;
}> = ({ selectedMethod, checkoutResult, total, installments }) => {
  if (selectedMethod === 'pix' && checkoutResult.pixQrCode) {
    return (
      <div className="w-full space-y-4">
        <img src={`data:image/png;base64,${checkoutResult.pixQrCode.encodedImage}`} alt="QR Code PIX"
          className="w-44 h-44 mx-auto rounded-2xl border border-gray-200" />
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">PIX copia e cola</p>
          <div className="flex gap-2">
            <input readOnly value={checkoutResult.pixQrCode.payload}
              className="flex-1 font-mono text-xs rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700" />
            <button type="button" onClick={() => { navigator.clipboard.writeText(checkoutResult!.pixQrCode!.payload); toast.success('Chave copiada!'); }}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50">
              <Copy className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <p className="text-xs text-gray-400">Após o pagamento, sua inscrição é confirmada automaticamente.</p>
        </div>
      </div>
    );
  }
  if (selectedMethod === 'boleto') {
    return (
      <div className="w-full space-y-4">
        {checkoutResult.identificationField && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Linha digitável</p>
            <div className="flex gap-2">
              <input readOnly value={checkoutResult.identificationField}
                className="flex-1 font-mono text-xs rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 break-all" />
              <button type="button" onClick={() => { navigator.clipboard.writeText(checkoutResult!.identificationField!); toast.success('Código copiado!'); }}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 shrink-0">
                <Copy className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        )}
        <p className="text-xs text-gray-500">Vence em 3 dias. Pague em qualquer banco, app ou lotérica.</p>
        {checkoutResult.bankSlipUrl && (
          <a href={checkoutResult.bankSlipUrl} target="_blank" rel="noopener noreferrer">
            <button type="button" className="w-full h-11 rounded-xl border border-gray-200 text-gray-600 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 text-sm">
              Ver boleto em PDF <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </a>
        )}
        <p className="text-xs text-gray-400">Sua inscrição é confirmada automaticamente após o pagamento.</p>
      </div>
    );
  }
  if (selectedMethod === 'credito') {
    return (
      <div className="w-full space-y-3 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <p className="text-sm font-bold text-gray-700">Pagamento aprovado!</p>
        <p className="text-xs text-gray-500">
          {installments > 1
            ? `Parcelado em ${installments}x de ${formatPrice(total / installments)}. Inscrição confirmada.`
            : 'Seu cartão foi cobrado com sucesso. Inscrição confirmada.'}
        </p>
      </div>
    );
  }
  if (selectedMethod === 'recorrente') {
    return (
      <div className="w-full space-y-3 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <p className="text-sm font-bold text-gray-700">Cobrança recorrente ativada!</p>
        <p className="text-xs text-gray-500">
          1ª parcela de {formatPrice(total / installments)} cobrada agora.{' '}
          {installments > 1 && `${installments - 1} parcela(s) restante(s) cobrada(s) mensalmente.`}
        </p>
        <p className="text-xs text-gray-400">Sua inscrição será confirmada após o processamento do cartão.</p>
      </div>
    );
  }
  if (selectedMethod === 'debito') {
    return (
      <div className="w-full space-y-3 text-center">
        <p className="text-sm text-gray-600">Finalize o pagamento no link abaixo:</p>
        {checkoutResult.paymentUrl && (
          <a href={checkoutResult.paymentUrl} target="_blank" rel="noopener noreferrer">
            <button type="button" className="w-full h-11 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2 text-sm hover:opacity-90">
              Pagar com débito <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </a>
        )}
        <p className="text-xs text-gray-400">Sua inscrição é confirmada automaticamente após o pagamento.</p>
      </div>
    );
  }
  return (
    <div className="w-full space-y-3">
      <a href={checkoutResult.paymentUrl ?? undefined} target="_blank" rel="noopener noreferrer">
        <button type="button" className="w-full h-11 rounded-xl bg-primary text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
          Ir para pagamento <ExternalLink className="w-4 h-4" />
        </button>
      </a>
    </div>
  );
};

const CheckoutScreen: React.FC<{
  selectedMethod: string;
  checkoutResult: CheckoutResult;
  inscricaoId: string | null;
  total: number;
  installments: number;
  onDone: () => void;
}> = ({ selectedMethod, checkoutResult, inscricaoId, total, installments, onDone }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 px-6 py-4">
        <Logo showTagline={false} />
      </header>
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-center max-w-sm mx-auto w-full">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          {selectedMethod === 'pix'
            ? <span className="text-xl font-black text-primary">PIX</span>
            : <CreditCard className="w-8 h-8 text-primary" />}
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {selectedMethod === 'pix' ? 'Pague via PIX' : selectedMethod === 'boleto' ? 'Boleto gerado' : 'Pagamento online'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Pedido #{inscricaoId?.slice(0, 8).toUpperCase()}</p>
        </div>

        <CheckoutResultBody selectedMethod={selectedMethod} checkoutResult={checkoutResult} total={total} installments={installments} />

        <button type="button" onClick={onDone}
          className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2">
          Já realizei o pagamento
        </button>
      </div>
    </div>
  );
};

// ─── Success screen ────────────────────────────────────────────────────────────
const SuccessScreen: React.FC<{
  evento: Evento;
  isDoacaoSubmission: boolean;
  inscricaoId: string | null;
}> = ({ evento, isDoacaoSubmission, inscricaoId }) => {
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
          <h1 className="text-2xl font-black text-gray-900">
            {isDoacaoSubmission ? 'Doação registrada!' : 'Inscrição realizada!'}
          </h1>
          <p className="text-gray-500 mt-2 max-w-sm">
            {isDoacaoSubmission
              ? <>Sua doação para <strong>{evento.nome}</strong> foi recebida com sucesso. O organizador irá confirmá-la em breve.</>
              : <>Sua inscrição em <strong>{evento.nome}</strong> foi recebida com sucesso.</>
            }
          </p>
        </div>
        {inscricaoId && (
          <p className="text-xs text-gray-400 font-mono bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
            Protocolo: {inscricaoId.slice(0, 8).toUpperCase()}
          </p>
        )}
        {evento.config_comunicacao?.link_pagamento && !isDoacaoSubmission && (
          <a
            href={evento.config_comunicacao.link_pagamento}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md"
          >
            Realizar pagamento
          </a>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Logo showTagline={false} />
          <span className="text-xs text-gray-400">Powered by Tovia</span>
        </div>
      </div>
    </div>
  );
};

// ─── Form step: header ─────────────────────────────────────────────────────────
const FormStepHeader: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline text-sm">Voltar</span>
      </button>
      <a href="/" className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity">
        <span className="text-sm font-light text-gray-400 tracking-tight">feito com</span>
        <ToviaLogo className="h-7 w-auto text-primary" />
      </a>
      <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold">
        <Lock className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Compra segura</span>
      </div>
    </div>
  </header>
);

// ─── Form step: cupom de desconto ──────────────────────────────────────────────
const CupomSection: React.FC<{
  codigoCupom: string;
  setCodigoCupom: (v: string) => void;
  cupomAplicado: SalesPageState['cupomAplicado'];
  cupomLoading: boolean;
  desconto: number;
  handleValidarCupom: () => void;
  handleRemoverCupom: () => void;
}> = ({ codigoCupom, setCodigoCupom, cupomAplicado, cupomLoading, handleValidarCupom, handleRemoverCupom }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
      <Tag className="w-4 h-4 text-primary" />
      <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Cupom de desconto</h2>
    </div>
    <div className="px-6 py-5">
      {!cupomAplicado ? (
        <div className="flex gap-2">
          <Input
            placeholder="Código do cupom"
            value={codigoCupom}
            onChange={e => setCodigoCupom(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleValidarCupom())}
            className="rounded-xl border border-gray-200 bg-white h-11 text-sm font-bold tracking-wider uppercase flex-1"
            maxLength={20}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleValidarCupom}
            disabled={cupomLoading || !codigoCupom.trim()}
            className="rounded-xl h-11 px-5 font-black shrink-0 border-gray-200"
          >
            {cupomLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-orange-50 border border-primary/20 rounded-xl px-4 py-3">
          <Tag className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-black text-primary">{cupomAplicado.codigo}</p>
            <p className="text-xs text-primary">
              {cupomAplicado.tipo === 'porcentagem' ? `${cupomAplicado.valor}% de desconto` : `R$ ${cupomAplicado.valor.toFixed(2)} de desconto`}
            </p>
          </div>
          <button type="button" onClick={handleRemoverCupom} className="text-primary/60 hover:text-red-500 transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  </div>
);

// ─── Form step: tipo de doação ─────────────────────────────────────────────────
const DoacaoDestinoSection: React.FC<{
  doacaoDestino: SalesPageState['doacaoDestino'];
  setDoacaoDestino: SalesPageState['setDoacaoDestino'];
  doacaoNomeInscrito: string;
  setDoacaoNomeInscrito: (v: string) => void;
}> = ({ doacaoDestino, setDoacaoDestino, doacaoNomeInscrito, setDoacaoNomeInscrito }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shrink-0">&#10003;</div>
      <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Tipo de doação</h2>
    </div>
    <div className="px-6 py-5 space-y-3">
      <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${doacaoDestino === 'livre' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
        <input type="radio" name="doacaoDestino" value="livre" checked={doacaoDestino === 'livre'} onChange={() => setDoacaoDestino('livre')} className="accent-primary" />
        <span className="text-sm font-bold text-gray-900">Doação livre</span>
      </label>
      <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${doacaoDestino === 'inscrito' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
        <input type="radio" name="doacaoDestino" value="inscrito" checked={doacaoDestino === 'inscrito'} onChange={() => setDoacaoDestino('inscrito')} className="accent-primary" />
        <span className="text-sm font-bold text-gray-900">Doação direcionada a um inscrito</span>
      </label>
      {doacaoDestino === 'inscrito' && (
        <div className="pt-2">
          <Label className="text-xs font-bold text-gray-700 mb-1 block">Nome do participante</Label>
          <Input
            placeholder="Nome completo do inscrito"
            value={doacaoNomeInscrito}
            onChange={e => setDoacaoNomeInscrito(e.target.value)}
          />
        </div>
      )}
    </div>
  </div>
);

// ─── Form step: seletor de parcelas ────────────────────────────────────────────
const InstallmentsSelector: React.FC<{
  label: string;
  count: number;
  startAt: number;
  installments: number;
  setInstallments: (n: number) => void;
  total: number;
  optionLabel: (n: number) => string;
}> = ({ label, count, startAt, installments, setInstallments, optionLabel }) => (
  <div className="flex items-center gap-3 px-1">
    <span className="text-sm text-gray-600 font-semibold shrink-0">{label}</span>
    <select
      value={installments}
      onChange={e => setInstallments(Number(e.target.value))}
      className="flex-1 rounded-xl border border-gray-200 bg-white h-10 px-3 text-sm font-bold focus:ring-primary focus:outline-none"
    >
      {Array.from({ length: count }, (_, i) => i + startAt).map(n => (
        <option key={n} value={n}>{optionLabel(n)}</option>
      ))}
    </select>
  </div>
);

// ─── Form step: dados do cartão ────────────────────────────────────────────────
const CardFieldsSection: React.FC<{
  card: SalesPageState['card'];
  setCard: SalesPageState['setCard'];
}> = ({ card, setCard }) => (
  <div className="space-y-3 pt-3 border-t border-gray-100">
    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Dados do cartão</p>
    <Input
      placeholder="Número do cartão"
      value={card.number}
      onChange={e => {
        const v = e.target.value.replace(/\D/g, '').slice(0, 16);
        setCard(c => ({ ...c, number: v.replace(/(\d{4})(?=\d)/g, '$1 ') }));
      }}
      className="rounded-xl border-gray-200 h-11 text-sm font-mono tracking-widest"
      maxLength={19}
    />
    <Input
      placeholder="Nome como está no cartão"
      value={card.holderName}
      onChange={e => setCard(c => ({ ...c, holderName: e.target.value.toUpperCase() }))}
      className="rounded-xl border-gray-200 h-11 text-sm"
    />
    <div className="grid grid-cols-2 gap-3">
      <Input
        placeholder="Validade MM/AA"
        value={card.expiry}
        onChange={e => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 4);
          setCard(c => ({ ...c, expiry: v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v }));
        }}
        className="rounded-xl border-gray-200 h-11 text-sm"
        maxLength={5}
      />
      <Input
        placeholder="CVV"
        value={card.ccv}
        onChange={e => setCard(c => ({ ...c, ccv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
        className="rounded-xl border-gray-200 h-11 text-sm"
        maxLength={4}
        type="password"
      />
    </div>
  </div>
);

// ─── Form step: seção de pagamento ─────────────────────────────────────────────
const PaymentSection: React.FC<{
  allowedMethods: string[];
  methodLabels: Record<string, string>;
  methodDescs: Record<string, string>;
  selectedMethod: string;
  setSelectedMethod: SalesPageState['setSelectedMethod'];
  setInstallments: (n: number) => void;
  installments: number;
  maxParcelasCredito: number;
  maxParcelasBoleto: number;
  maxParcelasRecorrente: number;
  needsCard: boolean;
  card: SalesPageState['card'];
  setCard: SalesPageState['setCard'];
  total: number;
}> = ({
  allowedMethods, methodLabels, methodDescs, selectedMethod, setSelectedMethod, setInstallments,
  installments, maxParcelasCredito, maxParcelasBoleto, maxParcelasRecorrente, needsCard, card, setCard, total,
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shrink-0">3</div>
      <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Pagamento</h2>
    </div>
    <div className="px-6 py-5 space-y-3">
      {allowedMethods.map(method => (
        <button key={method} type="button"
          onClick={() => { setSelectedMethod(method); setInstallments(method === 'recorrente' ? 2 : 1); }}
          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${selectedMethod === method ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${selectedMethod === method ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
            {method === 'pix' ? 'PIX' : method === 'boleto' ? 'BOL' : method === 'debito' ? 'DÉB' : <CreditCard className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">{methodLabels[method]}</p>
            <p className="text-xs text-gray-500 mt-0.5">{methodDescs[method]}</p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selectedMethod === method ? 'border-primary' : 'border-gray-300'}`}>
            {selectedMethod === method && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
          </div>
        </button>
      ))}

      {selectedMethod === 'credito' && maxParcelasCredito > 1 && (
        <InstallmentsSelector
          label="Parcelar em:"
          count={maxParcelasCredito}
          startAt={1}
          installments={installments}
          setInstallments={setInstallments}
          total={total}
          optionLabel={n => n === 1 ? `À vista — ${formatPrice(total)}` : `${n}x de ${formatPrice(total / n)} (total ${formatPrice(total)})`}
        />
      )}

      {selectedMethod === 'boleto' && maxParcelasBoleto > 1 && (
        <InstallmentsSelector
          label="Parcelar em:"
          count={maxParcelasBoleto}
          startAt={1}
          installments={installments}
          setInstallments={setInstallments}
          total={total}
          optionLabel={n => n === 1 ? `À vista — ${formatPrice(total)}` : `${n}x de ${formatPrice(total / n)} (boletos mensais)`}
        />
      )}

      {selectedMethod === 'recorrente' && (
        <InstallmentsSelector
          label="Parcelas:"
          count={maxParcelasRecorrente - 1}
          startAt={2}
          installments={installments}
          setInstallments={setInstallments}
          total={total}
          optionLabel={n => `${n}x de ${formatPrice(total / n)} /mês`}
        />
      )}

      {needsCard && <CardFieldsSection card={card} setCard={setCard} />}
    </div>
  </div>
);

// ─── Form step: resumo do pedido (sidebar) ─────────────────────────────────────
const OrderSummarySidebar: React.FC<{
  evento: Evento;
  selectedTickets: SalesPageState['selectedTickets'];
  quantities: SalesPageState['quantities'];
  doacaoValores: SalesPageState['doacaoValores'];
  getTicketTotal: SalesPageState['getTicketTotal'];
  cupomAplicado: SalesPageState['cupomAplicado'];
  subtotal: number;
  desconto: number;
  total: number;
  canSubmit: boolean;
  submitting: boolean;
  isGatewayPaid: boolean;
  allDoacao: boolean;
  handleSubmit: SalesPageState['handleSubmit'];
}> = ({
  evento, selectedTickets, quantities, doacaoValores, getTicketTotal, cupomAplicado,
  subtotal, desconto, total, canSubmit, submitting, isGatewayPaid, allDoacao, handleSubmit,
}) => (
  <div className="hidden lg:block lg:col-span-1">
    <div className="sticky top-24 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Evento */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex gap-3 items-start">
          {evento.imagem_url ? (
            <img src={evento.imagem_url} alt={evento.nome} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <TicketIcon className="w-6 h-6 text-primary/40" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-black text-gray-900 text-sm leading-tight line-clamp-2">{evento.nome}</p>
            <p className="text-xs text-gray-500 mt-1">{formatDate(evento.data_inicio)}</p>
            {evento.local && <p className="text-xs text-gray-400 mt-0.5 truncate">{evento.local}</p>}
          </div>
        </div>
      </div>

      {/* Itens */}
      <div className="px-5 py-4 border-b border-gray-100 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Resumo do pedido</p>
        {selectedTickets.map(t => (
          <div key={t.id} className="flex justify-between items-start gap-2 text-sm">
            <span className="text-gray-600 leading-tight">
              {t.tipo === 'doacao' && t.valor_livre
                ? `Doação · ${t.nome}`
                : `${quantities[t.id]}× ${t.nome}`}
            </span>
            <span className="font-semibold text-gray-900 shrink-0">
              {t.tipo === 'doacao' && t.valor_livre
                ? formatPrice(doacaoValores[t.id] || 0)
                : formatPrice(getTicketTotal(t))}
            </span>
          </div>
        ))}
      </div>

      {/* Total + botão */}
      <div className="p-5 space-y-4">
        {cupomAplicado && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="line-through">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-primary font-bold">
              <span>Desconto ({cupomAplicado.codigo})</span>
              <span>− {formatPrice(desconto)}</span>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="font-black text-gray-900">Total</span>
          <span className="font-black text-xl text-primary">{formatPrice(total)}</span>
        </div>
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-black shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
        >
          {submitting ? 'Processando...' : isGatewayPaid ? (allDoacao ? 'Gerar cobrança de doação' : 'Gerar cobrança') : allDoacao ? 'Confirmar doação' : 'Confirmar inscrição'}
        </Button>
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Shield className="w-3 h-3" />
          <span>Dados protegidos com SSL</span>
        </div>
      </div>
    </div>
  </div>
);

// ─── Form / checkout step (whole page) ─────────────────────────────────────────
const FormStep: React.FC<{
  evento: Evento;
  pagina: PaginaVenda;
  state: SalesPageState;
}> = ({ evento, pagina, state }) => {
  const {
    setStep, formValues, setFormValues, selectedTickets, allDoacao,
    cpf, setCpf, total, codigoCupom, setCodigoCupom, cupomAplicado, cupomLoading,
    handleValidarCupom, handleRemoverCupom, doacaoDestino, setDoacaoDestino,
    doacaoNomeInscrito, setDoacaoNomeInscrito, selectedMethod, setSelectedMethod,
    setInstallments, installments, card, setCard, submitting, handleSubmit,
    quantities, doacaoValores, getTicketTotal, subtotal, desconto,
  } = state;

  const {
    allowedMethods, maxParcelasCredito, maxParcelasBoleto, maxParcelasRecorrente,
    needsCard, isGatewayPaid, canSubmit, methodLabels, methodDescs,
  } = getFormStepData(state);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <FormStepHeader onBack={() => setStep('ticket')} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Formulário (esquerda) ── */}
          <form id="checkout-form" onSubmit={handleSubmit} className="lg:col-span-2 space-y-4 self-start">

            {/* Seus dados */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shrink-0">1</div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Seus dados</h2>
              </div>
              <div className="px-6 py-5 space-y-4">
                {pagina.campos_formulario.map(campo => (
                  <FormField
                    key={campo.id}
                    campo={campo}
                    value={formValues[campo.id]}
                    onChange={v => setFormValues(prev => ({ ...prev, [campo.id]: v }))}
                  />
                ))}
              </div>
            </div>

            {/* CPF */}
            {isGatewayPaid && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shrink-0">2</div>
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Documento</h2>
                </div>
                <div className="px-6 py-5 space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    CPF <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={cpf}
                    onChange={e => setCpf(maskCPF(e.target.value))}
                    className="rounded-xl border border-gray-200 bg-white h-11 text-gray-900 text-sm"
                  />
                  <p className="text-[11px] text-gray-400">Necessário para emissão da cobrança.</p>
                </div>
              </div>
            )}

            {/* Cupom de desconto */}
            {total > 0 && (
              <CupomSection
                codigoCupom={codigoCupom}
                setCodigoCupom={setCodigoCupom}
                cupomAplicado={cupomAplicado}
                cupomLoading={cupomLoading}
                desconto={desconto}
                handleValidarCupom={handleValidarCupom}
                handleRemoverCupom={handleRemoverCupom}
              />
            )}

            {/* Tipo de doação */}
            {allDoacao && selectedTickets.some(t => t.permite_direcionada) && (
              <DoacaoDestinoSection
                doacaoDestino={doacaoDestino}
                setDoacaoDestino={setDoacaoDestino}
                doacaoNomeInscrito={doacaoNomeInscrito}
                setDoacaoNomeInscrito={setDoacaoNomeInscrito}
              />
            )}

            {/* Pagamento */}
            {isGatewayPaid && (
              <PaymentSection
                allowedMethods={allowedMethods}
                methodLabels={methodLabels}
                methodDescs={methodDescs}
                selectedMethod={selectedMethod}
                setSelectedMethod={setSelectedMethod}
                setInstallments={setInstallments}
                installments={installments}
                maxParcelasCredito={maxParcelasCredito}
                maxParcelasBoleto={maxParcelasBoleto}
                maxParcelasRecorrente={maxParcelasRecorrente}
                needsCard={needsCard}
                card={card}
                setCard={setCard}
                total={total}
              />
            )}

            {/* Botão — mobile */}
            <div className="lg:hidden space-y-2">
              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-black shadow-lg shadow-primary/20"
              >
                {submitting ? 'Processando...' : isGatewayPaid ? (allDoacao ? 'Gerar cobrança de doação' : 'Gerar cobrança') : allDoacao ? 'Confirmar doação' : 'Confirmar inscrição'}
              </Button>
              <p className="text-center text-xs text-gray-400">Ao confirmar, você concorda com os termos do evento.</p>
            </div>
          </form>

          {/* ── Resumo do pedido (direita, sticky) ── */}
          <OrderSummarySidebar
            evento={evento}
            selectedTickets={selectedTickets}
            quantities={quantities}
            doacaoValores={doacaoValores}
            getTicketTotal={getTicketTotal}
            cupomAplicado={cupomAplicado}
            subtotal={subtotal}
            desconto={desconto}
            total={total}
            canSubmit={canSubmit}
            submitting={submitting}
            isGatewayPaid={isGatewayPaid}
            allDoacao={allDoacao}
            handleSubmit={handleSubmit}
          />

        </div>
      </main>
    </div>
  );
};

// ─── Main layout: header ───────────────────────────────────────────────────────
const MainHeader: React.FC<{ organizador: UserProfile | null | undefined }> = ({ organizador }) => (
  <header className="bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-30 shadow-sm">
    <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
      {/* Esquerda: feito com tovia */}
      <a href="/" className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity">
        <span className="text-sm font-light text-gray-400 tracking-tight">feito com</span>
        <ToviaLogo className="h-7 w-auto text-primary" />
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
);

// ─── Main layout: hero ─────────────────────────────────────────────────────────
const HeroBanner: React.FC<{ evento: Evento }> = ({ evento }) => (
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
);

// ─── Main layout: description + organizer (left column) ───────────────────────
const EventDescriptionAndOrganizer: React.FC<{
  evento: Evento;
  pagina: PaginaVenda;
  organizador: UserProfile | null | undefined;
}> = ({ evento, pagina, organizador }) => (
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
);

// ─── Main layout: ticket row ────────────────────────────────────────────────────
const TicketRow: React.FC<{
  ticket: Ticket;
  qty: number;
  doacaoValor: number;
  setDoacaoValores: SalesPageState['setDoacaoValores'];
  updateQty: SalesPageState['updateQty'];
}> = ({ ticket, qty, doacaoValor, setDoacaoValores, updateQty }) => {
  const isGratuito = ticket.tipo === 'gratuito' || ticket.tipo === 'doacao' || ticket.valor === 0;
  const expired = ticket.data_limite ? new Date(ticket.data_limite) < new Date() : false;
  const isValorLivre = ticket.tipo === 'doacao' && ticket.valor_livre;
  const isPatrocinio = ticket.tipo === 'doacao' && ticket.permite_patrocinio;
  const active = isValorLivre ? doacaoValor > 0 : qty > 0;

  return (
    <div className={`px-5 py-4 transition-colors ${expired ? 'opacity-50' : active ? 'bg-primary/5' : 'hover:bg-gray-50'}`}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{ticket.nome}</p>
          {isValorLivre ? (
            <p className="text-xs text-pink-600 font-semibold mt-0.5">Valor livre — você escolhe quanto doar</p>
          ) : isPatrocinio ? (
            <p className="text-xs text-pink-600 font-semibold mt-0.5">
              {ticket.valor_patrocinio ? `${formatPrice(ticket.valor_patrocinio)} por inscrição patrocinada` : 'Patrocinar inscrições'}
            </p>
          ) : (
            <p className="text-base font-black mt-0.5" style={{ color: isGratuito ? '#16a34a' : 'inherit' }}>
              {isGratuito ? 'Gratuito' : formatPrice(ticket.valor)}
            </p>
          )}
          {ticket.data_limite && !expired && (
            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Inscrições até {formatDate(ticket.data_limite)}
            </p>
          )}
          {expired && <p className="text-[11px] text-red-400 mt-0.5 font-semibold">Encerrado</p>}
        </div>

        {/* Controle de quantidade / valor livre */}
        {!expired && (
          isValorLivre ? (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-sm text-gray-500 font-semibold">R$</span>
              <input
                type="number"
                min={0}
                step={1}
                value={doacaoValor || ''}
                onChange={e => setDoacaoValores(prev => ({ ...prev, [ticket.id]: Number(e.target.value) }))}
                className="w-24 h-9 px-2 text-sm font-bold border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none text-right"
                placeholder="0,00"
              />
            </div>
          ) : (
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
          )
        )}
      </div>
    </div>
  );
};

// ─── Main layout: ticket selection panel ───────────────────────────────────────
const TicketSelectionPanel: React.FC<{
  tickets: Ticket[];
  state: SalesPageState;
}> = ({ tickets, state }) => {
  const {
    quantities, doacaoValores, setDoacaoValores, updateQty, totalQty,
    selectedTickets, cupomAplicado, desconto, total, getTicketTotal, setStep,
  } = state;

  return (
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
        ) : tickets.map(ticket => (
          <TicketRow
            key={ticket.id}
            ticket={ticket}
            qty={quantities[ticket.id] || 0}
            doacaoValor={doacaoValores[ticket.id] || 0}
            setDoacaoValores={setDoacaoValores}
            updateQty={updateQty}
          />
        ))}
      </div>

      {/* Total + CTA */}
      <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-3">
        {totalQty > 0 && (
          <div className="space-y-1">
            {selectedTickets.map(t => (
              <div key={t.id} className="flex justify-between text-sm text-gray-600">
                {t.tipo === 'doacao' && t.valor_livre ? (
                  <>
                    <span>Doação · {t.nome}</span>
                    <span className="font-semibold">{formatPrice(doacaoValores[t.id] || 0)}</span>
                  </>
                ) : (
                  <>
                    <span>{quantities[t.id]}× {t.nome}</span>
                    <span className="font-semibold">{formatPrice(getTicketTotal(t))}</span>
                  </>
                )}
              </div>
            ))}
            {cupomAplicado && (
              <div className="flex justify-between text-xs text-primary font-bold">
                <span>Desconto ({cupomAplicado.codigo})</span>
                <span>− {formatPrice(desconto)}</span>
              </div>
            )}
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
  );
};

// ─── Main layout: security footer ──────────────────────────────────────────────
const SecurityFooter: React.FC<{ organizador: UserProfile | null | undefined }> = ({ organizador }) => (
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
    <div className="bg-sidebar px-6 py-8 mt-0">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <ToviaLogo className="h-7 w-auto text-white" />
        <p className="text-white/30 text-xs">Todos os direitos reservados · BIGLAB Solutions © 2026</p>
        <a href="/" className="text-xs text-white/40 hover:text-white/70 transition-colors">tovia.app</a>
      </div>
    </div>
  </footer>
);

// ─── Main component ─────────────────────────────────────────────────────────────
const SalesPageContent: React.FC<Props> = ({ evento, pagina, tickets, eventoId, onSuccess }) => {
  const state = useSalesPageContent({ evento, pagina, tickets, eventoId, onSuccess });
  const { step, checkoutResult, selectedMethod, inscricaoId, total, installments, isDoacaoSubmission, organizador, setStep } = state;

  // ── Checkout screen ───────────────────────────────────────────────────────
  if (step === 'checkout' && checkoutResult) {
    return (
      <CheckoutScreen
        selectedMethod={selectedMethod}
        checkoutResult={checkoutResult}
        inscricaoId={inscricaoId}
        total={total}
        installments={installments}
        onDone={() => { setStep('success'); onSuccess?.(inscricaoId!); }}
      />
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <SuccessScreen
        evento={evento}
        isDoacaoSubmission={isDoacaoSubmission}
        inscricaoId={inscricaoId}
      />
    );
  }

  // ── Form / Checkout page ─────────────────────────────────────────────────
  if (step === 'form') {
    return <FormStep evento={evento} pagina={pagina} state={state} />;
  }

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <MainHeader organizador={organizador} />
      <HeroBanner evento={evento} />

      {/* ── Main grid ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        <EventDescriptionAndOrganizer evento={evento} pagina={pagina} organizador={organizador} />

        {/* ── RIGHT: ticket panel (sticky) ── */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <div className="sticky top-20">
            {step === 'ticket' && (
              <TicketSelectionPanel tickets={tickets} state={state} />
            )}
          </div>
        </div>
      </div>

      <SecurityFooter organizador={organizador} />
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
      {campo.tipo === 'select' && (
        <Select value={String(value || '')} onValueChange={v => onChange(v ?? '')}>
          <SelectTrigger className={inputClass}>
            <SelectValue placeholder={campo.placeholder || 'Selecione...'} />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-gray-200 shadow-xl z-[9999]">
            {(campo.opcoes || []).length > 0
              ? campo.opcoes!.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)
              : <SelectItem value="__empty__" disabled>Nenhuma opção disponível</SelectItem>
            }
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
          required={campo.obrigatorio}
          placeholder={campo.placeholder}
          value={String(value || '')}
          maxLength={campo.tipo === 'telefone' ? 15 : campo.label.toLowerCase().includes('cpf') ? 14 : undefined}
          onChange={e => {
            const v = e.target.value;
            if (campo.tipo === 'telefone') return onChange(maskTelefone(v));
            if (campo.label.toLowerCase().includes('cpf')) return onChange(maskCPF(v));
            onChange(v);
          }}
          className={inputClass}
        />
      )}
    </div>
  );
}
