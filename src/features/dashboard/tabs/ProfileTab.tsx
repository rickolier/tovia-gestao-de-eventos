import React from 'react';
import ImageCropper from '~/components/ImageCropper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Phone, Globe, Instagram, Link as LinkIcon, Save, Image as ImageIcon, CreditCard, Camera, Copy, ExternalLink, Trash2, Loader2, MapPin, KeyRound, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PLAN_CONFIGS } from '~/utils/plan-limits';
import { maskTelefone } from '~/utils/validators';
import { useProfileTab } from './hooks/useProfileTab';

export default function ProfileTab() {
  const navigate = useNavigate();
  const {
    user, profile,
    loading, uploadingPhoto, cropSrc, setCropSrc,
    sendingReset, cepLoading,
    publicPageEnabled, publicPageLoading, copied,
    publicPageUrl, fileInputRef,
    isEmailUser,
    formData, setFormData,
    handlePasswordReset, handlePhotoSelect, handlePhotoCropComplete, handleRemovePhoto,
    handleCepChange, handleTogglePublicPage, handleCopyUrl,
    handleSubmit,
    maskCEP, maskCPFouCNPJ,
  } = useProfileTab();

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-foreground">
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          aspect={1}
          outputWidth={400}
          outputHeight={400}
          label="Recortar foto de perfil (1:1)"
          onComplete={handlePhotoCropComplete}
          onCancel={() => setCropSrc(null)}
        />
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black tracking-tight text-foreground">Perfil</h2>
          <p className="text-sm text-muted-foreground">Configure as informações públicas da sua instituição e perfil de produtor.</p>
        </div>
        {profile?.codigo && (
          <div className="shrink-0 flex flex-col items-end gap-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Código do produtor</p>
            <p className="text-2xl font-black text-primary tracking-widest">{profile.codigo}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden transition-colors">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <User className="w-5 h-5 text-primary" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex flex-col items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <div
                  className="w-32 h-32 bg-muted rounded-[2rem] flex items-center justify-center border-2 border-dashed border-border overflow-hidden relative group transition-all hover:border-primary/50 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.imagem_url ? (
                    <img src={formData.imagem_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                  )}
                  <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                    {uploadingPhoto ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium text-center">Clique para alterar a foto</span>
                {formData.imagem_url && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploadingPhoto}
                    className="flex items-center gap-1 text-[10px] text-destructive/70 hover:text-destructive font-medium transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remover foto
                  </button>
                )}
                <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-center max-w-[160px]">
                  <p className="text-[10px] text-amber-700 leading-snug font-medium">
                    Use o <strong>logo da sua instituição</strong> — ele aparece nas páginas de inscrição dos seus eventos.
                  </p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nome do Produtor/Responsável</Label>
                  <Input 
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                    placeholder="Seu nome completo"
                    className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nome da Instituição</Label>
                  <Input
                    value={formData.instituicao}
                    onChange={e => setFormData({...formData, instituicao: e.target.value})}
                    placeholder="Ex: Comunidade da Graça"
                    className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold"
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Bio Curta (Aparece abaixo do nome)</Label>
                  <Input 
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    placeholder="Ex: Transformando vidas através de eventos."
                    className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Descrição Detalhada</Label>
              <Textarea 
                value={formData.descricao}
                onChange={e => setFormData({...formData, descricao: e.target.value})}
                placeholder="Conte um pouco sobre sua história e missão..."
                maxLength={2500}
                className="rounded-2xl min-h-[140px] bg-muted/50 border-none focus-visible:ring-primary font-medium"
              />
              <p className="text-[10px] text-muted-foreground text-right">{formData.descricao.length}/2500</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden transition-colors">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Phone className="w-5 h-5 text-primary" />
              Contato e Redes Sociais
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> E-mail de Contato</Label>
                <Input 
                  value={formData.contato_email}
                  onChange={e => setFormData({...formData, contato_email: e.target.value})}
                  placeholder="contato@exemplo.com"
                  className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> Telefone/WhatsApp</Label>
                <Input
                  value={formData.telefone}
                  onChange={e => setFormData({...formData, telefone: maskTelefone(e.target.value)})}
                  placeholder="(00) 00000-0000"
                  className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Website</Label>
                <Input 
                  value={formData.site}
                  onChange={e => setFormData({...formData, site: e.target.value})}
                  placeholder="https://www.seusite.com"
                  className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold"
                />
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Instagram className="w-4 h-4 text-primary" /> Instagram</Label>
                <Input 
                  value={formData.instagram}
                  onChange={e => setFormData({...formData, instagram: e.target.value})}
                  placeholder="@usuario"
                  className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><LinkIcon className="w-4 h-4 text-primary" /> LINKS IMPORTANTES</Label>
                <div className="space-y-3">
                  <Input 
                    value={formData.link_importante_1}
                    onChange={e => setFormData({...formData, link_importante_1: e.target.value})}
                    placeholder="Link Importante 1"
                    className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold"
                  />
                  <Input 
                    value={formData.link_importante_2}
                    onChange={e => setFormData({...formData, link_importante_2: e.target.value})}
                    placeholder="Link Importante 2"
                    className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de faturamento */}
        <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <CreditCard className="w-5 h-5 text-primary" />
              Informações para Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            <p className="text-xs text-muted-foreground">Esses dados são usados para emitir cobranças e notas fiscais. CPF/CNPJ é obrigatório para assinar um plano.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">CPF / CNPJ *</Label>
                <Input value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: maskCPFouCNPJ(e.target.value)})} placeholder="000.000.000-00 ou 00.000.000/0001-00" className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> CEP
                </Label>
                <div className="relative">
                  <Input
                    value={formData.cep}
                    onChange={e => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold pr-10"
                  />
                  {cepLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">Preencha o CEP para auto-completar o endereço.</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Endereço</Label>
                <Input value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} placeholder="Rua, Avenida..." className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Número</Label>
                <Input value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} placeholder="Ex: 123" className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Complemento</Label>
                <Input value={formData.complemento} onChange={e => setFormData({...formData, complemento: e.target.value})} placeholder="Apto, Sala..." className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Bairro</Label>
                <Input value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} placeholder="Ex: Centro" className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cidade</Label>
                <Input value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} placeholder="Ex: São Paulo" className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Página Pública do Organizador */}
        <div>
          <div className="flex flex-col gap-1 mb-4">
            <h2 className="text-lg font-black tracking-tight text-foreground">Minha Página Pública</h2>
            <p className="text-sm text-muted-foreground">Ative para exibir seus eventos e contato a qualquer visitante, sem precisar de conta no Tovia.</p>
          </div>

          <Card className="border border-border rounded-2xl bg-card shadow-sm hover:shadow-md transition-all max-w-md">
            <div className={`h-1.5 rounded-t-2xl ${publicPageEnabled ? 'bg-primary' : 'bg-muted'}`} />
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-foreground">Página do Organizador</CardTitle>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${publicPageEnabled ? 'border-green-500/30 text-green-600 bg-green-50' : 'border-border text-muted-foreground bg-muted/40'}`}>
                      {publicPageEnabled ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate font-mono">
                    {profile?.codigo ? `/${profile.codigo}` : `/o/${user?.uid?.slice(0, 12)}...`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePublicPage}
                  disabled={publicPageLoading}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${publicPageEnabled ? 'bg-primary' : 'bg-muted-foreground/30'} ${publicPageLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${publicPageEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                {publicPageEnabled
                  ? 'Sua página está visível. O conteúdo vem das informações do seu perfil acima.'
                  : 'Ative para gerar o link público da sua página de organizador.'}
              </p>
              {publicPageEnabled && (
                <div className="flex gap-3 pt-1 border-t border-border/50">
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copiado!' : 'Copiar link'}
                  </button>
                  <a
                    href={publicPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pb-8">
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 px-16 font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-95 text-sm"
          >
            {loading ? 'Salvando...' : (
              <>
                <Save className="w-5 h-5 mr-3" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>

      {/* ── Segurança da Conta ── */}
      <div className="mt-2 mb-10">
        <div className="flex flex-col gap-1 mb-4">
          <h2 className="text-lg font-black tracking-tight text-foreground">Segurança da Conta</h2>
          <p className="text-sm text-muted-foreground">Gerencie como você acessa o Tovia.</p>
        </div>

        <Card className="border border-border rounded-2xl bg-card shadow-sm max-w-md">
          <CardContent className="px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {isEmailUser
                ? <KeyRound className="w-5 h-5 text-primary" />
                : <ShieldCheck className="w-5 h-5 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">
                {isEmailUser ? 'Senha de acesso' : 'Login com Google'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEmailUser
                  ? `Conta: ${user?.email}`
                  : 'Sua senha é gerenciada pelo Google. Para alterá-la, acesse as configurações da sua conta Google.'}
              </p>
            </div>
            {isEmailUser && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={sendingReset}
                onClick={handlePasswordReset}
                className="shrink-0 rounded-xl text-xs font-bold"
              >
                {sendingReset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Alterar senha'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
