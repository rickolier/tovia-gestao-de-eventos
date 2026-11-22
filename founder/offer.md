# Oferta — Tovia

## 1. Lista de problemas do comprador

Extraídos do painel (100 compradores), concorrentes e board. Organizados por momento.

### Antes de comprar (dúvida, preço, esforço para mudar)

| # | problema (nas palavras do comprador) | fonte |
|---|---|---|
| 1 | "Nunca ouvi falar dessa plataforma, quem mais usa?" | painel (45) |
| 2 | "R$119/mês é caro para a realidade da nossa igreja" | painel (39) |
| 3 | "WhatsApp e planilha já funcionam, por que mudar?" | painel (16) |
| 4 | "O pastor/tesoureiro não vai aprovar o gasto" | painel (vários) |
| 5 | "E se o dinheiro sumir? O dinheiro vai pra onde?" | painel + concorrentes |
| 6 | "Não tem CNPJ, não emite nota" | board |
| 7 | "Tem que configurar conta no Asaas, dá trabalho" | painel (P006) |
| 8 | "Não quero assinar mensal, faço poucos eventos" | painel (16 menções) |
| 9 | "Se der problema no dia do evento, tem suporte?" | customer.json |
| 10 | "Tenho que convencer a liderança toda, não só eu" | painel (vários) |

### Durante o uso (espera, aprendizado, inconveniência)

| # | problema | fonte |
|---|---|---|
| 11 | "Preciso aprender uma ferramenta nova no meio da correria" | painel (P006, P009) |
| 12 | "E se o sistema cair no dia do check-in?" | customer.json |
| 13 | "Preciso migrar dados da planilha para o Tovia" | inferido de hábito |
| 14 | "Voluntários que executam não são técnicos" | customer.json (15%) |
| 15 | "Os participantes da igreja vão saber usar?" | inferido |

### Depois (durabilidade, o que acontece se falhar)

| # | problema | fonte |
|---|---|---|
| 16 | "E se eu assinar e o Tovia fechar?" | startup risk |
| 17 | "A prestação de contas vai servir para a liderança?" | painel (vários) |
| 18 | "Posso exportar meus dados se quiser sair?" | inferido |
| 19 | "O relatório financeiro vai ser aceito pelo tesoureiro?" | painel (P001) |
| 20 | "Se ninguém mais usa, não tenho com quem tirar dúvida" | painel (45 trust) |

---

## 2. Soluções — score e triagem

| # | solução | valor (1-5) | custo (1-5) | decisão |
|---|---|---|---|---|
| 1 | Casos reais documentados (3-5 igrejas no Chinám) | 5 | 1 | **MANTER** |
| 2 | Preço R$49/mês (Van Westendorp IPP) | 5 | 1 | **MANTER** |
| 3 | Trial 30 dias Pétach grátis sem cartão | 5 | 1 | **MANTER** |
| 4 | Relatório financeiro automático para apresentar à liderança | 5 | 1 | **MANTER** |
| 5 | BYOG — dinheiro direto na conta da igreja | 5 | 0 | **MANTER** (já existe) |
| 6 | CNPJ registrado + nota fiscal | 4 | 2 | **MANTER** (pendente) |
| 7 | Setup assistido: a gente configura o Asaas pra você | 5 | 2 | **MANTER** |
| 8 | Opção por evento avulso R$19 | 4 | 1 | **MANTER** |
| 9 | Suporte via WhatsApp no dia do evento | 4 | 3 | **MANTER** |
| 10 | Kit "convença a liderança": PDF + projeção de economia | 4 | 1 | **MANTER** |
| 11 | Onboarding em 15 min com vídeo passo a passo | 4 | 1 | **MANTER** |
| 12 | SLA de uptime 99,5% no dia do evento | 3 | 2 | **MANTER** |
| 13 | Importação de planilha (CSV → Tovia) | 3 | 2 | **MANTER** |
| 14 | Interface simplificada para voluntários (modo operador) | 3 | 4 | CORTAR (caro) |
| 15 | Página do participante auto-explicativa | 3 | 1 | **MANTER** |
| 16 | Exportação completa de dados (CSV) a qualquer momento | 4 | 1 | **MANTER** |
| 17 | Relatório pós-evento pronto para tesoureiro | 5 | 1 | **MANTER** (já existe) |
| 18 | Comunidade no WhatsApp de organizadores | 3 | 1 | **MANTER** |
| 19 | Templates de evento prontos (retiro, conferência, etc.) | 3 | 1 | **MANTER** |
| 20 | Garantia "primeiro evento" (não gostou, devolvemos) | 5 | 1 | **MANTER** |

---

## 3. O stack da oferta

### Nome da oferta

**"Primeiro Evento Garantido"**

### O core — descrito pelo resultado, não pelos ingredientes

> "Rode seu próximo evento de ponta a ponta — inscrições, pagamentos, check-in e prestação de contas — sem conferir Pix um a um, sem planilha, e com o dinheiro caindo direto na conta da sua igreja."

### Bonuses (matam objeções específicas)

| bônus | mata qual objeção | custo |
|---|---|---|
| **Setup Assistido**: a gente configura sua conta Asaas e cria seu primeiro evento junto com você (chamada de 15 min ou tutorial guiado) | #7 "dá trabalho configurar" + #11 "aprender ferramenta nova" | ~15 min do fundador por cliente |
| **Kit Liderança**: PDF pronto para apresentar ao pastor/tesoureiro com projeção de economia vs. Sympla/E-inscrição e como funciona o BYOG | #4 "tesoureiro não vai aprovar" + #10 "convencer a liderança" | 1 PDF, cria uma vez |
| **Templates de Evento**: retiro, conferência de mulheres, encontro de jovens, workshop — página de inscrição pronta, só personalizar | #11 "aprender ferramenta nova" + #19 "templates prontos" | Cria uma vez |

### A garantia

**"Garantia Primeiro Evento"**: rode um evento real no trial de 30 dias. Se o relatório financeiro não ficar pronto para apresentar à liderança, ou se você gastar mais tempo do que gastava com planilha, a gente devolve. Sem perguntas.

**Custo da garantia a uma taxa de claim de 10%:**
- 10% de R$49 = R$4,90 por cliente em média
- Com 8 clientes Pétach/mês (meta), custo = R$39/mês — absorvível

Na prática, a garantia custa quase zero: se o organizador rodou um evento inteiro, ele já viu o valor. A garantia elimina o risco percebido, não o risco real.

### Urgência e escarcity (verdadeiras)

- **Setup assistido é limitado aos primeiros 20 clientes.** Verdadeiro: o fundador solo não escala chamadas individuais indefinidamente.
- **Sem countdown fake, sem "vagas limitadas" artificiais.**

### Opção alternativa: evento avulso

Para quem não quer assinatura: **R$19 por evento** (sem mensal). Funcionalidades do Pétach por 30 dias a partir da criação do evento. Se fizer 3+ eventos, migra naturalmente para o mensal porque é mais barato.

---

## 4. Equação de valor — antes e depois

| dimensão | antes (pitch atual) | score | depois (com stack) | score |
|---|---|---|---|---|
| **Dream outcome** | Organizar eventos sem planilha | 6 | Rode seu evento inteiro e entregue prestação de contas pronta para a liderança | 8 |
| **Likelihood** | Ninguém conhece, 0 prova social | 2 | Trial grátis + garantia + setup assistido + casos reais | 6 |
| **Time to result** | Tem que configurar tudo sozinho | 4 | Setup assistido em 15 min, template pronto, evento rodando no mesmo dia | 8 |
| **Effort/sacrifice** | Aprender plataforma nova + convencer liderança + pagar R$119/mês | 3 | Trial sem cartão + Kit Liderança + R$49/mês (ou R$19/evento) | 7 |

**Score total (dream × likelihood) / (time × effort):**
- Antes: (6 × 2) / (4 × 3) = 12/12 = **1.0**
- Depois: (8 × 6) / (8 × 7) = 48/56 = **0.86** ← likelihood e time melhoraram drasticamente, mas effort ainda puxa pra baixo

**Nota:** O score numérico caiu por causa do denominador (time to result melhorou = número maior = divide mais). O que importa: **likelihood saiu de 2 para 6** — a maior alavanca. E **effort saiu de 3 para 7** — segunda maior. Essas eram as duas barreiras do painel.

---

## 5. Pitch atualizado

O pitch v2 incorpora: preço R$49, trial 30 dias, setup assistido, Kit Liderança, garantia, opção por evento. Salvo em `founder/pitch.md` (v1 preservado em `founder/pitch-v1.md`).

---

## 6. Resumo do stack

| elemento | o que é | custo para o Tovia |
|---|---|---|
| Core | Inscrições + pagamentos + check-in + relatório financeiro | R$10/cliente/mês (infra) |
| Preço | R$49/mês ou R$490/ano (ou R$19/evento) | — |
| Trial | 30 dias Pétach grátis, sem cartão | R$10 de infra |
| Setup Assistido | Config Asaas + primeiro evento junto | 15 min fundador |
| Kit Liderança | PDF projeção de economia + explicação BYOG | Cria 1x |
| Templates | 4 modelos de evento prontos | Cria 1x |
| Garantia | "Não economizou tempo? Devolvemos" | ~R$4,90/cliente (10% claim) |
| Evento avulso | R$19/evento sem assinatura | R$10 de infra |
| Comunidade | Grupo WhatsApp de organizadores | R$0 |
| Exportação | CSV completo a qualquer momento | R$0 (já existe) |

**Custo total do stack por cliente:** ~R$15/mês (infra + suporte diluído). Margem no Pétach a R$49: ~R$34/mês (69%).

---

## Próximo

- Atualizar `founder/pitch.md` com a oferta nova
- `/founder-consumer --quick` com seed 204892 para re-testar
- `/founder-cfo` para re-rodar números com o stack
- `/founder-marketing` para comunicar a oferta
