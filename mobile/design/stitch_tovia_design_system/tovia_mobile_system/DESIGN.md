---
name: Tovia Mobile System
colors:
  surface: '#f8faf8'
  surface-dim: '#d8dad9'
  surface-bright: '#f8faf8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f2'
  surface-container: '#eceeec'
  surface-container-high: '#e6e9e7'
  surface-container-highest: '#e1e3e1'
  on-surface: '#191c1b'
  on-surface-variant: '#3f4940'
  inverse-surface: '#2e3130'
  inverse-on-surface: '#eff1ef'
  outline: '#6f7a6f'
  outline-variant: '#becabd'
  surface-tint: '#006d3a'
  primary: '#006032'
  on-primary: '#ffffff'
  primary-container: '#1a7a45'
  on-primary-container: '#abffc1'
  inverse-primary: '#80d99a'
  secondary: '#006c4b'
  on-secondary: '#ffffff'
  secondary-container: '#64f9bc'
  on-secondary-container: '#00714e'
  tertiary: '#754900'
  on-tertiary: '#ffffff'
  tertiary-container: '#965e00'
  on-tertiary-container: '#ffe8d1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9bf6b5'
  primary-fixed-dim: '#80d99a'
  on-primary-fixed: '#00210d'
  on-primary-fixed-variant: '#00522a'
  secondary-fixed: '#68fcbf'
  secondary-fixed-dim: '#45dfa4'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8faf8'
  on-background: '#191c1b'
  surface-variant: '#e1e3e1'
  success: '#22c55e'
  danger: '#ef4444'
  warning: '#f59e0b'
  primary-light: '#e8f5ee'
  primary-dark: '#0d5c32'
  card-light: '#ffffff'
  card-dark: '#111a14'
  border-light: '#d4e4da'
  border-dark: '#243328'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '800'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.08em
  helper-text:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  numeric-data:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 16px
  stack-gap-lg: 16px
  stack-gap-md: 12px
  stack-gap-sm: 8px
  card-padding: 16px
  touch-target-min: 44px
---

## Brand & Style

The design system for Tovia Mobile is built on a **Corporate / Modern** aesthetic, specifically tailored for the high-stakes, fast-paced environment of event management. It prioritizes reliability, operational efficiency, and clarity. The visual language bridges the gap between professional tool and approachable companion, using a structured card-based layout to organize dense information into digestible units.

The style is characterized by:
- **High-Utility Minimalism:** Heavy use of white space and a clean green-tinted neutral palette to keep the focus on status and actions.
- **Structured Hierarchy:** Clear distinction between actionable event cards and read-only informational rows.
- **Operational Tactility:** Interaction design that utilizes haptics for critical feedback (e.g., successful QR scans) and physical metaphors like "bottom sheets" for secondary settings.
- **Status-Driven Visuals:** Heavy reliance on semantic color coding (Success, Warning, Danger) to allow organizers to assess event health at a glance.

## Colors

The palette is anchored by a "Deep Green" primary, symbolizing growth and professional stability. 

### Implementation Notes:
- **Color Mode:** The system supports both light and dark modes. In dark mode, background surfaces shift to a deep charcoal-green (`#0a100c`) rather than pure black to maintain brand continuity.
- **Semantic Mapping:** 
    - **Success (#22c55e):** Used for "Presente" status and completed tasks.
    - **Warning (#f59e0b):** Used for "Pendente" payments and high-priority alerts.
    - **Danger (#ef4444):** Used for "Bloqueado", "Expirado", or destructive actions like "Sair".
- **Surface Tiers:** Use `primary-light` (light mode) or `subtle-surface` (dark mode) for non-interactive background areas to create depth against the main `card-surface`.

## Typography

The system utilizes **Inter** (as the modern web-standard equivalent to system fonts) to ensure maximum legibility across mobile displays.

### Key Rules:
- **Weight as Hierarchy:** Headings must use Bold or Black weights to provide strong visual anchors in an info-dense environment.
- **Tabular Numerals:** For financial data and participant counts, always enable `tnum` (tabular figures) to ensure columns of numbers align vertically.
- **Micro-copy:** Labels use a strict uppercase format with increased letter spacing to distinguish them from interactive body text.
- **Mobile Adaptation:** Headlines scale down on small-factor devices, but body text remains at a minimum of 15px to ensure readability for organizers on the move.

## Layout & Spacing

This design system uses a **Fluid Grid** approach with fixed side margins. 

### Structural Principles:
- **Margins:** A consistent 16px horizontal margin is applied across all mobile screens.
- **Card-Based Architecture:** Information is grouped into cards. Vertical spacing between cards is 12px to maintain a rhythmic flow.
- **Safe Areas:** All critical actions (FABs and Bottom Navigation) must respect system safe areas for iOS and Android.
- **Touch Targets:** Ensure all interactive elements (Checkboxes, Toggles, and Chips) have a minimum touch area of 44x44px, regardless of their visual size.

## Elevation & Depth

Visual hierarchy is primarily established through **Tonal Layers** supplemented by **Ambient Shadows**.

- **Surface Levels:** 
    - Level 0: Screen background (`#f5f7f5`).
    - Level 1: Card surfaces (`#ffffff`).
    - Level 2: Floating elements (FABs, Bottom Sheets).
- **Shadows:** Cards utilize a soft, tinted shadow to avoid a "dirty" gray look. The shadow specification is `0 2px 12px rgba(0, 60, 20, 0.08)`, giving the UI a slight lift without looking overly skeuomorphic.
- **Borders:** In dark mode, depth is defined by low-contrast outlines (`#243328`) rather than shadows to ensure clarity in low-light environments.

## Shapes

The shape language balances friendliness with professional structure.

- **Standard Cards:** 14px radius is the primary signature of the layout, applied to all event and informational containers.
- **Interactive Elements:** Buttons and input fields use a softer 8px radius to feel distinct from the structural cards.
- **Status Indicators:** Chips, badges, and the progress bar are always "Pill-shaped" (999px radius) to signify they are meta-data or status-only elements.
- **Avatars:** User and attendee avatars are strictly circular.

## Components

### EventCards
Must include a `14px` corner radius. The right-aligned status toggle should be vertically centered with the title. Active events today ("Em andamento") receive a `4px` solid primary green left-border highlight.

### AttendeeRows
Rows should use a subtle green tint background (`#e8f5ee`) only when the checkbox is "Checked". The initials avatar uses a high-contrast background from the primary palette.

### StatusChips
Small, pill-shaped badges. Text is always centered. 
- **Pago:** Primary green background with white text.
- **Pendente:** Warning yellow background with dark text.
- **Expirado:** Danger red background with white text.

### Buttons
- **Primary:** Filled with primary green, white text, bold weight.
- **Outlined:** 1px primary green border, primary green text, transparent background.
- **Destructive:** Plain text in danger red, used for "Sair" or "Excluir".

### Input Fields
Background matches `subtle-surface`. Borders appear only on focus (Primary Green). Multiline inputs (for task descriptions) should have a minimum height of 100px.

### Bottom Sheet
Features a centered handle bar (`40x4px`, 20% opacity) at the top. The background uses a backdrop blur effect when layered over screen content.