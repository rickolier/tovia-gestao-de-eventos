# Unit economics: Tovia — SaaS de gestão de eventos para igrejas

## Nota do CFO

**Margem:** 77% no plano (8 clientes Pétach a R$119), contribuição de R$104,10 por assinatura. Margem saudável — cada cliente cobre quase todo o custo fixo mensal sozinho.

**A linha a vigiar: o ramp.** Os custos fixos são R$103/mês, quase tudo Claude (R$100). Com volume -20%, a margem cai para 74% e o lucro do ano 1 vai de R$4.506 para R$3.357. A captação dos primeiros clientes é o fator decisivo — não o preço nem o custo.

**Caixa necessário: R$559** antes de se pagar. Payback no mês 6 — confortável para um fundador solo com custos fixos mínimos.

**Cenários de preço (mesmo ramp de 8 clientes):**

| cenário | contribuição/un | margem | lucro ano 1 | payback |
|---|---:|---:|---:|---|
| **Pétach R$119 (atual)** | R$104,10 | 77% | R$4.506 | mês 6 |
| Pétach R$49 (teste A/B) | R$34,10 | 44% | R$642 | mês 12 |
| Chalém R$299 (atual) | R$284,10 | 92% | R$14.442 | mês 3 |

R$49 aparece como cenário de teste A/B (sugerido pelo Van Westendorp com compradores simulados), não como recomendação definitiva. O painel apontou **confiança** como barreira #1 (45%), acima de preço (39%) — com prova social real (eventos rodando, testemunhos de pastores), a percepção de preço pode mudar significativamente. A validação com compradores reais é o que decide se R$119 se sustenta ou não.

**Três formas de melhorar a margem:**

1. **Converter 1 dos 8 para Chalém (R$299):** contribuição extra de R$180/mês. Mix 7 Pétach + 1 Chalém eleva o lucro do ano 1 para ~R$6.666.
2. **Reduzir Claude para R$50/mês** (otimizar uso ou trocar tier): custos fixos caem 48%, payback antecipa para mês 4.
3. **Plano anual com desconto** (R$1.190/ano = ~R$99/mês): antecipa caixa, reduz churn, e o desconto percebido facilita a venda sem baixar o preço mensal.

**Condições do board sobre dinheiro:**
- ✅ Custo operacional baixo — R$103/mês fixo
- ✅ Não precisa de investimento externo — R$559 de caixa é acessível
- ⚠️ 5 clientes pagantes em 90 dias — ramp projeta ~2 no mês 3. Canal de aquisição é o gargalo.
- ⚠️ 20-30 clientes em 6 meses — ramp projeta ~4. Gap significativo. Depende de canal repetível.

**Sobre o evento avulso (R$19):** a R$19 com os mesmos custos variáveis, o negócio perde R$1.014 no ano 1. O avulso funciona como porta de entrada para a assinatura, nunca como receita principal.

**Nota:** estes números são antes de impostos. O fundador deve consultar um contador para verificar a estrutura tributária (MEI vs ME), encargos e obrigações fiscais antes de receber dinheiro.

---

Every number below comes from the input file. Nothing is looked up or guessed.

## One assinatura Pétach mensal

| line | per assinatura Pétach mensal |
| --- | ---: |
| Price | $119.00 |
| Supabase (proporcional) | -$4.00 |
| Vercel (proporcional) | -$3.00 |
| Resend (proporcional) | -$2.00 |
| Suporte / overhead | -$1.00 |
| Garantia (10% claim de R$49) | -$4.90 |
| **Contribution** (what each assinatura Pétach mensal leaves to pay the fixed costs) | **$104.10** (87%) |

## The margin that matters

Fixed costs: $103 a month (Claude (AI) $100, Domínio $3, Sentry $0, Zoho Mail $0).

- **Break-even: 1 assinatura Pétach mensals a day.** Below that you lose money every month.
- **Profit margin at your plan** (0 a day): **77%** of every sale, after every cost.

## Year 1, month by month

| month | assinatura Pétach mensals a day | revenue | profit | cumulative (after $540 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | $107 | -$10 | -$550 |
| 2 | 0 | $107 | -$10 | -$559 |
| 3 | 0 | $250 | $115 | -$444 |
| 4 | 0 | $250 | $115 | -$329 |
| 5 | 0 | $357 | $209 | -$120 |
| 6 | 0 | $464 | $303 | $183 |
| 7 | 0 | $607 | $428 | $610 |
| 8 | 0 | $714 | $521 | $1,132 |
| 9 | 0 | $821 | $615 | $1,747 |
| 10 | 0 | $964 | $740 | $2,487 |
| 11 | 0 | $964 | $740 | $3,226 |
| 12 | 0 | $964 | $740 | $3,966 |

- **Year 1 operating profit: $4,506** on $6,569 of revenue.
- After the $540 startup spend: $3,966.
- Startup money earned back: month 6.
- Cash you need before it pays for itself: **$559**.

## What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 77% | 1 | $4,506 |
| Price -10% | 74% | 1 | $3,849 |
| Volume -20% | 74% | 1 | $3,357 |
| Unit costs +15% | 75% | 1 | $4,383 |

No red flags in these numbers. They are only as good as the inputs: check every cost against a real quote.
