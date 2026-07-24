# Tovia Mobile — Especificação de Design

## Identidade do App

**Nome:** Tovia Mobile  
**Tagline:** O app do organizador de eventos  
**Plataforma:** iOS e Android  
**Propósito:** Companheiro operacional para organizadores de eventos — check-in, tarefas e visão financeira. A gestão completa acontece na web (toviaapp.com.br).

---

## Identidade Visual

**Cor primária:** #FF6B1A (laranja Tovia)  
**Primária light:** #FFF4EE (tint para backgrounds)  
**Primária dark:** #E55A08 (hover, pressed states)  
**Primária mid:** #FFC9A8 (borders, fills sutis)  
**Success:** #22c55e (check-in confirmado, presença marcada)  
**Danger:** #ef4444 (bloqueado, erro)  
**Warning:** #f59e0b (pagamento pendente, atenção)

**Backgrounds (light mode):**
- Screen background: #f5f5f3
- Card surface: #ffffff
- Subtle surface: #FFF4EE
- Border: #e2e0da

**Backgrounds (dark mode):**
- Screen background: #111110
- Card surface: #1c1c1a
- Subtle surface: #3D1506
- Border: #2e2e2a

**Tipografia:**
- Font family: System default (SF Pro no iOS, Roboto no Android)
- Headings: Bold / Black weight
- Body: Regular, 15–16sp
- Labels: 11sp, uppercase, letter-spacing 0.08em
- Dados numéricos: Tabular nums

**Radius:** 14dp cards, 8dp elementos pequenos, 999dp pills/badges  
**Shadows:** Sutis, baixa elevação. Cards: 0 2 12 rgba(255,107,26,0.08)

---

## Estrutura de Navegação

**Top bar (persistente, todas as telas):**
- Esquerda: Logo Tovia Mobile (wordmark, accent laranja no "Mobile")
- Direita: Avatar do usuário (círculo, fallback iniciais) + nome — abre profile bottom sheet

**Bottom navigation bar — 5 abas:**
1. Início (Home icon)
2. Check-in (Checkbox icon)
3. Tarefas (List icon)
4. Financeiro (Dollar/currency icon)
5. Suporte (Question mark icon)

Estilo da tab bar: fundo branco (light) / surface escuro (dark), aba ativa em laranja primário com ícone preenchido, abas inativas em cinza.

---

## Telas

---

### Profile Bottom Sheet

Ativado ao tocar no avatar ou nome na top bar. Sobe a partir de baixo.

**Handle bar** no topo central.  
**Header:** Avatar grande (64dp, círculo), nome completo em bold 18sp, email em muted 13sp.  
**Plan badge:** Pill com nome do plano (Chinám / Pétach / Koách / Chalém) em laranja.  
**Trial banner** (se aplicável): pill amarelo "Trial — X dias restantes".  
**Botão de ação:** "Editar perfil" — outlined, largura total — abre toviaapp.com.br no navegador.  
**Botão destrutivo:** "Sair" — texto vermelho, sem chevron.

---

### Tela 1 — Início (Home)

**Header:** "Meus Eventos" em bold 22sp. Subtítulo: contagem de eventos ativos.

**Event cards** (lista com scroll vertical):

Cada card contém:
- Nome do evento em bold 16sp
- Data e local em muted 13sp
- Contagem de inscritos: "128 inscritos"
- Toggle switch à direita: laranja = ativo, cinza = inativo
- Label de status abaixo do toggle: "Ativo" ou "Inativo"
- Tap no card (não no toggle) → tela de detalhe do evento (somente leitura)

**Seções:**
- "Em andamento" — eventos acontecendo hoje (borda esquerda laranja)
- "Próximos eventos" — eventos futuros
- "Encerrados" — eventos passados (levemente escurecidos)

**Estado vazio:** Ilustração de calendário + "Você ainda não tem eventos. Crie o seu primeiro em toviaapp.com.br"

---

### Tela 2 — Check-in

#### 2A — Seleção de Evento

Título: "Check-in" bold 22sp.  
Subtítulo: "Eventos disponíveis hoje" em muted 14sp.

**Event cards** apenas para eventos acontecendo hoje:
- Nome do evento em bold
- Horário de início
- Barra de progresso: check-ins feitos / total de inscritos
- "48 / 120 presentes" em laranja

**Estado vazio:** "Nenhum evento disponível para check-in hoje."

---

#### 2B — Seleção de Modo de Check-in

Após selecionar um evento:  
Título da tela = nome do evento.

**Dois cards grandes** (lado a lado ou empilhados):

Card 1 — QR Code:
- Ícone QR grande (48dp)
- Label: "Check-in QR Code"
- Subtítulo: "Abra a câmera para escanear"
- Background laranja preenchido

Card 2 — Lista:
- Ícone lista grande (48dp)
- Label: "Lista de Inscritos"
- Subtítulo: "Marque a presença manualmente"
- Card branco com borda laranja

**Botão de download offline** — abaixo dos dois cards, largura total:
- Ícone: nuvem com seta de download
- Estado A (não baixado): "Baixar lista para uso offline" — botão outlined laranja
- Estado B (baixado): "Lista salva • Pronto para offline" — laranja preenchido, nuvem com checkmark, desabilitado

---

#### 2C — Scanner QR Code

Tela cheia com câmera.  
**Overlay de scan:** quadro centralizado com cantos em branco, linha de scan animada.  
**Top bar:** seta voltar + nome do evento.  
**Painel inferior** (sempre visível, flutuando sobre câmera):
- Card do último scan: nome + verde "Presente ✓" ou vermelho "Bloqueado ✗" + motivo
- Botão "Ver lista" — navega para 2D sem fechar sessão de câmera
- Badge offline (se offline): "● Offline — sincronizando depois"

**Feedback do scan:**
- Sucesso: flash verde + haptic + som
- Falha: flash vermelho + haptic

---

#### 2D — Lista de Inscritos

**Barra de busca fixa** no topo: "Buscar por nome…"  
**Contador** abaixo da busca: "48 / 120 presentes" em bold laranja.

**Lista alfabética** com headers de seção (A, B, C…):

Cada linha:
- Círculo avatar com iniciais (40dp)
- Nome completo em bold 15sp
- Checkbox à direita — marcado = laranja preenchido, desmarcado = outline
- Linhas marcadas: background com tint laranja sutil

**FAB** (canto inferior direito): ícone câmera — "Usar QR" — alterna para scanner.  
**Indicador offline** se aplicável: banner no topo "Modo offline — X pendentes para sincronizar"

---

### Tela 3 — Tarefas

#### 3A — Seleção de Evento

Título: "Tarefas" bold 22sp.  
Event cards (mesmo estilo do Início) com badge mostrando contagem de tarefas pendentes: "3 pendentes" em pill laranja.

---

#### 3B — Lista de Tarefas do Evento

Título = nome do evento.  
**Filter chips** abaixo do título: "Todas" · "Pendentes" · "Em andamento" · "Concluídas"

**Linhas de tarefa:**
- Checkbox (tap para completar — swipe direita também completa)
- Título da tarefa em bold 14sp
- Data limite e avatar do responsável em muted 12sp
- Status chip: "Pendente" (cinza) / "Em andamento" (azul) / "Concluída" (verde)

**FAB:** "+" — cria nova tarefa.

**Estado vazio:** "Nenhuma tarefa ainda. Crie a primeira!"

---

#### 3C — Detalhe / Edição de Tarefa

Formulário tela cheia:
- Título da tarefa (campo de texto editável)
- Descrição (campo multiline)
- Data limite (date picker)
- Responsável (avatar picker, lista de membros da equipe)
- Seletor de status (segmented control)
- Botão "Salvar" — laranja primário, largura total

---

### Tela 4 — Financeiro

**Duas sub-abas** abaixo do título: "Pagamentos" | "Relatórios"

#### 4A — Pagamentos

Barra de busca: "Buscar inscrito…"  
Filter chips: "Todos" · "Pago" · "Pendente" · "Gratuito"

**Linhas de inscrição:**
- Nome em bold 14sp
- Status chip: "Pago" (verde) / "Pendente" (amarelo) / "Gratuito" (cinza) / "Expirado" (vermelho)
- Tap na linha → tela de detalhe

**Tela de detalhe (ao tocar):**
- Nome, tipo de ingresso, data de inscrição
- Status com explicação: "Pagamento pendente — aguardando confirmação" ou "Ingresso expirado"
- Somente leitura. Sem ações.

---

#### 4B — Relatórios

**Cards resumo (scroll horizontal):**
- "Total arrecadado" — valor R$ em bold laranja
- "Pendente" — valor R$ em amarelo
- "Presença" — percentual em bold

**Sparkline chart:** Inscrições por dia, últimos 30 dias. Preenchimento laranja, grid sutil.

**Estatísticas de check-in:**
- % presença
- Horário de pico de entrada (bar chart, horas × contagem)

Somente leitura. Sem botão de exportação (exportação = apenas web).

---

### Tela 5 — Suporte

Lista simples com scroll:

- **Base de Conhecimento** → abre toviaapp.com.br/base-conhecimento no navegador (chevron right)
- **Fale Conosco** → abre email ou link WhatsApp (chevron right)
- **Rever tutorial** → reabre fluxo de onboarding
- Divider
- **Sobre o Tovia Mobile** → número da versão, data do build
- **Política de Privacidade** → abre navegador (chevron right)
- **Termos de Uso** → abre navegador (chevron right)
- Divider
- **Sair** — texto vermelho, sem chevron, tap mostra alerta de confirmação

---

### Tela de Bloqueio Admin

Exibida imediatamente após login para emails de admin (antes de qualquer aba carregar).

**Layout centralizado:**
- Ícone de cadeado (48dp, laranja)
- Título: "Acesso restrito" bold 20sp
- Corpo: "A Central Tovia é acessada exclusivamente via web. Utilize toviaapp.com.br no seu navegador."
- Botão: "Abrir toviaapp.com.br" — laranja primário, largura total — abre navegador
- Link de texto abaixo: "Sair" — muted, faz logout

---

### Onboarding (Apenas no Primeiro Acesso)

4 slides deslizáveis com indicador de page dots.  
Botão "Pular" no canto superior direito nos slides 1–3. Botão "Começar" no slide 4.

**Slide 1 — Bem-vindo**
- Logo Tovia Mobile grande
- "Olá, [Nome]!"
- "Este é o seu app de campo. Check-in, tarefas e financeiro na palma da mão."

**Slide 2 — Check-in**
- Ilustração: celular com scanner QR
- "Faça check-in por QR Code ou pela lista de inscritos."
- Destaque: "Baixe a lista antes de chegar no local para usar sem internet."

**Slide 3 — Tarefas**
- Ilustração: checklist
- "Gerencie tarefas do evento e acompanhe sua equipe em tempo real."

**Slide 4 — Pronto!**
- Ilustração com checkmark laranja
- "Tudo certo! Vamos começar."
- Botão primário: "Começar"

---

## Inventário de Componentes

| Componente | Notas |
|---|---|
| EventCard | Toggle switch, label de seção, tap para detalhe |
| CheckinProgressBar | Preenchimento laranja, label "X / Y" |
| OfflineDownloadButton | Dois estados: download / pronto |
| AttendeeRow | Avatar com iniciais, nome, checkbox |
| TaskRow | Checkbox, título, data limite, status chip, swipe-to-complete |
| StatusChip | Pago / Pendente / Gratuito / Expirado / Ativo / Inativo |
| PlanBadge | Chinám / Pétach / Koách / Chalém |
| BottomSheet | Profile sheet, drag handle, backdrop blur |
| ScanOverlay | Cantos, animação de scan |
| ScanResultCard | Nome + status, flutuando sobre câmera |
| SparklineChart | Preenchimento laranja, janela de 30 dias |
| EmptyState | Ilustração + mensagem + CTA opcional |
| AdminBlockScreen | Tela cheia, centralizado, sem navegação |

---

## Feature Gating por Plano

| Feature | Chinám | Pétach | Koách | Chalém |
|---|---|---|---|---|
| Check-in por lista | ✓ | ✓ | ✓ | ✓ |
| Check-in por QR Code | — | — | ✓ | ✓ |
| Aba Tarefas | — | — | ✓ | ✓ |
| Membros de equipe | — | — | até 5 | até 10 |
| Eventos ativos | 1 | 3 | 5 | 10 |
| Vagas por evento | 100 | 200 | 500 | Ilimitado |
| Ingressos por evento | 1 | 3 | 5 | 10 |

Quando uma feature está bloqueada: mostrar card com o nome do plano necessário e botão "Ver planos" que abre toviaapp.com.br. Nunca esconder silenciosamente.
