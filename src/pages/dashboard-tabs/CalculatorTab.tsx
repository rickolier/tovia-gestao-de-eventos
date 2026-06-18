import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, Users, CreditCard, DollarSign, Percent, TrendingUp, Info, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function CalculatorTab() {
  const navigate = useNavigate();
  const [venueCostType, setVenueCostType] = useState<'total' | 'per_person'>('total');
  const [venueValue, setVenueValue] = useState<number>(0);
  const [minParticipants, setMinParticipants] = useState<number>(0);
  const [maxParticipants, setMaxParticipants] = useState<number>(0);

  const [marginType, setMarginType] = useState<'percentage' | 'fixed'>('percentage');
  const [marginValue, setMarginValue] = useState<number>(10);

  const [pixFee, setPixFee] = useState<number>(0.99);
  const [debitFee, setDebitFee] = useState<number>(1.99);
  const [creditFee, setCreditFee] = useState<number>(3.99);
  const [recurringFee, setRecurringFee] = useState<number>(4.99);

  const [results, setResults] = useState({
    totalVenueCost: 0,
    costPerPersonMin: 0,
    costPerPersonMax: 0,
    suggestedPricePix: 0,
    suggestedPriceDebit: 0,
    suggestedPriceCredit: 0,
    suggestedPriceRecurring: 0,
    marginAmountPerPerson: 0
  });

  useEffect(() => {
    const calculate = () => {
      const avgParticipants = (minParticipants + maxParticipants) / 2 || maxParticipants || minParticipants || 1;

      let totalVenueCost = 0;
      let costPerPerson = 0;
      let costPerPersonMinLimit = 0;
      let costPerPersonMaxLimit = 0;

      if (venueCostType === 'total') {
        totalVenueCost = venueValue;
        costPerPerson = totalVenueCost / avgParticipants;
        costPerPersonMinLimit = maxParticipants > 0 ? totalVenueCost / maxParticipants : 0;
        costPerPersonMaxLimit = minParticipants > 0 ? totalVenueCost / minParticipants : 0;
      } else {
        costPerPerson = venueValue;
        totalVenueCost = venueValue * avgParticipants;
        costPerPersonMinLimit = venueValue;
        costPerPersonMaxLimit = venueValue;
      }

      let marginAmount = 0;
      if (marginType === 'percentage') {
        marginAmount = costPerPerson * (marginValue / 100);
      } else {
        marginAmount = marginValue;
      }

      const basePrice = costPerPerson + marginAmount;

      const calcFinalPrice = (base: number, fee: number) => {
        if (fee >= 100) return 0;
        return base / (1 - fee / 100);
      };

      setResults({
        totalVenueCost,
        costPerPersonMin: costPerPersonMinLimit,
        costPerPersonMax: costPerPersonMaxLimit,
        suggestedPricePix: calcFinalPrice(basePrice, pixFee),
        suggestedPriceDebit: calcFinalPrice(basePrice, debitFee),
        suggestedPriceCredit: calcFinalPrice(basePrice, creditFee),
        suggestedPriceRecurring: calcFinalPrice(basePrice, recurringFee),
        marginAmountPerPerson: marginAmount
      });
    };

    calculate();
  }, [venueCostType, venueValue, minParticipants, maxParticipants, marginType, marginValue, pixFee, debitFee, creditFee, recurringFee]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Calculadora de Custos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Planeje seu evento com precisão e defina o preço ideal por forma de pagamento.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
            {/* Card header */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-muted/30">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-black text-foreground tracking-tight">Definição de Custos</h3>
            </div>

            <CardContent className="p-5 space-y-5">
              {/* Venue Cost Section */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Forma de cálculo do local</Label>
                  <div className="grid grid-cols-2 gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/50">
                    <button
                      onClick={() => setVenueCostType('total')}
                      className={`py-2 px-3 rounded-lg text-xs font-black transition-all ${venueCostType === 'total' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/60'}`}
                    >
                      VALOR TOTAL
                    </button>
                    <button
                      onClick={() => setVenueCostType('per_person')}
                      className={`py-2 px-3 rounded-lg text-xs font-black transition-all ${venueCostType === 'per_person' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/60'}`}
                    >
                      POR VAGA
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="venueValue" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {venueCostType === 'total' ? 'Custo Total do Contrato (R$)' : 'Custo por Inscrição/Vaga (R$)'}
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="venueValue"
                        type="number"
                        placeholder="0.00"
                        className="pl-10 h-10 rounded-xl border-border bg-muted/20 focus:bg-background transition-all font-bold"
                        value={venueValue || ''}
                        onChange={(e) => setVenueValue(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="minParticipants" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Vagas Mínimas</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="minParticipants"
                          type="number"
                          placeholder="0"
                          className="pl-10 h-10 rounded-xl border-border bg-muted/20 focus:bg-background transition-all font-medium"
                          value={minParticipants || ''}
                          onChange={(e) => setMinParticipants(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="maxParticipants" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Vagas Máximas</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="maxParticipants"
                          type="number"
                          placeholder="0"
                          className="pl-10 h-10 rounded-xl border-border bg-muted/20 focus:bg-background transition-all font-medium"
                          value={maxParticipants || ''}
                          onChange={(e) => setMaxParticipants(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Margin Section */}
              <div className="space-y-4 pt-4 border-t border-border/60">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Tipo de Margem Desejada</Label>
                  <div className="grid grid-cols-2 gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/50">
                    <button
                      onClick={() => setMarginType('percentage')}
                      className={`py-2 px-3 rounded-lg text-xs font-black transition-all ${marginType === 'percentage' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/60'}`}
                    >
                      PORCENTAGEM (%)
                    </button>
                    <button
                      onClick={() => setMarginType('fixed')}
                      className={`py-2 px-3 rounded-lg text-xs font-black transition-all ${marginType === 'fixed' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/60'}`}
                    >
                      VALOR FIXO (R$)
                    </button>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="marginValue" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {marginType === 'percentage' ? 'Margem Adicional (%)' : 'Margem Adicional em Reais (R$)'}
                  </Label>
                  <div className="relative">
                    {marginType === 'percentage' ? (
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    ) : (
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    )}
                    <Input
                      id="marginValue"
                      type="number"
                      placeholder={marginType === 'percentage' ? "10" : "50.00"}
                      className="pl-10 h-10 rounded-xl border-border bg-muted/20 focus:bg-background transition-all font-medium"
                      value={marginValue || ''}
                      onChange={(e) => setMarginValue(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Fees Section */}
              <div className="pt-4 border-t border-border/60">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 block">Taxas por forma de pagamento (%)</Label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'PIX', value: pixFee, onChange: setPixFee },
                    { label: 'DÉBITO', value: debitFee, onChange: setDebitFee },
                    { label: 'CRÉDITO', value: creditFee, onChange: setCreditFee },
                    { label: 'CORRENTE', value: recurringFee, onChange: setRecurringFee },
                  ].map(({ label, value, onChange }) => (
                    <div key={label} className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground">{label}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-10 rounded-xl bg-muted/20 font-bold text-center"
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                      />
                    </div>
                  ))}
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
              {/* Cost Highlight */}
              <div className="text-center space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Custo Médio por Vaga</span>
                <div className="text-3xl font-black text-foreground tracking-tight">
                  {formatCurrency((results.costPerPersonMin + results.costPerPersonMax) / 2)}
                </div>
              </div>

              {/* Min-Max + Margin */}
              <div className="space-y-2">
                {results.costPerPersonMin !== results.costPerPersonMax && (
                  <div className="bg-muted/40 px-4 py-3 rounded-xl border border-border/50 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Faixa Min–Max</span>
                      <span className="text-sm font-black text-foreground">
                        {formatCurrency(results.costPerPersonMin)} — {formatCurrency(results.costPerPersonMax)}
                      </span>
                    </div>
                    <Info className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                )}

                <div className="bg-primary px-4 py-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/60 block">Sua Margem</span>
                    <span className="text-xl font-black text-white">{formatCurrency(results.marginAmountPerPerson)}</span>
                  </div>
                  <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest">por inscrição</span>
                </div>
              </div>

              {/* Payment channels */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preço por canal de pagamento</h4>

                <div className="space-y-2">
                  {[
                    { label: 'Via PIX', price: results.suggestedPricePix, color: 'bg-emerald-500/10 text-emerald-600', highlight: false },
                    { label: 'Via Débito', price: results.suggestedPriceDebit, color: 'bg-blue-500/10 text-blue-600', highlight: false },
                    { label: 'Crédito', price: results.suggestedPriceCredit, color: 'bg-primary text-white', highlight: true },
                    { label: 'Recorrente', price: results.suggestedPriceRecurring, color: 'bg-purple-500/10 text-purple-600', highlight: false },
                  ].map(({ label, price, color, highlight }) => (
                    <div
                      key={label}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${highlight ? 'bg-primary/10 border-primary/20' : 'bg-card border-border/50 hover:border-primary/20'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <span className={`text-xs font-black uppercase tracking-wider ${highlight ? 'text-primary' : 'text-foreground'}`}>{label}</span>
                          {highlight && <span className="block text-[8px] font-black text-primary/50 uppercase tracking-widest">Recomendado</span>}
                        </div>
                      </div>
                      <span className={`text-base font-black ${highlight ? 'text-primary' : 'text-foreground'}`}>{formatCurrency(price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <Button
          onClick={() => {
            sessionStorage.setItem('tovia_calc_config', JSON.stringify({
              pixFee, creditFee, debitFee, recurringFee,
              maxParticipants, minParticipants, results,
            }));
            navigate('/eventos/novo');
          }}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-8 font-black text-sm shadow-sm gap-2"
        >
          <Plus className="w-4 h-4" />
          Criar evento com essas configurações
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="bg-muted/30 px-5 py-4 rounded-xl border border-border/50 text-center">
        <p className="text-xs text-muted-foreground font-medium max-w-2xl mx-auto">
          Estes cálculos são estimativas baseadas nos valores fornecidos. Podem haver variações dependendo de outros custos não listados. Recomendamos sempre uma margem de segurança para imprevistos.
        </p>
      </div>
    </div>
  );
}
