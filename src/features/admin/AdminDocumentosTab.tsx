import { FileText, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Doc {
  id: string;
  title: string;
  description: string;
  file: string;
  hasPreview: boolean;
  updatedAt: string;
  downloadFile?: string;
}

const DOCS: Doc[] = [
  {
    id: 'produto',
    title: 'Documento de Produto',
    description: 'Visão completa do Tovia: produto, estratégia, infraestrutura, SWOT, planos, roadmap e app mobile.',
    file: '/docs/documento-produto.html',
    hasPreview: true,
    updatedAt: '2026-09-03',
  },
  {
    id: 'codigos-erro',
    title: 'Códigos de Erro',
    description: '62 erros mapeados com códigos públicos (TV001…) e internos. 164 testes passando.',
    file: '/docs/codigos-erro.html',
    hasPreview: true,
    updatedAt: '2026-08-21',
  },
  {
    id: 'design-system',
    title: 'Design System',
    description: 'Paleta de cores, tipografia, componentes, espaçamento e padrões visuais do Tovia.',
    file: '/docs/tovia-design-system.html',
    hasPreview: true,
    updatedAt: '2026-07-20',
  },
  {
    id: 'mobile-spec',
    title: 'Tovia Mobile — Especificação',
    description: 'Spec completa do app mobile: telas, navegação, componentes, feature gating por plano.',
    file: '/docs/tovia-mobile-spec.html',
    hasPreview: true,
    downloadFile: '/docs/tovia-mobile-spec.md',
    updatedAt: '2026-07-24',
  },
  {
    id: 'arquitetura',
    title: 'Arquitetura Tovia',
    description: 'Mapa mental interativo da arquitetura completa. Visualize o mapa ou baixe os dados em JSON.',
    file: '/docs/arquitetura-tovia.html',
    hasPreview: true,
    downloadFile: '/docs/arquitetura-tovia.json',
    updatedAt: '2026-07-24',
  },
  {
    id: 'marketing-gtm',
    title: 'Marketing e Go-To-Market',
    description: 'Posicionamento, prospecção direta, gatilhos, conteúdo, pirâmide de distribuição e fases do GTM.',
    file: '/docs/marketing-gtm-tovia.html',
    hasPreview: true,
    updatedAt: '2026-09-03',
  },
  {
    id: 'kpis',
    title: 'KPIs e Métricas',
    description: 'North Star, funil de conversão, modelo financeiro, OKRs e metas por fase. Scorecard completo.',
    file: '/docs/kpis-tovia.html',
    hasPreview: true,
    updatedAt: '2026-09-03',
  },
  {
    id: 'backlog',
    title: 'Backlog Tovia',
    description: 'Pendências ativas: bugs, infra, produto, segurança, crescimento e escala. 29 itens pendentes.',
    file: '/docs/backlog-tovia.html',
    hasPreview: true,
    updatedAt: '2026-09-03',
  },
  {
    id: 'brandguide',
    title: 'Brand Guide — Checklist',
    description: 'Checklist interativo dos 12 capítulos do brand guide. Marque os itens conforme for desenvolvendo cada peça.',
    file: '/docs/brandguide-checklist.html',
    hasPreview: true,
    updatedAt: '2026-07-25',
  },
];

const SUPORTE_DOC_IDS = ['codigos-erro'];

export default function AdminDocumentosTab({ filterSupporte = false }: { filterSupporte?: boolean }) {
  const docs = filterSupporte ? DOCS.filter(d => SUPORTE_DOC_IDS.includes(d.id)) : DOCS;
  const handleView = (doc: Doc) => {
    window.open(doc.file, '_blank');
  };

  const handleDownload = (doc: Doc) => {
    const a = document.createElement('a');
    a.href = doc.file;
    a.download = doc.file.split('/').pop() || 'documento';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportPdf = (doc: Doc) => {
    const win = window.open(doc.file, '_blank');
    if (win) {
      win.addEventListener('afterprint', () => win.close());
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
        Documentos internos do Tovia. Visualize online, exporte em PDF ou baixe o arquivo.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map(doc => (
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
              {doc.hasPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => handleView(doc)}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Visualizar
                </Button>
              )}
              {doc.hasPreview && !doc.downloadFile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => handleExportPdf(doc)}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Exportar PDF
                </Button>
              )}
              {doc.downloadFile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => handleDownload({ ...doc, file: doc.downloadFile! })}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Baixar JSON
                </Button>
              )}
              {!doc.hasPreview && !doc.downloadFile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => handleDownload(doc)}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Baixar arquivo
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
