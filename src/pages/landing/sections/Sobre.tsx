import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';

export function Sobre() {
  return (
    <section id="para-quem" className="max-w-6xl mx-auto px-6 pt-10 pb-10">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <div className="w-full aspect-square max-w-md mx-auto rounded-[3rem] overflow-hidden relative shadow-2xl">
            <img src="/foto-sobre.jpg" alt="Organizador de eventos usando o Tovia" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-sidebar/40 to-transparent" />
          </div>
          <div className="absolute -bottom-6 -right-6 rounded-2xl p-4 flex items-center gap-3" style={{background:'linear-gradient(160deg,rgba(255,255,255,.80) 0%,rgba(255,255,255,.55) 100%)',backdropFilter:'blur(48px) saturate(180%)',WebkitBackdropFilter:'blur(48px) saturate(180%)',border:'1px solid rgba(255,255,255,.9)',boxShadow:'inset 0 2px 0 rgba(255,255,255,.95),inset 0 -1px 0 rgba(0,0,0,.04),0 20px 48px rgba(30,11,75,.12),0 4px 12px rgba(30,11,75,.08)'}}>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">127 inscrições</p>
              <p className="text-xs text-muted-foreground">confirmadas</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-4xl font-black text-foreground tracking-tight mt-3 mb-6 leading-tight">
            Uma plataforma feita para quem organiza com propósito
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            O Tovia nasceu para resolver um problema real: igrejas e organizações que precisam de uma ferramenta profissional para gerenciar eventos, mas sem a complexidade de sistemas corporativos.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Simples para o organizador. Claro para o participante. Completo para o evento.
          </p>
          <Link to="/login?cadastro=true" className="inline-flex items-center gap-2 bg-primary text-white font-black px-6 py-3 rounded-xl hover:bg-primary/90 transition-all text-sm">
            Criar minha conta <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
