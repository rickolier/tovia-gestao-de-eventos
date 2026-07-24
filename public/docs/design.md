# Tovia Mobile — Design Specification

## App Identity

**App name:** Tovia Mobile  
**Tagline:** O app do organizador de eventos  
**Platform:** iOS and Android  
**Purpose:** Operational companion for event organizers — check-in, tasks, and financial overview. Full management happens on the web.

---

## Brand & Visual Identity

**Primary color:** #1a7a45 (deep green)  
**Primary light:** #e8f5ee (green tint for backgrounds)  
**Primary dark:** #0d5c32 (hover, pressed states)  
**Success:** #22c55e (check-in confirmed, presence marked)  
**Danger:** #ef4444 (blocked, error states)  
**Warning:** #f59e0b (pending payment, attention)

**Backgrounds (light mode):**
- Screen background: #f5f7f5
- Card surface: #ffffff
- Subtle surface: #f0f4f1
- Border: #d4e4da

**Backgrounds (dark mode):**
- Screen background: #0a100c
- Card surface: #111a14
- Subtle surface: #18271c
- Border: #243328

**Typography:**
- Font family: System default (SF Pro on iOS, Roboto on Android)
- Headings: Bold / Black weight
- Body: Regular, 15–16sp
- Labels: 11sp, uppercase, letter-spacing 0.08em
- Numeric data: Tabular nums

**Radius:** 14dp cards, 8dp small elements, 999dp pills/badges  
**Shadows:** Subtle, low-elevation. Cards: 0 2 12 rgba(0,60,20,0.08)

---

## Navigation Structure

**Top bar (persistent, all screens):**
- Left: Tovia Mobile logo (wordmark, green accent on "Mobile")
- Right: User avatar (circle, initials fallback) + name — tappable, opens profile bottom sheet

**Bottom navigation bar — 5 tabs:**
1. Início (Home icon)
2. Check-in (Checkbox icon)
3. Tarefas (List icon)
4. Financeiro (Dollar/currency icon)
5. Suporte (Question mark icon)

Tab bar style: white background (light) / dark surface (dark), active tab in primary green with filled icon, inactive tabs in gray.

---

## Screens

---

### Profile Bottom Sheet

Triggered by tapping avatar or name in the top bar. Slides up from the bottom.

**Handle bar** at top center.  
**Header:** Large avatar (64dp, circle), full name below in bold 18sp, email in muted 13sp.  
**Plan badge:** Pill showing current plan name (Chinám / Pétach / Koách / Chalém) in green.  
**Trial banner** (if applicable): yellow pill "Trial — X dias restantes".  
**Action button:** "Editar perfil" — outlined, full width — opens tovia.app in browser.  
**Destructive button:** "Sair" — text only, red, at the bottom.

---

### Screen 1 — Início (Home)

**Header area:** "Meus Eventos" in bold 22sp. Subtitle: total active events count.

**Event cards** (vertical scroll list):

Each card contains:
- Event name in bold 16sp
- Date and location in muted 13sp
- Inscribed count: "128 inscritos"
- Status toggle switch on the right: green = active, gray = inactive
- Status label below toggle: "Ativo" or "Inativo"
- Tap card (not toggle) → read-only event detail screen

**Sections:**
- "Em andamento" — events happening today (highlighted with green left border)
- "Próximos eventos" — future events
- "Encerrados" — past events (slightly dimmed)

**Empty state:** Illustration of a calendar + "Você ainda não tem eventos. Crie o seu primeiro em tovia.app"

---

### Screen 2 — Check-in (Tab)

#### 2A — Event Selection

Title: "Check-in" bold 22sp.  
Subtitle: "Eventos disponíveis hoje" in muted 14sp.

**Event cards** for events happening today only:
- Event name bold
- Start time
- Progress bar: check-ins done / total inscribed
- "48 / 120 presentes" label in green

**Empty state:** "Nenhum evento disponível para check-in hoje."

---

#### 2B — Check-in Mode Selection

After selecting an event:  
Screen title = event name.

**Two large option cards** (side by side or stacked):

Card 1 — QR Code:
- Large QR scan icon (48dp)
- Label: "Check-in QR Code"
- Subtitle: "Abra a câmera para escanear"
- Green filled background

Card 2 — Lista:
- Large list icon (48dp)
- Label: "Lista de Inscritos"
- Subtitle: "Marque a presença manualmente"
- White card with green border

**Offline download button** — below the two cards, full width:
- Icon: cloud with download arrow
- State A (not downloaded): "Baixar lista para uso offline" — outlined green button
- State B (downloaded): "Lista salva • Pronto para offline" — green filled, cloud with checkmark icon, disabled

---

#### 2C — QR Code Scanner

Full-screen camera view.  
**Scan overlay:** centered square frame with corner brackets in white, animated scanning line.  
**Top bar:** back arrow + event name.  
**Bottom panel** (always visible, floating over camera):
- Last scan result card: name + green "Presente ✓" or red "Bloqueado ✗" + reason
- "Ver lista" button — navigates to 2D without closing camera session
- Offline badge (if offline): "● Offline — sincronizando depois"

**Scan feedback:**
- Success: green flash overlay + haptic + sound
- Failure: red flash overlay + haptic

---

#### 2D — Lista de Inscritos

**Fixed search bar** at top: "Buscar por nome…"  
**Counter** below search: "48 / 120 presentes" in green bold.

**Alphabetical list** with section headers (A, B, C…):

Each row:
- Avatar circle with initials (40dp)
- Full name in bold 15sp
- Checkbox on the right — checked = green filled, unchecked = outline
- Checked rows: subtle green tint background

**Floating action button** (bottom right): camera icon — "Usar QR" — switches to scanner.  
**Offline indicator** if applicable: banner at top "Modo offline — X pendentes para sincronizar"

---

### Screen 3 — Tarefas (Tasks)

#### 3A — Event Selection

Title: "Tarefas" bold 22sp.  
Event cards (same style as Início) with a badge showing pending task count: "3 pendentes" in orange pill.

---

#### 3B — Task List for Event

Title = event name.  
**Filter chips** below title: "Todas" · "Pendentes" · "Em andamento" · "Concluídas"

**Task rows:**
- Checkbox (tap to complete — swipe right also completes)
- Task title in bold 14sp
- Due date and assignee avatar in muted 12sp
- Status chip: "Pendente" (gray) / "Em andamento" (blue) / "Concluída" (green)

**FAB:** "+" — creates new task.

**Empty state:** "Nenhuma tarefa ainda. Crie a primeira!"

---

#### 3C — Task Detail / Edit

Full screen form:
- Task title (editable text field)
- Description (multiline text field)
- Due date (date picker)
- Assigned to (avatar picker, list of team members)
- Status selector (segmented control)
- "Salvar" button — primary green, full width

---

### Screen 4 — Financeiro

**Two sub-tabs** below the screen title: "Pagamentos" | "Relatórios"

#### 4A — Pagamentos

Search bar: "Buscar inscrito…"  
Filter chips: "Todos" · "Pago" · "Pendente" · "Gratuito"

**Inscription rows:**
- Name bold 14sp
- Status chip: "Pago" (green) / "Pendente" (yellow) / "Gratuito" (gray) / "Expirado" (red)
- Tap row → detail screen showing reason if not available for check-in

**Detail screen (when tapped):**
- Name, ticket type, registration date
- Status with explanation: "Pagamento pendente — aguardando confirmação" or "Ingresso expirado"
- Read-only. No actions.

---

#### 4B — Relatórios

**Summary cards (horizontal scroll):**
- "Total arrecadado" — R$ value in bold green
- "Pendente" — R$ value in yellow
- "Presença" — percentage in bold

**Sparkline chart:** Inscriptions per day, past 30 days. Green area fill, subtle grid.

**Check-in stats:**
- % presença
- Horário de pico de entrada (bar chart, hours × count)

Read-only. No export button (export = web only).

---

### Screen 5 — Suporte

Simple scrollable list of options:

- **Base de Conhecimento** → opens tovia.app/base-conhecimento in browser (chevron right)
- **Fale Conosco** → opens email or WhatsApp link (chevron right)
- **Rever tutorial** → reopens onboarding flow
- Divider
- **Sobre o Tovia Mobile** → version number, build date
- **Política de Privacidade** → opens browser (chevron right)
- **Termos de Uso** → opens browser (chevron right)
- Divider
- **Sair** — red text, no chevron, tap shows confirmation alert

---

### Admin Block Screen

Shown immediately after login for admin emails (before any tab loads).

**Center-aligned layout:**
- Lock icon (48dp, green)
- Title: "Acesso restrito" bold 20sp
- Body: "A Central Tovia é acessada exclusivamente via web. Utilize tovia.app no seu navegador."
- Button: "Abrir tovia.app" — primary green, full width — opens browser
- Text link below: "Sair" — muted, logs out

---

### Onboarding (First Launch Only)

4 swipeable slides with page dots indicator.  
Skip button top right on slides 1–3. "Começar" button on slide 4.

**Slide 1 — Bem-vindo**
- Tovia Mobile logo large
- "Olá, [Nome]!"
- "Este é o seu app de campo. Check-in, tarefas e financeiro na palma da mão."

**Slide 2 — Check-in**
- Illustration: phone with QR scanner
- "Faça check-in por QR Code ou pela lista de inscritos."
- Highlight box: "💡 Baixe a lista antes de chegar no local para usar sem internet."

**Slide 3 — Tarefas**
- Illustration: checklist
- "Gerencie tarefas do evento e acompanhe sua equipe em tempo real."

**Slide 4 — Pronto!**
- Green checkmark illustration
- "Tudo certo! Vamos começar."
- Primary button: "Começar"

---

## Component Inventory

| Component | Notes |
|---|---|
| EventCard | Toggle switch, status section label, tap for detail |
| CheckinProgressBar | green fill, "X / Y" label |
| OfflineDownloadButton | Two states: download / ready |
| AttendeeRow | Initials avatar, name, checkbox |
| TaskRow | Checkbox, title, due date, status chip, swipe-to-complete |
| StatusChip | Pago / Pendente / Gratuito / Expirado / Ativo / Inativo |
| PlanBadge | Chinám / Pétach / Koách / Chalém |
| BottomSheet | Profile sheet, drag handle, backdrop blur |
| ScanOverlay | Corner brackets, scanning animation |
| ScanResultCard | Name + status, floating over camera |
| SparklineChart | Area fill, green, 30-day window |
| EmptyState | Illustration + message + optional CTA |
| AdminBlockScreen | Full screen, centered, no navigation |

---

## Plan-Based Feature Gating

| Feature | Chinám | Pétach | Koách | Chalém |
|---|---|---|---|---|
| Check-in por lista | ✓ | ✓ | ✓ | ✓ |
| Check-in por QR Code | — | — | ✓ | ✓ |
| Aba Tarefas | — | — | ✓ | ✓ |
| Membros de equipe | — | — | até 5 | até 10 |
| Eventos ativos | 1 | 3 | 5 | 10 |
| Vagas por evento | 100 | 200 | 500 | Ilimitado |

When a feature is locked: show a card with the plan name required and a "Ver planos" button that opens tovia.app. Never hide silently.
