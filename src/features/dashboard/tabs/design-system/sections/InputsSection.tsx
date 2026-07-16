import { Search, XCircle } from 'lucide-react';
import { Section } from '../shared';

export function InputsSection() {
  return (
    <Section title="10. Inputs & Formulários" subtitle="Campos de entrada e controles de formulário">
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Label do Campo</label>
            <input
              type="text"
              placeholder="Placeholder..."
              className="w-full h-10 px-3 text-sm bg-muted/60 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
            />
            <p className="text-[11px] text-muted-foreground">Texto de apoio / descrição do campo</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Com Ícone Interno</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full h-10 pl-9 pr-3 text-sm bg-muted/60 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Estado de Erro</label>
            <input
              type="text"
              defaultValue="valor inválido"
              className="w-full h-10 px-3 text-sm bg-red-50 border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300/50 text-foreground"
            />
            <p className="text-[11px] text-red-600 flex items-center gap-1"><XCircle className="w-3 h-3" /> Este campo é obrigatório</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Select / Dropdown</label>
            <select className="w-full h-10 px-3 text-sm bg-muted/60 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground appearance-none">
              <option>Selecione uma opção</option>
              <option>Plano 1 - Chinám</option>
              <option>Plano 2 - Pétach</option>
              <option>Plano 3 - Koách</option>
              <option>Plano 4 - Chalém</option>
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-foreground">Textarea</label>
            <textarea
              placeholder="Digite sua mensagem..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-muted/60 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/60 resize-none"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
