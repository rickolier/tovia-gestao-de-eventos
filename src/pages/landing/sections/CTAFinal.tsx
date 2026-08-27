import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function CTAFinal() {
  return (
    <section className="bg-sidebar py-20 px-6 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
      <div className="max-w-4xl mx-auto relative text-center">
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
          Comece a organizar hoje,<br className="hidden md:block" /> no plano Chinám. É gratuito.
        </h2>
        <p className="text-white/70 text-base mb-10 max-w-2xl mx-auto">
          Crie sua conta agora, organize seu primeiro evento e cresça no seu ritmo. O plano Chinám é gratuito para sempre.
        </p>
        <div className="flex justify-center">
          <Link
            to="/login?cadastro=true"
            className="inline-flex items-center gap-2 bg-primary text-white font-black px-10 py-4 rounded-2xl hover:bg-primary/90 transition-all shadow-2xl text-sm uppercase tracking-widest"
          >
            Criar conta <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
