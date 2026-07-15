import React, { useState } from 'react';
import { Globe, Heart, CheckSquare, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEMO_TABS } from '../data';
import { MockupVendas, MockupDoacoes, MockupTarefas } from '../mockups';

export function DemoMockups() {
  const [demoTab, setDemoTab] = useState('vendas');

  return (
    <section id="funcionalidades" className="pt-8 pb-4 px-6 bg-[#e6f4ec]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Veja na prática</span>
          <h2 className="text-4xl font-black text-foreground tracking-tight mt-3">
            Funcionalidades que fazem<br />a diferença no dia a dia
          </h2>
          <p className="text-muted-foreground mt-3 text-sm max-w-lg mx-auto">
            Veja como o Tovia simplifica as partes mais trabalhosas de organizar um evento.
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          {DEMO_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setDemoTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  demoTab === tab.id
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 max-w-md">
            {demoTab === 'vendas' && (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
                  <Globe className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-4">Páginas de Inscrição prontas para compartilhar</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Cada evento ganha uma página pública com link próprio. Configure ingressos gratuitos ou pagos, personalize o formulário e acompanhe as inscrições chegando em tempo real.
                </p>
                <ul className="space-y-3">
                  {['Link único por evento', 'Ingressos gratuitos ou pagos', 'Formulários personalizados', 'Contador de vagas ao vivo'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {demoTab === 'doacoes' && (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center mb-5">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-4">Controle de Doações</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Registre doações livres — que entram direto no caixa do evento — ou vincule uma doação a um inscrito para cobrir o valor da inscrição dele. Tudo visível, tudo rastreado, tudo no caixa do evento.
                </p>
                <ul className="space-y-3">
                  {['Doações livres ou vinculadas a inscritos', 'Saldo atualizado automaticamente', 'Histórico e status por doação', '100% do valor vai para o seu caixa'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {demoTab === 'tarefas' && (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-5">
                  <CheckSquare className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-4">Gestão de Tarefas da Equipe</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Crie tarefas, atribua responsáveis e acompanhe o progresso de cada etapa do evento. Nada fica esquecido, e toda a equipe sabe o que precisa fazer.
                </p>
                <ul className="space-y-3">
                  {['Tarefas com responsável e prazo', 'Progresso visual em tempo real', 'Prioridades e categorias', 'Visão geral da equipe'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex-1 flex justify-center">
            {demoTab === 'vendas' && <MockupVendas />}
            {demoTab === 'doacoes' && <MockupDoacoes />}
            {demoTab === 'tarefas' && <MockupTarefas />}
          </div>
        </div>
      </div>
    </section>
  );
}
