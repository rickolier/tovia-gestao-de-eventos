import React from 'react';
import {
  Calendar, Users, Bell, Settings, Search, Plus, Trash2, Edit3, Eye,
  Download, Upload, LogOut, BarChart3, CreditCard, Star, Heart,
  CheckCircle2, XCircle, AlertTriangle, Info, ArrowRight, ChevronRight,
  ChevronLeft, Mail, Phone, MapPin, Link as LinkIcon, Globe, Instagram,
  Youtube, MessageCircle, Zap, Shield, Lock, Copy, Share2,
  Filter, SlidersHorizontal, RefreshCw, Save, X, Check, Menu,
  FileText, Image, Folder, Tag, Bookmark,
  TrendingUp, TrendingDown, DollarSign, Package, Layers,
  PartyPopper, Calculator, User, House,
} from 'lucide-react';
import { Section, Code } from '../shared';

const ICONS: Array<{ icon: React.ComponentType<{ className?: string }>; name: string }> = [
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
];

function IconItem({ icon: Icon, name }: { icon: React.ComponentType<{ className?: string }>; name: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-accent/10 transition-all">
      <Icon className="w-5 h-5 text-foreground" />
      <span className="text-[9px] text-muted-foreground text-center leading-tight font-mono">{name}</span>
    </div>
  );
}

export function IconesSection() {
  return (
    <Section title="12. Ícones" subtitle="Biblioteca Lucide React — ícones utilizados no Tovia">
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {ICONS.map(({ icon, name }) => (
            <IconItem key={name} icon={icon} name={name} />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-4">
          Fonte: <strong>lucide-react</strong> · Tamanho padrão: <Code>w-4 h-4</Code> (16px) em ações, <Code>w-5 h-5</Code> (20px) em destaques, <Code>w-3.5 h-3.5</Code> (14px) em textos
        </p>
      </div>
    </Section>
  );
}
