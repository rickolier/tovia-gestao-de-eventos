import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const fmt = (n: number) =>
  'R$ ' + Math.round(n).toLocaleString('pt-BR');

const pct = (n: number) => n.toFixed(1) + '%';

function MetricCard({ label, value, color }: { label: string; value: string; color?: 'green' | 'red' | 'default' }) {
  const colorClass = color === 'green' ? 'text-emerald-600' : color === 'red' ? 'text-red-500' : 'text-foreground';
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
        <p className={`text-xl font-black tracking-tight ${colorClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function SliderRow({ label, min, max, step, value, onChange, display }: {
  label: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void; display: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        <span className="text-xs font-semibold text-foreground ml-2 shrink-0">{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-black h-1"
      />
    </div>
  );
}

function DetailRow({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'red' }) {
  const cls = accent === 'green' ? 'text-emerald-600' : accent === 'red' ? 'text-red-500' : 'text-foreground';
  return (
    <div className="flex justify-between items-center text-sm py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <strong className={cls}>{value}</strong>
    </div>
  );
}

export default function AdminCalculatorTab() {
  const [nEss, setNEss] = useState(20);
  const [nPro, setNPro] = useState(10);
  const [nCus, setNCus] = useState(2);
  const [nIns, setNIns] = useState(500);
  const [cPro, setCPro] = useState(3000);
  const [cMkt, setCMkt] = useState(1000);
  const [cCnt, setCCnt] = useState(600);
  const [cInf, setCInf] = useState(500);

  const [oPlan, setOPlan] = useState(129);
  const [oQtd, setOQtd] = useState(100);
  const [oPrice, setOPrice] = useState(100);
  const [oMethod, setOMethod] = useState('pix');

  const rEss = nEss * 69;
  const rPro = nPro * 129;
  const rCusFix = nCus * 299;
  const rCusVar = nCus * nIns * 0.008;
  const grossMRR = rEss + rPro + rCusFix + rCusVar;
  const varCosts = (nEss + nPro + nCus) * (8 + 1.99);
  const fixedCosts = cPro + cMkt + cCnt + cInf;
  const totalCosts = fixedCosts + varCosts;
  const net = grossMRR - totalCosts;
  const margin = grossMRR > 0 ? (net / grossMRR) * 100 : 0;

  let gwPerTx = 0;
  if (oMethod === 'pix' || oMethod === 'boleto') gwPerTx = 1.99;
  else if (oMethod === 'cv')   gwPerTx = 0.49 + oPrice * 0.0299;
  else if (oMethod === 'cp26') gwPerTx = 0.49 + oPrice * 0.0349;
  else                          gwPerTx = 0.49 + oPrice * 0.0399;

  const gwTotal = gwPerTx * oQtd;
  const varFee = oPlan === 299 ? oPrice * oQtd * 0.008 : 0;
  const totalCost = oPlan + gwTotal + varFee;
  const revenue = oPrice * oQtd;
  const sympla = revenue * 0.10;
  const saving = sympla - totalCost;
  const taxPct = revenue > 0 ? (totalCost / revenue) * 100 : 0;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tovia">
        <TabsList className="mb-6">
          <TabsTrigger value="tovia">Projeção Tovia (MRR)</TabsTrigger>
          <TabsTrigger value="org">Viabilidade do Organizador</TabsTrigger>
        </TabsList>

        <TabsContent value="tovia" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Receita bruta (MRR)" value={fmt(grossMRR)} />
            <MetricCard label="Custos operacionais" value={fmt(totalCosts)} color="red" />
            <MetricCard label="Resultado líquido" value={fmt(net)} color={net >= 0 ? 'green' : 'red'} />
            <MetricCard label="Margem líquida" value={Math.round(margin) + '%'} color={margin >= 30 ? 'green' : margin >= 0 ? 'default' : 'red'} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-black mb-4">Clientes por plano</p>
              <SliderRow label="Essencial — R$69/mês"          min={0} max={500} step={5}    value={nEss}  onChange={setNEss}  display={String(nEss)} />
              <SliderRow label="Pro — R$129/mês"               min={0} max={300} step={5}    value={nPro}  onChange={setNPro}  display={String(nPro)} />
              <SliderRow label="Personalizado — R$299/mês"     min={0} max={100} step={1}    value={nCus}  onChange={setNCus}  display={String(nCus)} />
              <SliderRow label="Média inscritos pagos (Personalizado)" min={0} max={5000} step={50} value={nIns} onChange={setNIns} display={String(nIns)} />
            </div>
            <div>
              <p className="text-sm font-black mb-4">Custos fixos mensais</p>
              <SliderRow label="Prolabore"            min={1500}  max={20000} step={500} value={cPro} onChange={setCPro} display={fmt(cPro)} />
              <SliderRow label="Marketing"            min={0}     max={10000} step={200} value={cMkt} onChange={setCMkt} display={fmt(cMkt)} />
              <SliderRow label="Contador"             min={300}   max={1500}  step={50}  value={cCnt} onChange={setCCnt} display={fmt(cCnt)} />
              <SliderRow label="Infra (Firebase / Vercel / Resend)" min={100} max={3000} step={100} value={cInf} onChange={setCInf} display={fmt(cInf)} />
            </div>
          </div>

          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground font-semibold mb-3">Composição da receita bruta</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span>Essencial: <strong className="text-foreground">{fmt(rEss)}</strong></span>
                <span>Pro: <strong className="text-foreground">{fmt(rPro)}</strong></span>
                <span>Personalizado (fixo): <strong className="text-foreground">{fmt(rCusFix)}</strong></span>
                <span>0,8% inscritos: <strong className="text-foreground">{fmt(rCusVar)}</strong></span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="org" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Custo total (Tovia + gateway)" value={fmt(totalCost)} />
            <MetricCard label="Custo equivalente no Sympla (10%)" value={fmt(sympla)} color="red" />
            <MetricCard label="Economia vs. Sympla" value={fmt(saving)} color={saving >= 0 ? 'green' : 'red'} />
            <MetricCard label="% da receita em taxas" value={pct(taxPct)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-black mb-4">Configuração do evento</p>

              <div className="flex items-center gap-3 mb-3">
                <label className="text-xs text-muted-foreground w-52 shrink-0">Plano Tovia</label>
                <Select value={String(oPlan)} onValueChange={v => setOPlan(Number(v))}>
                  <SelectTrigger className="flex-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="69">Essencial — R$69/mês</SelectItem>
                    <SelectItem value="129">Pro — R$129/mês</SelectItem>
                    <SelectItem value="299">Personalizado — R$299/mês + 0,8%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <SliderRow label="Inscrições pagas no evento" min={10} max={2000} step={10} value={oQtd}   onChange={setOQtd}   display={String(oQtd)} />
              <SliderRow label="Valor do ingresso (R$)"     min={10} max={1000} step={10} value={oPrice} onChange={setOPrice} display={fmt(oPrice)} />

              <div className="flex items-center gap-3 mb-3">
                <label className="text-xs text-muted-foreground w-52 shrink-0">Forma de pagamento predominante</label>
                <Select value={oMethod} onValueChange={setOMethod}>
                  <SelectTrigger className="flex-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX — R$1,99/tx</SelectItem>
                    <SelectItem value="boleto">Boleto — R$1,99/tx</SelectItem>
                    <SelectItem value="cv">Cartão crédito à vista — 2,99% + R$0,49</SelectItem>
                    <SelectItem value="cp26">Cartão crédito 2–6x — 3,49% + R$0,49</SelectItem>
                    <SelectItem value="cp712">Cartão crédito 7–12x — 3,99% + R$0,49</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <p className="text-sm font-black mb-4">Detalhamento de custos</p>
              <Card>
                <CardContent className="pt-4 pb-3 px-4 space-y-0 divide-y divide-border">
                  <div className="pb-2 space-y-0">
                    <DetailRow label="Mensalidade Tovia"      value={fmt(oPlan)} />
                    <DetailRow label="Taxas gateway (Asaas)"  value={fmt(gwTotal)} />
                    {oPlan === 299 && (
                      <DetailRow label="0,8% sobre inscritos pagos" value={fmt(varFee)} />
                    )}
                  </div>
                  <div className="py-2 space-y-0">
                    <DetailRow label="Custo total Tovia"    value={fmt(totalCost)} />
                    <DetailRow label="Receita bruta do evento" value={fmt(revenue)} />
                    <DetailRow label="Receita líquida"      value={fmt(revenue - totalCost)} accent="green" />
                  </div>
                  <div className="pt-2 space-y-0">
                    <DetailRow label="Custo se usasse Sympla (10%)" value={fmt(sympla)}  accent="red" />
                    <DetailRow label="Economia com Tovia"           value={fmt(saving)}  accent={saving >= 0 ? 'green' : 'red'} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
