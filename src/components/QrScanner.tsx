import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  scanning: boolean;
}

export default function QrScanner({ onScan, onClose, scanning }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerId = 'qr-reader';

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {},
      )
      .catch((err) => {
        if (err?.toString().includes('NotAllowedError')) {
          setError('Permissão da câmera negada. Libere o acesso nas configurações do navegador.');
        } else if (err?.toString().includes('NotFoundError')) {
          setError('Nenhuma câmera encontrada neste dispositivo.');
        } else {
          setError('Não foi possível acessar a câmera.');
        }
      });

    return () => {
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, [scanning, onScan]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-black">
      <div className="flex items-center justify-between bg-sidebar px-4 py-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          <span className="text-sm font-black text-white">Scanner QR Code</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error ? (
        <div className="p-6 flex flex-col items-center gap-3 bg-background">
          <AlertCircle className="w-10 h-10 text-destructive/60" />
          <p className="text-sm text-center text-muted-foreground">{error}</p>
        </div>
      ) : (
        <div
          id={containerId}
          className={cn('w-full aspect-square max-h-[320px]', !scanning && 'hidden')}
        />
      )}
    </div>
  );
}
