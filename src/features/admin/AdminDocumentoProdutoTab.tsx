import React, { useRef, useState, useEffect } from 'react';
import { FileDown } from 'lucide-react';

export default function AdminDocumentoProdutoTab() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [html, setHtml] = useState('');

  useEffect(() => {
    fetch('/documento-produto.html')
      .then(r => r.text())
      .then(setHtml)
      .catch(() => setHtml('<p style="padding:2rem;color:#666">Erro ao carregar documento.</p>'));
  }, []);

  const handleExport = () => {
    iframeRef.current?.contentWindow?.print();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Documento interno — visão completa do produto, estratégia e infraestrutura.
        </p>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <FileDown className="w-4 h-4" />
          Exportar PDF
        </button>
      </div>
      <iframe
        ref={iframeRef}
        srcDoc={html}
        title="Documento de Produto e Estratégia"
        className="w-full border border-border rounded-xl"
        style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}
      />
    </div>
  );
}
