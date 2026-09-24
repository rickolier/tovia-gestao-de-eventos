import React, { useEffect, useState } from 'react';
import { db } from '~/services/firebase';
import { collection, query, orderBy, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Loader2, Ticket, Plus, Trash2, X, Copy, Check, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface Cupom {
  id: string;
  codigo: string;
  desconto_percent: number;
  desconto_fixo: number;
  planos: string[];
  max_usos: number;
  usos: number;
  ativo: boolean;
  validade?: string;
  criado_em: string;
  descricao?: string;
}

const PLANOS = [
  { key: 'petach', label: 'Pétach' },
  { key: 'koach', label: 'Koách' },
  { key: 'chalem', label: 'Chalém' },
];

const EMPTY_FORM = {
  codigo: '',
  desconto_percent: 0,
  desconto_fixo: 0,
  planos: ['petach', 'koach', 'chalem'] as string[],
  max_usos: 0,
  validade: '',
  descricao: '',
  ativo: true,
};

export default function AdminCuponsTab() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tipoDesconto, setTipoDesconto] = useState<'percent' | 'fixo'>('percent');

  const loadCupons = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'cupons'), orderBy('criado_em', 'desc')));
      setCupons(snap.docs.map(d => ({ id: d.id, ...d.data() } as Cupom)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCupons(); }, []);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setTipoDesconto('percent');
    setFormOpen(true);
  };

  const openEdit = (c: Cupom) => {
    setForm({
      codigo: c.codigo,
      desconto_percent: c.desconto_percent,
      desconto_fixo: c.desconto_fixo,
      planos: c.planos,
      max_usos: c.max_usos,
      validade: c.validade ?? '',
      descricao: c.descricao ?? '',
      ativo: c.ativo,
    });
    setTipoDesconto(c.desconto_fixo > 0 ? 'fixo' : 'percent');
    setEditingId(c.id);
    setFormOpen(true);
  };

  const handleSave = async () => {
    const codigo = form.codigo.trim().toUpperCase();
    if (!codigo) { toast.error('Informe o código do cupom.'); return; }
    if (tipoDesconto === 'percent' && (form.desconto_percent <= 0 || form.desconto_percent > 100)) {
      toast.error('Desconto percentual deve ser entre 1% e 100%.'); return;
    }
    if (tipoDesconto === 'fixo' && form.desconto_fixo <= 0) {
      toast.error('Informe o valor fixo de desconto.'); return;
    }

    setSaving(true);
    try {
      const id = editingId || uuidv4();
      const data: any = {
        id,
        codigo,
        desconto_percent: tipoDesconto === 'percent' ? form.desconto_percent : 0,
        desconto_fixo: tipoDesconto === 'fixo' ? form.desconto_fixo : 0,
        planos: form.planos,
        max_usos: form.max_usos,
        ativo: form.ativo,
        descricao: form.descricao.trim(),
        atualizado_em: new Date().toISOString(),
      };
      if (form.validade) data.validade = form.validade;
      if (!editingId) {
        data.criado_em = new Date().toISOString();
        data.usos = 0;
      }
      await setDoc(doc(db, 'cupons', id), data, { merge: true });
      toast.success(editingId ? 'Cupom atualizado!' : 'Cupom criado!');
      setFormOpen(false);
      loadCupons();
    } catch {
      toast.error('Erro ao salvar cupom.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;
    try {
      await deleteDoc(doc(db, 'cupons', id));
      toast.success('Cupom excluído.');
      setCupons(prev => prev.filter(c => c.id !== id));
    } catch {
      toast.error('Erro ao excluir.');
    }
  };

  const handleToggleAtivo = async (c: Cupom) => {
    try {
      await setDoc(doc(db, 'cupons', c.id), { ativo: !c.ativo }, { merge: true });
      setCupons(prev => prev.map(x => x.id === c.id ? { ...x, ativo: !x.ativo } : x));
      toast.success(c.ativo ? 'Cupom desativado.' : 'Cupom ativado.');
    } catch {
      toast.error('Erro ao atualizar.');
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePlano = (key: string) => {
    setForm(f => ({
      ...f,
      planos: f.planos.includes(key) ? f.planos.filter(p => p !== key) : [...f.planos, key],
    }));
  };

  function formatDate(iso: string) {
    try { return new Date(iso).toLocaleDateString('pt-BR'); } catch { return iso; }
  }

  function descontoLabel(c: Cupom) {
    if (c.desconto_fixo > 0) return `R$ ${c.desconto_fixo.toFixed(0)} off`;
    return `${c.desconto_percent}% off`;
  }

  const isExpired = (c: Cupom) => c.validade && new Date(c.validade) < new Date();
  const isMaxed = (c: Cupom) => c.max_usos > 0 && c.usos >= c.max_usos;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
          <Ticket className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground">Cupons de Desconto</h1>
          <p className="text-sm text-muted-foreground">Crie e gerencie cupons para organizadores</p>
        </div>
        {!loading && (
          <span className="ml-auto text-xs font-semibold bg-orange-50 text-primary px-3 py-1 rounded-full">
            {cupons.length} {cupons.length === 1 ? 'cupom' : 'cupons'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={openNew} className="gap-2 rounded-xl cursor-pointer">
          <Plus className="w-4 h-4" /> Novo cupom
        </Button>
      </div>

      {/* Form modal */}
      {formOpen && (
        <div className="bg-card border rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-foreground">{editingId ? 'Editar cupom' : 'Novo cupom'}</h2>
            <button onClick={() => setFormOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Código do cupom *</Label>
              <Input
                value={form.codigo}
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                placeholder="Ex: BEMVINDO20"
                className="h-11 rounded-xl font-mono uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (interna)</Label>
              <Input
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Ex: Campanha de lançamento"
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo de desconto</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTipoDesconto('percent')}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer',
                    tipoDesconto === 'percent' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                  )}
                >
                  Percentual (%)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoDesconto('fixo')}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer',
                    tipoDesconto === 'fixo' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                  )}
                >
                  Valor fixo (R$)
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{tipoDesconto === 'percent' ? 'Desconto (%)' : 'Desconto (R$)'} *</Label>
              <Input
                type="number"
                min={1}
                max={tipoDesconto === 'percent' ? 100 : 99999}
                value={tipoDesconto === 'percent' ? form.desconto_percent || '' : form.desconto_fixo || ''}
                onChange={e => {
                  const v = Number(e.target.value);
                  setForm(f => tipoDesconto === 'percent' ? { ...f, desconto_percent: v } : { ...f, desconto_fixo: v });
                }}
                placeholder={tipoDesconto === 'percent' ? '20' : '50'}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Máximo de usos (0 = ilimitado)</Label>
              <Input
                type="number"
                min={0}
                value={form.max_usos || ''}
                onChange={e => setForm(f => ({ ...f, max_usos: Number(e.target.value) }))}
                placeholder="0"
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Validade (opcional)</Label>
              <Input
                type="date"
                value={form.validade}
                onChange={e => setForm(f => ({ ...f, validade: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Planos aplicáveis</Label>
              <div className="flex gap-2 flex-wrap">
                {PLANOS.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => togglePlano(p.key)}
                    className={cn(
                      'px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer',
                      form.planos.includes(p.key) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl cursor-pointer">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? 'Salvar alterações' : 'Criar cupom'}
            </Button>
            <Button variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl cursor-pointer">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Listing */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : cupons.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          Nenhum cupom criado ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cupons.map(c => (
            <div key={c.id} className={cn('bg-card border rounded-2xl p-5 space-y-3 transition-opacity', (!c.ativo || isExpired(c) || isMaxed(c)) && 'opacity-50')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyCode(c.codigo, c.id)}
                    className="font-mono text-base font-black text-foreground flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
                  >
                    {c.codigo}
                    {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                </div>
                <span className={cn(
                  'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full',
                  c.ativo && !isExpired(c) && !isMaxed(c) ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                )}>
                  {!c.ativo ? 'Inativo' : isExpired(c) ? 'Expirado' : isMaxed(c) ? 'Esgotado' : 'Ativo'}
                </span>
              </div>

              <div className="text-2xl font-black text-primary">{descontoLabel(c)}</div>

              {c.descricao && <p className="text-xs text-muted-foreground">{c.descricao}</p>}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Planos: {c.planos.map(p => PLANOS.find(x => x.key === p)?.label || p).join(', ')}</p>
                <p>Usos: {c.usos}{c.max_usos > 0 ? ` / ${c.max_usos}` : ' (ilimitado)'}</p>
                {c.validade && <p>Validade: {formatDate(c.validade)}</p>}
                <p>Criado em: {formatDate(c.criado_em)}</p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button onClick={() => openEdit(c)} className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
                  <Pencil className="w-3 h-3" /> Editar
                </button>
                <button onClick={() => handleToggleAtivo(c)} className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  {c.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button onClick={() => handleDelete(c.id)} className="text-xs font-semibold text-muted-foreground hover:text-red-500 transition-colors cursor-pointer ml-auto flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
