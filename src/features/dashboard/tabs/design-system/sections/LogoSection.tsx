import { ToviaLogo } from '../../../../../components/ToviaLogo';
import { ToviaLogoMeow } from '../../../../../components/ToviaLogoMeow';
import { Section, Label, SubLabel, InfoNote, Code } from '../shared';

export function LogoSection() {
  return (
    <Section title="01. Logo & Marca" subtitle="Versões e aplicações do logotipo Tovia">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Default */}
        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <ToviaLogo className="h-8 w-auto text-primary" />
            <div className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground border-l border-border pl-3 leading-tight">
              Gestão de<br />Eventos
            </div>
          </div>
          <Label>Versão Principal — Fundo Claro</Label>
        </div>
        {/* Dark bg */}
        <div className="bg-[#2D1470] border border-border rounded-2xl p-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <ToviaLogo className="h-8 w-auto text-white" />
            <div className="text-[10px] font-semibold tracking-widest uppercase text-white/50 border-l border-white/20 pl-3 leading-tight">
              Gestão de<br />Eventos
            </div>
          </div>
          <Label>Versão Fundo Escuro</Label>
        </div>
        {/* Wordmark only */}
        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-4">
          <ToviaLogo className="h-10 w-auto text-primary" />
          <Label>Wordmark Isolado</Label>
        </div>
      </div>

      <div className="mt-4">
        <InfoNote>
          <strong className="text-foreground">Logo SVG vetorial:</strong> Arquivo <Code>logo-tovia.svg</Code> com <Code>fill="currentColor"</Code> — a cor é controlada via CSS (<Code>text-primary</Code>, <Code>text-white</Code>, etc.). Componente React: <Code>{'<ToviaLogo />'}</Code>. Nunca distorcer proporções ou usar em versão capitalizada.
        </InfoNote>
      </div>

      {/* Logo manuscrito decorativo */}
      <div className="mt-8">
        <SubLabel>Logo Manuscrito — Decorativo</SubLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-3">
            <ToviaLogoMeow className="h-20 w-auto text-primary" />
            <Label>Primário — Fundo Claro</Label>
          </div>
          <div className="bg-[#1E0B4B] border border-border rounded-2xl p-8 flex flex-col items-center gap-3">
            <ToviaLogoMeow className="h-20 w-auto text-[#F5F0E8]" />
            <Label>Cream — Fundo Escuro</Label>
          </div>
          <div className="bg-[#2D1470] border border-border rounded-2xl p-8 flex flex-col items-center gap-3">
            <ToviaLogoMeow className="h-20 w-auto text-primary" />
            <Label>Primário — Fundo Sidebar</Label>
          </div>
        </div>
        <div className="mt-4">
          <InfoNote>
            <strong className="text-foreground">Arquivo SVG — não é uma fonte.</strong> Fonte: <Code>logo-tovia-meow.svg</Code>, componente <Code>{'<ToviaLogoMeow />'}</Code> com <Code>fill="currentColor"</Code>. Uso exclusivo como elemento decorativo do logo manuscrito — nunca em corpo de texto, botões ou UI.
          </InfoNote>
        </div>
      </div>
    </Section>
  );
}
