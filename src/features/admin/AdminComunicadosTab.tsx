import React from 'react';
import { Megaphone } from 'lucide-react';

export default function AdminComunicadosTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-14 h-14 rounded-3xl bg-primary/10 flex items-center justify-center">
        <Megaphone className="w-7 h-7 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-black text-foreground">Comunicados</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Envie e-mails e notificações para seus clientes — em breve disponível.
        </p>
      </div>
      <span className="text-xs font-bold px-3 py-1 rounded-full bg-muted text-muted-foreground">Em desenvolvimento</span>
    </div>
  );
}
