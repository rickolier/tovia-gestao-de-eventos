import React, { useEffect, useState } from 'react';
import { db } from '~/services/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Loader2, Users } from 'lucide-react';

interface Lead {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  instituicao: string;
  tipo_evento: string;
  tamanho_publico: string;
  criado_em: string;
  origem?: string;
}

export default function AdminLeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, 'leads'), orderBy('criado_em', 'desc')))
      .then(snap => setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead))))
      .finally(() => setLoading(false));
  }, []);

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground">Formulários preenchidos na landing page</p>
        </div>
        {!loading && (
          <span className="ml-auto text-xs font-semibold bg-orange-50 text-primary px-3 py-1 rounded-full">
            {leads.length} leads
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          Nenhum lead ainda.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-left">
                <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Data</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Nome</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">E-mail</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">WhatsApp</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Instituição</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Tipo de Evento</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Público</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{formatDate(lead.criado_em)}</td>
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{lead.nome}</td>
                  <td className="px-4 py-3 text-foreground">{lead.email}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{lead.whatsapp}</td>
                  <td className="px-4 py-3 text-foreground">{lead.instituicao}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{lead.tipo_evento}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{lead.tamanho_publico}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
