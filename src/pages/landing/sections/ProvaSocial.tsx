import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'João Silva',
    role: 'Pastor e organizador de eventos',
    church: 'Igreja Vida Nova · São Paulo',
    text: 'Organizamos nosso retiro com mais de 300 pessoas usando o Tovia. Nunca foi tão simples acompanhar as inscrições e o financeiro ao mesmo tempo.',
    avatar: 'JS',
  },
  {
    name: 'Ana Paula Mendes',
    role: 'Coordenadora de eventos',
    church: 'Ministério Nova Esperança · Curitiba',
    text: 'A página de inscrição foi criada em minutos. Compartilhamos o link com o grupo e as inscrições chegaram automaticamente, sem precisar de planilha.',
    avatar: 'AM',
  },
  {
    name: 'Carlos Eduardo',
    role: 'Líder de jovens',
    church: 'Igreja Ressurreição · Belo Horizonte',
    text: 'Sempre controlamos os inscritos em planilhas e era um caos. O Tovia mudou completamente como trabalhamos. Hoje tudo está organizado em um só lugar.',
    avatar: 'CE',
  },
];

export function ProvaSocial() {
  return (
    <section className="py-20 px-6 bg-[#f0f7f3]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Prova social</span>
          <h2 className="text-4xl font-black text-foreground tracking-tight mt-3">
            Quem organiza com o Tovia
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white rounded-3xl p-7 border border-border flex flex-col gap-5 hover:shadow-md transition-all">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed flex-1">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground">{t.role} · {t.church}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
