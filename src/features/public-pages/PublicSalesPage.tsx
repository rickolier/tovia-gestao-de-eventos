import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDocument, listDocuments } from '~/services/firestore';
import { Evento, Ticket, PaginaVenda } from '~/types';
import { GlobeLock, Loader2 } from 'lucide-react';
import SalesPageContent from '~/features/public-pages/SalesPageContent';
import { where } from 'firebase/firestore';

export function PublicSalesPageByCodigo() {
  const { orgCodigo, eventoCodigo, paginaCodigo } = useParams<{ orgCodigo: string; eventoCodigo: string; paginaCodigo: string }>();
  const [eventoId, setEventoId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!eventoCodigo || !paginaCodigo) { setNotFound(true); return; }
    listDocuments<Evento>('eventos', [where('codigo', '==', eventoCodigo)])
      .then(results => {
        if (results.length === 0) { setNotFound(true); return; }
        setEventoId(results[0].id);
      })
      .catch(() => setNotFound(true));
  }, [eventoCodigo, paginaCodigo]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8 text-center">
        <GlobeLock className="w-16 h-16 text-muted-foreground/30" />
        <h1 className="text-2xl font-black text-foreground">Página não encontrada</h1>
        <p className="text-muted-foreground max-w-sm">Esta página de inscrição não existe ou está inativa.</p>
      </div>
    );
  }

  if (!eventoId) {
    return (
      <div className="min-h-screen bg-[#0C0720] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return <PublicSalesPageByEventoId eventoId={eventoId} paginaCodigo={paginaCodigo!} />;
}

function PublicSalesPageByEventoId({ eventoId, paginaCodigo }: { eventoId: string; paginaCodigo: string }) {
  const [loading, setLoading] = useState(true);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [pagina, setPagina] = useState<PaginaVenda | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [eventoData, paginasData] = await Promise.all([
          getDocument<Evento>('eventos', eventoId),
          listDocuments<PaginaVenda>(`eventos/${eventoId}/paginas_venda`),
        ]);
        if (!eventoData) { setLoading(false); return; }
        setEvento({ ...eventoData, id: eventoId });
        const pag = paginasData.find(p => p.codigo === paginaCodigo);
        if (!pag || !pag.ativa) { setLoading(false); return; }
        setPagina(pag);
        const allTickets = await listDocuments<Ticket>(`eventos/${eventoId}/tickets`);
        setTickets(allTickets.filter(t => pag.ticketIds.includes(t.id)));
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [eventoId, paginaCodigo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0C0720] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!evento || !pagina) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8 text-center">
        <GlobeLock className="w-16 h-16 text-muted-foreground/30" />
        <h1 className="text-2xl font-black text-foreground">Página não encontrada</h1>
        <p className="text-muted-foreground max-w-sm">Esta página de inscrição não existe ou está inativa.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <SalesPageContent evento={evento} pagina={pagina} tickets={tickets} eventoId={eventoId} />
    </div>
  );
}

export default function PublicSalesPage() {
  const { eventoId, slug } = useParams<{ eventoId: string; slug: string }>();
  const [loading, setLoading] = useState(true);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [pagina, setPagina] = useState<PaginaVenda | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    if (!eventoId || !slug) { setLoading(false); return; }
    (async () => {
      try {
        const [eventoData, paginasData] = await Promise.all([
          getDocument<Evento>('eventos', eventoId),
          listDocuments<PaginaVenda>(`eventos/${eventoId}/paginas_venda`),
        ]);
        if (!eventoData) { setLoading(false); return; }
        setEvento({ ...eventoData, id: eventoId });
        const pag = paginasData.find(p => p.slug === slug);
        if (!pag || !pag.ativa) { setLoading(false); return; }
        setPagina(pag);
        const allTickets = await listDocuments<Ticket>(`eventos/${eventoId}/tickets`);
        setTickets(allTickets.filter(t => pag.ticketIds.includes(t.id)));
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [eventoId, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0C0720] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!evento || !pagina) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8 text-center">
        <GlobeLock className="w-16 h-16 text-muted-foreground/30" />
        <h1 className="text-2xl font-black text-foreground">Página não encontrada</h1>
        <p className="text-muted-foreground max-w-sm">Esta página de inscrição não existe ou está inativa.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <SalesPageContent
        evento={evento}
        pagina={pagina}
        tickets={tickets}
        eventoId={eventoId!}
      />
    </div>
  );
}
