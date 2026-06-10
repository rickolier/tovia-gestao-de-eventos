import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, Coins, TrendingDown, Percent, FileText } from 'lucide-react';
import { updateDocument } from '../../lib/firebase-utils';
import { Evento } from '../../types';
import { toast } from 'sonner';

export default function FinanceiroConfigTab({ evento, onUpdate }: { evento: Evento; onUpdate?: () => void }) {
  const ev = evento as any;
  const [calcData, setCalcData] = useState({
    valorTicket: ev.valor_ticket_projeccao || 0,
    taxaPix:      evento?.config_pagamento?.pix?.taxa || 0,
    taxaDebito:   ev.config_pagamento?.debito?.taxa ?? 1.99,
    taxaCartao:   evento?.config_pagamento?.cartao_credito?.taxa || 0,
    taxaCorrente: ev.config_pagamento?.corrente?.taxa ?? 4.99,
    taxaBoleto:   ev.config_pagamento?.boleto?.taxa ?? 3.50,
    custoInscrito: ev.custo_estimado_por_pessoa || 0,
    installmentLogic: evento?.config_pagamento?.installmentLogic || 'free',
  });

  useEffect(() => {
    const ev2 = evento as any;
    setCalcData({
      valorTicket: ev2.valor_ticket_projeccao || 0,
      taxaPix:      evento?.config_pagamento?.pix?.taxa || 0,
      taxaDebito:   ev2.config_pagamento?.debito?.taxa ?? 1.99,
      taxaCartao:   evento?.config_pagamento?.cartao_credito?.taxa || 0,
      taxaCorrente: ev2.config_pagamento?.corrente?.taxa ?? 4.99,
      taxaBoleto:   ev2.config_pagamento?.boleto?.taxa ?? 3.50,
      custoInscrito: ev2.custo_estimado_por_pessoa || 0,
      installmentLogic: evento?.config_pagamento?.installmentLogic || 'free',
    });
  }, [evento.id, JSON.stringify(evento.config_pagamento)]);

  // valorTicket = base price (cost + margin, before fee)
  // suggestedPrice = what participant pays = base / (1 - fee%)
  const calc = (taxa: number) => {
    const suggestedPrice = taxa >= 100 ? 0 : calcData.valorTicket / (1 - taxa / 100);
    const valorTaxa = suggestedPrice - calcData.valorTicket;
    const margem = calcData.valorTicket - calcData.custoInscrito;
    return { suggestedPrice, valorTaxa, margem };
  };

  const resultsPix      = calc(calcData.taxaPix);
  const resultsDebito   = calc(calcData.taxaDebito);
  const resultsCartao   = calc(calcData.taxaCartao);
  const resultsCorrente = calc(calcData.taxaCorrente);
  const resultsBoleto   = calc(calcData.taxaBoleto);

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const handleSave = async () => {
    try {
      await updateDocument('eventos', evento.id, {
        config_pagamento: {
          ...evento.config_pagamento,
          pix:            { ...evento.config_pagamento?.pix,            taxa: calcData.taxaPix,      tipo_taxa: 'porcentagem' },
          debito:         { ativo: true,                                 taxa: calcData.taxaDebito,   tipo_taxa: 'porcentagem' },
          cartao_credito: { ...evento.config_pagamento?.cartao_credito,  taxa: calcData.taxaCartao,  tipo_taxa: 'porcentagem' },
          corrente:       { ativo: true,                                 taxa: calcData.taxaCorrente, tipo_taxa: 'porcentagem' },
          boleto:         { ativo: true,                                 taxa: calcData.taxaBoleto,   tipo_taxa: 'porcentagem' },
          installmentLogic: calcData.installmentLogic,
        },
        valor_ticket_projeccao: calcData.valorTicket,
        custo_estimado_por_pessoa: calcData.custoInscrito,
      } as any);
      toast.success('Configurações salvas!');
      if (onUpdate) onUpdate();
    } catch {
      toast.error('Erro ao salvar configurações.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Configurações Financeiras</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Taxas de gateway, margens e lógica de parcelamento.</p>
        </div>
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white rounded-2xl gap-2 h-11 px-8 font-black shadow-lg shadow-primary/20 transition-all active:scale-95">
          <FileText className="w-4 h-4" /> Salvar Configurações
        </Button>
      </div>

      <Card className="border-none shadow-xl bg-card rounded-[2rem] p-8 md:p-12">
        <div className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left: inputs */}
            <div className="space-y-8">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Coins className="w-3 h-3 text-primary" /> Valor Base do Ingresso — Custo + Margem (R$)
                </Label>
                <Input
                  type="number"
                  value={calcData.valorTicket || ''}
                  onChange={e => setCalcData(p => ({ ...p, valorTicket: Number(e.target.value) }))}
                  placeholder="Ex: 500.00"
                  className="h-16 text-3xl font-black rounded-2xl border-none bg-muted/40 focus:ring-primary/20 placeholder:text-muted-foreground/30"
                />
                <p className="text-[10px] font-bold text-muted-foreground italic px-2">Valor bruto pago pelo participante em cada inscrição.</p>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="w-3 h-3 text-red-500" /> Custo Fixo estimado por Inscrito (R$)
                </Label>
                <Input
                  type="number"
                  value={calcData.custoInscrito || ''}
                  onChange={e => setCalcData(p => ({ ...p, custoInscrito: Number(e.target.value) }))}
                  placeholder="Ex: 250.00"
                  className="h-14 font-black rounded-2xl border-none bg-muted/40 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Right: gateway config */}
            <div className="space-y-6 bg-muted/30 p-8 rounded-[2rem] border border-border/50">
              <h4 className="text-[11px] font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center shadow-sm">
                  <Percent className="w-4 h-4 text-primary" />
                </div>
                Configuração de Gateways
              </h4>

              {[
                { label: 'Taxa PIX (%)',             key: 'taxaPix'      },
                { label: 'Taxa Débito (%)',           key: 'taxaDebito'   },
                { label: 'Taxa Cartão de Crédito (%)',key: 'taxaCartao'   },
                { label: 'Taxa Corrente (%)',         key: 'taxaCorrente' },
                { label: 'Taxa Boleto (%)',           key: 'taxaBoleto'   },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest px-1">{label}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={(calcData as any)[key]}
                    onChange={e => setCalcData(p => ({ ...p, [key]: Number(e.target.value) }))}
                    className="h-12 font-bold rounded-xl border-none bg-card shadow-sm"
                  />
                </div>
              ))}

              {/* Lógica de Parcelamento */}
              <div className="space-y-3 pt-4 border-t border-border/20">
                <Label className="text-[11px] font-black uppercase tracking-widest px-1 flex items-center gap-2">
                  <Calculator className="w-3 h-3 text-primary" /> Lógica de Parcelamento
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: 'free',    title: 'Parcelamento Livre',    desc: 'Disponível em 12x independente da data da compra.' },
                    { value: 'limited', title: 'Parcelamento Limitado', desc: 'Calculado pela data atual vs data limite do ingresso.' },
                  ].map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => setCalcData(p => ({ ...p, installmentLogic: opt.value }))}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${calcData.installmentLogic === opt.value ? 'border-primary bg-primary/5' : 'border-transparent bg-card'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${calcData.installmentLogic === opt.value ? 'border-primary' : 'border-muted-foreground'}`}>
                          {calcData.installmentLogic === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest">{opt.title}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{opt.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="pt-6 border-t border-border/30 grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'PIX',     result: resultsPix      },
              { label: 'DÉBITO',  result: resultsDebito   },
              { label: 'CRÉDITO', result: resultsCartao   },
              { label: 'CORRENTE',result: resultsCorrente },
              { label: 'BOLETO',  result: resultsBoleto   },
            ].map(({ label, result }) => (
              <Card key={label} className="rounded-[2rem] border bg-primary/5 border-primary/10 overflow-hidden group hover:shadow-xl transition-all">
                <div className="p-6 text-center space-y-3">
                  <Badge className="font-black px-3 py-1 rounded-full bg-primary text-white text-[10px]">{label}</Badge>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-muted-foreground">Cobrar do participante</p>
                    <p className="text-xl font-black text-foreground">{fmt(result.suggestedPrice)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">taxa: {fmt(result.valorTaxa)}</p>
                  </div>
                  <div className="p-3 rounded-2xl border bg-white border-primary/10 group-hover:bg-primary transition-all">
                    <p className="text-[10px] uppercase font-black tracking-widest mb-0.5 text-muted-foreground group-hover:text-white/70">Sua margem</p>
                    <p className={`text-lg font-black transition-colors group-hover:text-white ${result.margem >= 0 ? 'text-primary' : 'text-red-500'}`}>
                      {fmt(result.margem)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
