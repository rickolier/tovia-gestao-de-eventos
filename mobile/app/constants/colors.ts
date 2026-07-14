export const Colors = {
  light: {
    // Superfícies — idêntico ao web (src/index.css :root)
    background: '#f4f7f5',
    card: '#ffffff',
    secondary: '#f0f4f2',
    // Texto
    foreground: '#111827',
    mutedFg: '#6b7280',
    // Cor de ação
    primary: '#1a7a45',
    primaryFg: '#ffffff',
    primaryLight: '#e8f5ee',
    primaryDark: '#0d5c32',
    // Bordas
    border: '#e5e7eb',
    input: '#e5e7eb',
    // Semânticos
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    // Sidebar (verde escuro — sempre escura, independe do tema)
    sidebar: '#162d20',
    sidebarFg: '#ffffff',
    sidebarMuted: 'rgba(255,255,255,0.55)',
    sidebarActiveBg: 'rgba(255,255,255,0.12)',
    sidebarHoverBg: 'rgba(255,255,255,0.07)',
    sidebarBorder: 'rgba(255,255,255,0.06)',
    // Tab bar (light)
    tabBar: '#ffffff',
    tabBarBorder: '#e5e7eb',
  },
  dark: {
    // Superfícies — idêntico ao web (.dark)
    background: '#0a0f0c',
    card: '#111a14',
    secondary: '#1a2820',
    // Texto
    foreground: '#f3f4f6',
    mutedFg: '#9ca3af',
    // Cor de ação (primary mais brilhante no dark)
    primary: '#22c55e',
    primaryFg: '#ffffff',
    primaryLight: '#0d2416',
    primaryDark: '#16a34a',
    // Bordas
    border: '#1e2d24',
    input: '#1e2d24',
    // Semânticos
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    // Sidebar (ainda mais escura no dark)
    sidebar: '#0d1a10',
    sidebarFg: '#ffffff',
    sidebarMuted: 'rgba(255,255,255,0.55)',
    sidebarActiveBg: 'rgba(255,255,255,0.12)',
    sidebarHoverBg: 'rgba(255,255,255,0.07)',
    sidebarBorder: 'rgba(255,255,255,0.06)',
    // Tab bar (dark)
    tabBar: '#111a14',
    tabBarBorder: '#1e2d24',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;
