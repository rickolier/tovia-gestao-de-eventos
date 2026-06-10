import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TicketIcon, DollarSign, Wallet, CheckCircle, ArrowRight, Menu, X, Users, Calendar, Globe, BarChart3, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Planos', href: '#planos' },
  { label: 'Sobre', href: '#sobre' },
];

const FEATURES = [
  {
    icon: TicketIcon,
    title: 'Ingressos & Inscrições',
    description: 'Crie categorias de ingressos gratuitos ou pagos, configure vagas e gerencie inscrições com formulários personalizados.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Globe,
    title: 'Páginas de Venda',
    description: 'Crie páginas de venda profissionais para seus eventos em minutos, sem precisar de um desenvolvedor.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Users,
    title: 'Gestão de Participantes',
    description: 'Acompanhe inscrições, status de pagamento e dados dos participantes em tempo real.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: DollarSign,
    title: 'Controle Financeiro',
    description: 'Registre pagamentos, gerencie doações e acompanhe o financeiro do seu evento com clareza.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Wallet,
    title: 'Gestão do Evento',
    description: 'Organize recursos, grupos de hospedagem e tarefas da equipe em um só lugar.',
    color: 'bg-pink-50 text-pink-600',
  },
  {
    icon: BarChart3,
    title: 'Relatórios',
    description: 'Tenha visão completa do seu evento com relatórios de inscrições, financeiro e ocupação.',
    color: 'bg-amber-50 text-amber-600',
  },
];

const PLANS = [
  {
    id: 'start',
    name: 'Start',
    subtitle: 'Inscrições',
    description: 'Para eventos simples com foco em inscrições e participantes.',
    modules: ['Ingressos gratuitos', 'Páginas de venda', 'Gestão de participantes', 'Relatórios'],
    highlight: false,
  },
  {
    id: 'essencial',
    name: 'Essencial',
    subtitle: 'Inscrições + Financeiro',
    description: 'Para quem precisa cobrar ingressos e controlar o financeiro.',
    modules: ['Tudo do Start', 'Ingressos pagos', 'Pagamentos e doações', 'Configuração financeira'],
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'Completo',
    description: 'Para eventos complexos com equipe, hospedagem e tarefas.',
    modules: ['Tudo do Essencial', 'Recursos e grupos', 'Gestão de tarefas', 'Equipe e responsáveis'],
    highlight: false,
  },
];

const STATS = [
  { value: '3', label: 'Módulos integrados' },
  { value: '100%', label: 'Feito para igrejas' },
  { value: '1 min', label: 'Para criar um evento' },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-foreground">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="text-3xl font-black text-primary tracking-tight leading-none">ekko</span>
            <span className="hidden sm:block text-[10px] font-semibold tracking-widest uppercase text-muted-foreground border-l border-border pl-3 leading-tight">
              Gestão de<br />Eventos
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-foreground hover:text-primary transition-colors px-4 py-2">
              Entrar
            </Link>
            <Link to="/login?cadastro=true" className="bg-primary hover:bg-primary/90 text-white text-sm font-black px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-primary/20">
              Criar conta grátis
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 text-muted-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white px-6 py-4 space-y-4">
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-foreground">
                {link.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-3">
              <Link to="/login" className="text-center text-sm font-semibold border border-border rounded-xl py-2.5">Entrar</Link>
              <Link to="/login?cadastro=true" className="text-center bg-primary text-white text-sm font-black rounded-xl py-2.5">Criar conta grátis</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--sidebar)] via-[#1e3d2a] to-[#1a7a45] pt-24 pb-32 px-6">
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5" />
        <div className="absolute top-20 -left-20 w-[300px] h-[300px] rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-1/4 w-[200px] h-[200px] rounded-full bg-primary/20" />

        <div className="max-w-6xl mx-auto relative">
          <div className="max-w-2xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">Plataforma para igrejas</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6">
              Gestão de eventos para quem{' '}
              <span className="text-emerald-400">transforma vidas</span>
            </h1>

            <p className="text-lg text-white/70 mb-10 max-w-xl leading-relaxed">
              Do acampamento à conferência, o Ekko reúne inscrições, financeiro e gestão de equipe em uma plataforma simples e profissional.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/login?cadastro=true"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary font-black px-8 py-4 rounded-2xl hover:bg-white/90 transition-all shadow-2xl text-sm uppercase tracking-widest"
              >
                Começar grátis <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#funcionalidades"
                className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all text-sm"
              >
                Ver funcionalidades <ChevronDown className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 30C1200 60 960 0 720 0C480 0 240 60 0 30L0 60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="max-w-6xl mx-auto px-6 -mt-2">
        <div className="grid grid-cols-3 gap-6 bg-white rounded-3xl border border-border shadow-xl p-8">
          {STATS.map((stat, i) => (
            <div key={i} className={cn('text-center', i < STATS.length - 1 && 'border-r border-border')}>
              <p className="text-3xl font-black text-primary">{stat.value}</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sobre ── */}
      <section id="sobre" className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Visual */}
          <div className="relative">
            <div className="w-full aspect-square max-w-md mx-auto bg-gradient-to-br from-[var(--sidebar)] to-primary rounded-[3rem] flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-8 right-8 w-24 h-24 rounded-2xl bg-white/10" />
              <div className="absolute bottom-8 left-8 w-16 h-16 rounded-xl bg-white/10" />
              <span className="text-8xl font-black text-white/20 select-none">ekko</span>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white border border-border rounded-2xl shadow-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Evento criado!</p>
                <p className="text-xs text-muted-foreground">Em menos de 1 minuto</p>
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Quem somos</span>
            <h2 className="text-3xl font-black text-foreground tracking-tight mt-3 mb-6 leading-tight">
              Uma plataforma feita para quem organiza com propósito
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              O Ekko nasceu para resolver um problema real: igrejas e organizações que precisam de uma ferramenta profissional para gerenciar eventos, mas sem a complexidade de sistemas corporativos.
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

      {/* ── Funcionalidades ── */}
      <section id="funcionalidades" className="bg-[#f4f7f5] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Funcionalidades</span>
            <h2 className="text-3xl font-black text-foreground tracking-tight mt-3">
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

      {/* ── Planos ── */}
      <section id="planos" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Planos</span>
            <h2 className="text-3xl font-black text-foreground tracking-tight mt-3">
              Escolha o plano ideal<br />para o seu evento
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">Comece grátis e escale conforme sua necessidade.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  'rounded-3xl p-8 border-2 flex flex-col transition-all',
                  plan.highlight
                    ? 'border-primary bg-gradient-to-br from-[var(--sidebar)] to-primary text-white shadow-2xl shadow-primary/20 scale-[1.02]'
                    : 'border-border bg-white hover:border-primary/30 hover:shadow-md'
                )}
              >
                {plan.highlight && (
                  <span className="text-[10px] font-semibold uppercase tracking-widest bg-white/20 text-white px-3 py-1 rounded-full self-start mb-4">
                    Mais popular
                  </span>
                )}
                <div className="mb-6">
                  <span className={cn('text-xs font-semibold uppercase tracking-widest', plan.highlight ? 'text-white/60' : 'text-primary')}>
                    {plan.name}
                  </span>
                  <h3 className={cn('text-xl font-black mt-1', plan.highlight ? 'text-white' : 'text-foreground')}>
                    {plan.subtitle}
                  </h3>
                  <p className={cn('text-sm mt-2', plan.highlight ? 'text-white/70' : 'text-muted-foreground')}>
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.modules.map((mod) => (
                    <li key={mod} className="flex items-center gap-3">
                      <CheckCircle className={cn('w-4 h-4 shrink-0', plan.highlight ? 'text-emerald-300' : 'text-primary')} />
                      <span className={cn('text-sm font-medium', plan.highlight ? 'text-white/90' : 'text-foreground')}>
                        {mod}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/login?cadastro=true"
                  className={cn(
                    'text-center font-black text-sm uppercase tracking-widest py-3 rounded-xl transition-all',
                    plan.highlight
                      ? 'bg-white text-primary hover:bg-white/90'
                      : 'bg-primary text-white hover:bg-primary/90'
                  )}
                >
                  Começar agora
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="bg-gradient-to-br from-[var(--sidebar)] to-primary py-24 px-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
            Pronto para transformar a gestão dos seus eventos?
          </h2>
          <p className="text-white/70 mb-10 text-lg">
            Crie sua conta agora e organize seu próximo evento em minutos.
          </p>
          <Link
            to="/login?cadastro=true"
            className="inline-flex items-center gap-2 bg-white text-primary font-black px-10 py-4 rounded-2xl hover:bg-white/90 transition-all shadow-2xl text-sm uppercase tracking-widest"
          >
            Criar conta grátis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[var(--sidebar)] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-2xl font-black text-white tracking-tight">ekko</span>
          <p className="text-white/30 text-xs">© 2026 Ekko Gestão de Eventos. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} className="text-xs text-white/40 hover:text-white/70 transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
