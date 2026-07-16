import { Plus, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section, Label, SubLabel } from '../shared';

export function BotoesSection() {
  return (
    <Section title="06. Botões" subtitle="Primary (laranja, ação principal) e Accent (violeta, destaque secundário) — sempre cursor-pointer">
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-8">
        <div>
          <SubLabel>Variantes</SubLabel>
          <div className="flex flex-wrap gap-3 mt-2">
            <div className="flex flex-col items-center gap-2">
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl">Primary</Button>
              <Label>Primary</Label>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button className="bg-accent hover:bg-accent/90 text-white rounded-xl">Accent</Button>
              <Label>Accent</Label>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button variant="secondary" className="rounded-xl">Secondary</Button>
              <Label>Secondary</Label>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button variant="outline" className="rounded-xl">Outline</Button>
              <Label>Outline</Label>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button variant="ghost" className="rounded-xl">Ghost</Button>
              <Label>Ghost</Label>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button variant="destructive" className="rounded-xl">Destrutivo</Button>
              <Label>Destructive</Label>
            </div>
          </div>
        </div>

        <div>
          <SubLabel>Tamanhos</SubLabel>
          <div className="flex flex-wrap gap-3 items-end mt-2">
            <div className="flex flex-col items-center gap-2">
              <Button size="lg" className="bg-primary text-white rounded-xl">Large</Button>
              <Label>lg</Label>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button className="bg-primary text-white rounded-xl">Default</Button>
              <Label>default</Label>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button size="sm" className="bg-primary text-white rounded-xl">Small</Button>
              <Label>sm</Label>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button size="icon" className="bg-primary text-white rounded-xl"><Plus className="w-4 h-4" /></Button>
              <Label>icon</Label>
            </div>
          </div>
        </div>

        <div>
          <SubLabel>Com Ícone</SubLabel>
          <div className="flex flex-wrap gap-3 mt-2">
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Novo Evento
            </Button>
            <Button className="bg-accent hover:bg-accent/90 text-white rounded-xl gap-2">
              <Download className="w-4 h-4" /> Exportar
            </Button>
            <Button variant="outline" className="rounded-xl gap-2">
              <Search className="w-4 h-4" /> Buscar
            </Button>
          </div>
        </div>

        <div>
          <SubLabel>Estados</SubLabel>
          <div className="flex flex-wrap gap-3 mt-2">
            <div className="flex flex-col items-center gap-2">
              <Button className="bg-primary text-white rounded-xl">Normal</Button>
              <Label>Normal</Label>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button disabled className="rounded-xl">Desabilitado</Button>
              <Label>Disabled</Label>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button className="bg-primary text-white rounded-xl opacity-70 cursor-wait">
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Carregando
              </Button>
              <Label>Loading</Label>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
