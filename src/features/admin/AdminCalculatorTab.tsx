import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ─── Tokens de cor Tovia ──────────────────────────────────────────────────────
const PRIMARY   = '#FF6B1A';
const PRIMARY_L = '#f0fdf4';  // fundo leve verde
const PRIMARY_B = '#86efac';  // borda verde
const DESTR     = '#dc2626';  // vermelho custo/negativo
const DESTR_L   = '#fee2e2';

// ─── Formatters ───────────────────────────────────────────────────────────────
const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const pct = (v: number) => `${(+v || 0).toFixed(1)}%`;
const fmt = (n: number) => 'R$ ' + Math.round(n).toLocaleString('pt-BR');

// ─── Asaas fee engine ─────────────────────────────────────────────────────────
interface Fees {
  pixPct: number; pixFixed: number;
  boletoFixed: number;
  creditPct: number; creditFixed: number;
  parcelPct: number; parcelFixed: number;
}

function calcAsaasFee(method: string, ticket: number, parcelas: number, fees: Fees): number {
  const { pixPct, pixFixed, boletoFixed, creditPct, creditFixed, parcelPct, parcelFixed } = fees;
  switch (method) {
    case 'pix':      return ticket * (pixPct / 100) + pixFixed;
    case 'boleto':   return boletoFixed;
    case 'credito':  return ticket * (creditPct / 100) + creditFixed;
    case 'parcelado': {
      const parcValue = ticket / parcelas;
      return parcelas * (parcValue * (parcelPct / 100) + parcelFixed);
    }
    default: return 0;
  }
}

// ─── Componentes ─────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', marginBottom: 12 }}>
      {children}
    </div>
  );
}

function MetricCardEvento({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || 'var(--foreground)', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SliderRowEvento({
  label, min, max, step, value, onChange, prefix,
}: {
  label: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void; prefix: 'R$' | '%' | null;
}) {
  const [inputVal, setInputVal] = useState(String(value));
  const [focused, setFocused]   = useState(false);
  const displayVal = focused ? inputVal : String(value);
  const inputW = prefix === 'R$' ? 90 : prefix === '%' ? 58 : 70;

  const commit = (raw: string) => {
    const num = parseFloat(String(raw).replace(',', '.'));
    if (!isNaN(num)) {
      const clamped = Math.min(max, Math.max(min, num));
      onChange(clamped);
      setInputVal(String(clamped));
    } else {
      setInputVal(String(value));
    }
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {prefix === 'R$' && <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>R$</span>}
          <input
            type="number" min={min} max={max} step={step} value={displayVal}
            onFocus={(e) => { setFocused(true); setInputVal(String(value)); (e.target as HTMLInputElement).select(); }}
            onChange={(e) => {
              setInputVal(e.target.value);
              const num = parseFloat(e.target.value);
              if (!isNaN(num)) onChange(Math.min(max, Math.max(min, num)));
            }}
            onBlur={() => { setFocused(false); commit(inputVal); }}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            style={{
              width: inputW, padding: '4px 6px',
              border: focused ? `1.5px solid ${PRIMARY}` : '1.5px solid var(--border)',
              borderRadius: 8, fontSize: 13, fontWeight: 700,
              color: 'var(--foreground)', textAlign: 'right', outline: 'none',
              background: 'var(--card)', transition: 'border .15s',
            }}
          />
          {prefix === '%' && <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>%</span>}
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => { onChange(+e.target.value); if (!focused) setInputVal(String(+e.target.value)); }}
        style={{ width: '100%', accentColor: PRIMARY, cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
        <span style={{ fontSize: 10, color: 'var(--border)' }}>{min}</span>
        <span style={{ fontSize: 10, color: 'var(--border)' }}>{max}</span>
      </div>
    </div>
  );
}

function DetailRowEvento({ label, value, color, bold, border = true }: {
  label: string; value: string; color?: string; bold?: boolean; border?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '7px 0', borderBottom: border ? '1px solid var(--border)' : 'none', fontSize: 13,
    }}>
      <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 600, color: color || 'var(--foreground)' }}>{value}</span>
    </div>
  );
}

const METHOD_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pix:       { bg: '#dcfce7', text: '#166534', label: 'PIX' },
  boleto:    { bg: '#fef9c3', text: '#854d0e', label: 'Boleto' },
  credito:   { bg: '#ede9fe', text: '#4c1d95', label: 'Crédito à vista' },
  parcelado: { bg: DESTR_L,   text: '#991b1b', label: 'Parcelado' },
};

// ─── Calculadora do Evento ────────────────────────────────────────────────────
function CalculadoraEvento() {
  const [inscritos,      setInscritos]      = useState(200);
  const [minInscritos,   setMinInscritos]   = useState(150);
  const [custoPorPessoa, setCustoPorPessoa] = useState(200);
  const [margemPct,      setMargemPct]      = useState(10);
  const [parcelas,       setParcelas]       = useState(6);
  const [planoTovia,     setPlanoTovia]     = useState(129);
  const [mixPix,         setMixPix]         = useState(35);
  const [mixBoleto,      setMixBoleto]      = useState(10);
  const [mixCredito,     setMixCredito]     = useState(20);
  const [mixParcelado,   setMixParcelado]   = useState(35);
  const [fees,           setFees]           = useState<Fees>({
    pixPct: 0, pixFixed: 1.99,
    boletoFixed: 1.99,
    creditPct: 2.99, creditFixed: 0.49,
    parcelPct: 3.49, parcelFixed: 0.49,
  });
  const [absorve,        setAbsorve]        = useState<'pagador' | 'organizer'>('pagador');
  const [subTab,         setSubTab]         = useState<'evento' | 'resultado' | 'comparativo'>('evento');
  const [showFees,       setShowFees]       = useState(false);

  // ── Cálculos
  const totalMix     = mixPix + mixBoleto + mixCredito + mixParcelado;
  const mixOk        = Math.abs(totalMix - 100) <= 1;
  const custoTotalMax = custoPorPessoa * inscritos;
  const custoTotalMin = custoPorPessoa * minInscritos;
  const margem        = custoPorPessoa * (margemPct / 100);
  const precoBase     = custoPorPessoa + margem;
  const ticket        = precoBase;
  const receitaBruta    = inscritos    * ticket;
  const receitaBrutaMin = minInscritos * ticket;

  const feeByMethod = {
    pix:       calcAsaasFee('pix',       ticket, 1,        fees),
    boleto:    calcAsaasFee('boleto',    ticket, 1,        fees),
    credito:   calcAsaasFee('credito',   ticket, 1,        fees),
    parcelado: calcAsaasFee('parcelado', ticket, parcelas, fees),
  };

  const taxaMediaPorInscrito =
    (mixPix       / 100) * feeByMethod.pix +
    (mixBoleto    / 100) * feeByMethod.boleto +
    (mixCredito   / 100) * feeByMethod.credito +
    (mixParcelado / 100) * feeByMethod.parcelado;

  const totalTaxasGateway    = taxaMediaPorInscrito * inscritos;
  const totalTaxasGatewayMin = taxaMediaPorInscrito * minInscritos;

  const precoSugerido = {
    pix:       absorve === 'pagador' ? precoBase + feeByMethod.pix       : precoBase,
    boleto:    absorve === 'pagador' ? precoBase + feeByMethod.boleto    : precoBase,
    credito:   absorve === 'pagador' ? precoBase + feeByMethod.credito   : precoBase,
    parcelado: absorve === 'pagador' ? precoBase + feeByMethod.parcelado : precoBase,
  };

  const custoToviaPeriodo  = planoTovia * parcelas;
  const receitaLiquida     = receitaBruta    - (absorve === 'organizer' ? totalTaxasGateway    : 0) - custoToviaPeriodo;
  const receitaLiquidaMin  = receitaBrutaMin - (absorve === 'organizer' ? totalTaxasGatewayMin : 0) - custoToviaPeriodo;

  const custosTradicional    = receitaBruta    * 0.10;
  const custosTradicionalMin = receitaBrutaMin * 0.10;
  const custoToviaTotal      = custoToviaPeriodo + (absorve === 'organizer' ? totalTaxasGateway    : 0);
  const custoToviaTotalMin   = custoToviaPeriodo + (absorve === 'organizer' ? totalTaxasGatewayMin : 0);
  const economia             = custosTradicional    - custoToviaTotal;
  const taxaEfetivaTotal     = (custoToviaPeriodo + totalTaxasGateway) / receitaBruta * 100;
  const breakEvenTovia       = margem > 0 ? custoToviaPeriodo / margem : Infinity;

  const TAB_BTN = (id: typeof subTab, label: string) => (
    <button
      onClick={() => setSubTab(id)}
      style={{
        padding: '7px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8,
        border: 'none', cursor: 'pointer',
        background: subTab === id ? '#111827' : 'transparent',
        color:      subTab === id ? '#fff'    : 'var(--muted-foreground)',
        transition: 'all .15s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ fontFamily: 'inherit' }}>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--muted)', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: 20 }}>
        {TAB_BTN('evento',       'Precificação')}
        {TAB_BTN('resultado',    'Resultado do evento')}
        {TAB_BTN('comparativo',  'Plataforma tradicional vs Tovia')}
      </div>

      {/* ── PRECIFICAÇÃO ─────────────────────────────────────────────────── */}
      {subTab === 'evento' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Esquerda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <SectionTitle>Custos do evento</SectionTitle>
              <SliderRowEvento label="Custo por pessoa"              min={0} max={10000} step={1}   value={custoPorPessoa} onChange={setCustoPorPessoa} prefix="R$" />
              <SliderRowEvento label="Inscritos esperados (máximo)"  min={1} max={10000} step={1}   value={inscritos}      onChange={setInscritos}      prefix={null} />
              <SliderRowEvento label="Inscritos mínimos (break-even)" min={1} max={inscritos} step={1} value={minInscritos} onChange={setMinInscritos}  prefix={null} />
              <SliderRowEvento label="Margem desejada (%)"           min={0} max={100}   step={0.5} value={margemPct}      onChange={setMargemPct}      prefix="%" />
              <div style={{ background: 'var(--muted)', borderRadius: 10, padding: 12, marginTop: 4 }}>
                <DetailRowEvento label="Custo total (máx)"        value={brl(custoTotalMax)} />
                <DetailRowEvento label="Custo total (mín)"        value={brl(custoTotalMin)} />
                <DetailRowEvento label="Margem por inscrição"     value={brl(margem)} />
                <DetailRowEvento label="Preço base (sem taxa)"    value={brl(precoBase)} bold border={false} />
              </div>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <SectionTitle>Parcelamento</SectionTitle>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '0 0 12px' }}>
                {absorve === 'pagador'
                  ? `Taxa incluída no valor (${fees.parcelPct}%/parcela + ${brl(fees.parcelFixed)}) — paga pelo participante.`
                  : 'Sem taxa no valor — taxa paga pela organização.'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, padding: '5px 8px', background: 'var(--muted)', borderRadius: 8, marginBottom: 6 }}>
                {['Parcelas', 'Valor/parcela', 'Total'].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h !== 'Parcelas' ? 'right' : 'left' }}>{h}</span>
                ))}
              </div>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => {
                const taxaParc      = calcAsaasFee('parcelado', ticket, n, fees);
                const totalComTaxa  = absorve === 'pagador' ? ticket + taxaParc : ticket;
                const valorParcela  = totalComTaxa / n;
                const isSelected    = n === parcelas;
                return (
                  <div key={n} onClick={() => setParcelas(n)} style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4,
                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                    background: isSelected ? PRIMARY_L : 'transparent',
                    border:     isSelected ? `1.5px solid ${PRIMARY}` : '1.5px solid transparent',
                    marginBottom: 3, transition: 'all .12s',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? PRIMARY : 'var(--foreground)' }}>{n}x</span>
                    <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 400, color: isSelected ? PRIMARY : 'var(--muted-foreground)', textAlign: 'center' }}>{brl(valorParcela)}</span>
                    <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 400, color: isSelected ? PRIMARY : 'var(--muted-foreground)', textAlign: 'right' }}>{brl(totalComTaxa)}</span>
                  </div>
                );
              })}
              <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 8, marginBottom: 0 }}>Clique em uma linha para selecionar.</p>
            </div>
          </div>

          {/* Direita */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <SectionTitle>Mix de pagamentos</SectionTitle>
                {!mixOk && (
                  <span style={{ fontSize: 11, background: DESTR_L, color: '#991b1b', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                    soma: {totalMix}%
                  </span>
                )}
              </div>
              {([
                { label: 'PIX',               val: mixPix,       set: setMixPix,       color: '#16a34a' },
                { label: 'Boleto',            val: mixBoleto,    set: setMixBoleto,    color: '#ca8a04' },
                { label: 'Crédito à vista',   val: mixCredito,   set: setMixCredito,   color: '#7c3aed' },
                { label: `Parcelado (${parcelas}x)`, val: mixParcelado, set: setMixParcelado, color: DESTR },
              ] as const).map(({ label, val, set, color }) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input type="number" min={0} max={100} step={1} value={val}
                        onChange={(e) => set(Math.min(100, Math.max(0, +e.target.value || 0)) as never)}
                        style={{ width: 52, padding: '3px 6px', border: `1.5px solid ${color}`, borderRadius: 7, fontSize: 12, fontWeight: 700, color: 'var(--foreground)', textAlign: 'right', outline: 'none', background: 'var(--card)' }} />
                      <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>%</span>
                    </div>
                  </div>
                  <div style={{ position: 'relative', height: 6, background: 'var(--muted)', borderRadius: 4 }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min(val, 100)}%`, background: color, borderRadius: 4, transition: 'width .2s' }} />
                  </div>
                  <input type="range" min={0} max={100} step={1} value={val}
                    onChange={(e) => set(+e.target.value as never)}
                    style={{ width: '100%', accentColor: color, marginTop: 2 }} />
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <SectionTitle>Preço sugerido por método</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(METHOD_COLORS).map(([method, { bg, text, label }]) => (
                  <div key={method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: bg, borderRadius: 10 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: text }}>{label}</span>
                      <span style={{ fontSize: 11, color: text, opacity: .7, marginLeft: 8 }}>taxa: {brl(feeByMethod[method as keyof typeof feeByMethod])}</span>
                      {method === 'parcelado' && (
                        <span style={{ display: 'block', fontSize: 11, color: text, opacity: .7, marginTop: 2 }}>
                          {parcelas}x de {brl(precoSugerido[method] / parcelas)}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: text }}>{brl(precoSugerido[method as keyof typeof precoSugerido])}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted-foreground)', background: 'var(--muted)', borderRadius: 8, padding: '8px 12px' }}>
                {absorve === 'pagador' ? 'Taxa adicionada ao preço base. O participante paga o custo do gateway.' : 'Participante paga o preço base. A organização absorve as taxas do gateway.'}
              </div>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <SectionTitle>Taxas do gateway (Asaas)</SectionTitle>
                <button onClick={() => setShowFees(!showFees)} style={{ fontSize: 11, color: PRIMARY, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showFees ? 'Ocultar' : 'Editar taxas'}
                </button>
              </div>
              {!showFees ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { l: 'PIX',      v: `R$ ${fees.pixFixed.toFixed(2)}` },
                    { l: 'Boleto',   v: brl(fees.boletoFixed) },
                    { l: 'Crédito',  v: `${fees.creditPct}% + ${brl(fees.creditFixed)}` },
                    { l: 'Parcelado', v: `${fees.parcelPct}%/parc. + ${brl(fees.parcelFixed)}` },
                  ].map(({ l, v }) => (
                    <div key={l} style={{ fontSize: 11, background: 'var(--muted)', borderRadius: 6, padding: '4px 10px' }}>
                      <span style={{ color: 'var(--muted-foreground)' }}>{l}: </span>
                      <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {([
                    { label: 'PIX (R$ fixo)',          key: 'pixFixed' },
                    { label: 'Boleto (R$ fixo)',       key: 'boletoFixed' },
                    { label: 'Crédito (%)',            key: 'creditPct' },
                    { label: 'Crédito (R$ fixo)',      key: 'creditFixed' },
                    { label: 'Parcelado (%/parc.)',    key: 'parcelPct' },
                    { label: 'Parcelado (R$ fixo/p.)', key: 'parcelFixed' },
                  ] as { label: string; key: keyof Fees }[]).map(({ label, key }) => (
                    <div key={key}>
                      <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>{label}</div>
                      <input type="number" step="0.01" value={fees[key]}
                        onChange={(e) => setFees(f => ({ ...f, [key]: +e.target.value }))}
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 700, textAlign: 'center', background: 'var(--card)', color: 'var(--foreground)' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <SectionTitle>Quem paga as taxas do gateway?</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {([
                  { v: 'pagador',   label: 'O participante',  desc: 'Taxa somada ao preço base' },
                  { v: 'organizer', label: 'A organização',   desc: 'Taxa descontada da margem' },
                ] as const).map(({ v, label, desc }) => (
                  <button key={v} onClick={() => setAbsorve(v)} style={{
                    padding: 12, borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                    border:      absorve === v ? `2px solid ${PRIMARY}` : '2px solid var(--border)',
                    background:  absorve === v ? PRIMARY_L              : 'var(--card)',
                    transition: 'all .15s',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: absorve === v ? PRIMARY : 'var(--foreground)' }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── RESULTADO DO EVENTO ──────────────────────────────────────────── */}
      {subTab === 'resultado' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <SectionTitle>Plano Tovia</SectionTitle>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { v: 0,   label: 'Plano 1 - Chinám — Gratuito'   },
                { v: 49,  label: 'Plano 2 - Pétach — R$49/mês'   },
                { v: 129, label: 'Plano 3 - Koách — R$129/mês'   },
                { v: 299, label: 'Plano 4 - Chalém — R$299/mês'  },
              ].map(({ v, label }) => (
                <button key={v} onClick={() => setPlanoTovia(v)} style={{
                  padding: '7px 14px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer',
                  border:      planoTovia === v ? `2px solid ${PRIMARY}` : '2px solid var(--border)',
                  background:  planoTovia === v ? PRIMARY_L              : 'var(--card)',
                  color:       planoTovia === v ? PRIMARY                : 'var(--muted-foreground)',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <MetricCardEvento label="Receita bruta (máximo)" value={brl(receitaBruta)}    sub={`${inscritos} inscritos × ${brl(ticket)}`} />
            <MetricCardEvento label="Receita bruta (mínimo)" value={brl(receitaBrutaMin)} sub={`${minInscritos} inscritos × ${brl(ticket)}`} />
            <MetricCardEvento label="Taxa efetiva Tovia (período)" value={pct(taxaEfetivaTotal)} sub={`${parcelas} mensalidades + gateway`} color={DESTR} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <SectionTitle>Cenário máximo ({inscritos} inscritos)</SectionTitle>
              <DetailRowEvento label="Receita bruta"              value={brl(receitaBruta)} />
              <DetailRowEvento label="Custos do evento"           value={brl(custoTotalMax)}       color={DESTR} />
              <DetailRowEvento label="Taxas gateway (estimado)"   value={brl(totalTaxasGateway)}   color={DESTR} />
              <DetailRowEvento label={`Tovia (${parcelas}x mensalidade)`} value={brl(planoTovia * parcelas)} color={DESTR} />
              {(() => {
                const liq = receitaBruta - custoTotalMax - totalTaxasGateway - (planoTovia * parcelas);
                return <DetailRowEvento label="Resultado líquido" value={brl(liq)} color={liq >= 0 ? PRIMARY : DESTR} bold border={false} />;
              })()}
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <SectionTitle>Cenário mínimo ({minInscritos} inscritos)</SectionTitle>
              <DetailRowEvento label="Receita bruta"              value={brl(receitaBrutaMin)} />
              <DetailRowEvento label="Custos do evento"           value={brl(custoTotalMin)}       color={DESTR} />
              <DetailRowEvento label="Taxas gateway (estimado)"   value={brl(totalTaxasGatewayMin)} color={DESTR} />
              <DetailRowEvento label={`Tovia (${parcelas}x mensalidade)`} value={brl(planoTovia * parcelas)} color={DESTR} />
              {(() => {
                const liq = receitaBrutaMin - custoTotalMin - totalTaxasGatewayMin - (planoTovia * parcelas);
                return <DetailRowEvento label="Resultado líquido" value={brl(liq)} color={liq >= 0 ? PRIMARY : DESTR} bold border={false} />;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── COMPARATIVO ─────────────────────────────────────────────────── */}
      {subTab === 'comparativo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--card)', border: `2px solid ${DESTR_L}`, borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <SectionTitle>Plataforma tradicional</SectionTitle>
                <span style={{ fontSize: 11, background: DESTR_L, color: '#991b1b', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>10% sobre tudo</span>
              </div>
              <DetailRowEvento label="Preço do ingresso"                         value={brl(precoBase)} />
              <DetailRowEvento label="Taxa por inscrição (10%)"                  value={brl(precoBase * 0.10)}    color={DESTR} />
              <DetailRowEvento label={`Total (${inscritos} inscritos)`}          value={brl(custosTradicional)}   color={DESTR} bold />
              <DetailRowEvento label={`Total (${minInscritos} inscritos mín.)`}  value={brl(custosTradicionalMin)} color={DESTR} />
              <DetailRowEvento label="Receita líquida p/ você (máx)"             value={brl(receitaBruta - custosTradicional)} color={DESTR} border={false} />
              <div style={{ marginTop: 12, fontSize: 12, color: '#9a3412', background: '#fff5f5', borderRadius: 8, padding: '8px 12px' }}>
                O dinheiro passa pela plataforma antes de chegar até você. A taxa incide sobre <strong>cada ingresso, sempre</strong>.
              </div>
            </div>
            <div style={{ background: 'var(--card)', border: `2px solid ${PRIMARY_B}`, borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <SectionTitle>Tovia + Asaas</SectionTitle>
                <span style={{ fontSize: 11, background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>dinheiro direto a você</span>
              </div>
              <DetailRowEvento label={`Mensalidade Tovia (${parcelas}x)`}         value={brl(custoToviaPeriodo)} />
              <DetailRowEvento label="Taxas gateway — mix configurado"             value={brl(totalTaxasGateway)} />
              <DetailRowEvento label={`Custo total (${inscritos} inscritos)`}      value={brl(custoToviaTotal)}    bold />
              <DetailRowEvento label={`Custo total (${minInscritos} inscritos mín.)`} value={brl(custoToviaTotalMin)} />
              <DetailRowEvento label="Receita líquida p/ você (máx)"               value={brl(receitaBruta - custoToviaTotal)} color={PRIMARY} border={false} />
              <div style={{ marginTop: 12, fontSize: 12, color: '#166534', background: PRIMARY_L, borderRadius: 8, padding: '8px 12px' }}>
                O dinheiro vai direto do participante para sua conta no gateway — o Tovia nunca toca no seu dinheiro.
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <SectionTitle>Custo por inscrição — tradicional vs Tovia</SectionTitle>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '0 0 14px' }}>
              Para um ingresso de {brl(precoBase)}, quanto cada plataforma cobra por inscrição em cada método.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 4 }}>
              {['Método', 'Trad. (10%)', 'Tovia + Asaas', 'Você economiza'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '.05em', padding: '5px 8px', background: 'var(--muted)', borderRadius: 6 }}>{h}</div>
              ))}
              {[
                { label: 'PIX',               fee: feeByMethod.pix },
                { label: 'Boleto',            fee: feeByMethod.boleto },
                { label: 'Crédito à vista',   fee: feeByMethod.credito },
                { label: `Parcelado (${parcelas}x)`, fee: feeByMethod.parcelado },
              ].map(({ label, fee }) => {
                const trad = precoBase * 0.10;
                const eco  = trad - fee;
                return [
                  <div key={label+'l'} style={{ fontSize: 12, color: 'var(--foreground)', padding: '7px 8px', borderBottom: '1px solid var(--border)' }}>{label}</div>,
                  <div key={label+'t'} style={{ fontSize: 12, fontWeight: 600, color: DESTR,   padding: '7px 8px', borderBottom: '1px solid var(--border)' }}>{brl(trad)}</div>,
                  <div key={label+'a'} style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', padding: '7px 8px', borderBottom: '1px solid var(--border)' }}>{brl(fee)}</div>,
                  <div key={label+'e'} style={{ fontSize: 12, fontWeight: 700, color: eco >= 0 ? PRIMARY : DESTR, padding: '7px 8px', borderBottom: '1px solid var(--border)' }}>{eco >= 0 ? '+' : ''}{brl(eco)}</div>,
                ];
              })}
            </div>
          </div>

          <div style={{ background: '#111827', borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6b7280', marginBottom: 12 }}>
              Argumento para a liderança
            </div>
            <p style={{ fontSize: 15, color: '#f9fafb', lineHeight: 1.7, margin: 0 }}>
              "Na plataforma tradicional, de cada <strong style={{ color: '#fca5a5' }}>{brl(precoBase)}</strong> arrecadado, <strong style={{ color: '#fca5a5' }}>{brl(precoBase * 0.10)}</strong> ficam com a plataforma. No Tovia, você paga <strong style={{ color: '#86efac' }}>{brl(planoTovia)}/mês</strong> e as taxas do seu gateway. Para este evento com {inscritos} inscritos e {parcelas}x de parcelamento, o custo total do Tovia é <strong style={{ color: '#86efac' }}>{brl(custoToviaTotal)}</strong> — contra <strong style={{ color: '#fca5a5' }}>{brl(custosTradicional)}</strong> da plataforma tradicional. Você economiza <strong style={{ color: '#86efac', fontSize: 18 }}>{brl(economia)}</strong>."
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Projeção MRR Tovia ───────────────────────────────────────────────────────
function SliderRowMRR({ label, min, max, step, value, onChange, display }: {
  label: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void; display: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        <span className="text-xs font-semibold text-foreground ml-2 shrink-0">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-black h-1" />
    </div>
  );
}

function DetailRowMRR({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'red' }) {
  const cls = accent === 'green' ? 'text-primary' : accent === 'red' ? 'text-red-500' : 'text-foreground';
  return (
    <div className="flex justify-between items-center text-sm py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <strong className={cls}>{value}</strong>
    </div>
  );
}

function ProjecaoMRR() {
  const [nPetach, setNPetach] = useState(20);
  const [nKoach,  setNKoach]  = useState(10);
  const [nChalem, setNChalem] = useState(2);
  const [nIns,    setNIns]    = useState(500);
  const [cPro,    setCPro]    = useState(3000);
  const [cMkt,    setCMkt]    = useState(1000);
  const [cCnt,    setCCnt]    = useState(600);
  const [cInf,    setCInf]    = useState(500);

  const rPetach    = nPetach * 49;
  const rKoach     = nKoach  * 129;
  const rChalemFix = nChalem * 299;
  const rChalemVar = nChalem * nIns * 0.008;
  const grossMRR   = rPetach + rKoach + rChalemFix + rChalemVar;
  const varCosts   = (nPetach + nKoach + nChalem) * (8 + 1.99);
  const fixedCosts = cPro + cMkt + cCnt + cInf;
  const totalCosts = fixedCosts + varCosts;
  const net        = grossMRR - totalCosts;
  const margin     = grossMRR > 0 ? (net / grossMRR) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Receita bruta (MRR)',   value: fmt(grossMRR),   color: undefined },
          { label: 'Custos operacionais',   value: fmt(totalCosts), color: 'red' as const },
          { label: 'Resultado líquido',     value: fmt(net),        color: (net >= 0 ? 'green' : 'red') as 'green' | 'red' },
          { label: 'Margem líquida',        value: Math.round(margin) + '%', color: (margin >= 30 ? 'green' : margin >= 0 ? undefined : 'red') as 'green' | 'red' | undefined },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="pt-4 pb-3 px-4">
            <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
            <p className={`text-xl font-black tracking-tight ${color === 'green' ? 'text-primary' : color === 'red' ? 'text-red-500' : 'text-foreground'}`}>{value}</p>
          </CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <p className="text-sm font-black mb-4">Clientes por plano</p>
          <SliderRowMRR label="Plano 2 - Pétach — R$49/mês"   min={0} max={500}  step={5}  value={nPetach} onChange={setNPetach} display={String(nPetach)} />
          <SliderRowMRR label="Plano 3 - Koách — R$129/mês"   min={0} max={300}  step={5}  value={nKoach}  onChange={setNKoach}  display={String(nKoach)} />
          <SliderRowMRR label="Plano 4 - Chalém — R$299/mês"  min={0} max={100}  step={1}  value={nChalem} onChange={setNChalem} display={String(nChalem)} />
          <SliderRowMRR label="Média inscritos pagos (Plano 4 - Chalém)" min={0} max={5000} step={50} value={nIns} onChange={setNIns} display={String(nIns)} />
        </div>
        <div>
          <p className="text-sm font-black mb-4">Custos fixos mensais</p>
          <SliderRowMRR label="Prolabore"  min={1500} max={20000} step={500} value={cPro} onChange={setCPro} display={fmt(cPro)} />
          <SliderRowMRR label="Marketing"  min={0}    max={10000} step={200} value={cMkt} onChange={setCMkt} display={fmt(cMkt)} />
          <SliderRowMRR label="Contador"   min={300}  max={1500}  step={50}  value={cCnt} onChange={setCCnt} display={fmt(cCnt)} />
          <SliderRowMRR label="Infra (Firebase / Vercel / Resend)" min={100} max={3000} step={100} value={cInf} onChange={setCInf} display={fmt(cInf)} />
        </div>
      </div>
      <Card><CardContent className="pt-4 pb-3 px-4">
        <p className="text-xs text-muted-foreground font-semibold mb-3">Composição da receita bruta</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span>Plano 2 - Pétach: <strong className="text-foreground">{fmt(rPetach)}</strong></span>
          <span>Plano 3 - Koách: <strong className="text-foreground">{fmt(rKoach)}</strong></span>
          <span>Plano 4 - Chalém (fixo): <strong className="text-foreground">{fmt(rChalemFix)}</strong></span>
          <span>0,8% inscritos Chalém: <strong className="text-foreground">{fmt(rChalemVar)}</strong></span>
        </div>
      </CardContent></Card>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AdminCalculatorTab() {
  return (
    <Tabs defaultValue="evento">
      <TabsList className="mb-6">
        <TabsTrigger value="evento">Calculadora do Evento</TabsTrigger>
        <TabsTrigger value="mrr">Projeção Tovia (MRR)</TabsTrigger>
      </TabsList>
      <TabsContent value="evento">
        <CalculadoraEvento />
      </TabsContent>
      <TabsContent value="mrr">
        <ProjecaoMRR />
      </TabsContent>
    </Tabs>
  );
}
