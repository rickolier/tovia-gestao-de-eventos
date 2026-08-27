import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FAQ_ITEMS } from '../data';

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-16 px-6 bg-primary relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
      <div className="max-w-3xl mx-auto relative">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/60">FAQ</span>
          <h2 className="text-4xl font-black text-white tracking-tight mt-3">Perguntas frequentes</h2>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border border-white/20 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm">
              <button
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/10 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-white text-sm pr-4">{item.q}</span>
                <ChevronDown className={cn('w-4 h-4 text-white/60 shrink-0 transition-transform', open === i && 'rotate-180')} />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-white/80 leading-relaxed border-t border-white/20 pt-4">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
