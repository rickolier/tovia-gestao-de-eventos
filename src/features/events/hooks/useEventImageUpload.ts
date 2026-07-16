import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '~/services/firebase';
import { toast } from 'sonner';

export function useEventImageUpload(initialUrl = '') {
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(initialUrl || null);
  const [imagemErro, setImagemErro] = useState<string | null>(null);
  const [uploadProgresso, setUploadProgresso] = useState<number | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const handleImagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImagemErro(null);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setImagemErro('Formato inválido. Use PNG, JPEG ou WebP.');
      return;
    }
    setCropSrc(URL.createObjectURL(file));
  };

  const handleCropComplete = (croppedFile: File) => {
    setImagemFile(croppedFile);
    setImagemPreview(URL.createObjectURL(croppedFile));
    setCropSrc(null);
  };

  const clearImagem = () => {
    setImagemFile(null);
    setImagemPreview(null);
    setImagemErro(null);
    setUploadProgresso(null);
  };

  const uploadImagem = async (eventoId: string, fallbackUrl = ''): Promise<string> => {
    if (!imagemFile) return fallbackUrl;
    setUploadProgresso(10);
    const imageBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(imagemFile);
    });
    setUploadProgresso(40);
    const fns = getFunctions(app, 'us-central1');
    const uploadCover = httpsCallable<unknown, { downloadUrl: string }>(fns, 'uploadEventCover');
    const result = await uploadCover({ eventoId, imageBase64, contentType: imagemFile.type });
    setUploadProgresso(100);
    const url = result.data.downloadUrl;
    return url.includes('?t=') ? url : `${url}?t=${Date.now()}`;
  };

  return {
    imagemFile,
    imagemPreview, setImagemPreview,
    imagemErro,
    uploadProgresso,
    cropSrc, setCropSrc,
    handleImagemChange,
    handleCropComplete,
    clearImagem,
    uploadImagem,
  };
}
