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
        // per person
        costPerPerson = venueValue;
        totalVenueCost = venueValue * avgParticipants;
        costPerPersonMinLimit = venueValue; // stays same per person
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
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
          <Calculator className="w-8 h-8 text-primary" />
          Calculadora de Custos
        </h2>
        <p className="text-muted-foreground text-sm font-medium">
          Planeje seu evento com precisão. Escolha como deseja calcular e defina seu valor ideal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-none shadow-[0_8px_40px_rgba(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden">
            <div className="bg-primary p-6 text-white">
              <h3 className="font-black text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-white/70" />
                Definição de Custos
              </h3>
            </div>
            <CardContent className="p-8 space-y-8">
              {/* Venue Cost Section */}
              <div className="space-y-6">
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">Forma de cálculo do Local</Label>
                  <div className="grid grid-cols-2 gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
                    <button 
                      onClick={() => setVenueCostType('total')}
                      className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all ${venueCostType === 'total' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted/50'}`}
                    >
                      VALOR TOTAL
                    </button>
                    <button 
                      onClick={() => setVenueCostType('per_person')}
                      className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all ${venueCostType === 'per_person' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted/50'}`}
                    >
                      POR VAGA
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="venueValue" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {venueCostType === 'total' ? 'Custo Total do Contrato (R$)' : 'Custo por Inscrição/Vaga (R$)'}
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="venueValue"
                        type="number" 
                        placeholder="0.00"
                        className="pl-10 h-14 rounded-2xl border-border bg-muted/20 focus:bg-background transition-all font-black text-lg"
                        value={venueValue || ''}
                        onChange={(e) => setVenueValue(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="minParticipants" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vagas Mínimas</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="minParticipants"
                          type="number" 
                          placeholder="0"
                          className="pl-10 h-14 rounded-2xl border-border bg-muted/20 focus:bg-background transition-all font-bold"
                          value={minParticipants || ''}
                          onChange={(e) => setMinParticipants(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="maxParticipants" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vagas Máximas</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="maxParticipants"
                          type="number" 
                          placeholder="0"
                          className="pl-10 h-14 rounded-2xl border-border bg-muted/20 focus:bg-background transition-all font-bold"
                          value={maxParticipants || ''}
                          onChange={(e) => setMaxParticipants(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Margin Section */}
              <div className="space-y-6 pt-6 border-t border-dashed border-border/80">
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">Tipo de Margem Desejada</Label>
                  <div className="grid grid-cols-2 gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
                    <button 
                      onClick={() => setMarginType('percentage')}
                      className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all ${marginType === 'percentage' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted/50'}`}
                    >
                      PORCENTAGEM (%)
                    </button>
                    <button 
                      onClick={() => setMarginType('fixed')}
                      className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all ${marginType === 'fixed' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted/50'}`}
                    >
                      VALOR FIXO (R$)
                    </button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="marginValue" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
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
                      className="pl-10 h-14 rounded-2xl border-border bg-muted/20 focus:bg-background transition-all font-bold"
                      value={marginValue || ''}
                      onChange={(e) => setMarginValue(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Fees Section */}
              <div className="pt-6 border-t border-dashed border-border/80">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Taxas de Operação das Formas de Pagamento (%)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold text-muted-foreground">PIX</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      className="h-12 rounded-xl bg-muted/20 font-bold text-center" 
                      value={pixFee} 
                      onChange={(e) => setPixFee(Number(e.target.value))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold text-muted-foreground">DÉBITO</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      className="h-12 rounded-xl bg-muted/20 font-bold text-center" 
                      value={debitFee} 
                      onChange={(e) => setDebitFee(Number(e.target.value))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold text-muted-foreground">CRÉDITO</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      className="h-12 rounded-xl bg-muted/20 font-bold text-center" 
                      value={creditFee} 
                      onChange={(e) => setCreditFee(Number(e.target.value))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold text-muted-foreground">CORRENTE</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      className="h-12 rounded-xl bg-muted/20 font-bold text-center" 
                      value={recurringFee} 
                      onChange={(e) => setRecurringFee(Number(e.target.value))} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.06)] rounded-[3rem] bg-accent/40 overflow-hidden sticky top-24">
            <div className="bg-foreground p-7 text-white flex justify-between items-center bg-gradient-to-br from-foreground to-foreground/80">
              <h3 className="font-black text-xl tracking-tight">Resultado do Cálculo</h3>
              <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <CardContent className="p-8 space-y-8">
              {/* Cost Highlight */}
              <div className="space-y-2">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block text-center">Custo Médio por Vaga</span>
                 <div className="text-center">
                   <div className="text-4xl md:text-5xl font-black text-foreground tracking-tighter">
                     {formatCurrency((results.costPerPersonMin + results.costPerPersonMax) / 2)}
                   </div>
                 </div>
              </div>

              {/* Split Breakdown */}
              <div className="grid grid-cols-1 gap-4">
                  {results.costPerPersonMin !== results.costPerPersonMax && (
                    <div className="bg-card p-5 rounded-3xl border border-border/50 shadow-sm flex justify-between items-center">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Min-Max</span>
                        <div className="text-sm font-black text-foreground">
                          {formatCurrency(results.costPerPersonMin)} — {formatCurrency(results.costPerPersonMax)}
                        </div>
                      </div>
                      <Info className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                  )}

                  <div className="bg-primary p-6 rounded-[2rem] shadow-xl shadow-primary/20 flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 block mb-2">Sua Margem Realizada</span>
                    <div className="text-3xl font-black text-white">
                      {formatCurrency(results.marginAmountPerPerson)}
                    </div>
                    <span className="text-[9px] text-white/50 font-bold mt-1 uppercase tracking-widest">por inscrição</span>
                  </div>
              </div>

              {/* Suggestions */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Preço por Canal de Pagamento</h4>
                
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-5 bg-card rounded-3xl border border-border/50 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-foreground uppercase tracking-wider">Via PIX</span>
                    </div>
                    <span className="text-lg font-black text-foreground">{formatCurrency(results.suggestedPricePix)}</span>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-card rounded-3xl border border-border/50 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-foreground uppercase tracking-wider">Via DÉBITO</span>
                    </div>
                    <span className="text-lg font-black text-foreground">{formatCurrency(results.suggestedPriceDebit)}</span>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-primary/10 rounded-3xl border border-primary/20 shadow-sm transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white transition-transform group-hover:scale-110">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black text-primary uppercase tracking-wider">CRÉDITO</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-primary block">{formatCurrency(results.suggestedPriceCredit)}</span>
                      <span className="text-[8px] font-black text-primary/50 uppercase tracking-widest">Recomendado</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-card rounded-3xl border border-border/50 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 transition-transform group-hover:scale-110">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-foreground uppercase tracking-wider">RECORRENTE</span>
                    </div>
                    <span className="text-lg font-black text-foreground">{formatCurrency(results.suggestedPriceRecurring)}</span>
                  </div>
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
            sessionStorage.setItem('ekko_calc_config', JSON.stringify({
              pixFee,
              creditFee,
              debitFee,
              recurringFee,
              maxParticipants,
              minParticipants,
              results,
            }));
            navigate('/eventos/novo');
          }}
          className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 px-10 font-black text-sm shadow-xl shadow-primary/20 transition-all active:scale-95 gap-3"
        >
          <Plus className="w-5 h-5" />
          Criar evento com essas configurações
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="bg-muted/30 p-6 rounded-3xl border border-border/50 text-center">
        <p className="text-[11px] text-muted-foreground font-medium max-w-2xl mx-auto">
          Nota: Estes cálculos são estimativas baseadas nos valores fornecidos. Podem haver variações dependendo de outros custos fixos ou variáveis não listados aqui. Recomendamos sempre uma margem de segurança para imprevistos.
        </p>
      </div>
    </div>
  );
}
