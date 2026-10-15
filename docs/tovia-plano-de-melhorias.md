# Tovia — Plano de Melhorias e Alterações

> **Propósito deste documento.** Fonte única de referência que consolida (1) as decisões de produto e negócio tomadas na revisão de setembro/2026 e (2) o plano técnico priorizado de alterações no código e nos documentos. Cada item técnico está numerado (T0.1, T1.2…) para virar, um a um, um prompt do Claude Code. As alterações são executadas pelo Claude Code; este documento é o contexto que alimenta esses prompts.
>
> **Data-base:** setembro/2026 · **Fase:** 2 (Captação) · **Autor da revisão:** Rick

---

## Como usar este documento

1. As **Decisões de produto e negócio** (Parte 1) são o modelo travado. Os itens técnicos as referenciam sem repetir.
2. O **Plano técnico** (Parte 2) é organizado em tiers de prioridade. A segurança (Tier 0) vem primeiro.
3. Cada item técnico traz: descrição, arquivos afetados, critério de "pronto quando" e documentos a atualizar. É esse conteúdo que forma o corpo de cada prompt.
4. A **Reconciliação doc × código** (Parte 3) lista os descompassos encontrados na auditoria, para não se perderem.
5. Os **documentos existentes são atualizados** — este plano não gera novos docs no conjunto de produto além dele mesmo.

### Princípios para escrever os prompts do Claude Code

- **Uma alteração isolada por prompt.** Um prompt = um item deste plano, com critério de pronto verificável. Nada de "melhore a segurança do Tovia".
- **Código e regras deployam juntos.** Nas mudanças de segurança, alterar `firestore.rules` sem alterar o código que lê os dados (ou vice-versa) quebra a produção. Os prompts de segurança tocam os dois lados na mesma leva.
- **Migração de dados existentes conta.** Mudar *onde* um dado é gravado não move os registros já existentes. Todo item que mexe em storage precisa de um passo de migração.
- **Degradação graciosa.** Nenhum limite corta o cliente no meio de um evento ativo — avisa e convida a upgrade.

---

# PARTE 1 — Decisões de produto e negócio

## 1.1 Novo modelo de planos (3 planos)

Redução de 4 para 3 planos. A mudança estrutural: **gate por volume, não por funcionalidade.** Todas as funcionalidades ficam liberadas desde o plano gratuito (inclusive gestão de doações, recursos, hospedagem etc.); o que separa os planos é o **volume de uso**. Racional: o diferencial do Tovia é organização, completude e cuidado com os dados — o usuário precisa *sentir* essa completude para se converter. Esconder módulos atrás de planos impede o usuário gratuito de experimentar a tese de venda. Ele deve tocar em tudo e esbarrar no volume, exatamente quando o produto já provou valor.

**BYOG (pagamento automático) é o gatilho de conversão principal.** Fica indisponível no gratuito e disponível em todos os planos pagos. No instante em que a instituição quer receber pagamento automático na conta, ela sobe de plano — independente de headcount.

### Tabela de limites

| Eixo | Plano 1 · Gratuito | Plano 2 · Pago (médio) | Plano 3 · Pago (completo) |
|---|---|---|---|
| **Âncora de público** | Porta de entrada / teste | Igreja modal (<300 membros) | Igreja grande (arquétipo CGA) |
| **BYOG (pagamento automático)** | ❌ *(gate principal)* | ✅ | ✅ |
| **Funcionalidades** | Todas liberadas | Todas | Todas |
| **Eventos ativos simultâneos** | 2 | 5 | 15 |
| **Inscrições por evento** | 100 | 300 | 600 |
| **E-mails/mês (guarda-custo interno)** | baixo *(definir)* | médio *(definir)* | alto, **não** ilimitado *(definir)* |
| **Comunicados em massa** | teto pequeno | teto médio | teto alto |
| **Preço mensal** | R$ 0 | *(definir — pós-medição)* | *(definir — pós-medição)* |

**Eixos de limite:**
- **Inscrições por evento** — métrica de valor visível ao cliente (intuitiva: "meu retiro tem 300 pessoas").
- **Eventos ativos simultâneos** — controla concorrência de uso.
- **E-mails/mês** — guarda-custo interno real (ver 1.2), não necessariamente exposto ao cliente.

**Por que os tetos não são "altos demais":** uma igreja de ~900 membros (a CGA, arquétipo do topo) nunca passa de ~360 pessoas num único evento. 600 inscrições/evento no Plano 3 cobrem com folga o operacional recorrente de qualquer igreja do público-alvo. Volumes acima disso são picos raros, atendidos por crédito avulso (ver 1.3), não por teto de assinatura.

**Pendências desta seção:** nomes dos 3 planos (manter tema hebraico, escolher 3); preços; teto numérico de e-mails/mês por plano — todos dependem da medição de custo (ver Pré-trabalho).

## 1.2 Cobrança e contagem por inscrição

O Tovia conta e cobra **por inscrição, não por pessoa.** Uma inscrição pode representar um grupo (casal, família): tem sempre um **conjunto âncora** de informações principais (que gera o e-mail e o registro) e um **conjunto complementar** (demais pessoas do grupo) que **não afeta o custo**.

- 1 inscrição = 1 e-mail = 1 registro âncora = 1 unidade contra o limite.
- O custo marginal real do Tovia é **e-mail** (OTP de acesso, confirmações), não Firestore. Por isso o guarda-custo interno dos planos é e-mails/mês.
- **Casal:** decisão do organizador, por evento, via ingresso e formulário personalizável. Ele pode criar um ingresso "casal" que conta 1 inscrição e coleta o cônjuge no formulário, ou dois ingressos separados. Se separar, conta 2 contra o limite — e a consequência (upgrade ou avulso) é escolha dele.
- **Cobrança por inscrição × logística por pessoa convivem:** o organizador ainda gerencia refeições/quartos por pessoa, via formulário e módulo de hospedagem, sem que isso afete o custo do Tovia.

## 1.3 Créditos avulsos para eventos grandes

Mecanismo de monetização que separa o recorrente do pontual. Eventos verdadeiramente grandes (acima do teto do plano) raramente são recorrentes — forçar a igreja a subir de plano recorrente por um pico anual gera cancelamento. Solução: a assinatura paga o dia a dia; o **crédito avulso** paga o pico.

- O crédito é um **passe por evento, com dimensão explícita:** "libera 1 evento de até X inscrições por Y meses". Não é saldo genérico.
- Mantém o controle de custo (você sabe exatamente o teto liberado) e é intuitivo.
- **Preço ancorado no custo real** daquele volume (ver Pré-trabalho).

## 1.4 Curso como evento recorrente com turmas

Cursos têm grade fixa e turma nova a cada semestre (na CGA: 3 cursos × 2 turmas/semestre × 2 semestres = 12 turmas/ano). Modelar como 12 eventos avulsos queimaria slots de "eventos ativos" e multiplicaria trabalho. Decisão: **curso = evento recorrente que contém turmas (instâncias).** Ocupa 1 slot de evento, com turmas dentro. Implica feature de **clonar/versionar** turma anterior.

Essa modelagem também mantém aberta a ponte para a visão futura de LMS (ver 1.7).

## 1.5 Definição de "evento ativo" pelo ciclo financeiro

Decisão de modelagem que **precede** o código de limites. "Um evento nunca é sobre a data, e sim sobre o acompanhamento": um evento de setembro com pagamento parcelado em 10× leva ~10 meses para encerrar, com webhooks de cobrança recorrente ativos o tempo todo.

**"Evento ativo" é definido pelo ciclo financeiro, não pela data:** o evento só desocupa o slot quando as cobranças pendentes se encerram. Definir pela data liberaria o slot cedo demais (e o Tovia ainda está trabalhando) ou puniria o cliente injustamente. O contador de "2/5/15 eventos ativos" depende desta definição.

## 1.6 Comunicados do organizador para participantes (feature nova)

**Lacuna doc × código:** os documentos vendem "comunicados em massa por email" ao participante como funcionalidade e como resolução de uma dor de marketing, mas hoje **isso não existe para o organizador**. O que existe é a página de Comunicados na Central Tovia Admin, que é *founder → clientes organizadores*. O organizador que precisa avisar 200 inscritos ("mudou o local do retiro") volta ao WhatsApp/planilha — a dor que o Tovia promete matar.

**Decisão: construir** a feature de comunicados *organizador → participantes do evento*. Coerente com a tese do produto. Como é o maior gerador discricionário de e-mail do sistema, **nasce com teto de volume por plano desde o dia 1** — feature e guarda-custo desenhados juntos.

## 1.7 Visão futura — LMS (fora do roadmap atual)

A igreja contratou uma plataforma de cursos online estilo "Netflix". "Curso como evento recorrente com turmas" (1.4) é o primeiro degrau na direção de um **LMS** (Learning Management System — plataforma de gestão de aprendizagem: hospeda aulas, organiza módulos, acompanha progresso, emite certificado). O valor de anotar agora não é planejar — é **não fechar portas**: modelar cursos pensando em turmas/instâncias/progressão mantém o caminho aberto. Registrado como visão de longo prazo no documento de negócio. Fora do roadmap da Fase 2.

## 1.8 Decisões ainda em aberto

- Nomes e preços dos 3 planos.
- Teto numérico de e-mails/mês por plano.
- Preço do crédito avulso.
- Regra exata de degradação graciosa ao atingir limite (mensagem, ponto de aviso).
- Check-in de inscrição de grupo (1 QR para N pessoas — detalhe de implementação).

---

# PARTE 2 — Plano técnico priorizado

## Tier 0 — Segurança *(prioridade máxima)*

### T0.1 — Mover chaves de gateway para documento só-servidor
As chaves `encrypted_api_key` / `encrypted_webhook_token` são gravadas em `users/{uid}`, cujo `get` é liberado publicamente para qualquer organizador com `pagina_publica == true` (justamente quem vende ingressos). Como as regras não projetam campos, o blob criptografado fica legível por qualquer um. A chave é ciphertext (AES-256-GCM com secret de ambiente), então não é vazamento em texto puro — mas é defesa-em-profundidade quebrada e desnecessária: o cliente só lê esse doc para derivar um booleano que já existe em `organizer_public.gateway_connected`.
- **Ação:** criar coleção `gateway_secrets/{uid}` (ou `users_private/{uid}`) com `allow read, write: if false` (acesso só via Admin SDK). Mover os campos `encrypted_*` para lá.
- **Arquivos:** `api/saveGatewayConfig.ts`, `api/createEventCharge.ts`, `api/asaasWebhook.ts` / `api/eventPaymentWebhook.ts` (se leem a chave), `src/features/public-pages/hooks/useSalesPageContent.ts` (trocar leitura de `!!u?.gateway?.encrypted_api_key` por `organizer_public.gateway_connected`), `firestore.rules`, `src/types/user.ts`.
- **Migração:** dispensada — não há chaves de gateway gravadas em produção (nenhum organizador conectou gateway até set/2026). A mudança é apenas de estrutura; a regra nasce fechada e o primeiro organizador real já entra no formato seguro. *(Se isso mudar antes da execução, reintroduzir o passo de migração dos `users` docs existentes.)*
- **Pronto quando:** nenhum campo `encrypted_*` legível por regra client-side; página de vendas continua detectando gateway conectado; teste de regra provando que `get` no doc de secrets falha para não-owner.
- **Docs:** backlog #3 (resolver); `documento-produto` (Segurança); `arquitetura-tovia.json` (`firestore_collections`); `codigos-erro` se mudar contrato.

### T0.2 — Documento público enxuto para eventos
`eventos/{id}` tem `allow get: if isValidId(eventoId)` — qualquer um com o ID lê o evento inteiro, incluindo `config_pagamento` (taxas, métodos, parcelas). Regras não projetam campos.
- **Ação:** criar/estender um doc público mínimo (ex.: `paginas_venda/{id}`) só com o que a página de vendas precisa; fechar o `get` público em `eventos`.
- **Arquivos:** `firestore.rules`, hook da página pública, código que grava o doc público ao publicar evento.
- **Pronto quando:** página pública funciona lendo só o doc enxuto; `config_pagamento` não é mais legível sem ser owner.
- **Docs:** backlog #23.

### T0.3 — Remover `webhook_token_hash` do `organizer_public`
Campo público desnecessário (o próprio comentário nas regras prevê remoção na "migração Split Asaas #50"). Aproveitar a mesma leva do T0.1.
- **Arquivos:** `api/saveGatewayConfig.ts`, `firestore.rules`.
- **Docs:** backlog #24.

### T0.4 — Hardening geral das `firestore.rules`
Revisar `allow list: if true` (ex.: subcoleção `tickets` de evento) e as collection-group queries (`/{path=**}/inscricoes`, `/pagamentos`, `/doacoes`) para confirmar que nenhuma vaza dado entre organizadores. Escrever testes de regra para os casos negativos.
- **Pronto quando:** suíte de testes de `firestore.rules` cobrindo acesso cruzado entre organizadores.

### T0.5 — Scan de secrets no CI (gitleaks)
Adicionar `gitleaks` (ou `trufflehog`) ao pipeline. Barato, alto valor.
- **Arquivos:** config de CI. · **Docs:** backlog #26.

### T0.6 — Threat model documentado
Mapear ativos (dados de inscritos, chaves de gateway, dados financeiros), superfícies (APIs públicas, webhooks, páginas de inscrição) e atacantes; gerar checklist de requisitos. Entregável de documentação.
- **Docs:** backlog #27 + seção de segurança do `documento-produto`.

## Tier 1 — Confiabilidade e operação

### T1.1 — Fallback de e-mail atrás de abstração
O Resend retorna 401 recorrente e o **OTP de login do participante depende disso** — é o fluxo central travando. Criar um `EmailProvider` (mesmo padrão do `PaymentProvider`) com Resend primário e fallback (SES ou Postmark).
- **Arquivos:** `api/sendEmail.ts` + nova abstração; os 5 endpoints que usam Resend.
- **Docs:** backlog #4.

### T1.2 — Consolidar os dois webhooks
Existem `api/asaasWebhook.ts` (242 linhas) e `api/eventPaymentWebhook.ts` (206 linhas). Investigar qual está ativo em produção; remover o morto ou documentar a divisão. Provável resquício da migração Vercel/Firebase.
- **Docs:** backlog #1/#8.

### T1.3 — Validar pagamento end-to-end em produção
Organizador externo real, pagamento real, webhook chegando. Item #1 do backlog; destrava a confiança para vender. Checklist operacional.

### T1.4 — NFS-e da assinatura + enquadramento de CNPJ *(decisão/contador)*
Emissão fiscal não é "futuro": no primeiro pagamento de assinatura já é obrigação. Confirmar enquadramento **ME/Simples** em vez de MEI — o cenário-meta de R$5k/mês já se aproxima do teto anual do MEI (~R$81k) e licenciamento de software costuma não se enquadrar no MEI. Afeta o roadmap; execução é mais decisão do que código.
- **Docs:** backlog #21.

## Tier 2 — Produto, monetização e observabilidade

### T2.1 — Instrumentar analytics de produto (PostHog)
Os KPIs (taxa de ativação, WAU, funil visitante→cadastro) **não são mensuráveis sem isso** — os OKRs da Fase 2 ficam sem baseline. Definir eventos alinhados ao "aha moment": evento criado, página publicada, 1ª inscrição, 1º pagamento.
- **Docs:** backlog #12; `kpis-tovia` (marcar como instrumentado).

### T2.2 — Novo modelo de planos e gating por volume
Implementar o modelo da Parte 1.1: 3 planos, gate por volume, BYOG em todos os pagos. Depende de: (a) definição de "evento ativo" pelo ciclo financeiro (1.5) e (b) medição de custo (Pré-trabalho). Gating conta **inscrições, não pessoas** (1.2), com **degradação graciosa** (nunca cortar no meio de evento ativo).
- **Arquivos:** `plan-limits` (src e api), tipos de plano, telas de faturamento/upgrade.
- **Pronto quando:** limites 2/5/15 e 100/300/600 aplicados; ao atingir o teto, o sistema avisa e convida a upgrade sem bloquear inscrições de evento pago em andamento.
- **Docs:** `documento-produto` (planos e preços); `marketing-gtm`; `kpis-tovia`; `arquitetura-tovia.json` (`plans`).

### T2.3 — Créditos avulsos para eventos grandes
Nova feature de monetização (1.3): passe por evento com dimensão explícita, preço ancorado em custo.
- **Arquivos:** modelo de crédito/entitlement, fluxo de compra (BYOG/gateway próprio ou cobrança Tovia — definir), aplicação do crédito ao liberar um evento acima do teto.
- **Pronto quando:** organizador em plano recorrente consegue liberar um evento único acima do teto via crédito, com prazo e limite próprios.
- **Docs:** `documento-produto` (modelo de negócio); `codigos-erro` (novos endpoints).

### T2.4 — Modelar curso como evento recorrente com turmas
Implementar 1.4: curso ocupa 1 slot com turmas (instâncias) dentro; feature de clonar/versionar turma.
- **Pronto quando:** um curso com múltiplas turmas ocupa 1 evento ativo, não N; nova turma é criada por clonagem da anterior.
- **Docs:** `documento-produto` (funcionalidades); `arquitetura-tovia.json`.

### T2.5 — Comunicados do organizador → participantes
Construir a feature de 1.6, com **teto de e-mail por plano embutido desde o início**. Fecha a lacuna doc × código.
- **Arquivos:** nova área de comunicados no painel do organizador (reaproveitar editor Tiptap já existente), envio via abstração de e-mail do T1.1, contagem contra o teto do plano.
- **Pronto quando:** organizador envia comunicado a todos os inscritos de um evento; o volume conta contra o teto de e-mail do plano; docs refletem a feature real.
- **Docs:** `documento-produto`; `marketing-gtm` (alinhar promessa ao entregue).

### T2.6 — Resolver `EquipeTab.tsx` órfã
414 linhas nunca importadas: conectar ao EventDetail ou remover. Decidir antes de virar dívida permanente.
- **Docs:** backlog #25.

### T2.7 — Higiene: caching, PWA, SEO, package name
Grupo de prompts curtos e independentes: React Query/SWR (#20) e Firestore persistence (#19); `manifest.json` + service worker (#6); Open Graph, `sitemap.xml`, `robots.txt`, Schema.org (#5); `package.json name` de `react-example` → `tovia`.

### T2.8 — Reconciliar backlog e documentos
Atualizar `backlog-tovia.html`, que está defasado (a duplicação `functions/` já foi removida; o código já cita itens que o doc não tem, como #50), e sincronizar os demais docs conforme os itens acima forem concluídos.

## Tier 3 — Crescimento *(futuro, pós-PMF da Fase 2)*

Gateways adicionais (Stripe, Mercado Pago, Pagar.me — abstração já pronta); relatórios cross-evento (#9); integração Google Calendar (#10); i18n (#18); API pública (#15); publicação do mobile nas lojas (#7); e a **visão LMS** (1.7). Registrados, fora da execução imediata.

---

# PARTE 3 — Reconciliação doc × código (auditoria set/2026)

Descompassos encontrados ao cruzar os documentos com o código-fonte:

| Achado | Situação | Item |
|---|---|---|
| Chaves de gateway em doc client-readable | **Corrigir** (segurança) | T0.1 |
| `config_pagamento` exposto em `eventos` GET | **Corrigir** (segurança) | T0.2 |
| `webhook_token_hash` público em `organizer_public` | **Corrigir** (segurança) | T0.3 |
| Comunicados ao participante prometidos nos docs, ausentes no código | **Construir feature** | T2.5 |
| `functions/` (duplicação Vercel/Firebase) já removida, mas backlog diz "pendente" | Doc defasado — atualizar | T2.8 |
| Backlog é snapshot parcial (código cita #50; doc vai até ~29) | Doc defasado — atualizar | T2.8 |
| `getBillingInfo` é handler em `admin.ts`, não rota isolada | `codigos-erro` impreciso — ajustar | T2.8 |
| `package.json name` = `react-example` | Cosmético — corrigir | T2.7 |
| Multi-gateway declarado como "só Asaas implementado" | **Correto** — sem ação | — |

**Aderência geral:** alta. A stack, a suíte de funcionalidades (com lastro em coleções reais do Firestore), a abstração de pagamento, a criptografia AES-256-GCM e a contagem de ~160 testes conferem com os documentos. Os desvios são pontuais.

---

# PARTE 4 — Pré-trabalho (medições antes de cravar números)

Sem isso, os números dos planos e do crédito são chute:

1. **Custo real por inscrição** — reads/writes de Firestore por ciclo de inscrito. Baixo e previsível (o modelo por inscrição, 1.2, torna-o estável), mas medir dá a margem exata.
2. **Custo real por e-mail** — o custo marginal que de fato escala. Referência: Resend gratuito até 3.000/mês; ~3–4 igrejas do porte da CGA já estouram a faixa grátis. Define o teto de e-mails/mês por plano e o guarda-custo.

Com esses dois números, cada teto vira margem conhecida (preço = custo no pior caso × margem-alvo) e o crédito avulso ganha preço real.

---

# PARTE 5 — Sequência de execução sugerida

1. **Tier 0 completo** (segurança — prioridade e maior delicadeza; escrever os prompts com passos de migração e teste explícitos). Ordem interna: T0.1 → T0.3 (mesma leva) → T0.2 → T0.4 → T0.5 → T0.6.
2. **T1.1 e T1.2** (confiabilidade do fluxo central).
3. **Pré-trabalho de medição** (destrava a precificação).
4. **T2.2 → T2.3 → T2.5 → T2.4** (novo modelo comercial e features associadas).
5. **T2.1** (analytics) em paralelo, quando possível.
6. **T2.6, T2.7, T2.8** (higiene e reconciliação) conforme disponibilidade.
7. **Tier 3** após o PMF da Fase 2.

---

# PARTE 6 — Mapa de documentos existentes a atualizar

| Documento | Atualizações previstas |
|---|---|
| `documento-produto.html` | 3 planos e preços; BYOG em todos os pagos; créditos avulsos; comunicados ao participante (feature real); curso recorrente; seção de segurança pós-T0.1; visão LMS no bloco de negócio |
| `marketing-gtm-tovia.html` | Reposicionar BYOG (agora em todos os pagos); alinhar a promessa de comunicados ao que é entregue |
| `kpis-tovia.html` | Instrumentação (T2.1); ajustar metas/faixas se os planos mudam |
| `backlog-tovia.html` | Reconciliar status (#2 feito, #3/#23/#24 em andamento); adicionar itens novos; sincronizar com o backlog real do código |
| `arquitetura-tovia.json` / `.html` | `firestore_collections` (gateway_secrets, doc público de evento); `plans`; novas rotas |
| `codigos-erro.html` | Novos endpoints (créditos, comunicados); corrigir enquadramento de `getBillingInfo` |

---

*Documento vivo. Próximo passo: extrair os prompts do Claude Code a partir dos itens do Tier 0, começando por T0.1.*
