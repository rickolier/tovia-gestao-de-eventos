import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface SwipeRowProps {
  children: React.ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  rightLabel?: string;
  leftLabel?: string;
  rightColor?: string;
  leftColor?: string;
  disabled?: boolean;
}

const THRESHOLD = 80;

export default function SwipeRow({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = 'Confirmar',
  leftLabel = 'Desmarcar',
  rightColor = 'bg-green-500',
  leftColor = 'bg-red-500',
  disabled = false,
}: SwipeRowProps) {
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const [offset, setOffset] = useState(0);
  const rowRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    swiping.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping.current) return;
    currentX.current = e.touches[0].clientX;
    let dx = currentX.current - startX.current;

    if (!onSwipeRight && dx > 0) dx = 0;
    if (!onSwipeLeft && dx < 0) dx = 0;

    const clamped = Math.max(-160, Math.min(160, dx));
    setOffset(clamped);
  };

  const handleTouchEnd = () => {
    if (!swiping.current) return;
    swiping.current = false;

    if (offset > THRESHOLD && onSwipeRight) {
      onSwipeRight();
    } else if (offset < -THRESHOLD && onSwipeLeft) {
      onSwipeLeft();
    }
    setOffset(0);
  };

  const rightProgress = Math.min(1, Math.max(0, offset / THRESHOLD));
  const leftProgress = Math.min(1, Math.max(0, -offset / THRESHOLD));

  return (
    <div className="relative overflow-hidden">
      {/* Fundo direito (swipe right → confirmar) */}
      {onSwipeRight && (
        <div
          className={cn('absolute inset-y-0 left-0 flex items-center pl-5 transition-opacity', rightColor)}
          style={{ width: Math.max(0, offset), opacity: rightProgress }}
        >
          <span className={cn(
            'text-xs font-black uppercase tracking-widest text-white transition-transform',
            rightProgress >= 1 ? 'scale-110' : 'scale-100',
          )}>
            {rightLabel}
          </span>
        </div>
      )}

      {/* Fundo esquerdo (swipe left → desmarcar) */}
      {onSwipeLeft && (
        <div
          className={cn('absolute inset-y-0 right-0 flex items-center justify-end pr-5 transition-opacity', leftColor)}
          style={{ width: Math.max(0, -offset), opacity: leftProgress }}
        >
          <span className={cn(
            'text-xs font-black uppercase tracking-widest text-white transition-transform',
            leftProgress >= 1 ? 'scale-110' : 'scale-100',
          )}>
            {leftLabel}
          </span>
        </div>
      )}

      {/* Conteúdo */}
      <div
        ref={rowRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative bg-background transition-transform"
        style={{
          transform: `translateX(${offset}px)`,
          transitionDuration: swiping.current ? '0ms' : '200ms',
        }}
      >
        {children}
      </div>
    </div>
  );
}
