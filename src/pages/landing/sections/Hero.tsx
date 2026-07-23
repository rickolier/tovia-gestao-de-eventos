import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Users, Heart, CheckCircle } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sidebar via-[#2D1470] to-[#1E0B4B] pt-10 pb-16 px-6">
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5" />
      <div className="absolute top-20 -left-20 w-[300px] h-[300px] rounded-full bg-white/5" />
      <div className="absolute bottom-0 right-1/4 w-[200px] h-[200px] rounded-full bg-primary/20" />

      <div className="max-w-6xl mx-auto relative flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6 uppercase">
            Do zero ao check-in{' '}
            <span className="text-[#FF8C47]">tudo em uma plataforma.</span>
          </h1>
          <p className="text-lg text-white/70 mb-10 max-w-xl leading-relaxed">
            Organize seu evento com inscrições, equipe, financeiro e check-in no mesmo lugar. Feito para igrejas, conferências, retiros e quem organiza com propósito.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/login?cadastro=true"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary font-black px-8 py-4 rounded-2xl hover:bg-white/90 transition-all shadow-2xl text-sm uppercase tracking-widest"
            >
              Criar meu evento <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all text-sm"
            >
              Ver como funciona <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="hidden md:flex flex-1 justify-center items-end relative" style={{ minHeight: '420px' }}>
          <div className="absolute bottom-0 right-4 w-80 h-80 rounded-full bg-[#FF6B1A]/20 border border-[#FF6B1A]/30" />
          <div className="absolute bottom-6 right-10 w-64 h-64 rounded-full bg-white/5" />
          <div
            className="relative z-10 overflow-hidden border-4 border-white/10"
            style={{ width: '420px', height: '520px', borderRadius: '50% 50% 50% 50% / 45% 45% 55% 55%', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}
          >
            <img src="/foto-hero.jpg" alt="Organizador de eventos" className="w-full h-full object-cover" style={{ objectPosition: 'center 20%', transform: 'scale(1.15)', transformOrigin: 'center 30%' }} />
          </div>
          <div className="absolute top-6 left-0 z-20 rounded-2xl px-4 py-3 flex items-center gap-3" style={{background:'linear-gradient(160deg,rgba(255,255,255,.55) 0%,rgba(255,255,255,.22) 100%)',backdropFilter:'blur(48px) saturate(180%)',WebkitBackdropFilter:'blur(48px) saturate(180%)',border:'1px solid rgba(255,255,255,.7)',boxShadow:'inset 0 2px 0 rgba(255,255,255,.9),inset 0 -1px 0 rgba(0,0,0,.06),0 20px 48px rgba(30,11,75,.18),0 4px 12px rgba(30,11,75,.10)'}}>
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest">Inscrições</p>
              <p className="text-lg font-black text-white leading-none">142</p>
            </div>
          </div>
          <div className="absolute top-28 right-0 z-20 rounded-2xl px-4 py-3 flex items-center gap-3" style={{background:'linear-gradient(160deg,rgba(255,255,255,.55) 0%,rgba(255,255,255,.22) 100%)',backdropFilter:'blur(48px) saturate(180%)',WebkitBackdropFilter:'blur(48px) saturate(180%)',border:'1px solid rgba(255,255,255,.7)',boxShadow:'inset 0 2px 0 rgba(255,255,255,.9),inset 0 -1px 0 rgba(0,0,0,.06),0 20px 48px rgba(30,11,75,.18),0 4px 12px rgba(30,11,75,.10)'}}>
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 text-violet-700" />
            </div>
            <div>
              <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest">Doações</p>
              <p className="text-lg font-black text-white leading-none">R$ 4.320</p>
            </div>
          </div>
          <div className="absolute bottom-12 left-2 z-20 rounded-2xl px-4 py-3 flex items-center gap-3" style={{background:'linear-gradient(160deg,rgba(255,255,255,.55) 0%,rgba(255,255,255,.22) 100%)',backdropFilter:'blur(48px) saturate(180%)',WebkitBackdropFilter:'blur(48px) saturate(180%)',border:'1px solid rgba(255,255,255,.7)',boxShadow:'inset 0 2px 0 rgba(255,255,255,.9),inset 0 -1px 0 rgba(0,0,0,.06),0 20px 48px rgba(30,11,75,.18),0 4px 12px rgba(30,11,75,.10)'}}>
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Evento criado!</p>
              <p className="text-[10px] text-white/70">Em menos de 1 minuto</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
