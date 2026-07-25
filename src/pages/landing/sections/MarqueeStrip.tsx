const WORDS = [
  'Retiros', 'Conferências', 'Acampamentos', 'Workshops', 'Encontros',
  'Cultos especiais', 'Seminários', 'Congressos', 'Eventos beneficentes',
  'Reuniões de jovens', 'Treinamentos', 'Celebrações',
];

export function MarqueeStrip() {
  const repeated = [...WORDS, ...WORDS];

  return (
    <div className="w-full overflow-hidden py-5 bg-sidebar">
      <div className="flex animate-marquee whitespace-nowrap">
        {repeated.map((word, i) => (
          <span key={i} className="flex items-center gap-6 mx-6">
            <span className="text-xl sm:text-2xl font-black text-white/90 tracking-tight">{word}</span>
            <span className="text-primary text-lg">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
