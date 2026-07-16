import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, BookOpen, Upload, ExternalLink, X, Check, ImageIcon, Search, Eye, Tag, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { listDocuments, createDocument, updateDocument, removeDocument } from '~/services/firestore';
import { ArtigoBC } from '~/types';
import { orderBy, setDoc, doc } from 'firebase/firestore';
import { db } from '~/services/firebase';
import { toast } from 'sonner';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '~/services/firebase';
import ImageCropper from '~/components/ImageCropper';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const EMPTY_FORM: Omit<ArtigoBC, 'id' | 'criado_em' | 'atualizado_em'> = {
  titulo: '',
  resumo: '',
  conteudo: '',
  banner_url: '',
  video_url: '',
  tags: [],
  ordem: 1,
  slug: '',
  autor: 'Equipe Tovia',
};

function normalize(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export default function AdminKnowledgeBaseTab({ readOnly = false }: { readOnly?: boolean }) {
  const [artigos, setArtigos] = useState<ArtigoBC[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tagsInput, setTagsInput] = useState('');
  const [confirmSeed, setConfirmSeed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewArtigo, setViewArtigo] = useState<ArtigoBC | null>(null);

  // Banner upload states
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const artigosFiltrados = useMemo(() => {
    if (!searchQuery.trim()) return artigos;
    const q = normalize(searchQuery);
    return artigos.filter(a =>
      normalize(a.titulo).includes(q) ||
      normalize(a.resumo).includes(q) ||
      normalize(a.conteudo).includes(q) ||
      a.tags.some(t => normalize(t).includes(q))
    );
  }, [artigos, searchQuery]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listDocuments<ArtigoBC>('base_conhecimento', [orderBy('ordem')]);
      setArtigos(data);
    } catch {
      toast.error('Erro ao carregar artigos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetBannerState = () => {
    setBannerFile(null);
    setBannerPreview('');
    setCropSrc(null);
    setUploadProgress(0);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setTagsInput('');
    resetBannerState();
    setShowForm(true);
  };

  const openEdit = (artigo: ArtigoBC) => {
    setEditId(artigo.id);
    setForm({
      titulo: artigo.titulo,
      resumo: artigo.resumo,
      conteudo: artigo.conteudo,
      banner_url: artigo.banner_url ?? '',
      video_url: artigo.video_url ?? '',
      tags: artigo.tags,
      ordem: artigo.ordem,
      slug: artigo.slug,
      autor: artigo.autor,
    });
    setTagsInput(artigo.tags.join(', '));
    resetBannerState();
    setBannerPreview(artigo.banner_url ?? '');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    resetBannerState();
  };

  const handleTituloChange = (titulo: string) => {
    setForm(f => ({
      ...f,
      titulo,
      slug: editId ? f.slug : slugify(titulo),
    }));
  };

  // ── Banner upload handlers ─────────────────────────────────────────────────

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('Formato inválido. Use PNG, JPEG ou WebP.');
      return;
    }
    setCropSrc(URL.createObjectURL(file));
    // reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleCropComplete = (croppedFile: File) => {
    setBannerFile(croppedFile);
    setBannerPreview(URL.createObjectURL(croppedFile));
    setCropSrc(null);
  };

  const uploadBanner = async (articleSlug: string): Promise<string> => {
    if (!bannerFile) return form.banner_url;
    const ext = bannerFile.type === 'image/png' ? 'png' : 'jpg';
    const storageRef = ref(storage, `base_conhecimento/${articleSlug}/banner.${ext}`);
    return new Promise<string>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, bannerFile, { contentType: bannerFile.type });
      task.on(
        'state_changed',
        snap => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        reject,
        async () => { resolve(await getDownloadURL(task.snapshot.ref)); },
      );
    });
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.resumo.trim() || !form.conteudo.trim()) {
      toast.error('Título, resumo e conteúdo são obrigatórios');
      return;
    }
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const slug = form.slug || slugify(form.titulo);
    const now = new Date().toISOString();

    setSaving(true);
    try {
      const bannerUrl = await uploadBanner(slug);

      if (editId) {
        await updateDocument<ArtigoBC>('base_conhecimento', editId, {
          ...form,
          tags,
          slug,
          banner_url: bannerUrl,
          atualizado_em: now,
        });
        toast.success('Artigo atualizado!');
      } else {
        const id = slug;
        await createDocument<ArtigoBC>('base_conhecimento', id, {
          id,
          ...form,
          tags,
          slug,
          banner_url: bannerUrl,
          autor: 'Equipe Tovia',
          criado_em: now,
          atualizado_em: now,
        });
        toast.success('Artigo criado!');
      }
      closeForm();
      load();
    } catch {
      toast.error('Erro ao salvar artigo');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await removeDocument('base_conhecimento', id);
      toast.success('Artigo excluído');
      load();
    } catch {
      toast.error('Erro ao excluir artigo');
    } finally {
      setDeleting(null);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { SEED_ARTIGOS } = await import('~/data/knowledgeBaseSeeds');
      await Promise.all(
        SEED_ARTIGOS.map(({ banner_url, video_url, ...textFields }) =>
          setDoc(doc(db, 'base_conhecimento', textFields.id), textFields, { merge: true })
        )
      );
      toast.success(`${SEED_ARTIGOS.length} artigos atualizados com sucesso!`);
      setConfirmSeed(false);
      load();
    } catch {
      toast.error('Erro ao importar artigos');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div>
      {/* Top actions */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {readOnly && <p className="text-xs text-muted-foreground italic">Visualização somente leitura.</p>}
        {!readOnly && <Button onClick={openCreate} className="flex items-center gap-2 h-9 text-sm font-semibold">
          <Plus className="w-4 h-4" />
          Novo artigo
        </Button>}

        {!readOnly && (!confirmSeed ? (
          <Button
            variant="outline"
            onClick={() => setConfirmSeed(true)}
            className="flex items-center gap-2 h-9 text-sm"
          >
            <Upload className="w-4 h-4" />
            Importar artigos iniciais
          </Button>
        ) : (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <span className="text-xs font-semibold text-amber-700">
              Isso vai sobrescrever artigos existentes com o mesmo ID. Confirmar?
            </span>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-1 text-xs font-black text-primary hover:text-primary-dark transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {seeding ? 'Importando...' : 'Sim'}
            </button>
            <button
              onClick={() => setConfirmSeed(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <a
          href="/base-de-conhecimento"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors ml-auto"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ver página pública
        </a>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar em título, conteúdo, tags..."
          className="w-full h-9 pl-9 pr-4 text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Article list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : artigos.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground mb-1">Nenhum artigo publicado</p>
          <p className="text-xs text-muted-foreground/60">Clique em "Importar artigos iniciais" para começar com os 20 artigos do tutorial.</p>
        </div>
      ) : artigosFiltrados.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-2xl">
          <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">Nenhum artigo encontrado para "{searchQuery}"</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Tente palavras diferentes ou limpe a busca.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {searchQuery && (
            <p className="text-xs text-muted-foreground mb-2">
              {artigosFiltrados.length} artigo{artigosFiltrados.length !== 1 ? 's' : ''} encontrado{artigosFiltrados.length !== 1 ? 's' : ''}
            </p>
          )}
          {artigosFiltrados.map(artigo => (
            <div
              key={artigo.id}
              className="flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/30 transition-colors"
            >
              {/* Banner thumbnail */}
              <div className="w-12 h-8 rounded-lg overflow-hidden bg-muted shrink-0">
                {artigo.banner_url ? (
                  <img src={artigo.banner_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-3.5 h-3.5 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              <span className="text-xs font-black text-muted-foreground/50 w-5 shrink-0 text-center">
                {artigo.ordem}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{artigo.titulo}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {artigo.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setViewArtigo(artigo)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Ler artigo"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {!readOnly && (
                  <>
                    <button
                      onClick={() => openEdit(artigo)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(artigo.id)}
                      disabled={deleting === artigo.id}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Article reader modal ── */}
      {viewArtigo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-xs font-black text-primary uppercase tracking-widest">Base de Conhecimento</span>
              </div>
              <button onClick={() => setViewArtigo(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {viewArtigo.banner_url && (
                <div className="w-full" style={{ aspectRatio: '3/1' }}>
                  <img src={viewArtigo.banner_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="px-6 py-5">
                <h2 className="text-xl font-black text-foreground leading-tight mb-2">{viewArtigo.titulo}</h2>

                {viewArtigo.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-4">
                    <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
                    {viewArtigo.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-sm text-muted-foreground leading-relaxed mb-5 italic border-l-2 border-primary/30 pl-3">
                  {viewArtigo.resumo}
                </p>

                {viewArtigo.video_url && (
                  <a
                    href={viewArtigo.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Assistir vídeo
                  </a>
                )}

                <div className="space-y-3">
                  {viewArtigo.conteudo.split(/\n\s*\n/).map((paragrafo, i) => (
                    <p key={i} className="text-sm text-foreground leading-relaxed">
                      {paragrafo.trim()}
                    </p>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  Atualizado em {new Date(viewArtigo.atualizado_em).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit form overlay ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col">

            {/* Form header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="font-black text-foreground">
                {editId ? 'Editar artigo' : 'Novo artigo'}
              </h2>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">

                <div className="col-span-2">
                  <Label className="text-xs font-semibold mb-1.5 block">Título *</Label>
                  <Input
                    value={form.titulo}
                    onChange={e => handleTituloChange(e.target.value)}
                    placeholder="Ex: Crie seu primeiro evento!"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Ordem</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.ordem}
                    onChange={e => setForm(f => ({ ...f, ordem: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Slug (URL)</Label>
                  <Input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="criar-evento"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs font-semibold mb-1.5 block">Resumo * <span className="text-muted-foreground font-normal">(aparece na listagem)</span></Label>
                  <Textarea
                    value={form.resumo}
                    onChange={e => setForm(f => ({ ...f, resumo: e.target.value }))}
                    placeholder="Descrição curta exibida na listagem de artigos..."
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs font-semibold mb-1.5 block">
                    Conteúdo * <span className="text-muted-foreground font-normal">(separe parágrafos com linha em branco)</span>
                  </Label>
                  <Textarea
                    value={form.conteudo}
                    onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))}
                    placeholder={"Escreva o conteúdo completo do artigo aqui...\n\nCada parágrafo separado por uma linha em branco."}
                    rows={10}
                    className="resize-y text-sm font-mono"
                  />
                </div>

                {/* ── Banner upload ── */}
                <div className="col-span-2">
                  <Label className="text-xs font-semibold mb-1.5 block">
                    Banner <span className="text-muted-foreground font-normal">(3:1 · 1200×400px, opcional)</span>
                  </Label>

                  {bannerPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-border" style={{ aspectRatio: '3/1' }}>
                      <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                      {/* Upload progress overlay */}
                      {saving && bannerFile && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                          <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <span className="text-white text-xs font-semibold">{uploadProgress}%</span>
                        </div>
                      )}
                      {/* Replace button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <ImageIcon className="w-3 h-3" />
                        Trocar imagem
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border hover:border-primary/40 rounded-xl transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground py-8"
                    >
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-xs font-semibold">Clique para enviar uma imagem</span>
                      <span className="text-[10px]">PNG, JPEG ou WebP</span>
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleBannerFileChange}
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs font-semibold mb-1.5 block">URL do Vídeo <span className="text-muted-foreground font-normal">(YouTube, opcional)</span></Label>
                  <Input
                    value={form.video_url}
                    onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs font-semibold mb-1.5 block">
                    Tags <span className="text-muted-foreground font-normal">(separadas por vírgula)</span>
                  </Label>
                  <Input
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    placeholder="ingressos, pagamento, essencial"
                  />
                </div>

              </div>
            </div>

            {/* Form footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
              <Button variant="outline" onClick={closeForm} className="h-9 text-sm">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="h-9 text-sm font-bold">
                {saving
                  ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />{bannerFile ? `Enviando... ${uploadProgress}%` : 'Salvando...'}</>
                  : editId ? 'Salvar alterações' : 'Criar artigo'
                }
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Cropper ── */}
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          aspect={3}
          outputWidth={1200}
          outputHeight={400}
          label="Ajuste o banner do artigo"
          onComplete={handleCropComplete}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}
