# Tovia — Guia de Execução para o Claude Code

> **O que é este documento.** A versão executável do `tovia-plano-de-melhorias.md`. Enquanto o plano é a referência estratégica, este guia é imperativo: o Claude Code lê e executa item a item. Cada bloco é autocontido — objetivo, arquivos reais, passos, critério de aceite e documentos a atualizar. Os nomes e caminhos já foram verificados contra o código; use-os exatamente como estão.
>
> **Repositório:** `tovia-gestao-de-eventos-main` · **Fase:** MVP, pré-validação com instituições reais (nenhum cliente em produção ainda).

---

## Regras de operação (valem para TODOS os itens)

1. **Um item por vez, um item por branch/commit.** Não misture itens. Não faça alterações fora do escopo do item em execução. Se notar algo fora do escopo, anote no fim, não conserte.
2. **Não invente escopo.** Se um passo exigir uma decisão que não está aqui nem no plano, **pare e pergunte**. Não escolha por conta própria valores de negócio (preços, limites, nomes de plano).
3. **Rode a verificação ao fim de cada item**, nesta ordem, e só considere o item pronto se todas passarem:
   - `npm run lint`
   - `npm run test` (suíte Vitest — ~160 testes hoje; não pode regredir)
   - `npm run build` (TypeScript + Vite; zero erros de tipo)
   - `npm run lint:rules` (quando o item tocar `firestore.rules`)
4. **Código e regras deployam juntos.** Ao alterar `firestore.rules`, altere na mesma leva todo código que lê/grava os dados afetados. Nunca deixe a regra fechar um caminho que o código ainda usa (quebra produção) nem o contrário.
5. **Banco Firestore é nomeado.** Não é `(default)`. É `ai-studio-5b5d834d-8788-4cb4-90df-ca1c7e43a048`, já configurado em `firebase.json` e no `getDb()` de `api/_firebase.ts`. Deploy de regras: `firebase deploy --only firestore:rules` (usa o target do `firebase.json`). Não crie um segundo banco.
6. **Imports usam extensão `.js`** (ESM/NodeNext) mesmo apontando para arquivos `.ts` — siga o padrão existente (`import { db } from './_firebase.js'`).
7. **Preserve as convenções de nomenclatura** listadas abaixo. Não renomeie campos existentes; ao mover dados, mantenha os mesmos nomes de campo.

### Fatos verificados do repositório (não redescubra)

- **Acesso Admin SDK (backend `api/`):** `import { db } from './_firebase.js'`. O `db` é um proxy que resolve o Firestore nomeado. Admin SDK **ignora** as `firestore.rules` — por isso dados sensíveis protegidos por `if false` continuam acessíveis pelo backend.
- **Helpers de `firestore.rules` já existentes:** `isSignedIn()`, `isOwner(userId)`, `isAdmin()`, `isValidId(id)`, `incoming()`, `existing()`, `isEventOwner(id)`. Reutilize.
- **Criptografia:** `api/_gateway-utils.ts` exporta `encrypt(text, keyHex)` e `decrypt(data, keyHex)` (AES-256-GCM). A chave vem de env. Não reimplemente.
- **Leitura client-side de docs:** o front usa um helper `getDocument<T>(colecao, id)`.
- **Sem harness de teste de regras ainda:** não há `@firebase/rules-unit-testing`. Isso é criado no **T0.4**; itens anteriores validam regras por build + suíte existente + verificação manual no emulador (documentada no item).

### Convenções de nomenclatura decididas (usar exatamente)

| Uso | Nome | Razão |
|---|---|---|
| Coleção de segredos do organizador | `organizer_secrets/{uid}` | Irmão privado de `organizer_public/{uid}` — mesmo prefixo e mesma chave por uid |
| Doc público enxuto do evento (T0.2) | `paginas_venda/{id}` | Coleção **já existente**; estender em vez de criar nova |
| Campos de gateway (ao mover) | `encrypted_api_key`, `encrypted_webhook_token`, `type`, `sandbox`, `connected_at` | Mesmos nomes de hoje, apenas relocados |
| Booleano público de status | `gateway_connected` | Já existe; permanece legível (não é sensível) |

---

# TIER 0 — Segurança (executar primeiro, em ordem)

## T0.1 — Mover chaves de gateway para `organizer_secrets/{uid}`

**Objetivo.** Tirar `encrypted_api_key` e `encrypted_webhook_token` do doc `users/{uid}` (hoje legível por qualquer um quando `pagina_publica == true`) e colocá-los em `organizer_secrets/{uid}`, acessível apenas via Admin SDK. O cliente nunca precisa da chave — só de um booleano.

**Contexto (por que é seguro agora).** Nenhum organizador conectou gateway em produção até set/2026. Não há dado a migrar; a estrutura nasce fechada. *(Se houver qualquer chave gravada em `users` no momento da execução, PARE e peça o passo de migração antes de fechar a regra.)*

**Arquivos e mudanças:**
1. `api/saveGatewayConfig.ts` — hoje grava, em `users/{uid}`, `gateway_connected: true` **e** o objeto `gateway: { type, encrypted_api_key, sandbox, connected_at, encrypted_webhook_token }`. Alterar para:
   - Gravar os campos criptografados (`type`, `encrypted_api_key`, `encrypted_webhook_token`, `sandbox`, `connected_at`) em `organizer_secrets/{uid}` via Admin SDK.
   - Manter apenas `gateway_connected: true` em `users/{uid}` (booleano, não sensível). Manter também o `gateway_connected` já escrito em `organizer_public/{uid}`.
   - **Não** gravar mais nenhum campo `encrypted_*` em `users`.
2. `api/createEventCharge.ts` — hoje lê `orgData.gateway?.encrypted_api_key` do doc `users`. Alterar para ler de `organizer_secrets/{uid}` via Admin `db`, depois `decrypt(...)` igual a hoje.
3. **Todos os outros leitores server-side** — rode `grep -rn "encrypted_api_key\|encrypted_webhook_token\|\.gateway\?\." api/` e atualize cada leitura restante (ex.: webhooks que validem `encrypted_webhook_token`) para ler de `organizer_secrets`.
4. `src/features/public-pages/hooks/useSalesPageContent.ts` (≈ linhas 51–59) — hoje faz `getDocument<UserProfile>('users', criado_por)` e deriva `gatewayConnected` de `u?.gateway_connected === true && !!u?.gateway?.encrypted_api_key`. Alterar para derivar **apenas** de `u?.gateway_connected === true` (remover a checagem de `encrypted_api_key`). Continuar lendo `users` para `setOrganizador(u)` (perfil público do organizador). Nenhuma leitura de campo `encrypted_*` deve sobrar no cliente.
5. `src/types/user.ts` — remover `encrypted_api_key`/`encrypted_webhook_token` do tipo do `gateway` em `UserProfile`; criar um tipo para o doc `organizer_secrets` com esses campos.
6. `firestore.rules` — adicionar:
   ```
   match /organizer_secrets/{userId} {
     allow read, write: if false; // acesso só via Admin SDK
   }
   ```
   *(Admin SDK ignora esta regra; nenhum cliente lê ou escreve.)*

**Aceite (pronto quando):**
- `grep -rn "encrypted_" src/` não retorna nenhuma leitura client-side (só tipos, se houver).
- A página de vendas pública continua detectando corretamente gateway conectado/desconectado.
- `firestore.rules` fecha `organizer_secrets` para o cliente; verificação manual no emulador confirma que um `get` não-autenticado em `organizer_secrets/{uid}` é negado.
- lint + test + build + lint:rules passam.

**Docs a atualizar:** `backlog-tovia.html` (marcar #3 resolvido); `documento-produto.html` (seção Segurança — chaves em coleção só-servidor); `arquitetura-tovia.json` e `.html` (`firestore_collections`: incluir `organizer_secrets`); `codigos-erro.html` se o contrato de `saveGatewayConfig`/`createEventCharge` mudar.

---

## T0.3 — Remover `webhook_token_hash` de `organizer_public`
*(Executado junto do T0.1 por tocar o mesmo fluxo.)*

**Objetivo.** `saveGatewayConfig.ts` grava `webhook_token_hash` (SHA-256) em `organizer_public/{uid}`, que é público. É desnecessário lá.

**Mudanças:**
- `api/saveGatewayConfig.ts` — parar de gravar `webhook_token_hash` em `organizer_public`. Se o hash for necessário para validar webhooks, guardá-lo em `organizer_secrets/{uid}` (Admin SDK).
- Confirmar via `grep -rn "webhook_token_hash"` que nenhum leitor client-side depende dele; ajustar se depender.
- `firestore.rules` — remover o comentário sobre o campo público em `organizer_public` (linha ~264).

**Aceite:** `organizer_public` não contém mais campo derivado de segredo; validação de webhook (se usa o hash) lê de `organizer_secrets`; lint + test + build passam.
**Docs:** `backlog-tovia.html` (#24 resolvido).

---

## T0.2 — Doc público enxuto do evento (fechar exposição de `config_pagamento`)

**Objetivo.** `eventos/{id}` tem `allow get: if isValidId(eventoId)` — qualquer um com o ID lê o evento inteiro, incluindo `config_pagamento` (taxas, métodos, parcelas). Regras não projetam campos. Servir à página pública só o necessário, via `paginas_venda/{id}`.

**Mudanças:**
1. Identificar exatamente quais campos a página pública de vendas consome de `eventos` (dados de exibição do evento, tickets, branding). Rastrear pelos hooks em `src/features/public-pages/`.
2. Ao publicar/salvar um evento, gravar/atualizar um doc espelho enxuto em `paginas_venda/{id}` contendo **apenas** esses campos — nunca `config_pagamento` nem outros dados internos.
3. Apontar a página pública para ler `paginas_venda/{id}` em vez de `eventos/{id}`.
4. `firestore.rules` — fechar o `get` público de `eventos/{id}` (manter acesso para owner/admin/equipe já existente); manter `paginas_venda/{id}` com `allow get: if isValidId(...)`.

**Aceite:** página pública funciona lendo só `paginas_venda`; um `get` público em `eventos/{id}` é negado; `config_pagamento` não é mais legível sem ser owner; lint + test + build + lint:rules passam.
**Cuidado:** garanta que o espelho `paginas_venda` é atualizado em TODA edição de evento que afete a página pública (senão a página fica defasada). Cobrir isso.
**Docs:** `backlog-tovia.html` (#23 resolvido); `arquitetura-tovia.json`.

---

## T0.4 — Harness de teste de regras + testes negativos

**Objetivo.** Criar a infraestrutura de teste de `firestore.rules` (inexistente hoje) e cobrir os casos de acesso indevido — incluindo os fechados em T0.1/T0.2/T0.3.

**Mudanças:**
1. Adicionar `@firebase/rules-unit-testing` como devDependency e configurar o emulador Firestore (via `firebase.json`, apontando o banco nomeado).
2. Criar um script (ex.: `test:rules`) e uma suíte que use `initializeTestEnvironment`.
3. Escrever testes **negativos** cobrindo: `organizer_secrets` não legível/escrevível por cliente; `eventos/{id}` GET público negado; `paginas_venda/{id}` GET público permitido mas sem campos sensíveis; e uma varredura dos `allow list: if true` e collection-group queries (`/{path=**}/inscricoes`, `/pagamentos`, `/doacoes`) provando que não vazam dados entre organizadores diferentes.

**Aceite:** `npm run test:rules` roda no emulador e passa; os casos acima têm testes negativos explícitos verdes.
**Docs:** `backlog-tovia.html` (#27 parcial / testes de regra).

---

## T0.5 — Scan de secrets no CI (gitleaks)

**Objetivo.** Detectar chaves/tokens commitados acidentalmente.
**Mudanças:** adicionar `gitleaks` ao pipeline de CI (passo dedicado), com config apropriada. Hoje o `.gitignore` já bloqueia `.env*`, mas não há varredura.
**Aceite:** CI executa o scan e falha o build se encontrar segredo; passa no estado atual do repo.
**Docs:** `backlog-tovia.html` (#26 resolvido).

---

## T0.6 — Threat model documentado *(documentação, não código)*

**Objetivo.** Mapear ativos (dados de inscritos, chaves de gateway, dados financeiros), superfícies de ataque (APIs públicas, webhooks, páginas de inscrição) e atacantes; virar checklist de requisitos.
**Entregável:** seção de segurança no `documento-produto.html` (ou doc de segurança dedicado) + checklist.
**Nota:** este item é candidato a ser redigido junto com o Rick, não gerado autonomamente. Se executado pelo Claude Code, produzir rascunho para revisão, não versão final.
**Docs:** `backlog-tovia.html` (#27).

---

# TIER 1 — Confiabilidade (após o Tier 0)

## T1.1 — Fallback de e-mail atrás de abstração `EmailProvider`

**Objetivo.** O Resend retorna 401 recorrente e o OTP de login do participante depende de e-mail — é o fluxo central travando. Criar uma abstração `EmailProvider` (espelhando o padrão de `PaymentProvider` em `api/_payments/`) com Resend primário e um fallback (SES ou Postmark), com failover automático.

**Mudanças:**
1. Criar `api/_email/` com `provider.ts` (interface), `factory.ts` e adapters (`resend/`, e um fallback). Espelhar a estrutura de `api/_payments/`.
2. Refatorar `api/sendEmail.ts` e os 5 endpoints que usam Resend para passar pela abstração.
3. Failover: se o provider primário falhar (ex.: 401/5xx), tentar o fallback automaticamente e logar no Sentry.

**Aceite:** todos os envios passam pela abstração; teste unitário simulando falha do primário prova que o fallback é acionado; lint + test + build passam.
**Docs:** `backlog-tovia.html` (#4 resolvido); `arquitetura-tovia.json` (`external_services`).

---

## T1.2 — Consolidar os dois webhooks

**Objetivo.** Existem `api/asaasWebhook.ts` (242 linhas) e `api/eventPaymentWebhook.ts` (206 linhas). Determinar qual está ativo em produção e eliminar a ambiguidade (provável resquício da migração Vercel/Firebase).

**Mudanças:**
1. Investigar qual endpoint o painel do gateway efetivamente chama e qual está referenciado na config de produção. **Não remova nada antes de confirmar** — se incerto, reporte os achados e pergunte.
2. Remover o webhook morto **ou**, se ambos têm papel, documentar claramente a divisão de responsabilidade no topo de cada arquivo.

**Aceite:** um único caminho de webhook de pagamento ativo e inequívoco; testes de webhook existentes (97) continuam verdes; lint + test + build passam.
**Docs:** `backlog-tovia.html` (#1/#8).

---

# BLOQUEADOS — não iniciar sem liberação explícita

Os itens abaixo dependem de decisões de negócio e de medição de custo ainda não fechadas (ver `tovia-plano-de-melhorias.md`, Parte 1 e Parte 4). **Não comece a implementá-los.** Quando liberados, virão com valores concretos:

- **T2.2 — Novo modelo de planos e gating por volume.** Falta: preços, nomes dos 3 planos, teto de e-mails/mês, definição operacional de "evento ativo pelo ciclo financeiro" e a regra de degradação graciosa.
- **T2.3 — Créditos avulsos.** Falta: preço do crédito (depende da medição de custo) e o fluxo de cobrança.
- **T2.4 — Curso como evento recorrente com turmas.** Falta: modelagem detalhada.
- **T2.5 — Comunicados organizador→participante.** Depende do T1.1 (abstração de e-mail) e do teto de e-mail por plano (T2.2).

Itens de higiene (T2.6 EquipeTab órfã, T2.7 caching/PWA/SEO/package name, T2.8 reconciliação de backlog) podem ser executados a qualquer momento após o Tier 0, um por vez, seguindo as mesmas regras de operação.

---

*Companheiro de `tovia-plano-de-melhorias.md`. Comece por T0.1.*
