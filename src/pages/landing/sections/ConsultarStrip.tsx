import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';

export function ConsultarStrip() {
  return (
    <div>
      <div className="bg-secondary/60 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-black text-foreground text-base">Já se inscreveu em um evento?</p>
              <p className="text-sm text-muted-foreground">Consulte seus dados, status de pagamento e QR Code de check-in.</p>
            </div>
          </div>
          <Link
            to="/consultar"
            className="w-full md:w-auto shrink-0 bg-primary text-white text-sm font-black uppercase tracking-widest px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            Consultar minha inscrição <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

