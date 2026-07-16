import React, { useRef } from 'react';
import {
  Calendar, Users, Bell, Settings, Search, Plus, Trash2, Edit3, Eye,
  Download, Upload, LogOut, Home, BarChart3, CreditCard, Star, Heart,
  CheckCircle2, XCircle, AlertTriangle, Info, ArrowRight, ChevronRight,
  ChevronLeft, Mail, Phone, MapPin, Link as LinkIcon, Globe, Instagram,
  Youtube, MessageCircle, Zap, Shield, Lock, Unlock, Copy, Share2,
  Filter, SlidersHorizontal, RefreshCw, Save, X, Check, Menu,
  FileText, Image, Video, Music, Folder, Tag, Bookmark,
  TrendingUp, TrendingDown, DollarSign, Package, Layers,
  PartyPopper, Calculator, User, House,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToviaLogo } from '../../../components/ToviaLogo';

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mb-14 print:mb-10 print:break-inside-avoid">
      <div className="mb-6 pb-3 border-b-2 border-primary/20">
        <h2 className="text-xl font-black text-foreground tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2 text-center">{children}</p>;
}

/* ─────────────────────────────────────────
   Color Swatch
───────────────────────────────────────── */
function Swatch({ color, label, hex, textClass = 'text-white' }: { color: string; label: string; hex: string; textClass?: string }) {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-border shadow-sm">
      <div className={`h-20 flex items-end p-3 ${color}`}>
        <span className={`text-[10px] font-bold font-mono ${textClass}`}>{hex}</span>
      </div>
      <div className="bg-card px-3 py-2">
        <p className="text-xs font-semibold text-foreground">{label}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Icon Grid Item
───────────────────────────────────────── */
function IconItem({ icon: Icon, name }: { icon: React.ComponentType<any>; name: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-accent/30 transition-all">
      <Icon className="w-5 h-5 text-foreground" />
      <span className="text-[9px] text-muted-foreground text-center leading-tight font-mono">{name}</span>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function DesignSystemTab() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();

  return (
    <div ref={printRef} className="space-y-2">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-10 flex-wrap gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Design System</h1>
          <p className="text-sm text-muted-foreground mt-1">Identidade visual e biblioteca de componentes do Tovia</p>
        </div>
        <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl">
          <Download className="w-4 h-4" /> Exportar PDF
        </Button>
      </div>

      {/* Print-only header */}
      <div className="hidden print:flex items-center justify-between mb-10 border-b-2 border-primary pb-6">
        <div>
          <div className="font-black text-4xl text-primary tracking-tight">tovia</div>
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Gestão de Eventos</div>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-foreground">Design System</p>
          <p className="text-xs text-muted-foreground">Identidade Visual & Componentes</p>
        </div>
      </div>

      {/* ──────────────────────────────────────
          1. LOGO
      ────────────────────────────────────── */}
      <Section title="01. Logo & Marca" subtitle="Versões e aplicações do logotipo Tovia">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Default */}
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <ToviaLogo className="h-8 w-auto text-primary" />
              <div className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground border-l border-border pl-3 leading-tight">
                Gestão de<br />Eventos
              </div>
            </div>
            <Label>Versão Principal — Fundo Claro</Label>
          </div>
          {/* Dark bg */}
          <div className="bg-[#2D1470] border border-border rounded-2xl p-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <ToviaLogo className="h-8 w-auto text-white" />
              <div className="text-[10px] font-semibold tracking-widest uppercase text-white/50 border-l border-white/20 pl-3 leading-tight">
                Gestão de<br />Eventos
              </div>
            </div>
            <Label>Versão Fundo Escuro</Label>
          </div>
          {/* Wordmark only */}
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-4">
            <ToviaLogo className="h-10 w-auto text-primary" />
            <Label>Wordmark Isolado</Label>
          </div>
        </div>

        <div className="mt-4 bg-muted/50 rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Logo SVG vetorial:</strong> Arquivo <code className="bg-muted px-1 rounded text-[11px]">logo-tovia.svg</code> com <code className="bg-muted px-1 rounded text-[11px]">fill="currentColor"</code> — a cor é controlada via CSS (<code className="bg-muted px-1 rounded text-[11px]">text-primary</code>, <code className="bg-muted px-1 rounded text-[11px]">text-white</code>, etc.). Componente React: <code className="bg-muted px-1 rounded text-[11px]">{'<ToviaLogo />'}</code>. Nunca distorcer proporções ou usar em versão capitalizada.
          </p>
        </div>
      </Section>

      {/* ──────────────────────────────────────
          2. CORES
      ────────────────────────────────────── */}
      <Section title="02. Paleta de Cores" subtitle="Tokens de cor usados em todo o sistema">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Cores Principais</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Swatch color="bg-[#FF6B1A]" label="Primary" hex="#FF6B1A" />
              <Swatch color="bg-[#2D1470]" label="Sidebar / Dark" hex="#2D1470" />
              <Swatch color="bg-[#FFF4EE]" label="Accent / Light" hex="#FFF4EE" textClass="text-[#FF6B1A]" />
              <Swatch color="bg-[#EDE8DE]" label="Secondary / Muted" hex="#EDE8DE" textClass="text-muted-foreground" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Neutros & Superfícies</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Swatch color="bg-[#F5F0E8]" label="Background" hex="#F5F0E8" textClass="text-muted-foreground" />
              <Swatch color="bg-white" label="Card / White" hex="#ffffff" textClass="text-muted-foreground" />
              <Swatch color="bg-[#111827]" label="Foreground / Text" hex="#111827" />
              <Swatch color="bg-[#6b7280]" label="Muted Foreground" hex="#6b7280" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Semânticas (Estado)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Swatch color="bg-orange-500" label="Sucesso" hex="#10b981" />
              <Swatch color="bg-amber-400" label="Aviso" hex="#f59e0b" textClass="text-amber-900" />
              <Swatch color="bg-red-500" label="Erro / Destrutivo" hex="#ef4444" />
              <Swatch color="bg-violet-500" label="Info / Premium" hex="#8b5cf6" />
            </div>
          </div>
        </div>
      </Section>

      {/* ──────────────────────────────────────
          3. TIPOGRAFIA
      ────────────────────────────────────── */}
      <Section title="03. Tipografia" subtitle="Família tipográfica Inter — usada em todo o sistema">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6">
          {/* Font family */}
          <div className="pb-5 border-b border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Família</p>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-3xl font-normal text-foreground">Inter</p>
                <p className="text-xs text-muted-foreground mt-1">Principal — interface</p>
              </div>
              <div>
                <p className="text-3xl font-normal text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>Poppins</p>
                <p className="text-xs text-muted-foreground mt-1">Fallback — títulos</p>
              </div>
            </div>
          </div>

          {/* Hierarchy */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">Hierarquia</p>
            <div className="space-y-5">
              {[
                { label: 'Display / Hero', className: 'text-4xl font-black tracking-tight', sample: 'Organize seus eventos', spec: '36px · Black 900 · tracking-tight' },
                { label: 'H1 — Título de Página', className: 'text-3xl font-black tracking-tight', sample: 'Gestão de Eventos', spec: '30px · Black 900' },
                { label: 'H2 — Título de Seção', className: 'text-xl font-black', sample: 'Agenda de Eventos', spec: '20px · Black 900' },
                { label: 'H3 — Subtítulo', className: 'text-base font-semibold', sample: 'Próximos Eventos', spec: '16px · Semibold 600' },
                { label: 'Body — Texto Principal', className: 'text-sm font-normal', sample: 'O Tovia ajuda você a gerenciar inscrições, pagamentos e equipes em um só lugar.', spec: '14px · Regular 400' },
                { label: 'Small — Suporte', className: 'text-xs font-medium', sample: 'Última atualização há 2 minutos', spec: '12px · Medium 500' },
                { label: 'Caption / Label', className: 'text-[10px] font-bold uppercase tracking-widest', sample: 'TOTAL DE EVENTOS', spec: '10px · Bold 700 · uppercase' },
              ].map(({ label, className, sample, spec }) => (
                <div key={label} className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                  <div className="shrink-0 w-48">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                    <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{spec}</p>
                  </div>
                  <p className={`${className} text-foreground`}>{sample}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ──────────────────────────────────────
          4. ESPAÇAMENTO & BORDAS
      ────────────────────────────────────── */}
      <Section title="04. Espaçamento & Bordas" subtitle="Sistema de espaçamento e arredondamento padrão">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Radius */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">Border Radius</p>
            <div className="flex flex-wrap gap-4 items-end">
              {[
                { label: 'sm', cls: 'rounded-sm', px: '2px' },
                { label: 'md', cls: 'rounded-md', px: '6px' },
                { label: 'lg / default', cls: 'rounded-lg', px: '12px' },
                { label: 'xl', cls: 'rounded-xl', px: '16px' },
                { label: '2xl', cls: 'rounded-2xl', px: '24px' },
                { label: 'full', cls: 'rounded-full', px: '9999px' },
              ].map(({ label, cls, px }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 bg-primary/20 border-2 border-primary/40 ${cls}`} />
                  <p className="text-[9px] font-bold text-muted-foreground text-center">{label}<br /><span className="font-mono text-[9px]">{px}</span></p>
                </div>
              ))}
            </div>
          </div>

          {/* Shadows */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">Sombras</p>
            <div className="flex flex-wrap gap-6 items-end">
              {[
                { label: 'none', cls: '' },
                { label: 'sm', cls: 'shadow-sm' },
                { label: 'md', cls: 'shadow-md' },
                { label: 'lg', cls: 'shadow-lg' },
              ].map(({ label, cls }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className={`w-14 h-14 bg-card border border-border rounded-xl ${cls}`} />
                  <p className="text-[9px] font-bold text-muted-foreground font-mono">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ──────────────────────────────────────
          5. BOTÕES
      ────────────────────────────────────── */}
      <Section title="05. Botões" subtitle="Variantes, tamanhos e estados dos botões">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-8">
          {/* Variants */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Variantes</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col items-center gap-2">
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl">Primary</Button>
                <Label>Primary</Label>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button variant="secondary" className="rounded-xl">Secondary</Button>
                <Label>Secondary</Label>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button variant="outline" className="rounded-xl">Outline</Button>
                <Label>Outline</Label>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button variant="ghost" className="rounded-xl">Ghost</Button>
                <Label>Ghost</Label>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button variant="destructive" className="rounded-xl">Destrutivo</Button>
                <Label>Destructive</Label>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2">
                  <Plus className="w-4 h-4" /> Com Ícone
                </Button>
                <Label>Com Ícone</Label>
              </div>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Tamanhos</p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col items-center gap-2">
                <Button size="lg" className="bg-primary text-white rounded-xl">Large</Button>
                <Label>lg</Label>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button className="bg-primary text-white rounded-xl">Default</Button>
                <Label>default</Label>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button size="sm" className="bg-primary text-white rounded-xl">Small</Button>
                <Label>sm</Label>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button size="icon" className="bg-primary text-white rounded-xl"><Plus className="w-4 h-4" /></Button>
                <Label>icon</Label>
              </div>
            </div>
          </div>

          {/* States */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Estados</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col items-center gap-2">
                <Button className="bg-primary text-white rounded-xl">Normal</Button>
                <Label>Normal</Label>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button disabled className="rounded-xl">Desabilitado</Button>
                <Label>Disabled</Label>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button className="bg-primary text-white rounded-xl opacity-70 cursor-wait">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Carregando
                </Button>
                <Label>Loading</Label>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ──────────────────────────────────────
          6. CARDS & SUPERFÍCIES
      ────────────────────────────────────── */}
      <Section title="06. Cards & Superfícies" subtitle="Padrões de card usados no sistema">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Stat card */}
          <div>
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">24</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total de eventos</p>
              </div>
            </div>
            <Label>Stat Card</Label>
          </div>

          {/* Event card */}
          <div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="h-2 w-full bg-primary" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">#EV001</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-primary">Ativo</span>
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-3">Conferência de Líderes 2025</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>10 Set 2025</span>
                </div>
              </div>
            </div>
            <Label>Event Card</Label>
          </div>

          {/* Info card */}
          <div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Dica importante</p>
                  <p className="text-xs text-muted-foreground mt-1">Complete seu perfil para liberar todos os recursos do plano.</p>
                </div>
              </div>
            </div>
            <Label>Info Card</Label>
          </div>
        </div>
      </Section>

      {/* ──────────────────────────────────────
          7. BADGES & TAGS
      ────────────────────────────────────── */}
      <Section title="07. Badges & Tags" subtitle="Indicadores de status e categorias">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Ativo', cls: 'bg-orange-50 text-primary border border-primary/20' },
              { label: 'Arquivado', cls: 'bg-muted text-muted-foreground border border-border' },
              { label: 'Pendente', cls: 'bg-amber-50 text-amber-600 border border-amber-200' },
              { label: 'Pago', cls: 'bg-emerald-100 text-emerald-700 border border-emerald-300' },
              { label: 'Cancelado', cls: 'bg-red-50 text-red-600 border border-red-200' },
              { label: 'Convidado', cls: 'bg-amber-50 text-amber-600 border border-amber-200' },
              { label: 'Koách', cls: 'bg-violet-50 text-violet-600 border border-violet-200' },
              { label: 'Pétach', cls: 'bg-blue-50 text-blue-600 border border-blue-200' },
              { label: 'Chinám', cls: 'bg-muted text-muted-foreground border border-border' },
              { label: 'Novo', cls: 'bg-primary text-white' },
            ].map(({ label, cls }) => (
              <span key={label} className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
            ))}
          </div>
        </div>
      </Section>

      {/* ──────────────────────────────────────
          8. INPUTS & FORMULÁRIOS
      ────────────────────────────────────── */}
      <Section title="08. Inputs & Formulários" subtitle="Campos de entrada e controles de formulário">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Input default */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Label do Campo</label>
              <input
                type="text"
                placeholder="Placeholder..."
                className="w-full h-10 px-3 text-sm bg-muted/60 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
              />
              <p className="text-[11px] text-muted-foreground">Texto de apoio / descrição do campo</p>
            </div>

            {/* Input with icon */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Com Ícone Interno</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-full h-10 pl-9 pr-3 text-sm bg-muted/60 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            {/* Input error */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Estado de Erro</label>
              <input
                type="text"
                defaultValue="valor inválido"
                className="w-full h-10 px-3 text-sm bg-red-50 border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300/50 text-foreground"
              />
              <p className="text-[11px] text-red-600 flex items-center gap-1"><XCircle className="w-3 h-3" /> Este campo é obrigatório</p>
            </div>

            {/* Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Select / Dropdown</label>
              <select className="w-full h-10 px-3 text-sm bg-muted/60 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground appearance-none">
                <option>Selecione uma opção</option>
                <option>Plano 1 - Chinám</option>
                <option>Plano 2 - Pétach</option>
                <option>Plano 3 - Koách</option>
              </select>
            </div>

            {/* Textarea */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">Textarea</label>
              <textarea
                placeholder="Digite sua mensagem..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm bg-muted/60 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/60 resize-none"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ──────────────────────────────────────
          9. FEEDBACK & ALERTAS
      ────────────────────────────────────── */}
      <Section title="09. Feedback & Alertas" subtitle="Mensagens de estado e notificação ao usuário">
        <div className="space-y-3">
          {[
            { icon: CheckCircle2, label: 'Sucesso', cls: 'bg-orange-50 border-primary/20 text-primary', iconCls: 'text-emerald-500', msg: 'Evento criado com sucesso! Você já pode gerenciar as inscrições.' },
            { icon: AlertTriangle, label: 'Aviso', cls: 'bg-amber-50 border-amber-200 text-amber-700', iconCls: 'text-amber-500', msg: 'Seu perfil está incompleto. Complete para liberar todos os recursos.' },
            { icon: XCircle, label: 'Erro', cls: 'bg-red-50 border-red-200 text-red-700', iconCls: 'text-red-500', msg: 'Erro ao salvar. Verifique sua conexão e tente novamente.' },
            { icon: Info, label: 'Info', cls: 'bg-blue-50 border-blue-200 text-blue-700', iconCls: 'text-blue-500', msg: 'Uma nova versão do Tovia está disponível com melhorias.' },
          ].map(({ icon: Icon, label, cls, iconCls, msg }) => (
            <div key={label} className={`flex items-start gap-3 p-4 rounded-xl border ${cls}`}>
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconCls}`} />
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs mt-0.5 opacity-80">{msg}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ──────────────────────────────────────
          10. ÍCONES
      ────────────────────────────────────── */}
      <Section title="10. Ícones" subtitle="Biblioteca Lucide React — ícones utilizados no Tovia">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {(
              [
                { icon: House, name: 'House' }, { icon: Calendar, name: 'Calendar' }, { icon: Users, name: 'Users' }, { icon: Bell, name: 'Bell' },
                { icon: Settings, name: 'Settings' }, { icon: Search, name: 'Search' }, { icon: Plus, name: 'Plus' }, { icon: Trash2, name: 'Trash2' },
                { icon: Edit3, name: 'Edit3' }, { icon: Eye, name: 'Eye' }, { icon: Download, name: 'Download' }, { icon: Upload, name: 'Upload' },
                { icon: LogOut, name: 'LogOut' }, { icon: BarChart3, name: 'BarChart3' }, { icon: CreditCard, name: 'CreditCard' },
                { icon: Star, name: 'Star' }, { icon: Heart, name: 'Heart' }, { icon: CheckCircle2, name: 'CheckCircle2' },
                { icon: XCircle, name: 'XCircle' }, { icon: AlertTriangle, name: 'AlertTriangle' }, { icon: Info, name: 'Info' },
                { icon: ArrowRight, name: 'ArrowRight' }, { icon: ChevronRight, name: 'ChevronRight' }, { icon: ChevronLeft, name: 'ChevronLeft' },
                { icon: Mail, name: 'Mail' }, { icon: Phone, name: 'Phone' }, { icon: MapPin, name: 'MapPin' }, { icon: LinkIcon, name: 'Link' },
                { icon: Globe, name: 'Globe' }, { icon: Instagram, name: 'Instagram' }, { icon: Youtube, name: 'Youtube' },
                { icon: MessageCircle, name: 'MessageCircle' }, { icon: Zap, name: 'Zap' }, { icon: Shield, name: 'Shield' },
                { icon: Lock, name: 'Lock' }, { icon: Copy, name: 'Copy' }, { icon: Share2, name: 'Share2' }, { icon: Filter, name: 'Filter' },
                { icon: SlidersHorizontal, name: 'Sliders' }, { icon: RefreshCw, name: 'RefreshCw' }, { icon: Save, name: 'Save' },
                { icon: X, name: 'X' }, { icon: Check, name: 'Check' }, { icon: Menu, name: 'Menu' }, { icon: FileText, name: 'FileText' },
                { icon: Image, name: 'Image' }, { icon: Folder, name: 'Folder' }, { icon: Tag, name: 'Tag' }, { icon: Bookmark, name: 'Bookmark' },
                { icon: TrendingUp, name: 'TrendingUp' }, { icon: TrendingDown, name: 'TrendingDown' }, { icon: DollarSign, name: 'DollarSign' },
                { icon: Package, name: 'Package' }, { icon: Layers, name: 'Layers' }, { icon: PartyPopper, name: 'PartyPopper' },
                { icon: Calculator, name: 'Calculator' }, { icon: User, name: 'User' },
              ] as Array<{ icon: React.ComponentType<any>; name: string }>
            ).map(({ icon, name }) => (
              <React.Fragment key={name}>
                <IconItem icon={icon} name={name} />
              </React.Fragment>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-4">Fonte: <strong>lucide-react</strong> · Tamanho padrão: <code className="bg-muted px-1 rounded">w-4 h-4</code> (16px) em ações, <code className="bg-muted px-1 rounded">w-5 h-5</code> (20px) em destaques, <code className="bg-muted px-1 rounded">w-3.5 h-3.5</code> (14px) em textos</p>
        </div>
      </Section>

      {/* ──────────────────────────────────────
          11. SIDEBAR
      ────────────────────────────────────── */}
      <Section title="11. Navegação — Sidebar" subtitle="Padrão de navegação lateral escura">
        <div className="flex gap-4">
          <div className="bg-[#2D1470] rounded-2xl p-4 w-56 space-y-0.5 shrink-0">
            <div className="px-3 pb-4 mb-2 border-b border-white/10">
              <div className="font-black text-3xl text-white tracking-tight">tovia</div>
            </div>
            {[
              [House,     'Início',        true],
              [User,      'Meu Perfil',    false],
              [Calendar,  'Agenda',        false],
              [BarChart3, 'Relatórios',    false],
              [Settings,  'Configurações', false],
            ].map(([Icon, label, active]) => (
              <div
                key={label as string}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-white/12 text-white'
                    : 'text-white/55 hover:bg-white/7 hover:text-white'
                }`}
              >
                {React.createElement(Icon as React.ComponentType<any>, { className: 'w-4 h-4 shrink-0' })}
                <span>{label as string}</span>
              </div>
            ))}
            <div className="pt-4 mt-2 border-t border-white/10">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-primary/90 text-white">
                <Plus className="w-4 h-4" />
                <span>Criar Evento</span>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-card border border-border rounded-2xl p-6 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Tokens da Sidebar</p>
            <div className="space-y-2 text-sm font-mono">
              {[
                ['--sidebar', '#2D1470', 'Fundo'],
                ['--sidebar-foreground', '#ffffff', 'Texto'],
                ['--sidebar-muted', 'rgba(255,255,255,0.55)', 'Item inativo'],
                ['--sidebar-active-bg', 'rgba(255,255,255,0.12)', 'Item ativo'],
                ['--sidebar-hover-bg', 'rgba(255,255,255,0.07)', 'Hover'],
                ['--sidebar-border', 'rgba(255,255,255,0.06)', 'Divisor'],
              ].map(([token, value, desc]) => (
                <div key={token} className="flex items-center gap-3">
                  <code className="text-[11px] text-primary bg-primary/5 px-2 py-0.5 rounded flex-1">{token}</code>
                  <span className="text-[11px] text-muted-foreground w-52">{value}</span>
                  <span className="text-[11px] text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ──────────────────────────────────────
          12. PLANOS
      ────────────────────────────────────── */}
      <Section title="12. Planos & Pricing" subtitle="Identidade visual dos planos Tovia">
        {/* Plan cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Plano 1 - Chinám */}
          <div className="rounded-2xl border-2 border-border bg-muted/40 p-5 flex flex-col gap-2">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-border bg-muted text-muted-foreground self-start">Plano 1 - Chinám</span>
            <p className="text-2xl font-black text-foreground mt-1">Gratuito</p>
            <p className="text-xs text-muted-foreground">Gratuito e permanente. Comece a organizar seu primeiro evento sem custo.</p>
            <p className="text-[11px] text-muted-foreground/70 mt-auto pt-2 border-t border-border">1 evento · até 100 vagas · 1 ingresso</p>
          </div>

          {/* Plano 2 - Pétach */}
          <div className="rounded-2xl border-2 border-border bg-muted/40 p-5 flex flex-col gap-2">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-border bg-muted text-muted-foreground self-start">Plano 2 - Pétach</span>
            <p className="text-2xl font-black text-foreground mt-1">R$49<span className="text-sm font-semibold text-muted-foreground">/mês</span></p>
            <p className="text-xs text-muted-foreground">Inscrições + controle financeiro manual. A porta de entrada para eventos com cobrança.</p>
            <p className="text-[11px] text-muted-foreground/70 mt-auto pt-2 border-t border-border">3 eventos · até 200 vagas · 3 ingressos</p>
          </div>

          {/* Plano 3 - Koách */}
          <div className="rounded-2xl border-2 border-primary bg-primary p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 bg-white/15 text-white self-start">Plano 3 - Koách</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white text-primary">Mais escolhido</span>
            </div>
            <p className="text-2xl font-black text-white mt-1">R$129<span className="text-sm font-semibold text-white/70">/mês</span></p>
            <p className="text-xs text-white/80">Gestão completa: recursos, grupos, tarefas e equipe.</p>
            <p className="text-[11px] text-white/60 mt-auto pt-2 border-t border-white/20">5 eventos · até 500 vagas · 5 membros</p>
          </div>

          {/* Plano 4 - Chalém */}
          <div className="rounded-2xl border-2 border-transparent p-5 flex flex-col gap-2" style={{ background: '#2D1470' }}>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 bg-white/10 text-white/80 self-start">Plano 4 - Chalém</span>
            <p className="text-2xl font-black text-white mt-1">R$299<span className="text-sm font-semibold text-white/70">/mês</span></p>
            <p className="text-xs text-white/60">Pagamentos automáticos via PIX, boleto e cartão. Inscritos ilimitados.</p>
            <p className="text-[11px] text-white/50 mt-auto pt-2 border-t border-white/10">10 eventos · inscritos ilimitados · 10 membros</p>
          </div>
        </div>

        {/* Annual billing note */}
        <p className="text-xs text-muted-foreground mt-3 text-center">
          <span className="font-semibold text-foreground">Cobrança anual (2 meses grátis):</span>{' '}
          Pétach R$40,83/mês · Koách R$107,50/mês · Chalém R$249,17/mês
        </p>
      </Section>

      {/* ──────────────────────────────────────
          13. TOVIA MOBILE
      ────────────────────────────────────── */}
      <Section title="13. Tovia Mobile" subtitle="Identidade, paleta e padrões do app React Native">

        {/* Logo Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Light */}
          <div className="bg-white border border-border rounded-2xl p-8 flex flex-col items-center gap-3">
            <ToviaLogo variant="mobile" className="h-8 w-auto text-[#1d1d1b]" />
            <Label>Logo — Fundo Claro</Label>
          </div>
          {/* Dark */}
          <div className="bg-[#1E0B4B] border border-border rounded-2xl p-8 flex flex-col items-center gap-3">
            <ToviaLogo variant="mobile" className="h-8 w-auto text-white" />
            <Label>Logo — Fundo Escuro</Label>
          </div>
          {/* Sidebar dark */}
          <div className="bg-[#2D1470] border border-border rounded-2xl p-8 flex flex-col items-center gap-3">
            <ToviaLogo variant="mobile" className="h-8 w-auto text-white" />
            <Label>Logo — Header do App</Label>
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 border border-border mb-6">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Lockup "tovia | mobile":</strong> Wordmark original + separador + sufixo "mobile" na mesma linha. Implementado como SVG vetorial via <code className="bg-muted px-1 rounded text-[11px]">{'<ToviaLogo variant="mobile" />'}</code>. A cor é controlada por <code className="bg-muted px-1 rounded text-[11px]">currentColor</code> — use <code className="bg-muted px-1 rounded text-[11px]">text-primary</code> no header do app (laranja), <code className="bg-muted px-1 rounded text-[11px]">text-white</code> em fundos escuros.
          </p>
        </div>

        {/* Paleta Mobile */}
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Paleta de Cores — Mobile</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Swatch color="bg-[#FF6B1A]" label="Primary" hex="#FF6B1A" />
          <Swatch color="bg-[#9B5FFF]" label="Accent / Violet" hex="#9B5FFF" />
          <Swatch color="bg-[#2D1470]" label="Header / Sidebar" hex="#2D1470" />
          <Swatch color="bg-[#1E0B4B]" label="Background Dark" hex="#1E0B4B" />
        </div>
        <div className="bg-muted/50 rounded-xl p-4 border border-border mb-6">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Paleta unificada web + mobile:</strong> Primary <code className="bg-muted px-1 rounded text-[11px]">#FF6B1A</code>, Sidebar <code className="bg-muted px-1 rounded text-[11px]">#2D1470</code> e Accent <code className="bg-muted px-1 rounded text-[11px]">#9B5FFF</code> são idênticos entre plataformas. Não existe primary verde — o verde é reservado exclusivamente para status de sucesso/pagamento.
          </p>
        </div>

        {/* Bottom Tab Bar */}
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Bottom Tab Bar</p>
        <div className="flex gap-4 mb-6">
          {/* Simulação do tab bar */}
          <div className="flex-1 bg-[#1E0B4B] rounded-2xl p-4 overflow-hidden">
            <div className="flex items-end justify-around border-t border-white/10 pt-3">
              {[
                { Icon: House,        label: 'Início',     active: true  },
                { Icon: DollarSign,   label: 'Financeiro', active: false },
                { Icon: CheckCircle2, label: 'Check-in',   active: false },
                { Icon: Layers,       label: 'Tarefas',    active: false },
                { Icon: MessageCircle,label: 'Suporte',    active: false },
              ].map(({ Icon, label, active }) => (
                <div key={label} className="flex flex-col items-center gap-1 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-[#FF6B1A]/15' : ''}`}>
                    <Icon className={`w-5 h-5 ${active ? 'text-[#FF6B1A]' : 'text-white/40'}`} />
                  </div>
                  <span className={`text-[9px] font-semibold text-center whitespace-nowrap ${active ? 'text-[#FF6B1A]' : 'text-white/40'}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Tokens */}
          <div className="flex-1 bg-card border border-border rounded-2xl p-5 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Abas — ícones (Lucide RN)</p>
            <div className="space-y-1.5 text-[11px] font-mono">
              {[
                ['Início',     'House'],
                ['Financeiro', 'DollarSign'],
                ['Check-in',  'CheckSquare (FAB)'],
                ['Tarefas',    'List'],
                ['Suporte',    'HelpCircle'],
              ].map(([tab, icon]) => (
                <div key={tab} className="flex items-center gap-2">
                  <span className="text-primary bg-primary/5 px-2 py-0.5 rounded w-24 text-center">{tab}</span>
                  <span className="text-muted-foreground">{icon}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Bar / Header */}
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Top Bar — Header</p>
        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-[#2D1470] rounded-2xl p-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-baseline gap-0">
                <span className="font-black text-xl text-white">tovia</span>
                <span className="font-black text-xl text-[#FF6B1A]">mobile</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-white/70" />
                </div>
                <div className="w-8 h-8 rounded-full bg-[#FF6B1A] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">OR</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-card border border-border rounded-2xl p-5 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Elementos</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li><span className="text-foreground font-semibold">Esquerda:</span> Logo toviamobile (fundo sidebar)</li>
              <li><span className="text-foreground font-semibold">Direita:</span> Ícone de notificação + avatar circular com iniciais</li>
              <li><span className="text-foreground font-semibold">Tap no avatar:</span> Abre bottom sheet com perfil e plano</li>
            </ul>
          </div>
        </div>

        {/* Shared tokens entre web e mobile */}
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Tokens Compartilhados — Web & Mobile</p>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] font-mono">
            {[
              ['Primary',         '#FF6B1A', 'colors.primary'],
              ['Accent / Violet', '#9B5FFF', 'colors.accent'],
              ['Sidebar',         '#2D1470', 'colors.sidebar / sidebar web'],
              ['Danger',          '#ef4444', 'colors.danger / destructive'],
              ['Sucesso',         '#10b981', 'emerald-500 / colors.success'],
              ['Aviso',           '#f59e0b', 'amber-400 / colors.warning'],
            ].map(([label, hex, token]) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md shrink-0 border border-border" style={{ background: hex }} />
                <span className="text-foreground w-24">{label}</span>
                <span className="text-muted-foreground">{token}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Footer */}
      <div className="border-t border-border pt-8 text-center print:pt-6">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Tovia Design System</strong> · versão 1.0 · {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">Uso interno — Gestão de Eventos para igrejas, conferências e ministérios</p>
      </div>
    </div>
  );
}
