import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { updateDocument } from '../../lib/firebase-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Phone, Globe, Instagram, Link as LinkIcon, Save, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileTab() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: profile?.nome || '',
    instituicao: profile?.instituicao || '',
    bio: profile?.bio || '',
    descricao: profile?.descricao || '',
    telefone: profile?.telefone || '',
    site: profile?.site || '',
    contato_email: profile?.contato_email || '',
    instagram: profile?.redes_social?.instagram || '',
    link_importante_1: profile?.link_importante_1 || '',
    link_importante_2: profile?.link_importante_2 || '',
    imagem_url: profile?.imagem_url || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      await updateDocument('users', user.uid, {
        ...formData,
        redes_social: {
          instagram: formData.instagram
        }
      });
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-foreground">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-foreground tracking-tight">Perfil</h2>
        <p className="text-muted-foreground">Configure as informações públicas da sua instituição e perfil de produtor.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden transition-colors">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-lg font-black flex items-center gap-2 text-foreground">
              <User className="w-5 h-5 text-primary" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 bg-muted rounded-[2rem] flex items-center justify-center border-2 border-dashed border-border overflow-hidden relative group transition-all hover:border-primary/50">
                  {formData.imagem_url ? (
                    <img src={formData.imagem_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-muted/30" />
                  )}
                  <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Alterar</span>
                  </div>
                </div>
                <Input 
                  placeholder="URL da Imagem" 
                  value={formData.imagem_url}
                  onChange={e => setFormData({...formData, imagem_url: e.target.value})}
                  className="text-[10px] h-8 rounded-lg bg-muted/50 border-none focus-visible:ring-primary"
                />
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nome do Produtor/Responsável</Label>
                  <Input 
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                    placeholder="Seu nome completo"
                    className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nome da Instituição</Label>
                  <Input 
                    value={formData.instituicao}
                    onChange={e => setFormData({...formData, instituicao: e.target.value})}
                    placeholder="Ex: Comunidade da Graça"
                    className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold"
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Bio Curta (Aparece abaixo do nome)</Label>
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
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Descrição Detalhada</Label>
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
            <CardTitle className="text-lg font-black flex items-center gap-2 text-foreground">
              <Phone className="w-5 h-5 text-primary" />
              Contato e Redes Sociais
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> E-mail de Contato</Label>
                <Input 
                  value={formData.contato_email}
                  onChange={e => setFormData({...formData, contato_email: e.target.value})}
                  placeholder="contato@exemplo.com"
                  className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> Telefone/WhatsApp</Label>
                <Input 
                  value={formData.telefone}
                  onChange={e => setFormData({...formData, telefone: e.target.value})}
                  placeholder="(00) 00000-0000"
                  className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Website</Label>
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
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Instagram className="w-4 h-4 text-primary" /> Instagram</Label>
                <Input 
                  value={formData.instagram}
                  onChange={e => setFormData({...formData, instagram: e.target.value})}
                  placeholder="@usuario"
                  className="rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><LinkIcon className="w-4 h-4 text-primary" /> LINKS IMPORTANTES</Label>
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
    </div>
  );
}
