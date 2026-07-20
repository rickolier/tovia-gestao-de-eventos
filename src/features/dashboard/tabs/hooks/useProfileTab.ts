import { useRef, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '~/services/firebase';
import { updateDocument } from '~/services/firestore';
import { useAuth } from '~/context/AuthContext';
import { toast } from 'sonner';
import { maskCEP, maskCPFouCNPJ, validateEmail, validateTelefone, validateCEP, fetchEnderecoByСEP } from '~/utils/validators';

export function useProfileTab() {
  const { user, profile, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [sendingReset, setSendingReset] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [publicPageEnabled, setPublicPageEnabled] = useState(!!profile?.pagina_publica);
  const [publicPageLoading, setPublicPageLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEmailUser = user?.providerData.some(p => p.providerId === 'password') ?? false;

  const publicPageUrl = profile?.codigo
    ? `${window.location.origin}/${profile.codigo}`
    : user ? `${window.location.origin}/o/${user.uid}` : '';

  const [formData, setFormData] = useState({
    nome: profile?.nome || '',
    instituicao: profile?.instituicao || '',
    cnpj: profile?.cnpj || '',
    bio: profile?.bio || '',
    descricao: profile?.descricao || '',
    telefone: profile?.telefone || '',
    site: profile?.site || '',
    contato_email: profile?.contato_email || '',
    instagram: profile?.redes_social?.instagram || '',
    link_importante_1: profile?.link_importante_1 || '',
    link_importante_2: profile?.link_importante_2 || '',
    imagem_url: profile?.imagem_url || '',
    cep: profile?.cep || '',
    endereco: profile?.endereco || '',
    numero: profile?.numero || '',
    complemento: profile?.complemento || '',
    bairro: profile?.bairro || '',
    cidade: profile?.cidade || '',
  });

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      const res = await fetch('/api/enviarRedefinicaoSenha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      if (!res.ok) throw new Error();
      toast.success(`E-mail de redefinição enviado para ${user.email}. Verifique sua caixa de entrada.`);
    } catch {
      toast.error('Não foi possível enviar o e-mail. Tente novamente.');
    } finally {
      setSendingReset(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem válida.'); return; }
    setCropSrc(URL.createObjectURL(file));
  };

  const handlePhotoCropComplete = async (croppedFile: File) => {
    setCropSrc(null);
    if (!user) return;
    setUploadingPhoto(true);
    try {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(croppedFile);
      });
      const fns = getFunctions(app, 'us-central1');
      const uploadFn = httpsCallable<unknown, { downloadUrl: string }>(fns, 'uploadProfilePhoto');
      const result = await uploadFn({ imageBase64, contentType: croppedFile.type || 'image/jpeg' });
      const url = result.data.downloadUrl;
      setFormData(prev => ({ ...prev, imagem_url: url }));
      await refreshProfile();
      toast.success('Foto atualizada!');
    } catch (err) {
      console.error('[upload foto]', err);
      toast.error('Erro ao fazer upload da foto. Tente novamente.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    setUploadingPhoto(true);
    try {
      await updateDocument('users', user.uid, { imagem_url: '' });
      setFormData(prev => ({ ...prev, imagem_url: '' }));
      await refreshProfile();
      toast.success('Foto removida!');
    } catch {
      toast.error('Erro ao remover foto.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCepChange = async (raw: string) => {
    const masked = maskCEP(raw);
    setFormData(prev => ({ ...prev, cep: masked }));
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 8) {
      setCepLoading(true);
      const addr = await fetchEnderecoByСEP(digits);
      setCepLoading(false);
      if (addr) {
        setFormData(prev => ({
          ...prev,
          endereco: addr.logradouro || prev.endereco,
          bairro: addr.bairro || prev.bairro,
          cidade: addr.localidade || prev.cidade,
        }));
        toast.success(`${addr.localidade} — ${addr.uf}`);
      } else {
        toast.error('CEP não encontrado.');
      }
    }
  };

  const handleTogglePublicPage = async () => {
    if (!user) return;
    const next = !publicPageEnabled;
    setPublicPageLoading(true);
    try {
      await updateDocument('users', user.uid, { pagina_publica: next });
      setPublicPageEnabled(next);
      await refreshProfile();
      toast.success(next ? 'Página pública ativada!' : 'Página pública desativada.');
    } catch (err: any) {
      const msg = err?.message ? String(err.message).slice(0, 120) : String(err).slice(0, 120);
      toast.error('Erro: ' + msg);
    } finally {
      setPublicPageLoading(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicPageUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isValidUrl = (url: string) => {
    if (!url) return true;
    try {
      const p = new URL(url);
      return p.protocol === 'http:' || p.protocol === 'https:';
    } catch { return false; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.nome.trim()) { toast.error('O nome do responsável é obrigatório.'); return; }
    if (formData.contato_email && !validateEmail(formData.contato_email)) {
      toast.error('E-mail de contato inválido.'); return;
    }
    if (formData.telefone && !validateTelefone(formData.telefone)) {
      toast.error('Telefone inválido. Use o formato (00) 00000-0000.'); return;
    }
    if (!isValidUrl(formData.site)) { toast.error('URL do website inválida. Use http:// ou https://'); return; }
    if (!isValidUrl(formData.link_importante_1)) { toast.error('Link Importante 1 inválido. Use http:// ou https://'); return; }
    if (!isValidUrl(formData.link_importante_2)) { toast.error('Link Importante 2 inválido. Use http:// ou https://'); return; }
    const docDigits = (formData.cnpj || '').replace(/\D/g, '');
    if (docDigits && docDigits.length !== 11 && docDigits.length !== 14) {
      toast.error('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos.'); return;
    }
    if (formData.cep && !validateCEP(formData.cep)) {
      toast.error('CEP inválido. Use o formato 00000-000.'); return;
    }
    setLoading(true);
    try {
      const { instagram, ...rest } = formData;
      await updateDocument('users', user.uid, {
        ...rest,
        redes_social: { instagram },
        updatedAt: new Date().toISOString(),
      });
      await refreshProfile();
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao atualizar perfil: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
