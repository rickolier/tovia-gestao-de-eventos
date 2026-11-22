# Operações — Tovia

## 1. Ciclo diário

Tovia é SaaS com fundador solo. Não há "abrir/fechar loja" — há blocos de atividade por prioridade.

### Bloco 1: Manhã (~1h) — Suporte e monitoramento
1. Verificar WhatsApp: mensagens de clientes/prospects (🔹 cliente vê)
2. Verificar Sentry: erros novos no app
3. Verificar Resend: emails com falha de entrega
4. Responder mensagens pendentes — meta: <4h de tempo de resposta (🔹 cliente vê)

### Bloco 2: Meio do dia (~2h) — Captação
5. Enviar mensagens 1-a-1 no WhatsApp para prospects (meta: 2-3/dia) (🔹 cliente vê)
6. Rodar setup assistido se agendado (~15 min por cliente) (🔹 cliente vê)
7. Follow-up com quem não respondeu (a cada 5 dias)

### Bloco 3: Tarde (~2h) — Produto e conteúdo
8. Corrigir bugs reportados / melhorias prioritárias
9. Criar conteúdo para Instagram (1-2 posts/semana)
10. Atualizar landing page com casos reais (quando houver)

### Bloco 4: Semanal (sexta-feira, ~1h) — Revisão
11. Revisar métricas: conversas iniciadas, setups agendados, eventos rodados
12. Atualizar planilha de pipeline de prospects
13. Planejar mensagens da próxima semana

**Total estimado:** 5-6h/dia nos primeiros 3 meses. Reduz para 3-4h conforme o produto estabiliza e o suporte diminui.

---

## 2. Fornecedores

### Infraestrutura (custos variáveis por cliente)

| Fornecedor | Serviço | Preço público | Mínimo | Pagamento |
|---|---|---|---|---|
| **Supabase** | Banco de dados + auth + storage | Free tier → Pro $25/mês | Sem mínimo | Cartão mensal |
| [supabase.com/pricing](https://supabase.com/pricing) | | Alt: PlanetScale, Neon | | |
| **Vercel** | Hosting + deploy | Free tier → Pro $20/mês | Sem mínimo | Cartão mensal |
| [vercel.com/pricing](https://vercel.com/pricing) | | Alt: Netlify ($19/mês), Cloudflare Pages (grátis) | | |
| **Resend** | Email transacional | Free 100/dia → Pro $20/mês (50k/mês) | Sem mínimo | Cartão mensal |
| [resend.com/pricing](https://resend.com/pricing) | | Alt: Postmark ($15/mês), Amazon SES (~$0.10/1000) | | |

### Ferramentas fixas

| Fornecedor | Serviço | Preço | Nota |
|---|---|---|---|
| **Registro.br** | Domínio .com.br | ~R$40/ano | Já contratado |
| **Sentry** | Monitoramento de erros | Grátis (Developer) | Limite: 5k eventos/mês |
| **Zoho Mail** | Email corporativo | Grátis (até 5 usuários) | Em uso |
| **Claude (Anthropic)** | AI para desenvolvimento | ~R$100/mês | Maior custo fixo |

### Gateway de pagamento do cliente

| Gateway | Taxa Pix | Taxa Boleto | Taxa Cartão | Nota |
|---|---|---|---|---|
| **Asaas** | R$1,99 | R$1,99 | 2,99%+ | Recomendado no pitch. Integrado. |
| [asaas.com/precos](https://www.asaas.com/precos) | | | | |
| **Mercado Pago** | 0,99% | R$3,49 | 4,74%+ | Alternativa popular |
| **Stripe** | 0,80% + R$0,67 | — | 3,99% + R$0,39 | Menos comum em igrejas |

**Nota:** as taxas do gateway são pagas pelo cliente (igreja), não pelo Tovia. O Tovia não intermedia dinheiro.

### Questão em aberto
- [ ] **CNPJ + contador:** custo varia de R$0 (MEI) a R$500-1.000 (ME). O fundador precisa consultar um contador para definir o melhor regime tributário (MEI tem limite de R$81k/ano de faturamento, suficiente para a fase inicial).

---

## 3. Pessoas

### Fase 1: Fundador solo (meses 1-6)

| Papel | Quem | Horas/semana | Custo |
|---|---|---|---|
| Desenvolvimento | Fundador | 10-15h | R$0 (tempo próprio) |
| Suporte | Fundador | 5-8h | R$0 |
| Captação/Vendas | Fundador | 8-10h | R$0 |
| Conteúdo/Marketing | Fundador | 3-5h | R$0 |
| **Total** | | **26-38h/semana** | **R$0** |

### Fase 2: Primeiras delegações (meses 6-12, se >10 clientes)

| Papel | Quem | Horas/semana | Custo estimado |
|---|---|---|---|
| Suporte nível 1 | Freelancer/estagiário | 10h | R$500-800/mês |
| Conteúdo Instagram | Freelancer | 5h | R$300-500/mês |
| Desenvolvimento | Fundador | 15-20h | R$0 |
| Vendas/Relacionamento | Fundador | 10-15h | R$0 |

**Nota:** contratação formal (CLT) envolve encargos de ~70-100% sobre o salário. Começar com freelancer/PJ. O contador precisa orientar sobre a estrutura.

### Rota semanal — Mês 1 (slow)

| Dia | Manhã (1h) | Meio (2h) | Tarde (2h) |
|---|---|---|---|
| Seg | Suporte + Sentry | 3 mensagens WhatsApp | Dev: bugs |
| Ter | Suporte | 2 mensagens + 1 setup | Dev: melhorias |
| Qua | Suporte | 3 mensagens WhatsApp | Conteúdo Instagram |
| Qui | Suporte | 2 mensagens + 1 setup | Dev: bugs |
| Sex | Suporte + revisão semanal | Follow-ups | Conteúdo + planejamento |
| Sáb-Dom | Suporte emergencial apenas (dia de evento) | — | — |

---

## 4. SOPs (Procedimentos Operacionais)

### SOP 1: Setup assistido de novo cliente

1. Agendar chamada de 15 min via WhatsApp (vídeo ou áudio)
2. Cliente cria conta no Tovia (guiar se necessário)
3. Conectar conta Asaas do cliente (orientar criação se não tiver)
4. Criar primeiro evento juntos: nome, data, preço, descrição
5. Gerar link de inscrição e testar com pagamento de R$1 (reembolsar depois)
6. Enviar link por WhatsApp para o cliente compartilhar
7. Agendar follow-up em 7 dias: "Como foi? Precisa de ajuda?"
8. Pedir permissão para usar como caso de uso (nome da igreja + números)

**Tempo total:** 15-25 min. **Meta:** <20 min após os primeiros 5 setups.

### SOP 2: Suporte no dia do evento

1. Notificação automática: evento acontece hoje (verificar na dashboard)
2. Mensagem proativa no WhatsApp: "Oi [nome], hoje é o dia! Se precisar de qualquer coisa durante o evento, me chama aqui."
3. Se problema reportado: responder em <30 min
4. Problemas comuns e respostas:
   - "Check-in não funciona" → verificar conexão, testar QR, modo offline
   - "Inscrito diz que pagou mas não aparece" → verificar status no Asaas, conferir manualmente
   - "Link de inscrição não abre" → verificar se o evento está publicado, testar link
5. Após o evento: mensagem de acompanhamento no dia seguinte

### SOP 3: Resposta a reclamação

1. Ler a mensagem inteira antes de responder
2. Agradecer pelo feedback (sem frase genérica — ser específico)
3. Confirmar que entendeu o problema (repetir nas suas palavras)
4. Dar prazo para resolução: "Vou resolver até [horário/dia]"
5. Resolver e avisar quando pronto
6. Verificar em 48h se o problema realmente foi resolvido
7. **Regra:** nunca demorar >4h para responder nos primeiros 20 clientes

### SOP 4: Revisão semanal (sexta-feira)

1. Abrir planilha de pipeline: quantos prospects contatados, quantos responderam, quantos agendaram
2. Verificar eventos da semana: quantos rodaram, problemas reportados
3. Checar métricas do marketing.md: conversas iniciadas, setups agendados, eventos rodados
4. Se alguma métrica no sinal de alerta → anotar ação corretiva para próxima semana
5. Planejar mensagens da próxima semana (quem contatar, follow-ups pendentes)
6. Verificar custos: Supabase/Vercel/Resend estão no free tier ou precisam upgrade?

### SOP 5: Onboarding de indicação

1. Receber nome + WhatsApp do indicado
2. Mensagem: "Oi [nome], o [quem indicou] da [igreja] me passou seu contato. Ele usou o Tovia pra [evento] e achou que podia te ajudar também. Quer que eu te mostre em 15 min?"
3. Se sim → SOP 1 (setup assistido)
4. Se não agora → marcar lembrete para 2 semanas

---

## 5. Stack de ferramentas

| Categoria | Ferramenta | Preço | Por que |
|---|---|---|---|
| **Código** | VS Code + GitHub | Grátis | Já em uso |
| **Deploy** | Vercel | Grátis → $20/mês | Já integrado, deploy automático |
| **Banco de dados** | Supabase | Grátis → $25/mês | Já integrado, auth + storage + DB |
| **Email** | Resend | Grátis → $20/mês | Já integrado, boa entregabilidade |
| **Email corporativo** | Zoho Mail | Grátis | contato@tovia.com.br |
| **Erros** | Sentry | Grátis | Monitoramento em produção |
| **Domínio** | Registro.br | R$40/ano | .com.br |
| **CRM / Pipeline** | Planilha Google | Grátis | Suficiente para <30 prospects |
| **Comunicação** | WhatsApp pessoal | Grátis | Canal principal de vendas e suporte |
| **Conteúdo** | Canva (free) + CapCut | Grátis | Instagram posts e Reels |
| **AI** | Claude | ~R$100/mês | Desenvolvimento e operações |
| **Financeiro** | Planilha + contador | R$0-200/mês | Controle básico; contador após CNPJ |

**Custo total da stack:** R$103/mês (fixo) + R$0-65/mês (se sair do free tier) = **R$103-168/mês**

Não precisa de: CRM pago (Pipedrive, HubSpot), ferramenta de email marketing (Mailchimp), chat de suporte (Intercom), analytics pago (Mixpanel). Tudo isso é para >50 clientes.

---

## 6. Licenças, permissões e obrigações

### Checklist para SaaS no Brasil

| Item | Status | O que fazer | Link/referência |
|---|---|---|---|
| **CNPJ** | ⬜ Pendente | Abrir MEI (grátis, limite R$81k/ano) ou ME (requer contador). MEI é suficiente para faturamento inicial. | [gov.br/mei](https://www.gov.br/empresas-e-negocios/pt-br/empreendedor) |
| **Nota fiscal** | ⬜ Depende do CNPJ | Emitir NFS-e para cada assinatura. Prefeitura do município do fundador. | Verificar portal da prefeitura de Atibaia-SP |
| **Regime tributário** | ⬜ Definir com contador | MEI: DAS ~R$70/mês fixo. Simples Nacional: 6-15,5% conforme faturamento. | [receita.fazenda.gov.br](https://www8.receita.fazenda.gov.br/SimplesNacional/) |
| **LGPD** | ⬜ Revisar | Política de privacidade no site, consentimento para coleta de dados, DPO (pode ser o próprio fundador inicialmente). | [gov.br/lgpd](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd) |
| **Termos de uso** | ⬜ Revisar | Contrato de prestação de serviço. Deixar claro que o Tovia não intermedia pagamentos. | Consultar advogado |
| **Código de Defesa do Consumidor** | ✅ Automático | Direito de arrependimento de 7 dias para compras online. Já contemplar no fluxo de cancelamento. | [planalto.gov.br/CDC](http://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm) |
| **Contrato com Asaas** | ⬜ Verificar | Se o Tovia indica o Asaas, verificar se há exigência de parceria formal ou programa de afiliados. | [asaas.com](https://www.asaas.com) |

**Nota:** regras variam por município e mudam. O fundador deve confirmar cada item com contador e/ou advogado. Isto não é conselho jurídico.

---

## 7. Registro de riscos

| # | Risco | Probabilidade | Impacto | Plano |
|---|---|---|---|---|
| 1 | **Nenhum cliente paga nos primeiros 3 meses** | Média | Alto | Pivotar para eventos gratuitos no Chinám como prova de conceito. Se 0 eventos rodados em 3 meses, reavaliar produto/mercado. Custo de manter o app rodando: R$103/mês — baixo o suficiente para sobreviver. |
| 2 | **Asaas muda termos/preços ou API** | Baixa | Alto | BYOG é agnóstico de gateway. Priorizar integração com segundo gateway (Mercado Pago ou Stripe) até mês 6. Manter abstração no código. |
| 3 | **App cai no dia do evento de um cliente** | Baixa | Muito alto | Monitoramento Sentry ativo. Check-in tem modo offline. Suporte WhatsApp no dia do evento. SLA informal: resolver em <1h se for dia de evento. |
| 4 | **Fundador adoece ou fica indisponível** | Média | Alto | SaaS roda sozinho (serverless). Suporte pode atrasar 1-2 dias sem impacto fatal. Para eventos no dia: ter mensagem automática de "estou indisponível, volto em X". Risco real: vendas param. |
| 5 | **Resend para de funcionar (API key 401)** | Média | Médio | Já aconteceu várias vezes. Ter roteiro de rotação de key documentado. Alternativa pronta: Amazon SES como fallback. |
| 6 | **Cliente reclama publicamente** | Baixa | Médio | SOP 3 (resposta a reclamação). Responder rápido, resolver, pedir para atualizar review. Com <10 clientes, cada reclamação é pessoal — resolver 1-a-1. |
| 7 | **Concorrente copia o BYOG** | Baixa (curto prazo) | Médio | E-inscrição é o mais provável — mas mudar de % por transação canibaliza receita deles. Vantagem do Tovia: velocidade de iteração (fundador solo = decisões rápidas). Construir switching costs: dados, relatórios, integrações. |
| 8 | **Free tier da infra estoura** | Média | Baixo | Supabase Pro $25/mês, Vercel Pro $20/mês, Resend Pro $20/mês. Total: +R$65/mês. Já contemplado no cenário do CFO. Monitorar uso semanalmente. |
| 9 | **CNPJ demora ou complica** | Média | Médio | MEI pode ser aberto em 1 dia online. Funcionar sem CNPJ limita: não emite nota, não assina contrato formal com igrejas. Priorizar abertura antes de fechar o primeiro pagante. |
| 10 | **Fundador perde motivação (burnout)** | Média | Alto | Custo de manter rodando é R$103/mês — não há pressão financeira para fechar. Definir marcos claros: 1 evento rodado → 5 eventos → 1 pagante → 5 pagantes. Celebrar cada um. Manter comunidade de founders (Y Combinator Startup School, comunidades brasileiras). |

---

## 8. Resumo

| Dimensão | Status |
|---|---|
| **Ciclo diário** | 5-6h/dia, 3 blocos (suporte → captação → produto) |
| **Fornecedores** | Todos contratados e integrados. Sem dependência de fornecedor físico. |
| **Pessoas** | Fundador solo. Primeira delegação possível a partir de 10 clientes. |
| **SOPs** | 5 procedimentos: setup, suporte no evento, reclamação, revisão semanal, indicação |
| **Stack** | R$103-168/mês. Tudo gratuito ou quase. |
| **Legal** | CNPJ é o blocker principal. MEI pode ser aberto em 1 dia. |
| **Riscos** | #1 (nenhum pagante) e #3 (app cai no evento) são os mais críticos. |

**O numbers.json não precisa de atualização** — os custos reais conferem com as estimativas.

**Próximo:** `/founder-launch` para o checklist de go-live.
