import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, CreditCard, DollarSign, Percent, TrendingUp, Info, ArrowUpFromLine, ArrowDownToLine, Check, Loader2 } from 'lucide-react';
import { Evento } from '~/types';
import { updateDocument } from '~/services/firestore';
import { toast } from 'sonner';

interface Props {
  evento: Evento;
  onUpdate?: () => void;
}

export default function CalculatorTab({ evento, onUpdate }: Props) {
  const [venueCostType, setVenueCostType] = useState<'total' | 'per_person'>('total');
  const [venueValue, setVenueValue] = useState<number>(0);
  const [minParticipants, setMinParticipants] = useState<number>(0);
  const [maxParticipants, setMaxParticipants] = useState<number>(0);

  const [marginType, setMarginType] = useState<'percentage' | 'fixed'>('percentage');
  const [marginValue, setMarginValue] = useState<number>(10);

  const [taxaAbsorbida, setTaxaAbsorbida] = useState<'pagador' | 'margem'>('pagador');

  // Taxas Asaas — defaults públicos do site deles
  const [pixFee, setPixFee] = useState<number>(1.99);         // R$ fixo por transação
  const [boletoFee, setBoletoFee] = useState<number>(1.99);   // R$ fixo por boleto
  const [creditFee, setCreditFee] = useState<number>(2.99);   // % à vista
  const [recurringFee, setRecurringFee] = useState<number>(2.49); // % por parcela recorrente

  const [results, setResults] = useState({
    totalVenueCost: 0,
    costPerPersonMin: 0,
    costPerPersonMax: 0,
    suggestedPricePix: 0,
    suggestedPriceBoleto: 0,
    suggestedPriceCredit: 0,
    suggestedPriceRecurring: 0,
    marginAmountPerPerson: 0,
  });

  useEffect(() => {
    const avg = (minParticipants + maxParticipants) / 2 || maxParticipants || minParticipants || 1;

    let totalVenueCost = 0;
    let costPerPerson = 0;
    let costPerPersonMin = 0;
    let costPerPersonMax = 0;

    if (venueCostType === 'total') {
      totalVenueCost = venueValue;
      costPerPerson = totalVenueCost / avg;
      costPerPersonMin = maxParticipants > 0 ? totalVenueCost / maxParticipants : 0;
      costPerPersonMax = minParticipants > 0 ? totalVenueCost / minParticipants : 0;
    } else {
      costPerPerson = venueValue;
      totalVenueCost = venueValue * avg;
      costPerPersonMin = venueValue;
      costPerPersonMax = venueValue;
    }

    const marginAmount =
      marginType === 'percentage' ? costPerPerson * (marginValue / 100) : marginValue;

    const base = costPerPerson + marginAmount;

    // Preço sugerido por método:
    // pagador = participante paga a taxa em cima do base (organizer recebe base)
    // margem  = participante paga o base (organizer paga a taxa do próprio bolso)
    const calcPct = (fee: number) =>
      taxaAbsorbida === 'pagador' ? (fee >= 100 ? 0 : base / (1 - fee / 100)) : base;

    const calcFixed = (fee: number) =>
      taxaAbsorbida === 'pagador' ? base + fee : base;

    setResults({
      totalVenueCost,
      costPerPersonMin,
      costPerPersonMax,
      suggestedPricePix: calcFixed(pixFee),
      suggestedPriceBoleto: calcFixed(boletoFee),
      suggestedPriceCredit: calcPct(creditFee),
      suggestedPriceRecurring: calcPct(recurringFee),
      marginAmountPerPerson: marginAmount,
    });
  }, [venueCostType, venueValue, minParticipants, maxParticipants, marginType, marginValue,
      taxaAbsorbida, pixFee, boletoFee, creditFee, recurringFee]);

  const [savingMargem, setSavingMargem] = useState(false);
  const [margemSalva, setMargemSalva] = useState(false);

  const handleAplicarMargem = async () => {
    if (!results.marginAmountPerPerson) return;
    setSavingMargem(true);
    try {
      await updateDocument('eventos', evento.id, { margem_por_inscricao: results.marginAmountPerPerson });
      setMargemSalva(true);
      onUpdate?.();
      toast.success(`Margem de ${fmt(results.marginAmountPerPerson)} aplicada ao evento!`);
      setTimeout(() => setMargemSalva(false), 3000);
    } catch { toast.error('Erro ao salvar margem.'); }
    finally { setSavingMargem(false); }
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const taxaOpts = [
    {
      value: 'pagador' as const,
      title: 'Taxas pelo Participante',
      desc: 'A taxa é somada ao valor base. Você recebe o valor base integralmente.',
      icon: <ArrowUpFromLine className="w-4 h-4" />,
      color: 'amber',
    },
    {
      value: 'margem' as const,
      title: 'Taxas pela Sua Margem',
      desc: 'O participante paga o valor base. A taxa é descontada da sua margem.',
      icon: <ArrowDownToLine className="w-4 h-4" />,
      color: 'primary',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="tab-page-header">
        <div><h2>Calculadora</h2><p>Calcule o valor ideal do ingresso para cobrir seus custos.</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-4">
          {/* Custos */}
          <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-muted/30">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-black text-foreground tracking-tight">Custos do Evento</h3>
            </div>
            <CardContent className="p-5 space-y-5">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
                    Forma de cálculo do custo
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/50">
                    {(['total', 'per_person'] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => setVenueCostType(v)}
                        className={`py-2 px-3 rounded-lg text-xs font-black transition-all ${
                          venueCostType === v ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/60'
                        }`}
                      >
                        {v === 'total' ? 'VALOR TOTAL' : 'POR VAGA'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {venueCostType === 'total' ? 'Custo Total do Evento (R$)' : 'Custo por Inscrição/Vaga (R$)'}
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="pl-10 h-10 rounded-xl border-border bg-muted/20 font-bold"
                        value={venueValue || ''}
                        onChange={e => setVenueValue(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Vagas Mínimas', val: minParticipants, set: setMinParticipants },
                      { label: 'Vagas Máximas', val: maxParticipants, set: setMaxParticipants },
                    ].map(({ label, val, set }) => (
                      <div key={label} className="grid gap-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</Label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="0"
                            className="pl-10 h-10 rounded-xl border-border bg-muted/20 font-medium"
                            value={val || ''}
                            onChange={e => set(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Margem */}
              <div className="space-y-4 pt-4 border-t border-border/60">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
                    Margem Desejada
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/50">
                    {(['percentage', 'fixed'] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => setMarginType(v)}
                        className={`py-2 px-3 rounded-lg text-xs font-black transition-all ${
                          marginType === v ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/60'
                        }`}
                      >
                        {v === 'percentage' ? 'PORCENTAGEM (%)' : 'VALOR FIXO (R$)'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {marginType === 'percentage' ? 'Margem (%)' : 'Margem (R$)'}
                  </Label>
                  <div className="relative">
                    {marginType === 'percentage'
                      ? <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      : <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
                    <Input
                      type="number"
                      placeholder={marginType === 'percentage' ? '10' : '50.00'}
                      className="pl-10 h-10 rounded-xl border-border bg-muted/20 font-medium"
                      value={marginValue || ''}
                      onChange={e => setMarginValue(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Quem absorve */}
              <div className="space-y-3 pt-4 border-t border-border/60">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Percent className="w-3 h-3 text-primary" /> Quem paga a taxa do gateway?
                </Label>
                <div className="grid gap-1.5">
                  {taxaOpts.map(opt => {
                    const active = taxaAbsorbida === opt.value;
                    const isAmber = opt.color === 'amber';
                    return (
                      <div
                        key={opt.value}
                        onClick={() => setTaxaAbsorbida(opt.value)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                          active
                            ? isAmber ? 'border-amber-400 bg-amber-50' : 'border-primary bg-orange-50'
                            : 'border-transparent bg-muted/40 hover:bg-muted/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            active ? (isAmber ? 'bg-amber-400 text-white' : 'bg-orange-500 text-white') : 'bg-muted text-muted-foreground'
                          }`}>
                            {opt.icon}
                          </div>
                          <div className="flex-1">
                            <p className={`text-xs font-black uppercase tracking-widest ${
                              active ? (isAmber ? 'text-amber-700' : 'text-primary') : 'text-foreground'
                            }`}>{opt.title}</p>
                            <p className="text-[11px] text-muted-foreground font-medium">{opt.desc}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            active ? (isAmber ? 'border-amber-400' : 'border-primary') : 'border-muted-foreground'
                          }`}>
                            {active && <div className={`w-2 h-2 rounded-full ${isAmber ? 'bg-amber-400' : 'bg-orange-500'}`} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Taxas Asaas */}
              <div className="pt-4 border-t border-border/60 space-y-3">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-0.5">
                    Taxas do Asaas (seu contrato)
                  </Label>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Valores padrão do Asaas. Ajuste se seu plano for diferente.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">PIX (R$ fixo)</Label>
                    <Input
                      type="number" step="0.01"
                      className="h-10 rounded-xl bg-muted/20 font-bold text-center"
                      value={pixFee}
                      onChange={e => setPixFee(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">BOLETO (R$ fixo)</Label>
                    <Input
                      type="number" step="0.01"
                      className="h-10 rounded-xl bg-muted/20 font-bold text-center"
                      value={boletoFee}
                      onChange={e => setBoletoFee(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CRÉDITO (%)</Label>
                    <Input
                      type="number" step="0.01"
                      className="h-10 rounded-xl bg-muted/20 font-bold text-center"
                      value={creditFee}
                      onChange={e => setCreditFee(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">RECORRENTE (%)</Label>
                    <Input
                      type="number" step="0.01"
                      className="h-10 rounded-xl bg-muted/20 font-bold text-center"
                      value={recurringFee}
                      onChange={e => setRecurringFee(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-5">
          <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-foreground">
              <h3 className="text-sm font-black text-white tracking-tight">Resultado do Cálculo</h3>
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
            </div>
            <CardContent className="p-5 space-y-5">
              {/* Custo médio */}
              <div className="text-center space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                  Custo Médio por Vaga
                </span>
                <div className="text-3xl font-black text-foreground tracking-tight">
                  {fmt((results.costPerPersonMin + results.costPerPersonMax) / 2)}
                </div>
              </div>

              {/* Faixa + margem */}
              <div className="space-y-2">
                {results.costPerPersonMin !== results.costPerPersonMax && (
                  <div className="bg-muted/40 px-4 py-3 rounded-xl border border-border/50 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Faixa Min–Max</span>
                      <span className="text-sm font-black text-foreground">
                        {fmt(results.costPerPersonMin)} — {fmt(results.costPerPersonMax)}
                      </span>
                    </div>
                    <Info className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                )}
                <div className="bg-primary px-4 py-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/60 block">Sua Margem</span>
                    <span className="text-xl font-black text-white">{fmt(results.marginAmountPerPerson)}</span>
                  </div>
                  <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest">por inscrição</span>
                </div>
              </div>

              {/* Preço sugerido por canal */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {taxaAbsorbida === 'pagador' ? 'Cobrar do participante' : 'Participante paga (você absorve a taxa)'}
                </h4>
                <div className="space-y-2">
                  {[
                    { label: 'PIX',        price: results.suggestedPricePix,       fee: `R$ ${pixFee.toFixed(2)}`,  color: 'bg-orange-500/10 text-primary' },
                    { label: 'Boleto',     price: results.suggestedPriceBoleto,    fee: fmt(boletoFee),       color: 'bg-amber-500/10 text-amber-600' },
                    { label: 'Crédito',    price: results.suggestedPriceCredit,    fee: `${creditFee}%`,      color: 'bg-primary text-white', highlight: true },
                    { label: 'Recorrente', price: results.suggestedPriceRecurring, fee: `${recurringFee}%`,   color: 'bg-purple-500/10 text-purple-600' },
                  ].map(({ label, price, fee, color, highlight }) => (
                    <div
                      key={label}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                        highlight ? 'bg-primary/10 border-primary/20' : 'bg-card border-border/50 hover:border-primary/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <span className={`text-xs font-black uppercase tracking-wider ${highlight ? 'text-primary' : 'text-foreground'}`}>
                            {label}
                          </span>
                          <span className="block text-[9px] text-muted-foreground font-medium">taxa: {fee}</span>
                        </div>
                      </div>
                      <span className={`text-base font-black ${highlight ? 'text-primary' : 'text-foreground'}`}>
                        {fmt(price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aplicar margem ao evento */}
              {results.marginAmountPerPerson > 0 && (
                <div className="pt-4 border-t border-border/60">
                  <button
                    onClick={handleAplicarMargem}
                    disabled={savingMargem}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white text-sm font-black hover:bg-primary/90 transition-all active:scale-[0.98] shadow-md shadow-primary/20 disabled:opacity-60"
                  >
                    {savingMargem ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                    ) : margemSalva ? (
                      <><Check className="w-4 h-4" /> Margem aplicada!</>
                    ) : (
                      <><TrendingUp className="w-4 h-4" /> Aplicar {fmt(results.marginAmountPerPerson)}/inscrição nos Recursos</>
                    )}
                  </button>
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    Salva a margem calculada em Recursos e ativa o painel de saúde financeira.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="bg-muted/30 px-5 py-4 rounded-xl border border-border/50 text-center">
        <p className="text-xs text-muted-foreground font-medium max-w-2xl mx-auto">
          Taxas padrão do Asaas: PIX R$ 1,99 fixo · Boleto R$ 1,99 fixo · Crédito 2,99% + R$ 0,49 · Recorrente 2,49%.
          Esses valores podem variar conforme seu plano contratado. Consulte seu painel Asaas para confirmar.
        </p>
      </div>
    </div>
  );
}
