import React from 'react';
import { Inscricao, Pessoa, Ticket, PaginaVenda, CampoFormulario } from '~/types';
import { maskCPF, maskTelefone } from '~/utils/validators';
import { useRegistrations } from './hooks/useRegistrations';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, UserPlus, Search, MoreHorizontal, CheckCircle, Clock, AlertCircle, Trash2, Edit2, ArrowUpAZ, ArrowDownZA, Filter, X, ArrowUp, ArrowDown, Upload, FileDown, AlertTriangle, Check, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { differenceInMonths } from 'date-fns';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Email, interpolate } from '~/services/email';

export default function RegistrationsTab({ eventoId, readOnly = false }: { eventoId: string; readOnly?: boolean }) {
  const {
    registrations, tickets, evento, loading, paginas,
    isDialogOpen, setIsDialogOpen,
    isImportDialogOpen, setIsImportDialogOpen,
    isDeleteDialogOpen, setIsDeleteDialogOpen,
    qrInscricao, setQrInscricao,
    importLoading, importPreview, setImportPreview,
    importTicketId, setImportTicketId,
    importStatus, setImportStatus,
    exportFormat, setExportFormat,
    exportFields, setExportFields,
    EXPORT_FIELD_OPTIONS,
    itemToDelete, searchTerm, setSearchTerm,
    editingId, setEditingId,
    selectedPagina, setSelectedPagina,
    showPageSelector, setShowPageSelector,
    dynamicValues, setDynamicValues,
    currentPage, setCurrentPage,
    sortConfig, columnFilters, setColumnFilters,
    formData, setFormData,
    filteredRegistrations, paginatedRegistrations,
    totalPages, ITEMS_PER_PAGE,
    fetchData, resetForm, getDynValue, requestSort, getMaxParcelas,
    handleSubmit, handleEdit, handleDelete, confirmDelete,
    handleFileUpload, processImport, handleExport, downloadTemplate,
  } = useRegistrations(eventoId);

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpAZ className="w-3 h-3 ml-2 opacity-30 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-2 text-primary" /> 
      : <ArrowDown className="w-3 h-3 ml-2 text-primary" />;
  };

  const FilterHeader = ({
    label,
    filterKey,
    columnKey,
    className: extraClass,
  }: {
    label: string,
    filterKey: string,
    columnKey: string,
    className?: string,
  }) => (
    <TableHead className={`font-semibold text-xs uppercase tracking-widest text-muted-foreground h-14 group${extraClass ? ' ' + extraClass : ''}`}>
      <div className="flex items-center">
        <button 
          onClick={() => requestSort(columnKey)}
          className="flex items-center hover:text-primary transition-colors focus:outline-none"
        >
          {label}
          <SortIcon columnKey={columnKey} />
        </button>
        <Popover>
          <PopoverTrigger className={`h-6 w-6 ml-1 transition-all rounded-md inline-flex items-center justify-center ${columnFilters[filterKey] ? 'text-primary bg-primary/10' : 'opacity-30 hover:opacity-100'}`}>
            <Filter className="w-3 h-3" />
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 rounded-xl border-none shadow-2xl bg-card">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtrar {label}</p>
                {columnFilters[filterKey] && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 text-destructive"
                    onClick={() => setColumnFilters(prev => ({ ...prev, [filterKey]: '' }))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <Input 
                placeholder={`Filtrar por ${label}...`}
                value={columnFilters[filterKey]}
                onChange={e => setColumnFilters(prev => ({ ...prev, [filterKey]: e.target.value }))}
                className="h-9 rounded-lg border-none bg-muted font-bold text-xs focus-visible:ring-primary"
                autoFocus
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </TableHead>
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-black uppercase text-[10px]"><CheckCircle className="w-3 h-3 mr-1" /> Pago</Badge>;
      case 'pagamento_iniciado': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-black uppercase text-[10px]"><Clock className="w-3 h-3 mr-1" /> Pagamento Iniciado</Badge>;
      case 'pendente': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-black uppercase text-[10px]"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'ajuda_solicitada': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none font-black uppercase text-[10px]"><AlertCircle className="w-3 h-3 mr-1" /> Ajuda Solicitada</Badge>;
      case 'analise': return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none font-black uppercase text-[10px]"><AlertCircle className="w-3 h-3 mr-1" /> Em Análise</Badge>;
      default: return <Badge variant="outline" className="font-black uppercase text-[10px] tracking-widest">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      <div className="tab-page-header">
        <div><h2>Participantes</h2><p>Lista de inscrições e controle de presença.</p></div>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Buscar por nome ou email..." 
            className="pl-11 rounded-2xl border-none bg-card h-12 font-bold shadow-sm focus-visible:ring-primary transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        {!readOnly && (
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
              className="border-primary/20 text-primary hover:bg-primary/5 gap-2 rounded-2xl h-12 px-6 font-black transition-all active:scale-95 flex-1 md:flex-none"
            >
              <Upload className="w-5 h-5 shrink-0" />
              Importar / Exportar
            </Button>
            <Button
              onClick={() => {
                const paginasComFormulario = paginas.filter(p => p.campos_formulario.length > 0);
                if (paginasComFormulario.length === 0) {
                  toast.error('Crie uma página de vendas com formulário antes de realizar inscrições manuais.');
                  return;
                }
                resetForm();
                setEditingId(null);
                setSelectedPagina(null);
                setDynamicValues({});
                setShowPageSelector(true);
              }}
              className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-2xl h-12 px-6 font-black shadow-lg shadow-primary/20 transition-all active:scale-95 flex-1 md:flex-none"
            >
              <UserPlus className="w-5 h-5 shrink-0" />
              Inscrição Manual
            </Button>
          </div>
        )}

        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="sm:max-w-4xl rounded-[2.5rem] border-none shadow-2xl p-0 bg-card transition-colors max-h-[90vh] overflow-hidden">
            <div className="flex h-full max-h-[90vh]">
              {/* ── LEFT: Import ── */}
              <div className="flex-1 p-8 overflow-y-auto scrollbar-hide border-r border-border/50">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Upload className="w-6 h-6 shrink-0" />
                </div>
                Importar
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Lote para as inscrições</Label>
                  <Select value={importTicketId} onValueChange={setImportTicketId}>
                    <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold focus:ring-primary">
                      <SelectValue placeholder="Selecione o Lote" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {tickets.map(t => (
                        <SelectItem key={t.id} value={t.id} className="font-medium">
                          {t.nome} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Status Padrão</Label>
                  <Select value={importStatus} onValueChange={v => setImportStatus(v as any)}>
                    <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold focus:ring-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="confirmada" className="font-medium">Confirmada (Pago)</SelectItem>
                      <SelectItem value="pendente" className="font-medium">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div 
                className="border-2 border-dashed border-border/50 rounded-[2rem] p-10 text-center space-y-4 hover:bg-muted/10 transition-all group relative cursor-pointer"
                onClick={() => document.getElementById('import-file')?.click()}
              >
                <input 
                  id="import-file"
                  type="file" 
                  accept=".csv, .xlsx, .xls" 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  {importPreview.length > 0 ? (
                    <Check className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-black text-lg text-foreground">
                    {importPreview.length > 0 ? `${importPreview.length} registros prontos` : 'Arraste ou selecione seu arquivo'}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">CSV ou Excel (.xlsx, .xls)</p>
                </div>
                {importPreview.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full text-[10px] font-black uppercase mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImportPreview([]);
                    }}
                  >
                    <X className="w-3 h-3 mr-1" /> Remover Arquivo
                  </Button>
                )}
              </div>

              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-amber-900 font-black text-sm uppercase tracking-wide">Importante</p>
                  <p className="text-amber-800/80 text-xs font-medium leading-relaxed">
                    Os nomes e emails são obrigatórios. O sistema tentará mapear as colunas automaticamente.
                  </p>
                  <button 
                    onClick={downloadTemplate}
                    className="text-primary font-black text-xs uppercase tracking-widest flex items-center gap-1 mt-2 hover:underline"
                  >
                    <FileDown className="w-3 h-3" /> Baixar Planilha Exemplo
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-8 gap-3 sm:gap-0">
              <Button
                variant="ghost"
                onClick={() => setIsImportDialogOpen(false)}
                className="rounded-2xl h-12 px-8 font-black text-muted-foreground"
              >
                Cancelar
              </Button>
              <Button
                disabled={importLoading || importPreview.length === 0 || !importTicketId}
                onClick={processImport}
                className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-10 font-black shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {importLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importando...
                  </div>
                ) : (
                  `Importar ${importPreview.length} registros`
                )}
              </Button>
            </DialogFooter>
              </div>{/* end left */}

              {/* ── RIGHT: Export ── */}
              <div className="flex-1 p-8 overflow-y-auto scrollbar-hide flex flex-col gap-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-primary">
                    <FileDown className="w-6 h-6 shrink-0" />
                  </div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">Exportar</h2>
                </div>

                {/* Format */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Formato</p>
                  <div className="flex gap-2">
                    {(['xlsx', 'csv', 'pdf'] as const).map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setExportFormat(f)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-wide transition-all border ${exportFormat === f ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-muted/50 text-muted-foreground border-transparent hover:border-primary/30'}`}
                      >
                        .{f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Campos a exportar</p>
                  <div className="space-y-2">
                    {EXPORT_FIELD_OPTIONS.map(opt => (
                      <label key={opt.key} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={exportFields.includes(opt.key)}
                          onChange={e => setExportFields(prev => e.target.checked ? [...prev, opt.key] : prev.filter(f => f !== opt.key))}
                          className="w-4 h-4 accent-primary rounded"
                        />
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-2xl text-xs text-muted-foreground font-medium">
                  {filteredRegistrations.length} inscrição(ões) serão exportadas conforme o filtro atual da tabela.
                </div>

                <div className="mt-auto pt-4">
                  <Button
                    onClick={handleExport}
                    disabled={exportFields.length === 0}
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 font-black shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Exportar {filteredRegistrations.length} inscrições
                  </Button>
                </div>
              </div>{/* end right */}
            </div>{/* end flex */}
          </DialogContent>
        </Dialog>

        {/* Page selector dialog */}
        <Dialog open={showPageSelector} onOpenChange={setShowPageSelector}>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-8 bg-card transition-colors">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <UserPlus className="w-6 h-6 shrink-0" />
                </div>
                Inscrição Manual
              </DialogTitle>
              <p className="text-sm text-muted-foreground font-medium pt-1">Selecione a página de vendas cujo formulário deseja preencher.</p>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              {paginas.filter(p => p.campos_formulario.length > 0).map(p => {
                const paginaTickets = tickets.filter(t => p.ticketIds.includes(t.id));
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPagina(p);
                      // Pre-set ticketId if page has only one ticket
                      if (paginaTickets.length === 1) {
                        setFormData(prev => ({ ...prev, ticketId: paginaTickets[0].id }));
                      } else {
                        setFormData(prev => ({ ...prev, ticketId: '' }));
                      }
                      setDynamicValues({});
                      setShowPageSelector(false);
                      setIsDialogOpen(true);
                    }}
                    className="w-full text-left p-5 rounded-2xl border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <p className="font-black text-foreground group-hover:text-primary transition-colors">{p.nome}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      {p.campos_formulario.length} campo(s) · {paginaTickets.length} ingresso(s) vinculado(s)
                    </p>
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setSelectedPagina(null);
            setDynamicValues({});
            resetForm();
          }
        }}>
          <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-none shadow-2xl p-8 bg-card transition-colors max-h-[90vh] overflow-y-auto scrollbar-hide">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <UserPlus className="w-6 h-6 shrink-0" />
                </div>
                {editingId ? 'Editar Inscrição' : 'Inscrição Manual'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-2">

              {/* Dynamic fields from sales page form */}
              {selectedPagina ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1 pb-1 border-b border-border/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">{selectedPagina.nome}</p>
                    <button type="button" onClick={() => { setIsDialogOpen(false); setShowPageSelector(true); }} className="text-[9px] text-muted-foreground hover:text-foreground underline ml-auto">Trocar página</button>
                  </div>
                  {selectedPagina.campos_formulario.map((campo: CampoFormulario) => (
                    <div key={campo.id} className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
                        {campo.label}{campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {campo.tipo === 'select' ? (
                        <Select
                          value={String(dynamicValues[campo.id] || '')}
                          onValueChange={v => setDynamicValues(prev => ({ ...prev, [campo.id]: v }))}
                        >
                          <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm focus:ring-primary">
                            <SelectValue placeholder={campo.placeholder || 'Selecione...'} />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            {(campo.opcoes || []).map(op => (
                              <SelectItem key={op} value={op} className="font-medium">{op}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : campo.tipo === 'checkbox' ? (
                        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                          <input
                            type="checkbox"
                            checked={Boolean(dynamicValues[campo.id])}
                            onChange={e => setDynamicValues(prev => ({ ...prev, [campo.id]: e.target.checked }))}
                            className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-medium text-foreground">{campo.label}</span>
                        </div>
                      ) : campo.tipo === 'textarea' ? (
                        <textarea
                          required={campo.obrigatorio}
                          placeholder={campo.placeholder}
                          value={String(dynamicValues[campo.id] || '')}
                          onChange={e => setDynamicValues(prev => ({ ...prev, [campo.id]: e.target.value }))}
                          className="w-full rounded-xl border-none bg-muted/50 p-3 font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors resize-none min-h-[80px] text-sm"
                        />
                      ) : (
                        <Input
                          type={campo.tipo === 'email' ? 'email' : campo.tipo === 'numero' ? 'number' : campo.tipo === 'data' ? 'date' : 'text'}
                          required={campo.obrigatorio}
                          placeholder={campo.placeholder}
                          value={String(dynamicValues[campo.id] || '')}
                          onChange={e => setDynamicValues(prev => ({ ...prev, [campo.id]: e.target.value }))}
                          className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors"
                        />
                      )}
                    </div>
                  ))}
                  {/* Ingresso select — filtered to page's ticketIds */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Ingresso</Label>
                    <Select value={formData.ticketId} onValueChange={v => setFormData(prev => ({ ...prev, ticketId: v }))}>
                      <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm focus:ring-primary">
                        <SelectValue placeholder="Selecione um ingresso">
                          {formData.ticketId ? tickets.find(t => t.id === formData.ticketId)?.nome : 'Selecione um ingresso'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl text-foreground">
                        {tickets.filter(t => selectedPagina.ticketIds.includes(t.id)).map(t => (
                          <SelectItem key={t.id} value={t.id} className="font-medium">
                            {t.nome} — {t.tipo === 'gratuito' || t.tipo === 'doacao' ? 'Gratuito' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                /* Original fixed fields for edit mode */
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Nome Completo</Label>
                      <Input id="nome" required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Email</Label>
                      <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">CPF</Label>
                      <Input id="cpf" placeholder="000.000.000-00" maxLength={14} value={formData.cpf} onChange={e => setFormData({...formData, cpf: maskCPF(e.target.value)})} className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Telefone</Label>
                      <Input id="telefone" placeholder="(00) 00000-0000" maxLength={15} value={formData.telefone} onChange={e => setFormData({...formData, telefone: maskTelefone(e.target.value)})} className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="idade" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Idade</Label>
                      <Input id="idade" type="number" value={formData.idade || ''} onFocus={e => e.target.select()} onChange={e => setFormData({...formData, idade: Number(e.target.value)})} className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Gênero</Label>
                      <Select value={formData.genero} onValueChange={v => setFormData({...formData, genero: v as any})}>
                        <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm focus:ring-primary">
                          <SelectValue>
                            {formData.genero === 'masculino' ? 'Masculino' : 'Feminino'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          <SelectItem value="masculino" className="font-medium">Masculino</SelectItem>
                          <SelectItem value="feminino" className="font-medium">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="celula" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Célula</Label>
                      <Input id="celula" value={formData.celula} onChange={e => setFormData({...formData, celula: e.target.value})} className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors" />
                    </div>
                  </div>
                </>
              )}


              <div className="p-4 bg-muted/30 rounded-2xl flex items-center justify-between">
                <div>
                  <Label className="text-xs font-black uppercase tracking-widest text-foreground">Solicitou Ajuda?</Label>
                  <p className="text-[10px] text-muted-foreground font-medium">Define o status como "Ajuda Solicitada"</p>
                </div>
                <input 
                  type="checkbox"
                  checked={formData.precisa_ajuda}
                  onChange={e => setFormData({...formData, precisa_ajuda: e.target.checked})}
                  className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary"
                />
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98] mt-4">
                {editingId ? 'Salvar Alterações' : 'Finalizar Inscrição'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-8 bg-card transition-colors">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-black text-destructive tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive">
                  <Trash2 className="w-6 h-6 shrink-0" />
                </div>
                Excluir Inscrição
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                Tem certeza que deseja excluir esta inscrição? Esta ação <span className="text-destructive font-black underline">não pode ser desfeita</span> e todos os pagamentos vinculados serão removidos.
              </p>
            </div>
            <div className="flex flex-col md:flex-row justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-2xl h-12 px-8 font-black text-muted-foreground hover:bg-muted">Cancelar</Button>
              <Button onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-white rounded-2xl h-12 px-10 font-black shadow-xl shadow-destructive/20 active:scale-95 transition-all">Excluir Inscrição</Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>

      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-card transition-colors border border-border/50">
        <div>
          <Table className="table-fixed w-full">
            <TableHeader className="bg-muted/50 border-b border-border/50 hover:bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-xs uppercase tracking-widest text-muted-foreground h-14 px-4 w-[22%] group">
                  <div className="flex items-center">
                    <button
                      onClick={() => requestSort('nome')}
                      className="flex items-center hover:text-primary transition-colors focus:outline-none"
                    >
                      Nome / Contato
                      <SortIcon columnKey="nome" />
                    </button>
                    <Popover>
                      <PopoverTrigger className={`h-6 w-6 ml-1 transition-all rounded-md inline-flex items-center justify-center ${columnFilters.nome ? 'text-primary bg-primary/10' : 'opacity-20 group-hover:opacity-100'}`}>
                        <Filter className="w-3 h-3" />
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3 rounded-xl border-none shadow-2xl bg-card">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtrar Nome</p>
                            {columnFilters.nome && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-destructive"
                                onClick={() => setColumnFilters(prev => ({ ...prev, nome: '' }))}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          <Input
                            placeholder="Filtrar por nome..."
                            value={columnFilters.nome}
                            onChange={e => setColumnFilters(prev => ({ ...prev, nome: e.target.value }))}
                            className="h-9 rounded-lg border-none bg-muted font-bold text-xs focus-visible:ring-primary"
                            autoFocus
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
                <FilterHeader label="Lote / Ingresso" filterKey="ticket" columnKey="ticket" className="w-[13%]" />
                <FilterHeader label="Status" filterKey="status" columnKey="status" className="w-[18%]" />
                <FilterHeader label="Financeiro" filterKey="financeiro" columnKey="financeiro" className="w-[13%]" />
                <FilterHeader label="Método" filterKey="metodo" columnKey="metodo" className="w-[10%]" />
                <TableHead className="font-semibold text-xs uppercase tracking-widest text-muted-foreground h-14 w-[9%]">Resp.</TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-widest text-muted-foreground h-14 px-3 w-[15%]">Gerenciar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Carregando dados...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-muted-foreground font-black text-[10px] uppercase tracking-widest">
                    Nenhuma inscrição encontrada na lista.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRegistrations.map(reg => (
                  <TableRow key={reg.id} className="hover:bg-muted/30 transition-colors border-b border-border/10 group">
                    <TableCell className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-black text-foreground tracking-tight">{reg.pessoa?.nome}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{reg.pessoa?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-black text-[9px] uppercase border-primary/20 bg-primary/5 text-primary py-1 px-3 rounded-lg">{reg.ticket?.nome}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(reg.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-primary tracking-tight">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reg.valor_pago || 0)}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">
                          Total {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reg.valor_total)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest bg-muted/50 py-1 px-2 rounded-md">{reg.forma_pagamento || 'PIX'}</span>
                    </TableCell>
                    <TableCell>
                      {reg.respostas_formulario && Object.keys(reg.respostas_formulario).length > 0 ? (
                        <Popover>
                          <PopoverTrigger className="h-7 px-2 rounded-lg text-[10px] font-black text-primary bg-primary/5 hover:bg-primary/10 transition-colors">
                            {Object.keys(reg.respostas_formulario).length} resp.
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-4 rounded-2xl border-none shadow-2xl bg-card" align="start">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Respostas do formulário</p>
                            <div className="space-y-2">
                              {Object.entries(reg.respostas_formulario).map(([label, valor]) => (
                                <div key={label}>
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                                  <p className="text-sm font-bold text-foreground">{String(valor) || '-'}</p>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right px-3">
                      <div className="flex justify-end gap-2">
                        {reg.status !== 'cancelada' && (
                          <Button variant="ghost" size="icon" onClick={() => setQrInscricao(reg)} className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="Ver QR Code">
                            <QrCode className="w-4 h-4" />
                          </Button>
                        )}
                        {!readOnly && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(reg)} className="h-10 w-10 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all" title="Editar inscrição">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(reg.id, reg.pessoaId)} className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all" title="Excluir inscrição">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border/30">
            <span className="text-xs text-muted-foreground">
              {currentPage * ITEMS_PER_PAGE + 1}–{Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredRegistrations.length)} de {filteredRegistrations.length} inscritos
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs rounded-lg"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                ← Anterior
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i).filter(i =>
                i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 1
              ).reduce<(number | '...')[]>((acc, i, idx, arr) => {
                if (idx > 0 && (i as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(i);
                return acc;
              }, []).map((item, idx) =>
                item === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
                ) : (
                  <Button
                    key={item}
                    variant={currentPage === item ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-8 w-8 p-0 text-xs rounded-lg ${currentPage === item ? 'bg-primary text-white' : ''}`}
                    onClick={() => setCurrentPage(item as number)}
                  >
                    {(item as number) + 1}
                  </Button>
                )
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs rounded-lg"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Próximo →
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={!!qrInscricao} onOpenChange={o => { if (!o) setQrInscricao(null); }}>
        <DialogContent className="sm:max-w-xs rounded-[2rem] border-none shadow-2xl p-0 bg-card overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-base font-black">QR Code do Ingresso</DialogTitle>
          </DialogHeader>
          {qrInscricao && (
            <div className="flex flex-col items-center gap-4 px-6 pb-6">
              <div className="bg-white p-4 rounded-2xl shadow-inner">
                <QRCodeSVG value={qrInscricao.id} size={180} level="M" />
              </div>
              <div className="text-center">
                <p className="font-black text-foreground">{qrInscricao.pessoa?.nome || qrInscricao.nome}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{qrInscricao.ticket_nome}</p>
                {qrInscricao.presenca && (
                  <span className="mt-2 inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Presença confirmada
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
