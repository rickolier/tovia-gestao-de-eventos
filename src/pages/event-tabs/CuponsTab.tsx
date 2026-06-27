import React, { useEffect, useState } from 'react';
import { listDocuments, createDocument, updateDocument, removeDocument } from '../../lib/firebase-utils';
import { Cupom } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Tag, Trash2, ToggleLeft, ToggleRight, Percent, DollarSign, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  eventoId: string;
}

const EMPTY_FORM = {
  codigo: '',
  tipo: 'porcentagem' as 'porcentagem' | 'fixo',
  valor: '',
  limite_usos: '',
  data_validade: '',
};

export default function CuponsTab({ eventoId }: Props) {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    listDocuments<Cupom>(`eventos/${eventoId}/cupons`)
      .then(data => {
        setCupons(data.sort((a, b) => b.criado_em.localeCompare(a.criado_em)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eventoId]);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const codigo = form.codigo.trim().toUpperCase();
    if (!codigo) { toast.error('Informe o código do cupom.'); return; }
    const valor = parseFloat(form.valor);
    if (!valor || valor <= 0) { toast.error('Informe um valor válido.'); return; }
    if (form.tipo === 'porcentagem' && valor > 100) { toast.error('Porcentagem máxima é 100%.'); return; }
    if (cupons.some(c => c.codigo === codigo)) { toast.error('Já existe um cupom com esse código.'); return; }

    setSaving(true);
    try {
      const id = uuidv4();
      const novoCupom: Cupom = {
        id,
        eventoId,
        codigo,
        tipo: form.tipo,
        valor,
        limite_usos: form.limite_usos ? parseInt(form.limite_usos) : undefined,
        usos: 0,
        data_validade: form.data_validade || undefined,
        ativo: true,
        criado_em: new Date().toISOString(),
      };
      await createDocument(`eventos/${eventoId}/cupons`, id, novoCupom);
      setCupons(prev => [novoCupom, ...prev]);
      setIsDialogOpen(false);
      toast.success(`Cupom ${codigo} criado!`);
    } catch {
      toast.error('Erro ao criar cupom.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (cupom: Cupom) => {
    await updateDocument(`eventos/${eventoId}/cupons`, cupom.id, { ativo: !cupom.ativo });
    setCupons(prev => prev.map(c => c.id === cupom.id ? { ...c, ativo: !c.ativo } : c));
  };

  const handleDelete = async (id: string) => {
    await removeDocument(`eventos/${eventoId}/cupons`, id);
    setCupons(prev => prev.filter(c => c.id !== id));
    toast.success('Cupom removido.');
  };

  const copyCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    toast.success('Código copiado!');
  };

  const isExpirado = (cupom: Cupom) =>
    !!cupom.data_validade && new Date(cupom.data_validade) < new Date();

  const isEsgotado = (cupom: Cupom) =>
    !!cupom.limite_usos && cupom.usos >= cupom.limite_usos;

  const fmtValor = (cupom: Cupom) =>
    cupom.tipo === 'porcentagem'
      ? `${cupom.valor}%`
      : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cupom.valor);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-foreground">Cupons de desconto</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Crie códigos de desconto para seus ingressos.</p>
        </div>
        <Button onClick={openNew} className="rounded-2xl font-black gap-2">
          <Plus className="w-4 h-4" /> Novo cupom
        </Button>
      </div>

      {loading && (
        <div className="py-16 flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && cupons.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border p-16 flex flex-col items-center gap-3 text-center">
          <Tag className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-muted-foreground">Nenhum cupom criado ainda</p>
          <p className="text-xs text-muted-foreground/60">Crie cupons de porcentagem ou valor fixo.</p>
        </div>
      )}

      {!loading && cupons.length > 0 && (
        <div className="space-y-3">
          {cupons.map(cupom => {
            const expirado = isExpirado(cupom);
            const esgotado = isEsgotado(cupom);
            const inativo = !cupom.ativo || expirado || esgotado;

            return (
              <div
                key={cupom.id}
                className={cn(
                  'bg-card rounded-2xl border p-5 flex items-center gap-5 transition-all',
                  inativo ? 'border-border opacity-60' : 'border-border hover:border-primary/30'
                )}
              >
                {/* Icon */}
                <div className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                  cupom.tipo === 'porcentagem' ? 'bg-primary/10' : 'bg-emerald-50'
                )}>
                  {cupom.tipo === 'porcentagem'
                    ? <Percent className="w-5 h-5 text-primary" />
                    : <DollarSign className="w-5 h-5 text-emerald-600" />
                  }
                </div>

                {/* Code + value */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => copyCodigo(cupom.codigo)}
                      className="font-black text-foreground text-base tracking-wider hover:text-primary transition-colors flex items-center gap-1.5"
                      title="Copiar código"
                    >
                      {cupom.codigo}
                      <Copy className="w-3.5 h-3.5 opacity-40" />
                    </button>
                    <span className="text-lg font-black text-primary">{fmtValor(cupom)}</span>
                    {expirado && <Badge variant="outline" className="text-[10px] font-black uppercase border-red-200 text-red-500 bg-red-50">Expirado</Badge>}
                    {esgotado && !expirado && <Badge variant="outline" className="text-[10px] font-black uppercase border-amber-200 text-amber-600 bg-amber-50">Esgotado</Badge>}
                    {!inativo && <Badge variant="outline" className="text-[10px] font-black uppercase border-emerald-200 text-emerald-600 bg-emerald-50">Ativo</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {cupom.usos} uso{cupom.usos !== 1 ? 's' : ''}
                      {cupom.limite_usos ? ` / ${cupom.limite_usos}` : ''}
                    </span>
                    {cupom.data_validade && (
                      <span className="text-xs text-muted-foreground">
                        Válido até {new Date(cupom.data_validade).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleAtivo(cupom)}
                    className="p-2 rounded-xl hover:bg-muted transition-colors"
                    title={cupom.ativo ? 'Desativar' : 'Ativar'}
                    disabled={expirado || esgotado}
                  >
                    {cupom.ativo
                      ? <ToggleRight className="w-5 h-5 text-primary" />
                      : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(cupom.id)}
                    className="p-2 rounded-xl hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-colors"
                    title="Excluir cupom"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={isDialogOpen} onOpenChange={o => { if (!o) setIsDialogOpen(false); }}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl p-0 bg-card overflow-hidden">
          <DialogHeader className="px-7 pt-7 pb-0">
            <DialogTitle className="text-xl font-black">Novo cupom</DialogTitle>
          </DialogHeader>

          <div className="px-7 py-5 space-y-5">
            {/* Code */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Código</Label>
              <Input
                placeholder="ex: DESCONTO20"
                value={form.codigo}
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                className="rounded-xl h-11 font-black tracking-wider"
                maxLength={20}
              />
              <p className="text-[11px] text-muted-foreground">Letras maiúsculas e números, sem espaços.</p>
            </div>

            {/* Type + value */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as 'porcentagem' | 'fixo' }))}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="porcentagem">Porcentagem (%)</SelectItem>
                    <SelectItem value="fixo">Valor fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {form.tipo === 'porcentagem' ? 'Desconto (%)' : 'Desconto (R$)'}
                </Label>
                <Input
                  type="number"
                  placeholder={form.tipo === 'porcentagem' ? '20' : '10,00'}
                  min={0}
                  max={form.tipo === 'porcentagem' ? 100 : undefined}
                  value={form.valor}
                  onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                  className="rounded-xl h-11"
                />
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Limite de usos</Label>
                <Input
                  type="number"
                  placeholder="Ilimitado"
                  min={1}
                  value={form.limite_usos}
                  onChange={e => setForm(f => ({ ...f, limite_usos: e.target.value }))}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Válido até</Label>
                <Input
                  type="date"
                  value={form.data_validade}
                  onChange={e => setForm(f => ({ ...f, data_validade: e.target.value }))}
                  className="rounded-xl h-11"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-7 pb-7 pt-2 flex gap-3">
            <Button variant="ghost" className="flex-1 rounded-xl h-11" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl h-11 font-black">
              {saving ? 'Criando...' : 'Criar cupom'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
