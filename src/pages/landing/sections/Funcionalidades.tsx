import { cn } from '@/lib/utils';
import { FEATURES } from '../data';

export function Funcionalidades() {
  return (
    <section id="funcionalidades" className="bg-background pt-12 pb-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Funcionalidades</span>
          <h2 className="text-4xl font-black text-foreground tracking-tight mt-3">
            Tudo que seu evento precisa,<br />em um só lugar
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="bg-white rounded-2xl p-6 border border-border hover:shadow-md transition-all group">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', feature.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
