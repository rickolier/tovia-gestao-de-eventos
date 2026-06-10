import React from 'react';
import RoomsTab from './RoomsTab';

export default function CheckInAndRoomsTab({ eventoId }: { eventoId: string }) {
  return (
    <div className="space-y-6 text-foreground">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-foreground">Grupos</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Organize os participantes em grupos, mesas, quartos ou qualquer divisão que o evento precisar.</p>
      </div>
      <RoomsTab eventoId={eventoId} />
    </div>
  );
}
