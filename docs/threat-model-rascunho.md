# Threat Model — Tovia (Rascunho para Revisão)

## 1. Ativos Protegidos

| Ativo | Localização | Classificação |
|-------|-------------|---------------|
| Chaves de API do gateway (Asaas etc) | `organizer_secrets/{uid}` (encrypted AES-256-GCM) | **Crítico** |
| Webhook tokens | `organizer_secrets/{uid}` (encrypted + hash) | **Crítico** |
| Dados pessoais de inscritos (nome, email, CPF, telefone) | `eventos/{id}/inscricoes`, `eventos/{id}/pessoas` | **Alto** |
| Dados financeiros de pagamentos | `eventos/{id}/pagamentos` | **Alto** |
| Credenciais Firebase (service account) | Variáveis de ambiente Vercel | **Crítico** |
| `GATEWAY_ENCRYPTION_KEY` | Variável de ambiente Vercel | **Crítico** |
| Tokens de autenticação Firebase Auth | Client-side (JWT) | **Médio** |
| Dados de perfil do organizador | `users/{uid}` | **Médio** |

## 2. Superfícies de Ataque

### APIs Públicas (Vercel Serverless)
- `POST /api/createEventCharge` — cria cobrança no gateway do organizador
- `POST /api/eventPaymentWebhook` — recebe notificações do gateway
- `POST /api/saveGatewayConfig` — salva chaves do gateway (autenticado)
- `POST /api/createCheckout` — billing da plataforma (Asaas direto)
- `POST /api/asaasWebhook` — webhook do billing
- `GET/POST /api/auth` — resolução de códigos, verificação

### Firestore (Client SDK)
- `paginas_venda` — leitura pública (dados de exibição)
- `organizer_public` — leitura pública (status de gateway)
- `eventos/{id}/tickets` — leitura pública (get por ID)
- `eventos/{id}/inscricoes` — escrita por qualquer autenticado (inscrição)
- Collection group queries em `inscricoes`, `pagamentos`, `doacoes`

### Páginas Públicas
- Página de vendas/inscrição (`/e/:eventoId/:slug`)
- Perfil público do organizador (`/org/:codigo`)
- Consulta de inscrição (`/consultar`)

## 3. Modelo de Atacantes

| Atacante | Capacidade | Motivação |
|----------|-----------|-----------|
| Visitante anônimo | Acesso às páginas públicas, pode ler dados de `paginas_venda` e `organizer_public` | Curiosidade, scraping |
| Usuário autenticado malicioso | Token Firebase Auth, pode ler docs conforme regras | Acesso a dados de outros organizadores |
| Organizador comprometido | Credenciais de um organizador real | Acesso ao gateway de outro organizador |
| Interceptador de rede | MITM (mitigado por HTTPS) | Roubo de credenciais/dados em trânsito |

## 4. Ameaças e Mitigações

### 4.1 Vazamento de chaves de gateway
- **Ameaça:** Client SDK lê `encrypted_api_key` de `users/{uid}`
- **Mitigação (T0.1 ✅):** Chaves movidas para `organizer_secrets` com `allow read, write: if false`
- **Status:** Implementado

### 4.2 Exposição de `config_pagamento` via `eventos/{id}`
- **Ameaça:** Qualquer um com ID do evento lê taxas e configurações financeiras
- **Mitigação (T0.2 ✅):** GET público fechado; página usa `evento_snapshot` em `paginas_venda`
- **Status:** Implementado

### 4.3 Webhook token hash exposto em `organizer_public`
- **Ameaça:** Hash SHA-256 do webhook token acessível publicamente
- **Mitigação (T0.3 ✅):** Hash movido para `organizer_secrets`
- **Status:** Implementado

### 4.4 Collection group queries vazam dados entre organizadores
- **Ameaça:** `/{path=**}/inscricoes` com `allow list: if true` permite listar inscrições de qualquer evento
- **Mitigação pendente (T0.4):** Testes negativos para validar isolamento; considerar fechar `list` público
- **Status:** Pendente (requer emulador Firebase + Java)

### 4.5 Secrets commitados no repositório
- **Ameaça:** Chaves ou tokens em código fonte
- **Mitigação (T0.5 ✅):** Gitleaks no CI
- **Status:** Implementado

### 4.6 Rate limiting insuficiente
- **Ameaça:** Abuso de endpoints de criação de cobrança ou webhook
- **Mitigação parcial:** `saveGatewayConfig` tem rate limit (10/hora). Outros endpoints sem limite explícito.
- **Status:** Parcial

### 4.7 Validação de entrada nas APIs
- **Ameaça:** Payloads malformados ou injeção
- **Mitigação:** Zod schemas validam body em todas as rotas principais
- **Status:** OK

### 4.8 IDOR em inscrições/pagamentos
- **Ameaça:** Usuário A acessa dados de inscrição do Usuário B
- **Mitigação:** Firestore rules verificam `isEventOwner` para leitura de inscrições
- **Status:** OK (validar com testes em T0.4)

## 5. Checklist de Requisitos de Segurança

- [x] Chaves de gateway criptografadas e isoladas do client SDK
- [x] Webhook tokens não expostos publicamente
- [x] Dados financeiros (config_pagamento) não acessíveis via GET público
- [x] Scan de secrets no CI
- [ ] Testes negativos de regras Firestore (T0.4 — requer Java/emulador)
- [ ] Rate limiting em `createEventCharge` e `eventPaymentWebhook`
- [ ] Revisão de collection group query permissions
- [ ] Content Security Policy headers
- [ ] Audit log de acesso a chaves do gateway
