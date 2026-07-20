import React, { useState } from 'react';
import { FileText, Download, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Doc {
  id: string;
  title: string;
  description: string;
  file: string;
  updatedAt: string;
}

const DOCS: Doc[] = [
  {
    id: 'produto',
    title: 'Documento de Produto',
    description: 'Visão completa do Tovia: produto, estratégia, infraestrutura, SWOT, planos, roadmap e app mobile.',
    file: '/docs/documento-produto.html',
    updatedAt: '2026-07-19',
  },
];

export default function AdminDocumentosTab() {
  const [viewing, setViewing] = useState<Doc | null>(null);

  const handleExportPdf = (doc: Doc) => {
    const win = window.open(doc.file, '_blank');
    if (win) {
      win.addEventListener('load', () => {
        const style = win.document.createElement('style');
        style.textContent = `
          @media print {
            body { background: #fff !important; color: #1a1a18 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .doc { padding: 24px !important; max-width: 100% !important; }
            .swot-cell.s { background: #e8f5ee !important; }
            .swot-cell.w { background: #fef2f2 !important; }
            .swot-cell.o { background: #eff6ff !important; }
            .swot-cell.t { background: #fffbeb !important; }
            .plan-card.chinam  { background: #f0f4f8 !important; }
            .plan-card.petach  { background: #fff2eb !important; }
            .plan-card.koach   { background: #e8f5ee !important; }
            .plan-card.chalem  { background: #fefbe8 !important; }
            * { color-scheme: light !important; }
          }
          @page { margin: 1.5cm; size: A4; }
        `;
        win.document.head.appendChild(style);
        setTimeout(() => win.print(), 300);
      });
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Documentos internos do Tovia. Visualize online ou exporte em PDF para compartilhar.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOCS.map(doc => (
          <div
            key={doc.id}
            className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground">{doc.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.description}</p>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Atualizado em {new Date(doc.updatedAt + 'T12:00:00').toLocaleDateString('pt-BR')}
            </div>
            <div className="flex gap-2 mt-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setViewing(doc)}
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Visualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleExportPdf(doc)}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Exportar PDF
              </Button>
            </div>
          </div>
        ))}
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
              <h2 className="text-sm font-bold text-foreground">{viewing.title}</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExportPdf(viewing)}>
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Exportar PDF
                </Button>
                <button
                  onClick={() => setViewing(null)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <iframe
              src={viewing.file}
              className="flex-1 w-full border-0"
              title={viewing.title}
            />
          </div>
        </div>
      )}
    </div>
  );
}
