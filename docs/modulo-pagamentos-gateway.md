# Módulo de Pagamentos Automáticos — Tovia
**Documento de Visão Técnica e de Negócio**
Versão 1.0 — Junho 2026

---

## 1. Conceito e Proposta de Valor

### O que é

O Módulo de Pagamentos Automáticos do Tovia permite que organizadores de eventos recebam pagamentos online diretamente em suas próprias contas de gateway — sem intermediação financeira do Tovia.

O organizador conecta a conta que já possui em uma das plataformas suportadas (Asaas, Pagar.me ou Mercado Pago), e a partir daí todos os ingressos pagos pelos participantes vão direto para a conta dele. O Tovia apenas orquestra a cobrança via API.

### O que diferencia dos concorrentes

| Plataforma | Modelo | Taxa por ingresso |
|---|---|---|
| Sympla | Intermediador financeiro | 10% do valor do ingresso |
| Eventbrite | Intermediador financeiro | ~5–7% + fixo por ingresso |
| **Tovia** | **BYOG — dinheiro direto ao organizador** | **Apenas as taxas do gateway escolhido** |

O Tovia **não é intermediador financeiro**. O dinheiro nunca passa pelo Tovia — vai diretamente da conta do participante para a conta do organizador no gateway. O Tovia cobra apenas a mensalidade mensal do plano.

### Benefícios para o organizador

- Controle total sobre o próprio dinheiro
- Sem divisão de receita com a plataforma
- Escolha da plataforma de pagamento que já usa ou prefere
- Taxas conhecidas e negociáveis diretamente com o gateway
- Saque configurado nas próprias preferências da conta do gateway

---

## 2. Estrutura de Planos

| Plano | Mensalidade | Pagamentos | Limites |
|---|---|---|---|
| Start | Gratuito | Sem módulo de pagamentos | 1 evento, 200 inscritos, 1 ingresso |
| Essencial | A definir | Manual (organizador registra manualmente) | 3 eventos, 500 inscritos, 3 ingressos |
| Pro | A definir | Automático via gateway próprio (BYOG) | 10 eventos, 1.000 inscritos, 10 ingressos |
| Custom | A definir | Automático via gateway próprio (BYOG) | Ilimitado |

**No plano Pro e Custom:** o Tovia não cobra percentual por ingresso vendido. A receita do Tovia é exclusivamente a mensalidade.

---

## 3. Gateways Suportados

### 3.1 Asaas

- **Site:** asaas.com
- **Foco:** cobranças recorrentes, assinaturas, PIX, boleto, cartão
- **Melhor para:** organizadores que já usam Asaas para outras finalidades ou precisam de boleto com vencimento programado
- **Taxas padrão:**

| Forma de pagamento | Taxa |
|---|---|
| PIX | R$ 1,99 por transação |
| Boleto | R$ 1,99 por transação recebida |
| Cartão de débito | R$ 0,35 + 1,89% |
| Cartão de crédito à vista | R$ 0,49 + 2,99% |
| Cartão de crédito 2–6x | R$ 0,49 + 3,49% |
| Cartão de crédito 7–12x | R$ 0,49 + 3,99% |
| Cartão de crédito 13–21x | R$ 0,49 + 4,29% |
| Saque (TED) | R$ 5,00 |

### 3.2 Pagar.me

- **Site:** pagar.me
- **Foco:** e-commerce, marketplaces, checkout transparente
- **Melhor para:** organizadores que precisam de checkout customizado e vendas de alto volume
- **Taxas:** consultadas em pagar.me/precos (variam por volume e plano contratado)

### 3.3 Mercado Pago

- **Site:** mercadopago.com.br
- **Foco:** checkout com alta taxa de conversão, reconhecimento do consumidor final
- **Melhor para:** organizadores com público amplo que já usa Mercado Livre/Mercado Pago
- **Taxas:** variam por método e plano; consultadas em mercadopago.com.br/taxas

---

## 4. Fluxo Completo de Pagamento

```
[1] Participante acessa a página pública do evento
[2] Seleciona o(s) ingresso(s) e quantidade
[3] Preenche dados pessoais e escolhe forma de pagamento
[4] Tovia cria uma cobrança na API do gateway usando a key do organizador
[5] Participante é redirecionado para o checkout (PIX, boleto ou cartão)
[6] Participante conclui o pagamento
[7] Gateway envia confirmação via webhook para o Tovia
[8] Tovia atualiza o status da inscrição para "pago"
[9] Tovia envia email de confirmação para o participante
[10] Dinheiro cai na conta do organizador no gateway (conforme prazo de liquidação)
```

### Prazos de liquidação por forma de pagamento (referência Asaas)

| Método | Prazo para cair na conta |
|---|---|
| PIX | Imediato |
| Cartão de crédito à vista | D+30 (ou antecipável com taxa) |
| Cartão de crédito parcelado | Conforme parcela (ou antecipável) |
| Boleto | D+2 úteis após pagamento |

---

## 5. O Que o Organizador Precisa Fazer no Gateway

Esta é a parte mais importante do ponto de vista de proteção do Tovia e experiência do organizador. Antes de conectar o gateway ao Tovia, o organizador precisa ter a própria conta completamente configurada.

### 5.1 Criação e validação da conta

Todos os gateways exigem um processo de KYC (Know Your Customer) para liberar recebimentos:

**Pessoa Física (CPF):**
- Nome completo conforme documento
- CPF válido
- Data de nascimento
- Endereço completo
- Selfie ou foto do documento (frente e verso)
- Número de celular validado

**Pessoa Jurídica (CNPJ):**
- CNPJ ativo e regular na Receita Federal
- Razão social e nome fantasia
- Endereço comercial
- Representante legal: CPF, RG ou CNH, selfie
- Contrato social ou requerimento de empresário (em alguns casos)

> **Atenção para o Tovia:** O Tovia deve orientar o organizador a concluir o KYC no gateway antes de tentar conectar. Uma key de conta não verificada pode funcionar para criar cobranças mas não permite saques — o organizador recebe pagamentos que ficam retidos.

### 5.2 Cadastro da conta bancária para saque

O organizador deve cadastrar a conta bancária onde deseja receber os saques:

- Banco, agência e conta corrente ou poupança
- A conta deve estar no mesmo CPF/CNPJ da conta do gateway
- Alguns gateways permitem cadastrar mais de uma conta e definir um padrão

> **Atenção para o Tovia:** Se o organizador não cadastrar a conta bancária, o dinheiro fica retido no saldo do gateway e não cai na conta dele. O Tovia não tem como fazer isso por ele — é uma ação que só o próprio titular da conta no gateway pode executar. A tela de conexão do Tovia deve exibir um checklist claro com esse passo.

### 5.3 Saque automático vs. manual

Os gateways oferecem duas modalidades:

| Modalidade | Como funciona |
|---|---|
| Saque automático | O saldo disponível cai na conta bancária em D+1 útil automaticamente |
| Saque manual | O organizador precisa entrar no gateway e solicitar o saque quando quiser |

O Tovia deve recomendar **saque automático** para evitar que o organizador esqueça de solicitar e depois não saiba onde está o dinheiro do evento.

### 5.4 Configuração de limite de parcelamento

Alguns gateways permitem que o vendedor defina o número máximo de parcelas aceitas. O organizador deve:

- Definir o número máximo de parcelas (recomendado: conforme a lógica do evento)
- Decidir se o custo do parcelamento é absorvido por ele ou repassado ao participante

O Tovia já tem essa lógica no `FinanceiroConfigTab` — ao conectar o gateway, o Tovia pré-preenche com as taxas padrão e o organizador ajusta conforme sua configuração no gateway.

### 5.5 Geração da API Key

Cada gateway tem um caminho diferente para criar a API key:

**Asaas:**
- Menu: Configurações → Integrações → Chave de API
- Gerar nova chave (ambiente de produção, não sandbox)
- Copiar e colar no Tovia

**Pagar.me:**
- Menu: Configurações → Chaves de API
- Criar chave do tipo "Chave Secreta" (não a chave pública)
- Copiar e colar no Tovia

**Mercado Pago:**
- Menu: Seu negócio → Configurações → Credenciais
- Usar o "Access Token" de produção (não o de teste)
- Copiar e colar no Tovia

> **Atenção crítica:** O organizador deve usar sempre a key de **produção**, não a de sandbox/teste. O Tovia detecta automaticamente e exibe um alerta se uma key de sandbox for inserida em ambiente de produção.

---

## 6. Checklist de Onboarding (exibido ao organizador no Tovia)

Ao acessar "Configurações de Pagamento" no Pro, o organizador verá:

```
☐ 1. Criar conta na plataforma escolhida
☐ 2. Completar verificação de identidade (KYC)
☐ 3. Cadastrar conta bancária para saque
☐ 4. Ativar saque automático (recomendado)
☐ 5. Gerar a API Key de produção
☐ 6. Colar a API Key no Tovia
☐ 7. Aguardar validação (Tovia faz uma chamada de teste)
✓ Pronto — checkout ativo para seus eventos
```

---

## 7. Arquitetura Técnica

### 7.1 Armazenamento das credenciais

As API Keys dos organizadores são dados altamente sensíveis e seguem protocolo de segurança máximo:

- **Nunca armazenadas em texto plano** no Firestore
- Criptografadas com AES-256 usando uma chave mestra armazenada como variável de ambiente no servidor (Vercel)
- A chave descriptografada existe apenas em memória dentro da Cloud Function durante a execução
- O frontend **nunca recebe a key** — só recebe a informação "gateway: asaas, status: conectado"
- Nenhum log imprime a key

### 7.2 Camada de abstração de gateway

O Tovia implementa uma interface comum para todos os gateways, de forma que adicionar um novo gateway no futuro não exige alterar o fluxo de checkout:

```typescript
interface GatewayAdapter {
  // Criação de cobrança (ingresso pago)
  createCharge(params: ChargeParams): Promise<ChargeResult>

  // Criação de assinatura (ingresso recorrente)
  createSubscription(params: SubscriptionParams): Promise<SubscriptionResult>

  // Processamento do webhook recebido
  handleWebhook(payload: unknown, signature: string): Promise<WebhookResult>

  // Verificação de saúde da conexão
  healthCheck(): Promise<{ ok: boolean; accountName: string }>
}
```

Implementações: `AsaasAdapter`, `PagarmeAdapter`, `MercadoPagoAdapter`

### 7.3 Roteamento de webhooks

Cada organizador tem uma URL de webhook única no Tovia:

```
https://tovia.app/api/webhook/{gateway}/{userId}
```

O Tovia registra essa URL automaticamente no gateway ao conectar a conta — o organizador não precisa configurar manualmente. Ao receber o webhook, o Tovia:

1. Valida a assinatura digital do gateway (evita webhooks forjados)
2. Identifica o organizador pelo `userId` na URL
3. Busca a cobrança no Firestore pelo `chargeId` retornado pelo gateway
4. Atualiza o status da inscrição correspondente
5. Dispara o email de confirmação ao participante via Resend

### 7.4 Health check periódico

A cada 24 horas, o Tovia faz uma chamada leve à API do gateway de cada organizador conectado. Se a chamada falhar (key revogada, conta suspensa, etc.):

1. O checkout do organizador é pausado automaticamente
2. O organizador recebe email: "Sua integração com [Gateway] está inativa — reconecte para reativar o checkout"
3. O painel do Tovia exibe um alerta em destaque

---

## 8. Pontos Críticos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| API key vazada | Acesso à conta financeira do organizador | Criptografia AES-256 + nunca no frontend |
| Key revogada sem aviso | Checkout quebrado silenciosamente | Health check diário + notificação imediata |
| Webhook não chega | Inscrição fica como "pendente" para sempre | URL única por organizador + registro automático + reprocessamento manual |
| Sandbox em produção | Dinheiro "pago" mas não recebido | Detecção automática ao conectar + alerta bloqueante |
| Gateway fora do ar | Impossível vender ingressos temporariamente | Mensagem de erro clara na página de inscrição |
| KYC incompleto no gateway | Dinheiro retido, não cai na conta | Checklist de onboarding + aviso antes de ativar |
| Conta bancária não cadastrada | Saldo preso no gateway | Item explícito no checklist de onboarding |
| Webhook forjado | Inscrição confirmada sem pagamento real | Validação de assinatura digital por gateway |
| API do gateway muda | Adapter quebra para todos os usuários | Monitoramento por gateway + versionamento de API |

---

## 9. Responsabilidades — Tovia vs. Organizador

Esta divisão é fundamental para proteger o Tovia juridicamente e operacionalmente.

### Responsabilidade do Tovia

- Integração técnica com os gateways suportados
- Segurança no armazenamento das credenciais
- Criação correta das cobranças via API
- Roteamento e processamento dos webhooks
- Atualização de status das inscrições
- Notificações ao participante
- Monitoramento da saúde das integrações
- Informar o organizador sobre problemas na conta do gateway

### Responsabilidade do Organizador

- Criar e manter a própria conta no gateway
- Completar o KYC exigido pelo gateway
- Cadastrar conta bancária para saque
- Manter a API key ativa e válida
- Configurar limites de parcelamento no gateway
- Cumprir os termos de uso do gateway escolhido
- Emitir nota fiscal quando necessário (obrigação fiscal do vendedor)
- Gerenciar contestações (chargebacks) diretamente com o gateway

> **Ponto legal importante:** O Tovia não é parte na relação financeira entre o participante e o organizador. O contrato de pagamento é entre o participante e o gateway do organizador. O Tovia é o sistema de gestão que orquestra a operação.

---

## 10. Roadmap de Implementação

### Fase 1 — Fundação (Asaas)
- [ ] Tela de conexão de gateway no dashboard do organizador
- [ ] Criptografia e armazenamento seguro de API keys
- [ ] Adapter Asaas completo (createCharge, createSubscription, handleWebhook, healthCheck)
- [ ] Webhook roteado por organizador com validação de assinatura
- [ ] Substituição do fluxo de simulação em PublicRegistration por checkout real
- [ ] Health check diário com notificação por email
- [ ] Checklist de onboarding no painel

### Fase 2 — Segundo gateway (Pagar.me)
- [ ] Adapter Pagar.me
- [ ] Tela de seleção de gateway com instruções por plataforma
- [ ] Detecção automática de ambiente sandbox/produção

### Fase 3 — Terceiro gateway (Mercado Pago)
- [ ] Adapter Mercado Pago
- [ ] Registro automático de webhook via API nos 3 gateways

### Fase 4 — Experiência avançada
- [ ] Pré-preenchimento do FinanceiroConfigTab com taxas do gateway conectado
- [ ] Dashboard financeiro conectado ao extrato do gateway (saldo, próximos saques)
- [ ] Reprocessamento manual de webhook para inscrições travadas em "pendente"
- [ ] Suporte a múltiplos gateways por organizador (por evento)

---

## 11. Perguntas Frequentes (para suporte)

**"O dinheiro não caiu na minha conta"**
→ Verificar se o KYC foi concluído no gateway. Verificar se a conta bancária está cadastrada. Verificar o prazo de liquidação da forma de pagamento usada.

**"Meu checkout parou de funcionar"**
→ Verificar no painel do Tovia se há alerta de gateway desconectado. Se sim, gerar nova API key no gateway e reconectar.

**"Um participante pagou mas aparece como pendente"**
→ O webhook não foi processado. Usar a função de reprocessamento manual no painel financeiro, ou verificar o histórico de cobranças no gateway para confirmar o pagamento.

**"Quero trocar de gateway"**
→ Conectar o novo gateway em "Configurações de Pagamento". Novos eventos usarão o novo gateway. Cobranças já criadas no gateway anterior seguem o fluxo original.

---

---

## 12. Tarefas Internas do Tovia para Lançar o Módulo

Além da implementação técnica, o Tovia precisa preparar o próprio sistema para que os organizadores consigam se configurar com o mínimo de suporte humano. Essas tarefas são tão importantes quanto o código.

### 12.1 Base de Conhecimento — Artigos a criar

A Base de Conhecimento do Tovia deve ter uma seção dedicada ao Módulo de Pagamentos, com os seguintes artigos:

**Introdução:**
- O que é o Módulo de Pagamentos e como funciona
- Diferença entre pagamento manual (Essencial) e automático (Pro/Custom)
- Por que o dinheiro vai direto para a conta do organizador

**Por gateway:**
- Como criar uma conta no Asaas passo a passo
- Como criar uma conta no Pagar.me passo a passo
- Como criar uma conta no Mercado Pago passo a passo
- Como gerar a API Key em cada plataforma (com capturas de tela)
- O que é KYC e como concluir a verificação de identidade

**Configuração no Tovia:**
- Como conectar seu gateway ao Tovia
- Como configurar as taxas no painel financeiro
- Como definir as formas de pagamento por ingresso
- Como configurar parcelamento

**Financeiro e saques:**
- Como cadastrar a conta bancária para saque no gateway
- O que é saque automático e como ativar
- Prazos de liquidação por forma de pagamento
- O que fazer se o dinheiro não caiu na conta

**Resolução de problemas:**
- O que significa "gateway desconectado"
- Um participante pagou mas aparece como pendente — o que fazer
- Minha API Key parou de funcionar — como resolver
- Como trocar de gateway

### 12.2 Tutorial de Configuração da Conta

O fluxo de onboarding do Tovia (Tutorial da Conta) deve incluir os passos do módulo de pagamentos como uma etapa dedicada para usuários dos planos Pro e Custom:

```
Etapa 1 — Perfil do organizador       ✓ Já existe
Etapa 2 — Criar primeiro evento        ✓ Já existe
Etapa 3 — Configurar ingressos         ✓ Já existe
Etapa 4 — Conectar plataforma de pagamento  ← NOVO
   4a. Escolha sua plataforma (Asaas / Pagar.me / Mercado Pago)
   4b. Crie sua conta na plataforma escolhida
   4c. Complete o KYC e cadastre sua conta bancária
   4d. Gere a API Key de produção
   4e. Cole a API Key no Tovia e valide a conexão
Etapa 5 — Publicar página de inscrição  ← NOVO (checkout ativo)
```

Cada etapa 4 deve ter um botão "Ver instruções para [Gateway escolhido]" que abre o artigo correspondente da Base de Conhecimento.

### 12.3 Agente de IA para Configuração de Gateway

**Faz todo o sentido.** Esta é uma das melhores aplicações de IA dentro do produto — ajudar em um processo técnico e com muitos passos onde o usuário leigo tem alta chance de travar.

**O que o agente faria:**

O organizador clicaria em "Preciso de ajuda para configurar" na tela de conexão de gateway. Um chat seria aberto com um agente especializado que:

- Perguntaria qual gateway o organizador quer usar
- Guiaria passo a passo com linguagem simples ("Agora clique em Configurações, depois em Integrações...")
- Identificaria em qual passo o usuário está e onde travou
- Detectaria erros comuns (sandbox vs. produção, key com permissões erradas)
- Validaria a conexão e confirmaria quando tudo estiver correto
- Redirecionaria para suporte humano se o problema for no gateway (não no Tovia)

**O que o agente não faria:**

- Não acessa a conta do organizador no gateway (não tem como)
- Não resolve problemas dentro do gateway (conta suspensa, KYC reprovado)
- Não substitui o suporte do gateway escolhido

**Custo e viabilidade:**

O agente pode ser implementado usando a API da Anthropic (Claude Haiku para custo reduzido). O contexto do agente seria pré-carregado com:
- O gateway que o organizador escolheu
- O passo em que está no checklist
- Os artigos da Base de Conhecimento como referência
- O erro retornado pela validação da API key, se houver

O custo por sessão de atendimento seria de centavos — viável mesmo para o plano Pro com margem confortável.

**Onde vive no produto:**

- Botão flutuante "Assistente de Configuração" na tela de conexão de gateway
- Também acionável pelo Tutorial da Conta na etapa 4
- Acessível pelo painel quando o gateway estiver com status de erro

---

## 13. Comunicação com o Organizador

Além da Base de Conhecimento e do agente, o Tovia deve ter emails e notificações automáticas para os momentos críticos do ciclo de vida do gateway:

| Evento | Canal | Mensagem |
|---|---|---|
| Gateway conectado com sucesso | Email + notificação no painel | Confirmação + link para publicar o evento |
| Primeiro ingresso vendido via checkout | Email | Celebração + lembrete do prazo de saque |
| Gateway desconectado (health check falhou) | Email urgente + alerta no painel | "Seu checkout está pausado — reconecte para reativar" |
| Key expirando (se o gateway avisar via API) | Email preventivo | "Atualize sua API Key em breve" |
| KYC pendente no gateway | Email | "Complete sua verificação para começar a receber" |
| Saldo disponível para saque (se a API permitir consulta) | Email semanal | Extrato resumido + botão para acessar o gateway |

---

*Documento interno Tovia — Módulo de Pagamentos v1.0*
