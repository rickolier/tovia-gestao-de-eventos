import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '~/context/AuthContext';
import { PlanLevel } from '~/types';
import { PLAN_CONFIGS } from '~/utils/plan-limits';
import Logo from '~/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, ArrowRight, TicketIcon, DollarSign, Wallet, Zap, CreditCard, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MODULE_ICONS = [TicketIcon, DollarSign, Wallet];
const MODULE_LABELS = ['Inscrições', 'Financeiro', 'Gestão do Evento'];

type Period = 'monthly' | 'annual';
type PaymentMethod = 'credit_card' | 'pix';

function maskCpfCnpj(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

function maskCep(value: string) {
  return value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d{0,3})/, '$1-$2');
}

export default function CheckoutPlano() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { planLevel: PlanLevel; period: Period; paymentMethod: PaymentMethod } | null;
  const planLevel: PlanLevel = state?.planLevel || 'petach';
  const period: Period = state?.period || 'monthly';
  const paymentMethod: PaymentMethod = state?.paymentMethod || 'credit_card';

  const config = PLAN_CONFIGS[planLevel];
  const price = period === 'annual' ? config.price.annualMonthLabel : config.price.monthlyLabel;
  const totalLabel = period === 'annual' ? config.price.annualTotalLabel : '';
  const moduleCount = config.modulesCount;

  const [form, setForm] = useState({
    nome: profile?.nome || user?.displayName || '',
    cpfCnpj: profile?.cnpj || '',
    telefone: profile?.telefone || '',
    cep: profile?.cep || '',
    endereco: profile?.endereco || '',
    numero: profile?.numero || '',
    complemento: profile?.complemento || '',
    bairro: profile?.bairro || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cpfDigits = form.cpfCnpj.replace(/\D/g, '');
    if (cpfDigits.length !== 11 && cpfDigits.length !== 14) {
      toast.error('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.');
      return;
    }

    setSaving(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/createCheckout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          planLevel,
          period,
          paymentMethod,
          userId: user.uid,
          userName: form.nome || user.email || '',
          userEmail: user.email || '',
          userCpfCnpj: form.cpfCnpj,
          userPhone: form.telefone,
          userCep: form.cep,
          userEndereco: form.endereco,
          userNumero: form.numero,
          userComplemento: form.complemento,
          userBairro: form.bairro,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao processar.');
      if (data.paymentUrl) {
        toast.success('Redirecionando para o pagamento...');
        window.open(data.paymentUrl, '_blank');
        navigate('/planos/aguardando');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao processar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCepBlur = async () => {
    const digits = form.cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          endereco: data.logradouro || prev.endereco,
          bairro: data.bairro || prev.bairro,
        }));
      }
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      {/* Header */}
      <div className="bg-[var(--sidebar)] px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-white/60 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex-1 flex justify-center">
          <Logo variant="white" />
        </div>
        <div className="w-20" />
      </div>

      {/* Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

        {/* Left — Billing form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h1 className="text-2xl font-black text-foreground">Dados de cobrança</h1>
            <p className="text-sm text-muted-foreground mt-1">Preencha os dados para gerar o link de pagamento.</p>
          </div>

          {/* Identification */}
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Identificação</h2>

            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input
                id="nome"
                required
                value={form.nome}
                onChange={e => set('nome', e.target.value)}
                placeholder="Seu nome completo"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cpfCnpj">CPF ou CNPJ *</Label>
                <Input
                  id="cpfCnpj"
                  required
                  value={form.cpfCnpj}
                  onChange={e => set('cpfCnpj', maskCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={e => set('telefone', maskPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Endereço <span className="font-normal normal-case tracking-normal">(opcional)</span></h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={form.cep}
                  onChange={e => set('cep', maskCep(e.target.value))}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={form.bairro}
                  onChange={e => set('bairro', e.target.value)}
                  placeholder="Bairro"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_100px] gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={form.endereco}
                  onChange={e => set('endereco', e.target.value)}
                  placeholder="Rua, Avenida..."
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={form.numero}
                  onChange={e => set('numero', e.target.value)}
                  placeholder="Nº"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={form.complemento}
                onChange={e => set('complemento', e.target.value)}
                placeholder="Apto, sala, bloco..."
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          {/* Payment method info */}
          <div className="bg-card rounded-2xl border p-6 space-y-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Forma de pagamento</h2>
            {period === 'monthly' ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <CreditCard className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">Cartão de crédito</p>
                  <p className="text-xs text-muted-foreground">Assinatura mensal recorrente — você insere os dados do cartão na próxima etapa</p>
                </div>
              </div>
            ) : paymentMethod === 'pix' ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <QrCode className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">PIX à vista</p>
                  <p className="text-xs text-muted-foreground">Pagamento único anual via PIX</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <CreditCard className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">Cartão de crédito — 12x sem juros</p>
                  <p className="text-xs text-muted-foreground">Você insere os dados do cartão na próxima etapa</p>
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="w-full h-13 rounded-2xl font-black uppercase tracking-widest text-sm bg-primary hover:bg-primary/90 text-white disabled:opacity-40 shadow-lg"
            style={{ height: '52px' }}
          >
            {saving
              ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processando...</>
              : <>Gerar link de pagamento <ArrowRight className="w-5 h-5 ml-2" /></>}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Ao continuar você será redirecionado para a página de pagamento seguro do Asaas.
          </p>
        </form>

        {/* Right — Plan summary */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <div className="bg-card rounded-2xl border overflow-hidden">
            {/* Plan header */}
            {planLevel === 'chalem' && (
              <div className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-xs font-bold">
                <Zap className="w-3.5 h-3.5" />
                Único com pagamentos automáticos
              </div>
            )}
            <div className="p-6 space-y-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-primary/10 text-primary">
                  {config.name}
                </span>
                <h3 className="text-xl font-black text-foreground mt-3">{config.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black text-primary">{price}</span>
                </div>
                {totalLabel && (
                  <p className="text-xs text-muted-foreground mt-0.5">{totalLabel} · cobrado anualmente</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {period === 'monthly' ? 'Assinatura mensal — cancele quando quiser' : 'Pagamento único anual'}
                </p>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Módulos incluídos</p>
                {MODULE_LABELS.map((mod, i) => {
                  const Icon = MODULE_ICONS[i];
                  const active = i < moduleCount;
                  return (
                    <div key={mod} className={cn('flex items-center gap-3', !active && 'opacity-30')}>
                      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', active ? 'bg-primary/10' : 'bg-muted')}>
                        <Icon className={cn('w-4 h-4', active ? 'text-primary' : 'text-muted-foreground')} />
                      </div>
                      <p className={cn('text-sm font-semibold text-foreground', !active && 'line-through')}>{mod}</p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground">{config.limitsLabel}</p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-2xl p-4 text-xs text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground">Pagamento seguro</p>
            <p>Processado pelo Asaas — plataforma brasileira de pagamentos regulamentada pelo Banco Central.</p>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-[var(--sidebar)] py-8 px-6 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start gap-0.5">
            <span className="text-xl font-black text-white tracking-tight">tovia</span>
            <span className="text-xs text-white/40">Gestão de Eventos</span>
          </div>
          <p className="text-white/30 text-xs text-center">Todos os direitos reservados · BIGLAB Solutions © 2026</p>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            <a href="mailto:suporte@toviaapp.com.br" className="text-xs text-white/40 hover:text-white/70 transition-colors">suporte@toviaapp.com.br</a>
            <a href="/privacidade" className="text-xs text-white/40 hover:text-white/70 transition-colors">Privacidade</a>
            <a href="/termos-de-uso" className="text-xs text-white/40 hover:text-white/70 transition-colors">Termos de Uso</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
