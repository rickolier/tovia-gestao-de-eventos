import { listDocuments, updateDocument } from '~/services/firestore';
import type { Evento, EventoSnapshot, PaginaVenda } from '~/types';

export function buildEventoSnapshot(evento: Evento): EventoSnapshot {
  return {
    nome: evento.nome,
    data_inicio: evento.data_inicio,
    data_fim: evento.data_fim,
    local: evento.local,
    descricao: evento.descricao || '',
    imagem_url: evento.imagem_url || '',
    criado_por: evento.criado_por,
    cor_tema: evento.cor_tema || '',
  };
}

export async function syncEventoSnapshot(eventoId: string, snapshot: EventoSnapshot): Promise<void> {
  const paginas = await listDocuments<PaginaVenda>(`eventos/${eventoId}/paginas_venda`);
  await Promise.all(
    paginas.map(p => updateDocument(`eventos/${eventoId}/paginas_venda`, p.id, { evento_snapshot: snapshot })),
  );
}
