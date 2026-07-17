export const Colors = {
  light: {
    // Superfícies — Roxo + Laranja + Creme
    background: '#F5F0E8',
    card: '#ffffff',
    secondary: '#EDE8DE',
    // Texto
    foreground: '#1E0B4B',
    mutedFg: '#6b5fa0',
    // Cor de ação
    primary: '#FF6B1A',
    primaryFg: '#ffffff',
    primaryLight: '#FFF4EE',
    primaryDark: '#E55A08',
    // Violeta accent
    accent: '#9B5FFF',
    accentFg: '#ffffff',
    accentLight: '#F0E8FF',
    // Bordas
    border: '#E0D8CC',
    input: '#E0D8CC',
    // Semânticos
    success: '#16a34a',
    danger: '#ef4444',
    warning: '#d97706',
    // Toggles (ligado = verde, desligado = cinza — thumb branco)
    toggleOn: '#7CB342',
    toggleOff: '#E2E2E2',
    // Tab bar / sidebar (roxo profundo — sempre escura)
    sidebar: '#2D1470',
    sidebarFg: '#F5F0E8',
    sidebarMuted: 'rgba(245,240,232,0.55)',
    sidebarActiveBg: 'rgba(245,240,232,0.13)',
    sidebarHoverBg: 'rgba(245,240,232,0.07)',
    sidebarBorder: 'rgba(245,240,232,0.08)',
    // Tab bar mobile
    tabBar: '#2D1470',
    tabBarBorder: 'rgba(245,240,232,0.08)',
  },
  dark: {
    // Superfícies
    background: '#0E0520',
    card: '#1A0B3B',
    secondary: '#2D1470',
    // Texto
    foreground: '#F5F0E8',
    mutedFg: '#c4b8e8',
    // Cor de ação (laranja mais claro no dark)
    primary: '#FF8C47',
    primaryFg: '#ffffff',
    primaryLight: '#2D1470',
    primaryDark: '#FF6B1A',
    // Violeta accent
    accent: '#B47AFF',
    accentFg: '#ffffff',
    accentLight: '#2D1470',
    // Bordas
    border: '#3D2080',
    input: '#3D2080',
    // Semânticos
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    // Toggles (ligado = verde, desligado = cinza — thumb branco)
    toggleOn: '#7CB342',
    toggleOff: '#45454F',
    // Sidebar (ainda mais escura no dark)
    sidebar: '#1A0B40',
    sidebarFg: '#F5F0E8',
    sidebarMuted: 'rgba(245,240,232,0.55)',
    sidebarActiveBg: 'rgba(245,240,232,0.13)',
    sidebarHoverBg: 'rgba(245,240,232,0.07)',
    sidebarBorder: 'rgba(245,240,232,0.08)',
    // Tab bar mobile
    tabBar: '#1A0B40',
    tabBarBorder: 'rgba(245,240,232,0.08)',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;
