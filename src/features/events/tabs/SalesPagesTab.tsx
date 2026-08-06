import React from 'react';
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
  Plus, Copy, Trash2, ExternalLink, Globe, GlobeLock,
  Edit2, GripVertical, X, Settings2, TicketIcon, FileText, Eye, ArrowLeft, FileDown, Loader2,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import { PaginaVenda, CampoFormulario } from '~/types';
import SalesPageContent from '~/features/public-pages/SalesPageContent';
import { useSalesPagesTab, CAMPOS_PADRAO, TIPOS_CAMPO, baseUrl, slugify } from './hooks/useSalesPagesTab.tsx';

// ═════════════════════════════════════════════════════════════════════════════
export default function SalesPagesTab({ eventoId }: { eventoId: string }) {
  const {
    paginas, tickets, evento, organizerProfile,
    isDialogOpen, setIsDialogOpen,
    editingId,
    deleteId, setDeleteId,
    activeSection, setActiveSection,
    previewPagina, setPreviewPagina,
    previewKey, setPreviewKey,
    exportingId,
    form, setForm,
    novoCampo, setNovoCampo,
    novaOpcao, setNovaOpcao,
    openCreate, openEdit, handleSave,
    toggleAtiva, handleDelete,
    getPageUrl, copyLink, exportarFicha,
    addCampoPadrao, addCampoCustom, removeCampo, moveCampo, toggleCampoObrigatorio,
  } = useSalesPagesTab(eventoId);

  return (
    <div className="space-y-6 text-foreground">

      <div className="tab-page-header">
        <div><h2>Páginas</h2><p>Páginas públicas de inscrição com formulário.</p></div>
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
            const url = getPageUrl(p);
            const urlDisplay = url.replace(/^https?:\/\/[^/]+/, '');
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
                      <p className="text-xs text-muted-foreground mt-0.5 truncate font-mono">{urlDisplay}</p>
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
                    <button onClick={() => copyLink(p)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
                      <Copy className="w-3.5 h-3.5" /> Copiar link
                    </button>
                    <button
                      onClick={() => { setPreviewPagina(p); setPreviewKey(k => k + 1); }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" /> Abrir
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
                { id: 'tickets', label: 'Informações', icon: TicketIcon },
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
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Descrição (opcional)</Label>
                    <span className={`text-[10px] font-semibold tabular-nums ${(form.descricao?.length ?? 0) > 400 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {form.descricao?.length ?? 0}/500
                    </span>
                  </div>
                  <Textarea
                    placeholder="Uma breve descrição que aparecerá na página pública..."
                    value={form.descricao}
                    onChange={e => { if (e.target.value.length <= 500) setForm(prev => ({ ...prev, descricao: e.target.value })); }}
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
                    {form.campos_formulario.map((campo, idx) => (
                      <div key={campo.id} className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl border border-border/40">
                        <div className="flex flex-col shrink-0">
                          <button
                            type="button"
                            onClick={() => moveCampo(campo.id, 'up')}
                            disabled={idx === 0}
                            className="text-muted-foreground/40 hover:text-foreground disabled:opacity-20 transition-colors"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveCampo(campo.id, 'down')}
                            disabled={idx === form.campos_formulario.length - 1}
                            className="text-muted-foreground/40 hover:text-foreground disabled:opacity-20 transition-colors"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
            {activeSection === 'tickets' ? (
              <Button onClick={() => setActiveSection('campos')} className="rounded-2xl h-12 px-8 font-black bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all active:scale-95 ml-auto gap-2">
                Próximo: Formulário →
              </Button>
            ) : (
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-10 font-black shadow-xl shadow-primary/20 transition-all active:scale-95 ml-auto">
                {editingId ? 'Salvar Alterações' : 'Criar Página'}
              </Button>
            )}
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
              <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-1 rounded-md">{getPageUrl(previewPagina).replace(/^https?:\/\/[^/]+/, '')}</span>
              <button onClick={() => copyLink(previewPagina)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
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
