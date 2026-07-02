import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TicketIcon, DollarSign, Wallet, CheckCircle, ArrowRight, Menu, X, Users, Calendar, Globe, BarChart3, ChevronDown, Plus, Heart, CheckSquare, Clock, MapPin, ExternalLink, Check, Zap, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Para quem é', href: '#para-quem' },
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Planos', href: '#planos' },
];

const NAV_ROUTE_LINKS: { label: string; to: string }[] = [];

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
    subtitle: 'Inscrições gratuitas',
    price: 'Grátis',
    limits: '1 evento · até 200 vagas · 1 tipo de ingresso',
    description: 'Para dar os primeiros passos — crie seu evento e gerencie participantes sem custo.',
    modules: ['Ingressos gratuitos', 'Páginas de Inscrição Personalizadas', 'Gestão de participantes', 'Relatórios básicos'],
    highlight: false,
  },
  {
    id: 'essencial',
    name: 'Essencial',
    subtitle: 'Inscrições + Financeiro',
    price: 'R$ 69/mês',
    limits: '3 eventos · até 500 vagas cada · 3 tipos de ingresso',
    description: 'Para organizar o financeiro do evento — registre pagamentos e doações com clareza.',
    modules: ['Tudo do Start', 'Ingressos com valores reais', 'Registro manual de pagamentos e doações', 'Controle financeiro e saldo livre'],
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'Pagamentos Automáticos',
    price: 'R$ 129/mês',
    limits: '10 eventos · até 1.000 vagas cada · 10 tipos de ingresso',
    description: 'Checkout online com PIX, boleto e cartão direto para sua conta. Gestão completa de equipe e recursos.',
    modules: ['Tudo do Essencial', 'Pagamentos automáticos (BYOG)', 'PIX, Boleto e Cartão de crédito', 'Grupos, quartos e mesas', 'Tarefas e equipe integrada'],
    highlight: true,
  },
  {
    id: 'personalizado',
    name: 'Personalizado',
    subtitle: 'Limites maiores',
    price: 'Sob consulta',
    limits: 'Eventos ilimitados · Inscrições ilimitadas · + 0,8% sobre inscritos pagos',
    description: 'Para organizações com múltiplos eventos de grande porte — cresça sem preocupação com limites.',
    modules: ['Tudo do Pro', 'Eventos e inscrições ilimitados', '0,8% apenas sobre inscrições pagas', 'Suporte prioritário e onboarding dedicado'],
    highlight: false,
  },
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

// ── Animated "Como funciona" bento cards — visual Tovia ─────────────────────

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ToviaMockupHeader({ sub }: { sub: string }) {
  return (
    <div className="bg-primary px-3 py-2 flex items-center gap-2 shrink-0">
      <span className="font-logo font-bold text-white text-sm leading-none tracking-tight">tovia</span>
      <span className="text-white/40 text-[10px]">/</span>
      <span className="text-white/70 text-[10px] font-semibold">{sub}</span>
    </div>
  );
}

function AnimConta() {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => setP(n => (n + 1) % 6), 850);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="w-44 bg-white rounded-t-2xl shadow-2xl overflow-hidden border border-white/20 flex flex-col">
      <ToviaMockupHeader sub="criar conta" />
      {p >= 5 ? (
        <div className="p-4 flex flex-col items-center gap-1.5 py-5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-[11px] font-black text-emerald-600">Conta criada!</p>
          <p className="text-[9px] text-muted-foreground">Bem-vindo ao Tovia</p>
        </div>
      ) : (
        <div className="p-3 space-y-2">
          <div className={cn('h-7 rounded-lg border px-2.5 flex items-center text-[11px] transition-all duration-500',
            p >= 1 ? 'border-primary/30 bg-primary/5 text-foreground' : 'border-gray-200 text-gray-300 bg-gray-50'
          )}>
            {p >= 1 ? 'João Silva' : 'Seu nome'}
            {p === 1 && <span className="inline-block w-0.5 h-3 bg-primary ml-0.5" />}
          </div>
          <div className={cn('h-7 rounded-lg border px-2.5 flex items-center text-[11px] transition-all duration-500',
            p >= 3 ? 'border-primary/30 bg-primary/5 text-foreground' : 'border-gray-200 text-gray-300 bg-gray-50'
          )}>
            {p >= 3 ? 'joao@email.com' : 'E-mail'}
            {p === 3 && <span className="inline-block w-0.5 h-3 bg-primary ml-0.5" />}
          </div>
          <div className={cn('h-7 rounded-lg flex items-center justify-center text-[11px] font-black transition-all duration-300',
            p >= 4 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
          )}>
            Criar conta →
          </div>
        </div>
      )}
    </div>
  );
}

function AnimEvento() {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => setP(n => (n + 1) % 5), 950);
    return () => clearInterval(id);
  }, []);
  const vagas = [0, 50, 120, 180, 200][p] ?? 0;
  return (
    <div className="w-44 bg-white rounded-t-2xl shadow-2xl overflow-hidden border border-white/20 flex flex-col">
      <ToviaMockupHeader sub="novo evento" />
      <div className="p-3 space-y-2">
        <div className={cn('h-7 rounded-lg border px-2.5 flex items-center text-[11px] transition-all duration-500',
          p >= 1 ? 'border-primary/30 bg-primary/5 text-foreground font-semibold' : 'border-gray-200 text-gray-300 bg-gray-50'
        )}>
          {p >= 1 ? 'Acampamento Jovem' : 'Nome do evento'}
          {p === 1 && <span className="inline-block w-0.5 h-3 bg-primary ml-0.5" />}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wide">Vagas</span>
          <span className="text-sm font-black text-primary transition-all">{vagas} / 200</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${(vagas / 200) * 100}%` }} />
        </div>
        <div className={cn('flex gap-1.5 transition-all duration-500', p >= 4 ? 'opacity-100' : 'opacity-0')}>
          <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md">Gratuito ✓</span>
          <span className="text-[9px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md">R$ 50</span>
        </div>
        <div className={cn('h-7 rounded-lg flex items-center justify-center text-[11px] font-black transition-all duration-300',
          p >= 3 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
        )}>
          Criar evento →
        </div>
      </div>
    </div>
  );
}

function AnimCompartilhar() {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => setP(n => (n + 1) % 6), 900);
    return () => clearInterval(id);
  }, []);
  const avatarColors = ['bg-emerald-200', 'bg-violet-200', 'bg-blue-200'];
  const avatarInits  = ['JO', 'AM', 'CE'];
  const vis = p >= 3 ? Math.min(p - 2, 3) : 0;
  return (
    <div className="w-44 bg-white rounded-t-2xl shadow-2xl overflow-hidden border border-white/20 flex flex-col">
      <ToviaMockupHeader sub="compartilhar" />
      <div className="p-3 space-y-2">
        <div className="h-7 rounded-lg bg-gray-50 border border-gray-200 px-2.5 flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-[9px] font-mono text-muted-foreground truncate">tovia.app/e/acampamento</span>
        </div>
        <div className={cn('h-7 rounded-lg flex items-center justify-center text-[11px] font-black transition-all duration-300',
          p >= 2 ? 'bg-emerald-500 text-white' : 'bg-primary text-white'
        )}>
          {p >= 2 ? '✓ Copiado!' : 'Copiar link'}
        </div>
        <div className="h-8 flex items-center">
          {vis > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {avatarColors.slice(0, vis).map((cls, i) => (
                  <div key={i} className={cn('w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-gray-700', cls)}>
                    {avatarInits[i]}
                  </div>
                ))}
              </div>
              <span className="text-[9px] font-bold text-emerald-600">+{vis} inscritos!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnimDashboard() {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => setP(n => (n + 1) % 5), 800);
    return () => clearInterval(id);
  }, []);
  const counts  = [38, 72, 105, 127, 142];
  const amounts = [1200, 2640, 3800, 4020, 4320];
  const count  = counts[p] ?? 38;
  const amount = amounts[p] ?? 1200;
  return (
    <div className="w-52 bg-white rounded-t-2xl shadow-2xl overflow-hidden border border-white/20 flex">
      <div className="w-11 bg-[var(--sidebar)] flex flex-col items-center pt-2.5 gap-2.5 shrink-0">
        <span className="font-logo font-bold text-white text-[13px] leading-none">t</span>
        <div className="w-5 h-px bg-white/15 mt-1" />
        {[0, 1, 2].map(i => (
          <div key={i} className={cn('w-5 h-1 rounded-sm', i === 0 ? 'bg-white/60' : 'bg-white/20')} />
        ))}
      </div>
      <div className="flex-1 p-2.5 space-y-2">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Dashboard</p>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-gray-50 rounded-lg p-1.5">
            <p className="text-[8px] text-muted-foreground">Inscrições</p>
            <p className="text-lg font-black text-foreground leading-tight transition-all">{count}</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-1.5">
            <p className="text-[8px] text-muted-foreground">Arrecadado</p>
            <p className="text-[11px] font-black text-emerald-600 leading-tight">
              R${amount >= 1000 ? (amount / 1000).toFixed(1) + 'k' : amount}
            </p>
          </div>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.round((count / 200) * 100)}%` }} />
        </div>
        <div className={cn('flex items-center gap-1 bg-emerald-50 rounded-lg px-1.5 py-1 transition-all duration-500', p % 2 === 0 ? 'opacity-100' : 'opacity-30')}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-[8px] text-emerald-700 font-semibold">Nova inscrição!</span>
        </div>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: 'O Tovia é gratuito?',
    a: 'Sim! O plano Start é gratuito para sempre, com 1 evento ativo, até 200 vagas e 1 tipo de ingresso. Para funcionalidades financeiras e mais eventos, os planos Essencial (R$69/mês) e Pro (R$129/mês) são a escolha certa.',
  },
  {
    q: 'O Tovia realiza cobranças de ingressos?',
    a: 'No Essencial, não — você registra os pagamentos manualmente. No plano Pro e Personalizado, você conecta seu próprio gateway de pagamento (Asaas, Pagar.me ou Mercado Pago) e recebe os valores direto na sua conta. O Tovia nunca intermedia seu dinheiro.',
  },
  {
    q: 'Posso criar mais de um evento ao mesmo tempo?',
    a: 'Sim. Start: 1 evento. Essencial: até 3 simultâneos. Pro: até 10. Personalizado: ilimitado. Se precisar de mais, entre em contato.',
  },
  {
    q: 'Preciso saber programar para usar o Tovia?',
    a: 'Não. O Tovia foi feito para qualquer pessoa conseguir usar — crie eventos, gerencie inscrições e acompanhe o financeiro sem nenhum conhecimento técnico.',
  },
  {
    q: 'Posso cancelar meu plano a qualquer momento?',
    a: 'Sim. Não há fidelidade ou multa. Cancele ou mude de plano quando quiser, direto pelo painel.',
  },
  {
    q: 'O que é o plano Personalizado e o que significa os 0,8%?',
    a: 'O plano Personalizado (R$299/mês) é para organizações com múltiplos eventos de grande porte. Além da mensalidade, cobramos 0,8% apenas sobre inscrições que geraram pagamento — inscrições gratuitas não geram cobrança variável.',
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-20 px-6 bg-[#f0f7f3]">
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
  const [billing, setBilling] = useState<'mensal' | 'anual'>('mensal');

  return (
    <div className="min-h-screen bg-white font-sans text-foreground pt-16">

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border shadow-sm">
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
            {NAV_ROUTE_LINKS.map(link => (
              <Link key={link.label} to={link.to} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-foreground hover:text-primary transition-colors px-4 py-2">
              Entrar
            </Link>
            <Link to="/login?cadastro=true" className="bg-primary hover:bg-primary/90 text-white text-sm font-black px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-primary/20">
              Criar meu evento
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
            {NAV_ROUTE_LINKS.map(link => (
              <Link key={link.label} to={link.to} onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-foreground">
                {link.label}
              </Link>
            ))}
            <div className="pt-2 flex flex-col gap-3">
              <Link to="/login" className="text-center text-sm font-semibold border border-border rounded-xl py-2.5">Entrar</Link>
              <Link to="/login?cadastro=true" className="text-center bg-primary text-white text-sm font-black rounded-xl py-2.5">Criar meu evento</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--sidebar)] via-[#1e3d2a] to-[#1a7a45] pt-10 pb-16 px-6">
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5" />
        <div className="absolute top-20 -left-20 w-[300px] h-[300px] rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-1/4 w-[200px] h-[200px] rounded-full bg-primary/20" />

        <div className="max-w-6xl mx-auto relative flex flex-col md:flex-row items-center gap-12">
          {/* Texto */}
          <div className="flex-1 max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6 uppercase">
              Do zero ao check-in{' '}
              <span className="text-emerald-400">tudo em uma plataforma.</span>
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

      </section>

      {/* ── Wave + Box strip: Consultar inscrição ── */}
      <div className="-mt-16">
        <svg viewBox="0 0 1440 62" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
          <path d="M0 62L1440 62L1440 30C1200 60 960 0 720 0C480 0 240 60 0 30L0 62Z" fill="#f0fdf4" />
        </svg>
        <div className="bg-[#f0fdf4]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-sm text-foreground">
              <span className="font-bold">Já se inscreveu em um evento?</span>
              <span className="text-muted-foreground ml-1.5 hidden sm:inline">Consulte seus dados, status de pagamento e QR Code de check-in.</span>
            </p>
          </div>
          <Link
            to="/consultar"
            className="shrink-0 text-sm font-bold text-primary hover:underline flex items-center gap-1.5 whitespace-nowrap"
          >
            Consultar minha inscrição <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        </div>
      </div>

      {/* ── Sobre ── */}
      <section id="para-quem" className="max-w-6xl mx-auto px-6 pt-20 pb-10">
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
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">127 inscrições</p>
                <p className="text-xs text-muted-foreground">confirmadas</p>
              </div>
            </div>
          </div>

          {/* Text */}
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

      {/* ── Significado do nome ── */}
      <section className="bg-[#f0f7f3] w-full py-10 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">A solução</span>
        <h2 className="text-3xl font-black text-foreground tracking-tight mt-3 mb-6">
          Tovia — טוֹבִיָּה
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          O nome vem do hebraico antigo <strong className="text-foreground">Toviyah</strong>, formado por duas raízes:{' '}
          <strong className="text-foreground">Tov</strong> (טוֹב), que significa bondade, e{' '}
          <strong className="text-foreground">Yah</strong> (יָהּ), forma abreviada do nome de Deus.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Mas o que nos inspira vai além da tradução literal. Em hebraico, <em>tov</em> descreve algo que está cumprindo exatamente o propósito para o qual foi criado — uma ideia mais próxima de <strong className="text-foreground">"funcionando como deveria"</strong> do que simplesmente "bom".
        </p>
        <p className="text-muted-foreground leading-relaxed">
          É isso que o Tovia quer ser: uma plataforma que cumpre o seu propósito para que o seu evento cumpra o dele.
        </p>
      </div>
      </section>

      {/* ── Como funciona ── */}
      <section id="como-funciona" className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-black uppercase tracking-widest text-primary">Como funciona</span>
            <h2 className="text-4xl font-black text-foreground tracking-tight mt-3">
              Do cadastro ao evento,<br />em minutos
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {([
              {
                step: '01',
                title: 'Crie sua conta',
                desc: 'Cadastre-se gratuitamente em menos de 1 minuto, sem cartão de crédito necessário.',
                Anim: AnimConta,
              },
              {
                step: '02',
                title: 'Configure o evento',
                desc: 'Defina vagas, ingressos e formulários personalizados em poucos cliques.',
                Anim: AnimEvento,
              },
              {
                step: '03',
                title: 'Compartilhe o link',
                desc: 'Seus participantes se inscrevem diretamente pela página criada pelo Tovia.',
                Anim: AnimCompartilhar,
              },
              {
                step: '04',
                title: 'Acompanhe tudo',
                desc: 'Inscrições, financeiro e equipe em tempo real, centralizados em um só lugar.',
                Anim: AnimDashboard,
              },
            ] as { step: string; title: string; desc: string; Anim: React.FC }[]).map(({ step, title, desc, Anim }) => (
              <div
                key={step}
                className="relative rounded-3xl overflow-hidden min-h-[240px] p-7 pb-0 flex flex-col"
                style={{ background: 'linear-gradient(135deg, var(--sidebar) 0%, #1e4a2e 100%)' }}
              >
                {/* Decorative blob */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

                {/* Text */}
                <span className="inline-flex text-xs font-black text-emerald-300 bg-white/10 border border-white/10 px-3 py-1 rounded-full w-fit mb-4">
                  {step}º Passo
                </span>
                <h3 className="text-xl font-black text-white leading-tight mb-2 max-w-[58%]">{title}</h3>
                <p className="text-xs text-white/50 leading-relaxed max-w-[55%]">{desc}</p>

                {/* Animated mockup — bottom-right, flush */}
                <div className="absolute bottom-0 right-4 flex items-end">
                  <Anim />
                </div>
              </div>
            ))}
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
      <section id="funcionalidades" className="pt-8 pb-4 px-6 bg-[#e6f4ec]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Veja na prática</span>
            <h2 className="text-4xl font-black text-foreground tracking-tight mt-3">
              Funcionalidades que fazem<br />a diferença no dia a dia
            </h2>
            <p className="text-muted-foreground mt-3 text-sm max-w-lg mx-auto">
              Veja como o Tovia simplifica as partes mais trabalhosas de organizar um evento.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-3 mb-6 flex-wrap">
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

      {/* ── Prova social ── */}
      <section className="py-20 px-6 bg-[#f0f7f3]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Prova social</span>
            <h2 className="text-4xl font-black text-foreground tracking-tight mt-3">
              Quem organiza com o Tovia
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'João Silva',
                role: 'Pastor e organizador de eventos',
                church: 'Igreja Vida Nova · São Paulo',
                text: 'Organizamos nosso retiro com mais de 300 pessoas usando o Tovia. Nunca foi tão simples acompanhar as inscrições e o financeiro ao mesmo tempo.',
                avatar: 'JS',
              },
              {
                name: 'Ana Paula Mendes',
                role: 'Coordenadora de eventos',
                church: 'Ministério Nova Esperança · Curitiba',
                text: 'A página de inscrição foi criada em minutos. Compartilhamos o link com o grupo e as inscrições chegaram automaticamente, sem precisar de planilha.',
                avatar: 'AM',
              },
              {
                name: 'Carlos Eduardo',
                role: 'Líder de jovens',
                church: 'Igreja Ressurreição · Belo Horizonte',
                text: 'Sempre controlamos os inscritos em planilhas e era um caos. O Tovia mudou completamente como trabalhamos. Hoje tudo está organizado em um só lugar.',
                avatar: 'CE',
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-3xl p-7 border border-border flex flex-col gap-5 hover:shadow-md transition-all">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.role} · {t.church}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Gateway & BYOG ── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Transparência</span>
            <h2 className="text-3xl font-black text-foreground tracking-tight mt-3">
              Seu dinheiro vai direto para você
            </h2>
            <p className="text-muted-foreground mt-3 text-sm max-w-xl mx-auto">
              O Tovia não cobra comissão por ingresso e não intermedia pagamentos. Você conecta seu próprio gateway — o dinheiro das inscrições cai direto na sua conta.
            </p>
          </div>

          {/* BYOG visual */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { step: '1', title: 'Você cria o evento', desc: 'Configure inscrições, valores e formas de pagamento no Tovia.' },
              { step: '2', title: 'Participante paga', desc: 'O pagamento é processado direto pela sua conta no Asaas — sem intermediário.' },
              { step: '3', title: 'Dinheiro na sua conta', desc: 'O valor cai na sua conta conforme as regras do seu gateway. O Tovia nunca toca no seu dinheiro.' },
            ].map(item => (
              <div key={item.step} className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm shrink-0">{item.step}</div>
                <div>
                  <p className="font-bold text-foreground text-sm">{item.title}</p>
                  <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Partner + payment methods + fees */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Asaas partner */}
            <div className="rounded-3xl border border-border bg-card p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Gateway parceiro</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 font-black text-lg">A</span>
                </div>
                <div>
                  <p className="font-black text-foreground">Asaas</p>
                  <p className="text-xs text-muted-foreground">Plataforma de pagamentos</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                O Tovia se integra com o Asaas. Você cria sua conta no Asaas, conecta ao Tovia e começa a receber. Simples assim.
              </p>
            </div>

            {/* Payment methods + fees */}
            <div className="rounded-3xl border border-border bg-card p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Formas de pagamento disponíveis</p>
              <div className="space-y-3">
                {[
                  { method: 'PIX',                fee: '0,99% por transação',    color: 'bg-emerald-50 text-emerald-700' },
                  { method: 'Boleto Bancário',    fee: 'R$2,49 por boleto',       color: 'bg-orange-50 text-orange-700'  },
                  { method: 'Cartão de crédito',  fee: '2,99% por transação',    color: 'bg-blue-50 text-blue-700'      },
                  { method: 'Crédito recorrente', fee: '3,49% por cobrança',      color: 'bg-violet-50 text-violet-700'  },
                ].map(item => (
                  <div key={item.method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.color}`}>{item.method}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.fee}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
                Taxas cobradas pelo Asaas diretamente ao organizador. Valores podem variar conforme o plano contratado com o Asaas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Planos ── */}
      <section id="planos" className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Planos</span>
            <h2 className="text-4xl font-black text-foreground tracking-tight mt-3">
              Escolha o plano ideal<br />para o seu evento
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">14 dias testando o Pro completo, sem custo. Depois escolha o plano certo para você.</p>

            {/* Trial callout */}
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-2 rounded-full mt-5">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              Trial gratuito de 14 dias com todas as funcionalidades Pro
            </div>

            <div className="inline-flex items-center gap-1 bg-muted rounded-2xl p-1 mt-6 ml-0 block">
              <div className="inline-flex items-center gap-1 bg-muted rounded-2xl p-1">
                <button
                  onClick={() => setBilling('mensal')}
                  className={cn('px-5 py-2 rounded-xl text-sm font-bold transition-all',
                    billing === 'mensal' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}
                >Mensal</button>
                <button
                  onClick={() => setBilling('anual')}
                  className={cn('px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2',
                    billing === 'anual' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                  Anual
                  <span className="text-[10px] font-black bg-primary text-white px-2 py-0.5 rounded-full">2 meses grátis</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cards de planos */}
          <div className="grid md:grid-cols-3 gap-6 items-stretch">

            {/* ── START ── */}
            <div className="rounded-3xl border border-border bg-card p-8 flex flex-col gap-5">
              <div>
                <p className="text-4xl font-black text-foreground tracking-tight">Start</p>
                <p className="text-sm text-muted-foreground mt-1 font-normal">Para pequenos eventos, com grandes propósitos!</p>
                <div className="mt-3 h-px bg-border w-full" />
              </div>
              <div className="rounded-2xl bg-muted px-5 py-4">
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black text-foreground">
                    {billing === 'mensal' ? 'R$39' : 'R$32,50'}
                  </span>
                  <span className="text-muted-foreground text-sm mb-0.5">/mês</span>
                </div>
                {billing === 'anual' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="line-through">R$468</span>
                    {' → '}
                    <span className="font-bold text-foreground">R$390/ano</span>
                  </p>
                )}
              </div>
              <ul className="flex-1 space-y-2.5 text-sm">
                {[
                  { ok: true,  label: '1 evento ativo' },
                  { ok: true,  label: 'Até 100 inscrições por evento' },
                  { ok: true,  label: 'Inscrições e formulários' },
                  { ok: true,  label: 'Financeiro básico' },
                  { ok: true,  label: 'Relatórios básicos' },
                  { ok: false, label: 'Equipe e check-in' },
                  { ok: false, label: 'Doações, grupos e tarefas' },
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    {f.ok
                      ? <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-emerald-600" /></span>
                      : <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0"><X className="w-3 h-3 text-muted-foreground/40" /></span>
                    }
                    <span className={f.ok ? 'text-foreground' : 'text-muted-foreground/50 line-through'}>{f.label}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/login?cadastro=true"
                className="block text-center text-sm font-black uppercase tracking-widest py-3.5 rounded-2xl bg-muted hover:bg-muted/70 text-foreground transition-all"
              >
                Começar com o Start
              </Link>
            </div>

            {/* ── ESSENCIAL ── */}
            <div className="rounded-3xl border-2 border-primary/30 bg-card p-8 flex flex-col gap-5 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                  <Star className="w-3 h-3 fill-white" /> Mais escolhido
                </span>
              </div>
              <div>
                <p className="text-4xl font-black text-foreground tracking-tight">Essencial</p>
                <p className="text-sm text-muted-foreground mt-1 font-normal">Para eventos que crescem a cada edição!</p>
                <div className="mt-3 h-px bg-primary/20 w-full" />
              </div>
              <div className="rounded-2xl bg-primary/8 border border-primary/15 px-5 py-4">
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black text-primary">
                    {billing === 'mensal' ? 'R$99' : 'R$82,50'}
                  </span>
                  <span className="text-muted-foreground text-sm mb-0.5">/mês</span>
                </div>
                {billing === 'anual' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="line-through">R$1.188</span>
                    {' → '}
                    <span className="font-bold text-primary">R$990/ano</span>
                  </p>
                )}
              </div>
              <ul className="flex-1 space-y-2.5 text-sm">
                {[
                  { ok: true, label: '3 eventos ativos simultâneos' },
                  { ok: true, label: 'Até 500 inscrições por evento' },
                  { ok: true, label: 'Equipe (até 5 membros)' },
                  { ok: true, label: 'Check-in por QR Code' },
                  { ok: true, label: 'Doações' },
                  { ok: true, label: 'Grupos e quartos' },
                  { ok: true, label: 'Tarefas e exportar dados' },
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-emerald-600" /></span>
                    <span className="text-foreground">{f.label}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/login?cadastro=true"
                className="block text-center text-sm font-black uppercase tracking-widest py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white transition-all shadow-md shadow-primary/20"
              >
                Assinar Essencial
              </Link>
            </div>

            {/* ── PRO ── */}
            <div className="rounded-3xl bg-primary p-8 flex flex-col gap-5 shadow-2xl shadow-primary/30 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

              <div className="relative">
                <p className="text-4xl font-black text-white tracking-tight">Pro</p>
                <p className="text-sm text-white/70 mt-1 font-normal">Para eventos que transformam muitas vidas!</p>
                <div className="mt-3 h-px bg-white/20 w-full" />
              </div>

              <div className="relative rounded-2xl bg-white/15 border border-white/20 px-5 py-4">
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black text-white">
                    {billing === 'mensal' ? 'R$249' : 'R$207,50'}
                  </span>
                  <span className="text-white/70 text-sm mb-0.5">/mês</span>
                </div>
                {billing === 'anual' && (
                  <p className="text-xs text-white/60 mt-1">
                    <span className="line-through">R$2.988</span>
                    {' → '}
                    <span className="font-bold text-white">R$2.490/ano</span>
                  </p>
                )}
              </div>

              <ul className="relative flex-1 space-y-2.5 text-sm">
                {[
                  '10 eventos ativos simultâneos',
                  'Até 1.000 inscrições por evento',
                  'Equipe (até 10 membros)',
                  'Check-in por QR Code',
                  'Financeiro completo',
                  'Grupos, quartos, doações e tarefas',
                  'Relatórios completos + exportar',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                    <span className="text-white">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/login?cadastro=true"
                className="relative block text-center text-sm font-black uppercase tracking-widest py-3.5 rounded-2xl bg-white text-primary hover:bg-white/90 transition-all shadow-lg"
              >
                Assinar Pro agora
              </Link>
            </div>
          </div>

          {/* Box Plano Personalizado — proeminente */}
          <div className="mt-8 rounded-2xl bg-[var(--sidebar)] px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div>
              <p className="text-lg font-black text-white">🏢 Precisa de algo além do Pro?</p>
              <p className="text-sm text-white/70 mt-1.5 max-w-lg">
                Grandes conferências, múltiplas organizações, integrações específicas ou volume acima do padrão — se o Pro não for suficiente para o seu contexto, a gente conversa e monta algo sob medida para você.
              </p>
            </div>
            <a
              href="mailto:contato@tovia.app"
              className="shrink-0 bg-white hover:bg-white/90 text-primary text-sm font-black uppercase tracking-widest px-7 py-3.5 rounded-xl transition-all shadow-md whitespace-nowrap"
            >
              Fale com a gente →
            </a>
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
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="text-2xl font-black text-white tracking-tight">tovia</span>
            <a href="mailto:suporte@toviapp.com.br" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              suporte@toviapp.com.br
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
            <Link to="/privacidade" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              Privacidade
            </Link>
            <Link to="/termos-de-uso" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
