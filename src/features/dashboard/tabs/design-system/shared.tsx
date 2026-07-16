import React from 'react';

/* Helpers compartilhados pelas seções do Design System */

export function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mb-14 print:mb-10 print:break-inside-avoid">
      <div className="mb-6 pb-3 border-b-2 border-primary/20">
        <h2 className="text-xl font-black text-foreground tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2 text-center">{children}</p>;
}

export function SubLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">{children}</p>;
}

export function Swatch({ color, label, hex, textClass = 'text-white' }: { color: string; label: string; hex: string; textClass?: string }) {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-border shadow-sm">
      <div className={`h-20 flex items-end p-3 ${color}`}>
        <span className={`text-[10px] font-bold font-mono ${textClass}`}>{hex}</span>
      </div>
      <div className="bg-card px-3 py-2">
        <p className="text-xs font-semibold text-foreground">{label}</p>
      </div>
    </div>
  );
}

export function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/50 rounded-xl p-4 border border-border">
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  );
}

export function Code({ children }: { children: React.ReactNode }) {
  return <code className="bg-muted px-1 rounded text-[11px]">{children}</code>;
}
