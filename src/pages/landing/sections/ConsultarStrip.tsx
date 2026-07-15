import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';

export function ConsultarStrip() {
  return (
    <div className="md:-mt-16">
      <svg viewBox="0 0 1440 62" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block h-8 md:h-auto">
        <path d="M0 62L1440 62L1440 30C1200 60 960 0 720 0C480 0 240 60 0 30L0 62Z" fill="#f0fdf4" />
      </svg>
      <div className="bg-[#f0fdf4]">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-black text-[#1a2e1a] text-base">Já se inscreveu em um evento?</p>
              <p className="text-sm text-[#3d5c3d]">Consulte seus dados, status de pagamento e QR Code de check-in.</p>
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
