import React from 'react';
import { AnimConta, AnimEvento, AnimCompartilhar, AnimDashboard } from '../animations';

const STEPS = [
  { step: '01', title: 'Crie sua conta', desc: 'Cadastre-se em menos de 1 minuto e comece a organizar seu primeiro evento de graça.', Anim: AnimConta },
  { step: '02', title: 'Configure o evento', desc: 'Defina vagas, ingressos e formulários personalizados em poucos cliques.', Anim: AnimEvento },
  { step: '03', title: 'Compartilhe o link', desc: 'Seus participantes se inscrevem diretamente pela página criada pelo Tovia.', Anim: AnimCompartilhar },
  { step: '04', title: 'Acompanhe tudo', desc: 'Inscrições, financeiro e equipe em tempo real, centralizados em um só lugar.', Anim: AnimDashboard },
] as { step: string; title: string; desc: string; Anim: React.FC }[];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="py-16 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-black uppercase tracking-widest text-primary">Como funciona</span>
          <h2 className="text-4xl font-black text-foreground tracking-tight mt-3">
            Do cadastro ao evento,<br />em minutos
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {STEPS.map(({ step, title, desc, Anim }) => (
            <div
              key={step}
              className="relative rounded-3xl overflow-hidden min-h-[240px] p-7 pb-0 flex flex-col"
              style={{ background: 'linear-gradient(135deg, var(--sidebar) 0%, #1E0B4B 100%)' }}
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
              <span className="inline-flex text-xs font-black text-primary/70 bg-white/10 border border-white/10 px-3 py-1 rounded-full w-fit mb-4">
                {step}º Passo
              </span>
              <h3 className="text-xl font-black text-white leading-tight mb-2 max-w-[60%] sm:max-w-[58%]">{title}</h3>
              <p className="text-xs text-white/50 leading-relaxed max-w-full sm:max-w-[55%] mb-4 sm:mb-0">{desc}</p>
              <div className="hidden sm:flex absolute bottom-0 right-4 items-end">
                <Anim />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
