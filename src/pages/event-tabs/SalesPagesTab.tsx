import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus, Link2, Copy, Trash2, ExternalLink, Globe, GlobeLock,
  Edit2, GripVertical, X, Settings2, TicketIcon, FileText, Eye, ArrowLeft, FileDown, Loader2,
} from 'lucide-react';
import { listDocuments, createDocument, updateDocument, removeDocument, getDocument } from '../../lib/firebase-utils';
import { PaginaVenda, CampoFormulario, Ticket, Evento, UserProfile } from '../../types';
import SalesPageContent from '../../components/SalesPageContent';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// ─── Campos pré-definidos do formulário ─────────────────────────────────────
const CAMPOS_PADRAO: Omit<CampoFormulario, 'id'>[] = [
  { tipo: 'texto',    label: 'Nome completo',    obrigatorio: true,  placeholder: 'Seu nome' },
  { tipo: 'email',    label: 'E-mail',           obrigatorio: true,  placeholder: 'seu@email.com' },
  { tipo: 'telefone', label: 'Telefone/WhatsApp', obrigatorio: true, placeholder: '(11) 9 0000-0000' },
  { tipo: 'select',   label: 'Gênero',           obrigatorio: false, opcoes: ['Masculino', 'Feminino', 'Prefiro não informar'] },
  { tipo: 'data',     label: 'Data de nascimento', obrigatorio: false },
  { tipo: 'texto',    label: 'CPF',              obrigatorio: false, placeholder: '000.000.000-00' },
  { tipo: 'texto',    label: 'Célula / Grupo',   obrigatorio: false, placeholder: 'Ex: Célula Centro' },
  { tipo: 'texto',    label: 'Igreja / Comunidade', obrigatorio: false, placeholder: '' },
  { tipo: 'textarea', label: 'Observações',      obrigatorio: false, placeholder: 'Alguma informação adicional?' },
];

const TIPOS_CAMPO: { value: CampoFormulario['tipo']; label: string }[] = [
  { value: 'texto',    label: 'Texto simples' },
  { value: 'email',    label: 'E-mail' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'numero',   label: 'Número' },
  { value: 'data',     label: 'Data' },
  { value: 'select',   label: 'Seleção (dropdown)' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'textarea', label: 'Texto longo' },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);
}

const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

// ═════════════════════════════════════════════════════════════════════════════
export default function SalesPagesTab({ eventoId }: { eventoId: string }) {
  const [paginas, setPaginas] = useState<PaginaVenda[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [organizerProfile, setOrganizerProfile] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'tickets' | 'campos'>('tickets');
  const [previewPagina, setPreviewPagina] = useState<PaginaVenda | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [exportingId, setExportingId] = useState<string | null>(null);

  // ── Form state ──────────────────────────────────────────────────────────
  const emptyForm = (): Omit<PaginaVenda, 'id' | 'eventoId' | 'criado_em'> => ({
    nome: '',
    slug: '',
    ativa: true,
    descricao: '',
    ticketIds: [],
    campos_formulario: CAMPOS_PADRAO.slice(0, 3).map(c => ({ ...c, id: uuidv4() })),
  });
  const [form, setForm] = useState(emptyForm());

  // New custom field form
  const [novoCampo, setNovoCampo] = useState<Omit<CampoFormulario, 'id'>>({
    tipo: 'texto', label: '', obrigatorio: false, placeholder: '',
  });
  const [novaOpcao, setNovaOpcao] = useState('');

  // ── Data fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    listDocuments<PaginaVenda>(`eventos/${eventoId}/paginas_venda`).then(setPaginas).catch(() => {});
    listDocuments<Ticket>(`eventos/${eventoId}/tickets`).then(setTickets).catch(() => {});
    getDocument<Evento>('eventos', eventoId).then(e => {
      if (e) {
        setEvento({ ...e, id: eventoId });
        if (e.criado_por) {
          getDocument<UserProfile>('users', e.criado_por).then(p => { if (p) setOrganizerProfile(p); }).catch(() => {});
        }
      }
    }).catch(() => {});
  }, [eventoId]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setActiveSection('tickets');
    setIsDialogOpen(true);
  };

  const openEdit = (p: PaginaVenda) => {
    setEditingId(p.id);
    setForm({ nome: p.nome, slug: p.slug, ativa: p.ativa, descricao: p.descricao || '', ticketIds: p.ticketIds, campos_formulario: p.campos_formulario });
    setActiveSection('tickets');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome da página é obrigatório'); return; }
    if (!form.slug.trim()) { toast.error('Slug é obrigatório'); return; }
    if (form.ticketIds.length === 0) { toast.error('Selecione pelo menos um ingresso'); return; }

    const slug = slugify(form.slug);
    const conflict = paginas.find(p => p.slug === slug && p.id !== editingId);
    if (conflict) { toast.error('Já existe uma página com este slug. Escolha outro nome.'); return; }

    try {
      if (editingId) {
        const original = paginas.find(p => p.id === editingId)!;
        const updated: PaginaVenda = { ...original, ...form, slug };
        // Use setDoc (createDocument) instead of updateDoc to avoid issues with nested arrays
        await createDocument(`eventos/${eventoId}/paginas_venda`, editingId, updated as any);
        setPaginas(prev => prev.map(p => p.id === editingId ? updated : p));
        toast.success('Página atualizada!');
      } else {
        const id = uuidv4();
        const nova: PaginaVenda = { id, eventoId, ...form, slug, criado_em: new Date().toISOString() };
        await createDocument(`eventos/${eventoId}/paginas_venda`, id, nova as any);
        setPaginas(prev => [...prev, nova]);
        toast.success('Página de vendas criada!');
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error('Erro ao salvar página:', err);
      let msg = 'Erro ao salvar página';
      try { msg = JSON.parse(err.message)?.error || msg; } catch {}
      toast.error(msg);
    }
  };

  const toggleAtiva = async (p: PaginaVenda) => {
    try {
      await updateDocument(`eventos/${eventoId}/paginas_venda`, p.id, { ativa: !p.ativa });
      setPaginas(prev => prev.map(x => x.id === p.id ? { ...x, ativa: !x.ativa } : x));
    } catch { toast.error('Erro ao atualizar status'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await removeDocument(`eventos/${eventoId}/paginas_venda`, deleteId);
      setPaginas(prev => prev.filter(p => p.id !== deleteId));
      toast.success('Página excluída');
      setDeleteId(null);
    } catch { toast.error('Erro ao excluir'); }
  };

  const copyLink = (slug: string) => {
    const url = `${baseUrl}/e/${eventoId}/${slug}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Link copiado!'));
  };

  const exportarFicha = async (pagina: PaginaVenda) => {
    if (!evento) return;
    setExportingId(pagina.id);
    try {
      const [{ pdf }, { default: FichaInscricaoPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../../components/FichaInscricaoPDF'),
      ]);
      const ticketsDaPagina = tickets.filter(t => pagina.ticketIds.includes(t.id));
      const blob = await pdf(
        <FichaInscricaoPDF
          evento={evento}
          pagina={pagina}
          tickets={ticketsDaPagina}
          organizerProfile={organizerProfile}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ficha-inscricao-${pagina.slug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Ficha exportada com sucesso!');
    } catch {
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setExportingId(null);
    }
  };

  // ── Campo helpers ───────────────────────────────────────────────────────
  const addCampoPadrao = (campo: Omit<CampoFormulario, 'id'>) => {
    setForm(prev => ({ ...prev, campos_formulario: [...prev.campos_formulario, { ...campo, id: uuidv4() }] }));
  };

  const addCampoCustom = () => {
    if (!novoCampo.label.trim()) { toast.error('Informe o nome do campo'); return; }
    setForm(prev => ({ ...prev, campos_formulario: [...prev.campos_formulario, { ...novoCampo, id: uuidv4() }] }));
    setNovoCampo({ tipo: 'texto', label: '', obrigatorio: false, placeholder: '', opcoes: [] });
    setNovaOpcao('');
  };

  const removeCampo = (id: string) => {
    setForm(prev => ({ ...prev, campos_formulario: prev.campos_formulario.filter(c => c.id !== id) }));
  };

  const toggleCampoObrigatorio = (id: string) => {
    setForm(prev => ({
      ...prev,
      campos_formulario: prev.campos_formulario.map(c => c.id === id ? { ...c, obrigatorio: !c.obrigatorio } : c),
    }));
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 text-foreground">

      <div className="tab-page-header">
        <h2>Páginas</h2>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl font-bold h-10 px-5 shadow-sm transition-all active:scale-95 shrink-0">
          <Plus className="w-4 h-4" /> Nova Página
        </Button>
      </div>

      {/* ── List ── */}
      {paginas.length === 0 ? (
        <div className="py-20 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
          <Globe className="w-14 h-14 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">Nenhuma página criada ainda.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Crie páginas de venda e compartilhe o link com os participantes.</p>
          <Button onClick={openCreate} variant="outline" className="mt-5 rounded-xl gap-2 border-primary text-primary hover:bg-primary/5">
            <Plus className="w-4 h-4" /> Criar primeira página
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginas.map(p => {
            const url = `${baseUrl}/e/${eventoId}/${p.slug}`;
            const ticketsNomes = tickets.filter(t => p.ticketIds.includes(t.id)).map(t => t.nome);
            return (
              <Card key={p.id} className="border border-border rounded-2xl bg-card shadow-sm hover:shadow-md transition-all card-flat">
                <div className={`h-1.5 rounded-t-2xl ${p.ativa ? 'bg-primary' : 'bg-muted'}`} />
                <CardHeader className="pb-2 pt-4 px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold text-foreground truncate">{p.nome}</CardTitle>
                        <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 shrink-0 ${p.ativa ? 'border-green-500/30 text-green-600 bg-green-50' : 'border-muted text-muted-foreground'}`}>
                          {p.ativa ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate font-mono">/e/{eventoId.slice(0,8)}.../{p.slug}</p>
                    </div>
                    <Switch checked={p.ativa} onCheckedChange={() => toggleAtiva(p)} />
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-4 space-y-3">
                  {/* Ingressos */}
                  <div className="flex flex-wrap gap-1.5">
                    {ticketsNomes.length > 0
                      ? ticketsNomes.map(n => (
                          <span key={n} className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-md font-semibold">{n}</span>
                        ))
                      : <span className="text-[10px] text-muted-foreground/50 italic">Sem ingressos selecionados</span>
                    }
                  </div>
                  {/* Campos */}
                  <p className="text-xs text-muted-foreground">{p.campos_formulario.length} campo(s) no formulário</p>
                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t border-border/50">
                    <button onClick={() => copyLink(p.slug)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
                      <Copy className="w-3.5 h-3.5" /> Copiar link
                    </button>
                    <button
                      onClick={() => { setPreviewPagina(p); setPreviewKey(k => k + 1); }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" /> Visualizar
                    </button>
                    <button
                      onClick={() => exportarFicha(p)}
                      disabled={exportingId === p.id}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium disabled:opacity-50"
                    >
                      {exportingId === p.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <FileDown className="w-3.5 h-3.5" />
                      }
                      Ficha PDF
                    </button>
                    <div className="ml-auto flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(p)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteId(p.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          DIALOG — Criar / Editar página
      ════════════════════════════════════════════════ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[640px] w-[95vw] max-h-[92vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl p-0 bg-card">
          {/* Header */}
          <div className="px-8 pt-8 pb-4 border-b border-border/50">
            <DialogTitle className="text-xl font-black text-foreground">
              {editingId ? 'Editar Página de Venda' : 'Nova Página de Venda'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-1">
              Configure os ingressos, o formulário e o link da página.
            </DialogDescription>

            {/* Section tabs */}
            <div className="flex gap-1 mt-5 bg-muted/50 p-1 rounded-xl w-fit">
              {([
                { id: 'tickets', label: 'Ingressos & Info', icon: TicketIcon },
                { id: 'campos',  label: 'Formulário',    icon: FileText },
              ] as const).map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeSection === s.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <s.icon className="w-4 h-4" /> {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-8 py-6 space-y-5">

            {/* ── Section: Ingressos & Info ── */}
            {activeSection === 'tickets' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nome da página</Label>
                    <Input
                      placeholder="Ex: Inscrições Adultos"
                      value={form.nome}
                      onChange={e => setForm(prev => ({ ...prev, nome: e.target.value, slug: slugify(e.target.value) }))}
                      className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Link2 className="w-3 h-3" /> Slug (URL)
                    </Label>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 h-12 border border-border/0">
                      <span className="text-xs text-muted-foreground font-mono shrink-0">/e/.../</span>
                      <Input
                        value={form.slug}
                        onChange={e => setForm(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                        className="border-none bg-transparent shadow-none h-full p-0 font-mono text-sm font-semibold"
                        placeholder="nome-da-pagina"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Descrição (opcional)</Label>
                  <Textarea
                    placeholder="Uma breve descrição que aparecerá na página pública..."
                    value={form.descricao}
                    onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                    className="rounded-xl border-none bg-muted/50 resize-none"
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Ingressos disponíveis nesta página</Label>
                  {tickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 italic">Nenhum ingresso criado para este evento ainda.</p>
                  ) : (
                    <div className="space-y-2">
                      {tickets.map(t => (
                        <label key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-all border border-transparent hover:border-border/40">
                          <Checkbox
                            checked={form.ticketIds.includes(t.id)}
                            onCheckedChange={checked => setForm(prev => ({
                              ...prev,
                              ticketIds: checked ? [...prev.ticketIds, t.id] : prev.ticketIds.filter(id => id !== t.id),
                            }))}
                            className="rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground">{t.nome}</p>
                            <p className="text-xs text-muted-foreground">{t.tipo === 'gratuito' ? 'Gratuito' : `R$ ${t.valor.toFixed(2).replace('.', ',')}`}</p>
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">{t.tipo}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-foreground">Página ativa</p>
                    <p className="text-xs text-muted-foreground">Página visível e acessível pelo link público</p>
                  </div>
                  <Switch checked={form.ativa} onCheckedChange={v => setForm(prev => ({ ...prev, ativa: v }))} />
                </div>
              </>
            )}

            {/* ── Section: Formulário ── */}
            {activeSection === 'campos' && (
              <>
                {/* Active fields */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Campos do formulário</Label>
                  <div className="space-y-2">
                    {form.campos_formulario.map(campo => (
                      <div key={campo.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/40">
                        <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground leading-none">{campo.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{TIPOS_CAMPO.find(t => t.value === campo.tipo)?.label}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCampoObrigatorio(campo.id)}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-colors ${campo.obrigatorio ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                        >
                          {campo.obrigatorio ? 'Obrigatório' : 'Opcional'}
                        </button>
                        <button type="button" onClick={() => removeCampo(campo.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {form.campos_formulario.length === 0 && (
                      <p className="text-sm text-muted-foreground/50 italic text-center py-4">Nenhum campo adicionado.</p>
                    )}
                  </div>
                </div>

                {/* Add preset field */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Adicionar campo pré-definido</Label>
                  <div className="flex flex-wrap gap-2">
                    {CAMPOS_PADRAO.filter(c => !form.campos_formulario.some(f => f.label === c.label)).map(c => (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => addCampoPadrao(c)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card hover:border-primary hover:text-primary hover:bg-primary/5 transition-all font-medium"
                      >
                        + {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add custom field */}
                <div className="space-y-3 border border-border/50 rounded-2xl p-4 bg-muted/10">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Campo personalizado</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Nome do campo</Label>
                      <Input value={novoCampo.label} onChange={e => setNovoCampo(p => ({ ...p, label: e.target.value }))} placeholder="Ex: Nome da Igreja" className="rounded-xl border-none bg-muted/50 h-10 text-sm shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Tipo</Label>
                      <Select value={novoCampo.tipo} onValueChange={v => setNovoCampo(p => ({ ...p, tipo: v as any }))}>
                        <SelectTrigger className="rounded-xl border-none bg-muted/50 h-10 text-sm shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-xl">
                          {TIPOS_CAMPO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Placeholder (opcional)</Label>
                      <Input value={novoCampo.placeholder || ''} onChange={e => setNovoCampo(p => ({ ...p, placeholder: e.target.value }))} placeholder="Texto de exemplo" className="rounded-xl border-none bg-muted/50 h-10 text-sm shadow-sm" />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={novoCampo.obrigatorio} onCheckedChange={v => setNovoCampo(p => ({ ...p, obrigatorio: !!v }))} className="rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                        <span className="text-sm font-medium text-foreground">Obrigatório</span>
                      </label>
                    </div>
                  </div>
                  {novoCampo.tipo === 'select' && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Opções do dropdown</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {(novoCampo.opcoes || []).map((op, i) => (
                          <span key={i} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg font-medium">
                            {op}
                            <button type="button" onClick={() => setNovoCampo(p => ({ ...p, opcoes: (p.opcoes || []).filter((_, j) => j !== i) }))} className="hover:text-red-500 ml-0.5">×</button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input value={novaOpcao} onChange={e => setNovaOpcao(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (novaOpcao.trim()) { setNovoCampo(p => ({ ...p, opcoes: [...(p.opcoes || []), novaOpcao.trim()] })); setNovaOpcao(''); } } }} placeholder="Ex: Masculino" className="rounded-xl border-none bg-muted/50 h-9 text-sm shadow-sm" />
                        <Button type="button" variant="outline" size="sm" className="rounded-xl h-9 px-3 border-primary text-primary hover:bg-primary/5" onClick={() => { if (novaOpcao.trim()) { setNovoCampo(p => ({ ...p, opcoes: [...(p.opcoes || []), novaOpcao.trim()] })); setNovaOpcao(''); } }}>+ Adicionar</Button>
                      </div>
                    </div>
                  )}
                  <Button type="button" onClick={addCampoCustom} variant="outline" size="sm" className="rounded-xl border-primary text-primary hover:bg-primary/5 gap-2">
                    <Plus className="w-3.5 h-3.5" /> Adicionar campo
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="px-8 pb-8 flex flex-col sm:flex-row gap-3 flex-wrap">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-2xl h-12 px-8 font-bold text-muted-foreground hover:bg-muted">Cancelar</Button>
            {editingId && form.slug && (
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl h-12 px-6 font-bold border-border text-muted-foreground hover:border-primary hover:text-primary gap-2"
                onClick={() => {
                  const p = paginas.find(x => x.id === editingId);
                  if (p) { setPreviewPagina({ ...p, ...form, slug: slugify(form.slug) }); setPreviewKey(k => k + 1); }
                }}
              >
                <Eye className="w-4 h-4" /> Visualizar
              </Button>
            )}
            {activeSection === 'tickets' && (
              <Button onClick={() => setActiveSection('campos')} variant="outline" className="rounded-2xl h-12 px-8 font-bold border-primary text-primary hover:bg-primary/5 gap-2">
                Próximo: Formulário →
              </Button>
            )}
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-10 font-black shadow-xl shadow-primary/20 transition-all active:scale-95 ml-auto">
              {editingId ? 'Salvar Alterações' : 'Criar Página'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Internal Page Preview ── */}
      {previewPagina && evento && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background">
          {/* Preview toolbar */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-card border-b border-border shrink-0">
            <button
              onClick={() => setPreviewPagina(null)}
              className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <div className="w-px h-4 bg-border" />
            <span className="text-xs font-black uppercase tracking-widest text-primary">{previewPagina.nome}</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-1 rounded-md">/e/{eventoId.slice(0,8)}.../{previewPagina.slug}</span>
              <button onClick={() => copyLink(previewPagina.slug)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
                <Copy className="w-3.5 h-3.5" /> Copiar link
              </button>
            </div>
          </div>
          {/* Page content */}
          <div className="flex-1 overflow-y-auto">
            <SalesPageContent
              key={previewKey}
              evento={evento}
              pagina={previewPagina}
              tickets={tickets.filter(t => previewPagina.ticketIds.includes(t.id))}
              eventoId={eventoId}
            />
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[380px] rounded-[2rem] border-none shadow-2xl p-8 bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">Excluir página</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1">Esta ação não pode ser desfeita. O link deixará de funcionar.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-6 flex gap-3">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="rounded-xl h-11 px-6 font-bold">Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl h-11 px-8 font-black active:scale-95 transition-all">Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
