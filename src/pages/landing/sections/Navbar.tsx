import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { NAV_LINKS, NAV_ROUTE_LINKS } from '../data';
import { ToviaLogo } from '../../../components/ToviaLogo';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <ToviaLogo className="h-7 w-auto text-primary" />
          <span className="hidden sm:block text-[10px] font-semibold tracking-widest uppercase text-muted-foreground border-l border-border pl-3 leading-tight">
            Gestão de<br />Eventos
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <a key={link.label} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </a>
          ))}
          {NAV_ROUTE_LINKS.map(link => (
            <Link key={link.label} to={link.to} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold text-foreground hover:text-primary transition-colors px-4 py-2">
            Entrar
          </Link>
          <Link to="/login?cadastro=true" className="bg-primary hover:bg-primary/90 text-white text-sm font-black px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-primary/20">
            Criar conta
          </Link>
        </div>

        <button className="md:hidden p-2 text-muted-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white px-6 py-4 space-y-4">
          {NAV_LINKS.map(link => (
            <a key={link.label} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-foreground">
              {link.label}
            </a>
          ))}
          {NAV_ROUTE_LINKS.map(link => (
            <Link key={link.label} to={link.to} onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-3">
            <Link to="/login" className="text-center text-sm font-semibold border border-border rounded-xl py-2.5">Entrar</Link>
            <Link to="/login?cadastro=true" className="text-center bg-primary text-white text-sm font-black rounded-xl py-2.5">Criar conta</Link>
          </div>
        </div>
      )}
    </header>
  );
}
