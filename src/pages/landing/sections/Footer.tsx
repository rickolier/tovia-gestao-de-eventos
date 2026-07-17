import { ToviaLogo } from '~/components/ToviaLogo';
import React from 'react';
import { Link } from 'react-router-dom';
import { NAV_LINKS, NAV_ROUTE_LINKS } from '../data';

export function Footer() {
  return (
    <footer className="bg-sidebar py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <ToviaLogo className="h-7 w-auto text-white" />
          <a href="mailto:suporte@toviaapp.com.br" className="text-xs text-white/40 hover:text-white/70 transition-colors">
            suporte@toviaapp.com.br
          </a>
        </div>
        <p className="text-white/30 text-xs">Todos os direitos reservados · BIGLAB Solutions © 2026</p>
        <div className="flex items-center gap-6 flex-wrap justify-center">
          {NAV_LINKS.map(link => (
            <a key={link.label} href={link.href} className="text-xs text-white/40 hover:text-white/70 transition-colors">
              {link.label}
            </a>
          ))}
          {NAV_ROUTE_LINKS.map(link => (
            <Link key={link.label} to={link.to} className="text-xs text-white/40 hover:text-white/70 transition-colors">
              {link.label}
            </Link>
          ))}
          <Link to="/privacidade" className="text-xs text-white/40 hover:text-white/70 transition-colors">Privacidade</Link>
          <Link to="/termos-de-uso" className="text-xs text-white/40 hover:text-white/70 transition-colors">Termos de Uso</Link>
        </div>
      </div>
    </footer>
  );
}
