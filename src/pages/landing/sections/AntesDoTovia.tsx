import { FileSpreadsheet, MessageCircle, Clock, Users, DollarSign, RefreshCw, AlertTriangle, Inbox } from 'lucide-react';

const DORES = [
  { icon: FileSpreadsheet, label: 'Planilhas infinitas' },
  { icon: DollarSign, label: 'Pagamentos perdidos' },
  { icon: MessageCircle, label: 'Tudo no WhatsApp' },
  { icon: Users, label: 'Muitos grupos' },
  { icon: Clock, label: 'Cobranças diferentes' },
  { icon: RefreshCw, label: 'Retrabalho constante' },
  { icon: AlertTriangle, label: 'Medo de esquecer alguém' },
  { icon: Inbox, label: 'Sem visão do todo' },
];

const POSITIONS = [
  { top: '4%', left: '2%' },
  { top: '16%', right: '0%' },
  { top: '30%', left: '-2%' },
  { top: '42%', right: '4%' },
  { top: '55%', left: '0%' },
  { top: '66%', right: '2%' },
  { top: '78%', left: '4%' },
  { top: '88%', right: '6%' },
];

export function AntesDoTovia() {
  return (
    <section className="py-16 px-6 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left — text */}
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-destructive">Parece familiar?</span>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mt-3 leading-tight">
              Que tal simplificar a organização dos seus eventos?
            </h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              Organizar um evento deveria ser simples, mas na prática vira uma corrida entre planilhas, grupos de WhatsApp e cobranças que se perdem pelo caminho.
            </p>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Se você se identificou com algum desses, <strong className="text-foreground">você não está sozinho.</strong>
            </p>
          </div>

          {/* Right — image with floating pain cards */}
          <div className="relative min-h-[420px] flex items-center justify-center">
            {/* Background image */}
            <div className="relative w-64 h-80 sm:w-72 sm:h-96 rounded-3xl overflow-hidden shadow-xl">
              <img
                src="/foto-antes.png"
                alt="Organizador sobrecarregado"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.style.background = 'linear-gradient(135deg, #2D1470 0%, #1E0B4B 100%)';
                  target.parentElement!.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;opacity:0.3"><svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#F5F0E8" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg></div>';
                }}
              />
            </div>

            {/* Floating pain cards */}
            {DORES.map(({ icon: Icon, label }, i) => {
              const pos = POSITIONS[i];
              const isLeft = 'left' in pos;
              return (
                <div
                  key={label}
                  className="absolute flex items-center gap-2 bg-primary/90 backdrop-blur-md border border-white/20 shadow-lg rounded-full px-3 py-2 animate-pulse"
                  style={{
                    top: pos.top,
                    ...(isLeft ? { left: pos.left } : { right: pos.right }),
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: '3s',
                  }}
                >
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-white whitespace-nowrap">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
