import { Section, Swatch, SubLabel, InfoNote, Code } from '../shared';

export function CoresSection() {
  return (
    <Section title="02. Paleta de Cores" subtitle="Paleta v2 — roxo profundo como marca, laranja como ação, creme como fundo">
      <div className="space-y-6">
        <div>
          <SubLabel>Paleta Completa</SubLabel>
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
            <Swatch color="bg-[#1E0B4B]" label="Ink" hex="#1E0B4B" />
            <Swatch color="bg-[#2D1470]" label="Roxo" hex="#2D1470" />
            <Swatch color="bg-[#9B5FFF]" label="Violeta" hex="#9B5FFF" />
            <Swatch color="bg-[#FF6B1A]" label="Laranja" hex="#FF6B1A" />
            <Swatch color="bg-[#FFF4EE]" label="Pêssego" hex="#FFF4EE" textClass="text-[#FF6B1A]" />
            <Swatch color="bg-[#F5F0E8]" label="Creme" hex="#F5F0E8" textClass="text-muted-foreground" />
            <Swatch color="bg-white" label="Branco" hex="#ffffff" textClass="text-muted-foreground" />
          </div>
        </div>
        <div>
          <SubLabel>Ação e Destaque</SubLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Swatch color="bg-[#FF6B1A]" label="Primary" hex="#FF6B1A" />
            <Swatch color="bg-[#E55A08]" label="Primary Dark (hover)" hex="#E55A08" />
            <Swatch color="bg-[#9B5FFF]" label="Accent / Violeta" hex="#9B5FFF" />
            <Swatch color="bg-[#F0E8FF]" label="Accent Light" hex="#F0E8FF" textClass="text-[#9B5FFF]" />
          </div>
        </div>
        <div>
          <SubLabel>Neutros & Superfícies</SubLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Swatch color="bg-[#F5F0E8]" label="Background" hex="#F5F0E8" textClass="text-muted-foreground" />
            <Swatch color="bg-white" label="Card" hex="#ffffff" textClass="text-muted-foreground" />
            <Swatch color="bg-[#1E0B4B]" label="Foreground / Texto" hex="#1E0B4B" />
            <Swatch color="bg-[#6b5fa0]" label="Muted Foreground" hex="#6b5fa0" />
          </div>
        </div>
        <div>
          <SubLabel>Semânticas (Estado)</SubLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Swatch color="bg-emerald-500" label="Sucesso" hex="#10b981" />
            <Swatch color="bg-amber-400" label="Aviso" hex="#f59e0b" textClass="text-amber-900" />
            <Swatch color="bg-red-500" label="Erro / Destrutivo" hex="#ef4444" />
            <Swatch color="bg-blue-500" label="Info" hex="#3b82f6" />
          </div>
        </div>
        <InfoNote>
          <strong className="text-foreground">Regra:</strong> nunca use hex diretamente no código. Sempre use as variáveis CSS (<Code>var(--primary)</Code>) ou as classes do tema (<Code>bg-primary</Code>, <Code>text-accent</Code>). Os valores mudam entre light e dark — as variáveis garantem consistência automática.
        </InfoNote>
      </div>
    </Section>
  );
}
