import React, { useEffect, useState } from 'react';
import ImageCropper from '~/components/ImageCropper';
import { useAuth } from '~/context/AuthContext';
import { getDocument, updateDocument, removeDocument } from '~/services/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Eye, EyeOff, Trash2, AlertTriangle, ImagePlus, X } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '~/services/firebase';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Evento } from '~/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getPlanConfig } from '~/utils/plan-limits';
import { Badge } from '@/components/ui/badge';

export default function EditEvent() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventoOriginal, setEventoOriginal] = useState<Evento | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const plan = getPlanConfig(profile?.plano);

  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [uploadProgresso, setUploadProgresso] = useState<number | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    data_inicio: '',
    data_fim: '',
    local: '',
    instituicao: '',
    descricao: '',
    vagas_totais: 0,
    imagem_url: '',
    cor_tema: '#064e3b',
    ativo: true
  });

  useEffect(() => {
    if (id) {
      const fetchEvento = async () => {
        try {
          const data = await getDocument<Evento>('eventos', id);
          if (!data) {
            toast.error('Evento não encontrado');
            navigate('/dashboard');
            return;
          }
          
          // Convert ISO dates to datetime-local format (YYYY-MM-DDTHH:mm)
          const formatDate = (isoString: string) => {
            const date = new Date(isoString);
            const pad = (num: number) => num.toString().padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
          };

          setEventoOriginal({ ...data, id });
          setFormData({
            nome: data.nome,
            data_inicio: formatDate(data.data_inicio),
            data_fim: formatDate(data.data_fim),
            local: data.local,
            instituicao: data.instituicao || '',
            descricao: data.descricao || '',
            vagas_totais: data.vagas_totais,
            imagem_url: data.imagem_url || '',
            cor_tema: data.cor_tema || '#064e3b',
            ativo: data.ativo !== false
          });
          if (data.imagem_url) setImagemPreview(data.imagem_url);
        } catch (error) {
          console.error('Error fetching event:', error);
          toast.error('Erro ao carregar dados do evento');
        } finally {
          setLoading(false);
        }
      };
      fetchEvento();
    }
  }, [id, navigate]);

  const handleToggleStatus = async () => {
    if (!id || !eventoOriginal) return;
    try {
      const newStatus = formData.ativo === false ? true : false;
      await updateDocument('eventos', id, { ativo: newStatus });
      setFormData(prev => ({ ...prev, ativo: newStatus }));
      toast.success(newStatus ? 'Evento ativado!' : 'Evento desativado!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao alternar status do evento.');
    }
  };

  const handleDeleteEvent = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await removeDocument('eventos', id);
      toast.success('Evento excluído com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir evento.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleImagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('Formato inválido. Use PNG, JPEG ou WebP.');
      return;
    }
    setCropSrc(URL.createObjectURL(file));
  };

  const handleCropComplete = (croppedFile: File) => {
    setImagemFile(croppedFile);
    setImagemPreview(URL.createObjectURL(croppedFile));
    setCropSrc(null);
  };

  const uploadImagem = async (eventoId: string): Promise<string> => {
    if (!imagemFile) return formData.imagem_url;
    const ext = imagemFile.type === 'image/png' ? 'png' : 'jpg';
    const storageRef = ref(storage, `eventos/${eventoId}/capa.${ext}`);
    const uploadPromise = new Promise<string>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, imagemFile, { contentType: imagemFile.type });
      task.on('state_changed',
        snap => setUploadProgresso(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        reject,
        async () => { resolve(await getDownloadURL(task.snapshot.ref)); }
      );
    });
    return Promise.race([uploadPromise, new Promise<string>((_, rej) => setTimeout(() => rej(new Error('Upload timeout')), 30000))]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    if (formData.vagas_totais > plan.maxAttendeesPerEvent) {
      toast.error(`Seu plano permite no máximo ${plan.maxAttendeesPerEvent} inscritos por evento.`);
      return;
    }

    setSaving(true);
    try {
      if (!formData.data_inicio || !formData.data_fim) {
        toast.error('Por favor, preencha as datas do evento.');
        setSaving(false);
        return;
      }

      // Ensure dates are in ISO 8601 format for Firestore validation
      const dataInicio = new Date(formData.data_inicio).toISOString();
      const dataFim = new Date(formData.data_fim).toISOString();

      const imagemUrl = await uploadImagem(id);

      const eventData = {
        nome: formData.nome,
        data_inicio: dataInicio,
        data_fim: dataFim,
        local: formData.local,
        instituicao: formData.instituicao || '',
        descricao: formData.descricao || '',
        vagas_totais: Number(formData.vagas_totais),
        imagem_url: imagemUrl,
        cor_tema: formData.cor_tema || '#064e3b',
      };

      await updateDocument('eventos', id, eventData);
      toast.success('Evento atualizado com sucesso!');
      navigate(`/eventos/${id}`);
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast.error('Erro ao atualizar evento.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
    {cropSrc && (
      <ImageCropper
        imageSrc={cropSrc}
        aspect={16 / 9}
        outputWidth={1280}
        outputHeight={720}
        label="Imagem de Capa"
        onComplete={handleCropComplete}
        onCancel={() => setCropSrc(null)}
      />
    )}
    <div className="min-h-screen bg-background">
      {/* Sticky top header */}
      <header className="sticky top-0 z-30 bg-[var(--sidebar)] h-14 flex items-center px-4 gap-3">
        <Link to={`/eventos/${id}`} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-sm font-semibold text-white flex-1">Editar Evento</h1>
        <Badge variant="outline" className="text-xs font-semibold text-white/70 border-white/20 rounded-lg">
          Plano {plan.name}
        </Badge>
      </header>

      <div className="max-w-3xl mx-auto py-8 px-4">
        <Card className="border border-border shadow-sm rounded-2xl overflow-hidden card-flat">
          <div className="h-1.5 bg-primary" />
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="text-base font-bold text-foreground">Informações do Evento</CardTitle>
            <p className="text-sm text-muted-foreground">Atualize os dados do seu evento.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Evento</Label>
                  <Input 
                    id="nome" 
                    required 
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                    placeholder="Ex: Conferência Anual 2024"
                    className="rounded-xl border-border focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_inicio">Data de Início</Label>
                    <Input 
                      id="data_inicio" 
                      type="datetime-local" 
                      required 
                      value={formData.data_inicio}
                      onChange={e => setFormData({...formData, data_inicio: e.target.value})}
                      className="rounded-xl border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_fim">Data de Término</Label>
                    <Input 
                      id="data_fim" 
                      type="datetime-local" 
                      required 
                      value={formData.data_fim}
                      onChange={e => setFormData({...formData, data_fim: e.target.value})}
                      className="rounded-xl border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="local">Local</Label>
                  <Input 
                    id="local" 
                    required 
                    value={formData.local}
                    onChange={e => setFormData({...formData, local: e.target.value})}
                    placeholder="Ex: Auditório Central ou Online"
                    className="rounded-xl border-border"
                  />
                </div>

                {/* Imagem de capa */}
                <div className="space-y-2">
                  <Label>Imagem de Capa do Evento</Label>
                  {!imagemPreview ? (
                    <label
                      htmlFor="imagem_upload_edit"
                      className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-2xl p-8 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <ImagePlus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">Clique para anexar a imagem</p>
                        <p className="text-xs text-muted-foreground mt-0.5">PNG, JPEG ou WebP · proporção 16:9</p>
                      </div>
                      <input
                        id="imagem_upload_edit"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleImagemChange}
                      />
                    </label>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-border">
                      <img
                        src={imagemPreview}
                        alt="Preview da capa"
                        className="w-full object-cover"
                        style={{ aspectRatio: '16/9', objectPosition: 'center' }}
                      />
                      <button
                        type="button"
                        onClick={() => { setImagemFile(null); setImagemPreview(null); setUploadProgresso(null); setFormData(p => ({ ...p, imagem_url: '' })); }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <label
                        htmlFor="imagem_upload_edit_change"
                        className="absolute bottom-2 right-2 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        <ImagePlus className="w-3.5 h-3.5" /> Trocar imagem
                        <input
                          id="imagem_upload_edit_change"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={handleImagemChange}
                        />
                      </label>
                      {uploadProgresso !== null && uploadProgresso < 100 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                          <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgresso}%` }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Label htmlFor="cor_tema">Cor do Tema (Identidade Visual)</Label>
                  <div className="flex flex-wrap gap-3 mb-2">
                    {[
                      '#7C3AED', '#10B981', '#FACC15', '#EC4899', '#3B82F6', '#F97316'
                    ].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({...formData, cor_tema: color})}
                        className={`w-10 h-10 rounded-xl border-2 transition-all ${formData.cor_tema === color ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-4 items-center">
                    <Input 
                      id="cor_tema" 
                      type="color"
                      value={formData.cor_tema}
                      onChange={e => setFormData({...formData, cor_tema: e.target.value})}
                      className="w-20 h-10 p-1 rounded-lg cursor-pointer"
                    />
                    <Input 
                      type="text"
                      value={formData.cor_tema}
                      onChange={e => setFormData({...formData, cor_tema: e.target.value})}
                      className="rounded-xl border-border"
                      placeholder="#064e3b"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Esta cor será usada no cabeçalho do card e nas páginas internas do evento.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instituicao">Instituição Organizadora</Label>
                  <Input 
                    id="instituicao" 
                    value={formData.instituicao}
                    onChange={e => setFormData({...formData, instituicao: e.target.value})}
                    placeholder="Ex: Universidade Federal"
                    className="rounded-xl border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição do Evento</Label>
                  <Textarea 
                    id="descricao"
                    value={formData.descricao}
                    onChange={e => setFormData({...formData, descricao: e.target.value})}
                    placeholder="Descreva os detalhes do seu evento..."
                    maxLength={2500}
                    className="rounded-xl border-border min-h-[120px]"
                  />
                  <p className="text-[10px] text-muted-foreground pl-1">{formData.descricao.length}/2500</p>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vagas_totais">Vagas Totais (Máx: {plan.maxAttendeesPerEvent})</Label>
                    <Input 
                      id="vagas_totais" 
                      type="number" 
                      required 
                      max={plan.maxAttendeesPerEvent}
                      value={formData.vagas_totais}
                      onChange={e => setFormData({...formData, vagas_totais: Number(e.target.value)})}
                      className={`rounded-xl border-border ${formData.vagas_totais > plan.maxAttendeesPerEvent ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {formData.vagas_totais > plan.maxAttendeesPerEvent && (
                      <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Seu plano limita este campo a {plan.maxAttendeesPerEvent}
                      </p>
                    )}
                  </div>
                </div>

              </div>

              <div className="pt-8 border-t space-y-4">
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-xl gap-2 shadow-lg transition-all active:scale-95"
                >
                  {saving ? 'Salvando...' : (
                    <>
                      <Save className="w-5 h-5" />
                      Salvar Alterações
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="h-12 rounded-xl text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
                    onClick={handleToggleStatus}
                  >
                    {formData.ativo !== false ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Desativar Evento
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Ativar Evento
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline" 
                    className="h-12 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Evento
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Evento</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o evento <strong>{formData.nome}</strong>? Esta ação não pode ser desfeita e todos os dados associados serão perdidos.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteEvent} disabled={isDeleting}>
                {isDeleting ? 'Excluindo...' : 'Sim, excluir evento'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </>
  );
}

