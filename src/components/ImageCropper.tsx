import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface Area { x: number; y: number; width: number; height: number; }

interface ImageCropperProps {
  imageSrc: string;
  aspect: number;         // ex: 16/9 ou 1
  onComplete: (file: File) => void;
  onCancel: () => void;
  outputWidth?: number;   // largura do canvas de saída
  outputHeight?: number;
  label?: string;
}

async function getCroppedImage(imageSrc: string, pixelCrop: Area, outputWidth: number, outputHeight: number): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    outputWidth, outputHeight,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) { reject(new Error('Canvas vazio')); return; }
      resolve(new File([blob], 'imagem.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  });
}

export default function ImageCropper({
  imageSrc, aspect, onComplete, onCancel,
  outputWidth = 1280, outputHeight = 720,
  label = 'Ajuste a imagem',
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const file = await getCroppedImage(imageSrc, croppedAreaPixels, outputWidth, outputHeight);
      onComplete(file);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-sm font-black text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Arraste para reposicionar · Use o zoom para ajustar</p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative w-full bg-black" style={{ height: 360 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: { border: '2px solid #1a7a45', borderRadius: 8 },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-5 py-3 border-t border-border bg-muted/30">
          <button onClick={() => setZoom(z => Math.max(1, z - 0.1))} className="text-muted-foreground hover:text-foreground transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="range" min={1} max={3} step={0.05}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="text-muted-foreground hover:text-foreground transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-muted-foreground w-10 text-right">{zoom.toFixed(1)}×</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
          <Button variant="ghost" onClick={onCancel} className="rounded-xl" disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2"
          >
            {loading
              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processando…</>
              : <><Check className="w-4 h-4" /> Confirmar</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
