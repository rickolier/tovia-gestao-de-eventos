// Espelha a escala tipográfica do web (src/index.css + Tailwind classes usadas nas páginas)
export const Typography = {
  // font-size: 36px font-weight: 900 tracking-tight — telas de display/hero
  display: { fontSize: 36, fontWeight: '900' as const, letterSpacing: -1.2 },
  // text-2xl font-black — títulos de card (ex: "Bem-vindo de volta!")
  h1: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.4 },
  // text-xl font-bold — subtítulos de seção
  h2: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2 },
  // text-base font-semibold — nome de evento, item de lista
  h3: { fontSize: 16, fontWeight: '600' as const },
  // text-sm — corpo de texto
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  // text-[15px] — corpo ligeiramente maior (como no web)
  bodyLg: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  // text-xs — texto secundário / metadados
  small: { fontSize: 12, fontWeight: '400' as const },
  // text-[10px] uppercase tracking-widest font-semibold — labels de campo
  label: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const },
  // text-[11px] — captions, badges
  caption: { fontSize: 11, fontWeight: '600' as const },
} as const;

// Border radius — segue o web (--radius: 0.75rem = 12px como base)
export const Radius = {
  sm: 8,     // rounded-lg (~8px) — inputs pequenos
  md: 12,    // rounded-xl (12px) — inputs padrão, botões secundários
  card: 16,  // rounded-2xl (16px) — cards de conteúdo
  lg: 24,    // rounded-3xl (24px) — cards principais (igual ao card do login web)
  pill: 999, // rounded-full — badges, chips, pills
} as const;

// Sombras — low-elevation como no web
export const Shadow = {
  flat: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#003c14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 8,
  },
} as const;
