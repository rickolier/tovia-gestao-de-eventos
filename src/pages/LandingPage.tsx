import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TicketIcon, DollarSign, Wallet, CheckCircle, ArrowRight, Menu, X, Users, Calendar, Globe, BarChart3, ChevronDown, Plus, Heart, CheckSquare, Clock, MapPin, ExternalLink, Check } from 'lucide-react';
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
    title: 'Páginas de Inscrição',
    description: 'Crie páginas de inscrição profissionais para seus eventos em minutos, sem precisar de um desenvolvedor.',
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
    description: 'Registre manualmente pagamentos recebidos e doações, acompanhe o financeiro do evento com clareza. Não realizamos cobranças.',
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
    price: 'Grátis',
    limits: '1 evento · 200 vagas · 1 tipo de ingresso · 1 página de inscrição',
    description: 'Para eventos simples com foco em inscrições e participantes.',
    modules: ['Ingressos gratuitos', 'Páginas de Inscrição Personalizadas', 'Gestão de participantes', 'Relatórios'],
    highlight: false,
  },
  {
    id: 'essencial',
    name: 'Essencial',
    subtitle: 'Inscrições + Financeiro',
    price: 'R$ 39,90/mês',
    limits: '3 eventos · 500 vagas/evento · 3 tipos de inscrição · 3 páginas de inscrição',
    description: 'Para quem precisa organizar o financeiro do evento — registre pagamentos recebidos, doações e acompanhe tudo com clareza.',
    modules: ['Tudo do Start', 'Ingressos com valores reais', 'Registro de pagamentos e doações', 'Configuração de Taxas e Margens para gestão real'],
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'Completo',
    price: 'R$ 99,00/mês',
    limits: 'Eventos ilimitados · Inscrições ilimitadas · Páginas ilimitadas',
    description: 'O plano para quem não quer preocupações!',
    modules: ['Tudo do Essencial', 'Administre recursos, contratações e fornecedores', 'Gestão de Tarefas com equipe integrada', 'Distribua participantes em grupos, quartos, mesas'],
    highlight: false,
  },
];

const STATS = [
  { value: '3', label: 'Módulos integrados' },
  { value: '100%', label: 'Feito para igrejas' },
  { value: '1 min', label: 'Para criar um evento' },
];

const DEMO_TABS = [
  { id: 'vendas', label: 'Páginas de Inscrição', icon: Globe },
  { id: 'doacoes', label: 'Doações', icon: Heart },
  { id: 'tarefas', label: 'Tarefas', icon: CheckSquare },
];

function MockupVendas() {
  const pages = [
    { title: 'Acampamento Jovem 2026', tickets: 142, max: 200, color: 'bg-emerald-500' },
    { title: 'Conferência de Mulheres', tickets: 89, max: 150, color: 'bg-violet-500' },
    { title: 'Retiro de Casais', tickets: 34, max: 60, color: 'bg-blue-500' },
  ];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % pages.length), 2200);
    return () => clearInterval(t);
  }, []);
  const page = pages[active];
  const pct = Math.round((page.tickets / page.max) * 100);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-border w-full max-w-sm mx-auto">
      {/* Browser chrome */}
      <div className="bg-gray-100 border-b border-border px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-md px-3 py-1 text-[10px] text-gray-400 font-mono truncate ml-2">
          tovia.app/e/acampamento-jovem
        </div>
      </div>
      {/* Page content */}
      <div className="p-5 transition-all duration-500">
        <div className="flex gap-2 mb-4">
          {pages.map((p, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={cn('flex-1 text-[10px] font-semibold px-2 py-1.5 rounded-lg transition-all', active === i ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
              {p.title.split(' ')[0]}
            </button>
          ))}
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 mb-4">
          <h4 className="text-sm font-black text-foreground leading-tight mb-1">{page.title}</h4>
          <p className="text-xs text-muted-foreground mb-3">Igreja Vida Nova · São Paulo</p>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-gray-500">{page.tickets}/{page.max} inscritos</span>
            <span className="text-[10px] font-bold text-primary">{pct}%</span>
          </div>
          <div className="h-2 bg-white/60 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all duration-700', page.color)} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button className="w-full bg-primary text-white text-xs font-black py-2.5 rounded-xl">
          Inscrever-se agora
        </button>
      </div>
    </div>
  );
}

function MockupDoacoes() {
  const [total, setTotal] = useState(4320);
  const [items, setItems] = useState([
    { name: 'Carlos M.', value: 150, time: '2min' },
    { name: 'Ana S.', value: 80, time: '5min' },
    { name: 'Rafael T.', value: 200, time: '12min' },
  ]);
  useEffect(() => {
    const names = ['Maria L.', 'João P.', 'Beatriz A.', 'Lucas F.', 'Sandra O.'];
    let idx = 0;
    const t = setInterval(() => {
      const value = [50, 100, 120, 180, 250][Math.floor(Math.random() * 5)];
      setTotal(p => p + value);
      setItems(prev => [{ name: names[idx % names.length], value, time: 'agora' }, ...prev.slice(0, 2)]);
      idx++;
    }, 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden w-full max-w-sm mx-auto">
      <div className="bg-gradient-to-br from-[var(--sidebar)] to-primary p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">Total de Doações</p>
        <p className="text-3xl font-black transition-all duration-500">R$ {total.toLocaleString('pt-BR')}</p>
        <p className="text-xs text-white/60 mt-1">Acampamento Jovem 2026</p>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Últimas doações</p>
        {items.map((item, i) => (
          <div key={i} className={cn('flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-500', i === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50')}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                {item.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{item.name}</p>
                <p className="text-[10px] text-muted-foreground">{item.time}</p>
              </div>
            </div>
            <span className="text-sm font-black text-emerald-600">+R${item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupTarefas() {
  const allTasks = [
    { label: 'Confirmar local com equipe', done: true, assignee: 'Ana', tag: 'Logística' },
    { label: 'Enviar convites por email', done: true, assignee: 'Carlos', tag: 'Comunicação' },
    { label: 'Montar cronograma do evento', done: false, assignee: 'João', tag: 'Planejamento' },
    { label: 'Definir escala de voluntários', done: false, assignee: 'Maria', tag: 'Equipe' },
    { label: 'Revisar página de inscrições', done: false, assignee: 'Rafael', tag: 'Digital' },
  ];
  const [tasks, setTasks] = useState(allTasks);
  useEffect(() => {
    const t = setInterval(() => {
      setTasks(prev => {
        const firstUndone = prev.findIndex(t => !t.done);
        if (firstUndone === -1) return allTasks.map(t => ({ ...t, done: false }));
        return prev.map((t, i) => i === firstUndone ? { ...t, done: true } : t);
      });
    }, 1800);
    return () => clearInterval(t);
  }, []);
  const done = tasks.filter(t => t.done).length;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden w-full max-w-sm mx-auto">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-foreground">Tarefas do Evento</p>
          <p className="text-[10px] text-muted-foreground">Acampamento Jovem 2026</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-primary">{done}/{tasks.length}</p>
          <p className="text-[10px] text-muted-foreground">concluídas</p>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100">
        <div className="h-full bg-primary transition-all duration-700 rounded-full" style={{ width: `${(done / tasks.length) * 100}%` }} />
      </div>
      <div className="p-3 space-y-1.5">
        {tasks.map((task, i) => (
          <div key={i} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-500', task.done ? 'bg-emerald-50' : 'bg-gray-50')}>
            <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300', task.done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300')}>
              {task.done && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-xs font-semibold truncate transition-all', task.done ? 'line-through text-muted-foreground' : 'text-foreground')}>{task.label}</p>
              <p className="text-[10px] text-muted-foreground">{task.assignee} · {task.tag}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: 'O Tovia é gratuito?',
    a: 'Sim! O plano Start é gratuito para sempre, com 1 evento ativo, até 200 vagas e 1 página de inscrição. Para mais eventos e funcionalidades financeiras, temos os planos Essencial e Pro.',
  },
  {
    q: 'O Tovia realiza cobranças de ingressos?',
    a: 'Não. O Tovia é uma plataforma de organização — você registra manualmente os pagamentos recebidos e doações. Nós não intermediamos nem processamos cobranças.',
  },
  {
    q: 'Posso criar mais de um evento ao mesmo tempo?',
    a: 'No plano Start você pode ter 1 evento ativo. No Essencial, até 3 eventos simultâneos. No Pro, eventos ilimitados.',
  },
  {
    q: 'Preciso saber programar para usar o Tovia?',
    a: 'Não. O Tovia foi feito para qualquer pessoa conseguir usar. Crie eventos, gerencie inscrições e acompanhe o financeiro sem nenhum conhecimento técnico.',
  },
  {
    q: 'Posso cancelar meu plano a qualquer momento?',
    a: 'Sim. Não há fidelidade ou multa. Você pode cancelar ou mudar de plano quando quiser, diretamente pelo painel.',
  },
  {
    q: 'O Tovia funciona para qualquer tipo de evento?',
    a: 'Sim! Foi criado pensando em igrejas que organizam acampamentos, conferências, retiros e encontros. Mas funciona para qualquer evento que precise de inscrições e organização.',
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">FAQ</span>
          <h2 className="text-4xl font-black text-foreground tracking-tight mt-3">
            Perguntas frequentes
          </h2>
          <p className="text-muted-foreground mt-3 text-sm">Ficou com dúvida? Veja as respostas mais comuns.</p>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-base font-bold text-foreground pr-4">{item.q}</span>
                <ChevronDown className={cn('w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200', open === i && 'rotate-180')} />
              </button>
              {open === i && (
                <div className="px-6 pb-5 pt-1">
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoTab, setDemoTab] = useState('vendas');

  return (
    <div className="min-h-screen bg-white font-sans text-foreground">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="text-3xl font-black text-primary tracking-tight leading-none">tovia</span>
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

        <div className="max-w-6xl mx-auto relative flex flex-col md:flex-row items-center gap-12">
          {/* Texto */}
          <div className="flex-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">Plataforma para igrejas</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6 uppercase">
              Gestão de eventos para quem{' '}
              <span className="text-emerald-400">transforma vidas</span>
            </h1>

            <p className="text-lg text-white/70 mb-10 max-w-xl leading-relaxed">
              Do acampamento à conferência, o Tovia reúne inscrições, financeiro e gestão de equipe em uma plataforma simples e profissional.
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

          {/* Hero visual — foto + circle + floating cards */}
          <div className="hidden md:flex flex-1 justify-center items-end relative" style={{ minHeight: '420px' }}>
            {/* Círculo de contraste */}
            <div className="absolute bottom-0 right-4 w-80 h-80 rounded-full bg-emerald-400/20 border border-emerald-400/30" />
            <div className="absolute bottom-6 right-10 w-64 h-64 rounded-full bg-white/5" />

            {/* Foto dentro da elipse */}
            <div
              className="relative z-10 overflow-hidden border-4 border-white/10"
              style={{
                width: '420px',
                height: '520px',
                borderRadius: '50% 50% 50% 50% / 45% 45% 55% 55%',
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              }}
            >
              <img
                src="/foto-hero.jpg"
                alt="Organizador de eventos"
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center 20%', transform: 'scale(1.15)', transformOrigin: 'center 30%' }}
              />
            </div>

            {/* Card flutuante — inscrições */}
            <div className="absolute top-6 left-0 z-20 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-border">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Inscrições</p>
                <p className="text-lg font-black text-foreground leading-none">142</p>
              </div>
            </div>

            {/* Card flutuante — doações */}
            <div className="absolute top-28 right-0 z-20 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-border">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 text-violet-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Doações</p>
                <p className="text-lg font-black text-foreground leading-none">R$ 4.320</p>
              </div>
            </div>

            {/* Card flutuante — evento criado */}
            <div className="absolute bottom-12 left-2 z-20 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-border">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Evento criado!</p>
                <p className="text-[10px] text-muted-foreground">Em menos de 1 minuto</p>
              </div>
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
      <section id="sobre" className="max-w-6xl mx-auto px-6 pt-20 pb-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Visual */}
          <div className="relative">
            <div className="w-full aspect-square max-w-md mx-auto rounded-[3rem] overflow-hidden relative shadow-2xl">
              <img
                src="/foto-sobre.jpg"
                alt="Organizador de eventos usando o Tovia"
                className="w-full h-full object-cover object-center"
              />
              {/* Overlay sutil com a cor da marca */}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--sidebar)]/40 to-transparent" />
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

      {/* ── Funcionalidades ── */}
      <section id="funcionalidades" className="bg-[#f4f7f5] pt-12 pb-10 px-6">
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

      {/* ── Demo mockups ── */}
      <section className="pt-12 pb-6 px-6 bg-[#f4f7f5]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Veja na prática</span>
            <h2 className="text-4xl font-black text-foreground tracking-tight mt-3">
              Funcionalidades que fazem<br />a diferença no dia a dia
            </h2>
            <p className="text-muted-foreground mt-3 text-sm max-w-lg mx-auto">
              Veja como o Tovia simplifica as partes mais trabalhosas de organizar um evento.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-3 mb-10 flex-wrap">
            {DEMO_TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDemoTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                    demoTab === tab.id
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-white border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Mockup panel */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            {/* Description */}
            <div className="flex-1 max-w-md">
              {demoTab === 'vendas' && (
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
                    <Globe className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground mb-4">Páginas de Inscrição profissionais</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Crie páginas de inscrição para cada evento sem precisar de um desenvolvedor. Compartilhe o link e veja as inscrições chegarem em tempo real.
                  </p>
                  <ul className="space-y-3">
                    {['Link único por evento', 'Múltiplos tipos de ingresso', 'Contador de vagas ao vivo', 'Formulários personalizados'].map(item => (
                      <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {demoTab === 'doacoes' && (
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center mb-5">
                    <Heart className="w-6 h-6 text-pink-600" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground mb-4">Controle de Doações</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Registre e acompanhe todas as doações recebidas no seu evento. Veja o total acumulado e o histórico de contribuições — sem intermediários, sem taxas.
                  </p>
                  <ul className="space-y-3">
                    {['Registro manual de doações', 'Total acumulado em tempo real', 'Histórico de contribuições', 'Nenhuma cobrança realizada pela plataforma'].map(item => (
                      <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {demoTab === 'tarefas' && (
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-5">
                    <CheckSquare className="w-6 h-6 text-violet-600" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground mb-4">Gestão de Tarefas da Equipe</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Distribua tarefas entre os membros da equipe, acompanhe o progresso e garanta que nada fique para trás no dia do evento.
                  </p>
                  <ul className="space-y-3">
                    {['Tarefas com responsáveis', 'Progresso visual em tempo real', 'Categorias e etiquetas', 'Visão geral da equipe'].map(item => (
                      <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Animated mockup */}
            <div className="flex-1 flex justify-center">
              {demoTab === 'vendas' && <MockupVendas />}
              {demoTab === 'doacoes' && <MockupDoacoes />}
              {demoTab === 'tarefas' && <MockupTarefas />}
            </div>
          </div>
        </div>
      </section>

      {/* ── Planos ── */}
      <section id="planos" className="pt-12 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Planos</span>
            <h2 className="text-4xl font-black text-foreground tracking-tight mt-3">
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
                {/* Badge mais popular */}
                {plan.highlight && (
                  <span className="text-[10px] font-semibold uppercase tracking-widest bg-white/20 text-white px-3 py-1 rounded-full inline-block mb-5">
                    Mais popular
                  </span>
                )}

                {/* Nome */}
                <div className="mb-3">
                  <span className={cn('text-xs font-semibold uppercase tracking-widest', plan.highlight ? 'text-white/50' : 'text-muted-foreground')}>
                    {plan.name}
                  </span>
                  <h3 className={cn('text-xl font-black mt-0.5', plan.highlight ? 'text-white' : 'text-foreground')}>
                    {plan.subtitle}
                  </h3>
                </div>

                {/* Preço */}
                <div className="flex items-baseline gap-1 mb-4">
                  {plan.id === 'start' ? (
                    <span className={cn('text-4xl font-black', plan.highlight ? 'text-emerald-300' : 'text-primary')}>
                      {plan.price}
                    </span>
                  ) : (
                    <>
                      <span className={cn('text-4xl font-black', plan.highlight ? 'text-emerald-300' : 'text-primary')}>
                        {plan.price?.replace('/mês', '')}
                      </span>
                      <span className={cn('text-sm font-medium', plan.highlight ? 'text-white/60' : 'text-muted-foreground')}>/mês</span>
                    </>
                  )}
                </div>

                {/* Limites */}
                {plan.limits && (
                  <p className={cn('text-[11px] font-medium rounded-lg px-3 py-1.5 mb-5 leading-relaxed', plan.highlight ? 'bg-white/10 text-white/70' : 'bg-gray-50 border border-border text-muted-foreground')}>
                    {plan.limits}
                  </p>
                )}

                {/* Descrição */}
                <p className={cn('text-sm mb-6', plan.highlight ? 'text-white/70' : 'text-muted-foreground')}>
                  {plan.description}
                </p>

                {/* Módulos */}
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

      {/* ── Tabela comparativa de planos ── */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Comparativo</span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mt-2">
              O que cada plano inclui?
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Veja lado a lado as funcionalidades disponíveis em cada plano.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-5 text-foreground font-black text-base w-1/2">Funcionalidade</th>
                  {[
                    { name: 'Start', price: 'Grátis', highlight: false },
                    { name: 'Essencial', price: 'R$ 39,90/mês', highlight: true },
                    { name: 'Pro', price: 'R$ 99,00/mês', highlight: false },
                  ].map(plan => (
                    <th key={plan.name} className={`text-center px-4 py-5 w-[16%] ${plan.highlight ? 'bg-primary/5' : ''}`}>
                      <p className={`font-black text-base ${plan.highlight ? 'text-primary' : 'text-foreground'}`}>{plan.name}</p>
                      <p className="text-xs text-muted-foreground font-normal mt-0.5">{plan.price}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    category: 'Eventos & Limites',
                    rows: [
                      { label: 'Eventos ativos', start: '1', essencial: '3', pro: 'Ilimitado' },
                      { label: 'Vagas por evento', start: '200', essencial: '500', pro: 'Ilimitado' },
                      { label: 'Tipos de inscrição', start: '1', essencial: '3', pro: 'Ilimitado' },
                      { label: 'Páginas de inscrição', start: '1', essencial: '3', pro: 'Ilimitado' },
                    ],
                  },
                  {
                    category: 'Inscrições',
                    rows: [
                      { label: 'Inscrições gratuitas', start: true, essencial: true, pro: true },
                      { label: 'Formulários personalizados', start: true, essencial: true, pro: true },
                      { label: 'Gestão de participantes', start: true, essencial: true, pro: true },
                      { label: 'Ingressos com valores', start: false, essencial: true, pro: true },
                    ],
                  },
                  {
                    category: 'Financeiro',
                    rows: [
                      { label: 'Registro de pagamentos', start: false, essencial: true, pro: true },
                      { label: 'Registro de doações', start: false, essencial: true, pro: true },
                      { label: 'Configuração de taxas e margens', start: false, essencial: true, pro: true },
                      { label: 'Relatórios financeiros', start: false, essencial: true, pro: true },
                    ],
                  },
                  {
                    category: 'Gestão Avançada',
                    rows: [
                      { label: 'Gestão de recursos e fornecedores', start: false, essencial: false, pro: true },
                      { label: 'Tarefas com equipe integrada', start: false, essencial: false, pro: true },
                      { label: 'Distribuição em grupos e quartos', start: false, essencial: false, pro: true },
                      { label: 'Relatórios completos', start: false, essencial: false, pro: true },
                    ],
                  },
                ].map((section, si) => (
                  <React.Fragment key={`section-${si}`}>
                    <tr className="border-t border-border bg-muted/40">
                      <td colSpan={4} className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {section.category}
                      </td>
                    </tr>
                    {section.rows.map((row, ri) => (
                      <tr key={`${si}-${ri}`} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 text-foreground font-medium">{row.label}</td>
                        {(['start', 'essencial', 'pro'] as const).map((plan, pi) => {
                          const val = row[plan];
                          const isHighlight = plan === 'essencial';
                          return (
                            <td key={plan} className={`text-center px-4 py-4 ${isHighlight ? 'bg-primary/5' : ''}`}>
                              {typeof val === 'boolean' ? (
                                val
                                  ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary mx-auto">✓</span>
                                  : <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground/40 mx-auto">—</span>
                              ) : (
                                <span className={`font-semibold text-xs ${val === 'Ilimitado' ? 'text-primary' : 'text-foreground'}`}>{val}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FAQ />

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
          <span className="text-2xl font-black text-white tracking-tight">tovia</span>
          <p className="text-white/30 text-xs">© 2026 Tovia Gestão de Eventos. Todos os direitos reservados.</p>
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
