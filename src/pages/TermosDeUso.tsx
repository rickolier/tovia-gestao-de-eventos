import { ToviaLogo } from '~/components/ToviaLogo';
import React from 'react';
import { Link } from 'react-router-dom';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-lg font-black text-gray-900">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
  </section>
);

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <header className="bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity">
            <span className="text-sm font-light text-gray-400 tracking-tight">feito com</span>
            <ToviaLogo className="h-7 w-auto text-primary" />
          </Link>
          <Link to="/" className="text-xs font-black text-primary hover:underline">
            Voltar ao início →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Termos de Uso</h1>
          <p className="text-sm text-gray-400 mt-2">Última atualização: julho de 2026</p>
        </div>

        <Section title="1. Aceitação dos Termos">
          <p>
            Ao criar uma conta ou utilizar a plataforma <strong className="font-semibold text-gray-800">Tovia</strong>, você concorda com estes Termos de Uso. Se não concordar com qualquer parte destes termos, não utilize a plataforma.
          </p>
          <p>
            A Tovia é operada pela <strong className="font-semibold text-gray-800">BIGLAB Solutions</strong>. Dúvidas podem ser enviadas para: <a href="mailto:suporte@toviaapp.com.br" className="text-primary hover:underline font-semibold">suporte@toviaapp.com.br</a>
          </p>
        </Section>

        <Section title="2. O que é o Tovia">
          <p>
            O Tovia é uma plataforma de gestão de eventos voltada para igrejas, organizações e comunidades. Oferece ferramentas para criação de páginas de inscrição, gestão de participantes, controle financeiro manual e organização de equipes.
          </p>
          <p>
            <strong className="font-semibold text-gray-800">O Tovia não realiza cobranças de ingressos nem processa pagamentos de participantes.</strong> A plataforma registra manualmente pagamentos informados pelo organizador. A intermediação financeira com participantes é de responsabilidade exclusiva do organizador.
          </p>
        </Section>

        <Section title="3. Cadastro e Conta">
          <ul className="list-disc pl-5 space-y-1">
            <li>Você deve fornecer informações verdadeiras e atualizadas no cadastro.</li>
            <li>Você é responsável pela segurança da sua senha e de todas as atividades realizadas em sua conta.</li>
            <li>É proibido criar contas para fins fraudulentos, ilegais ou que violem estes Termos.</li>
            <li>A Tovia se reserva o direito de suspender ou encerrar contas que violem estes Termos.</li>
          </ul>
        </Section>

        <Section title="4. Planos e Pagamentos">
          <p>
            A Tovia oferece planos gratuitos e pagos. Os planos pagos são cobrados recorrentemente via cartão de crédito, Pix ou boleto, processados por nosso parceiro de pagamentos (Asaas).
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>O plano Chinám é gratuito e não requer cartão de crédito.</li>
            <li>Planos pagos podem ser cancelados a qualquer momento, sem multa ou fidelidade.</li>
            <li>O cancelamento encerra a cobrança no próximo ciclo; o acesso permanece até o fim do período já pago.</li>
            <li>Não realizamos estornos por períodos parcialmente utilizados.</li>
          </ul>
        </Section>

        <Section title="5. Uso Adequado da Plataforma">
          <p>Ao utilizar o Tovia, você concorda em não:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Utilizar a plataforma para fins ilegais, fraudulentos ou prejudiciais a terceiros.</li>
            <li>Coletar ou armazenar dados pessoais de participantes sem o consentimento adequado.</li>
            <li>Compartilhar o acesso à sua conta com terceiros não autorizados.</li>
            <li>Tentar acessar sistemas ou dados de outros usuários sem autorização.</li>
            <li>Publicar conteúdo ofensivo, discriminatório ou que viole direitos de terceiros.</li>
          </ul>
        </Section>

        <Section title="6. Dados dos Participantes">
          <p>
            Como organizador, ao coletar dados de participantes dos seus eventos por meio do Tovia, você assume a responsabilidade de controlador de dados perante a LGPD (Lei nº 13.709/2018). Você deve:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Informar os participantes sobre o uso dos dados coletados.</li>
            <li>Utilizá-los apenas para fins relacionados ao evento.</li>
            <li>Atender solicitações de acesso, correção ou exclusão feitas pelos participantes.</li>
          </ul>
          <p>
            A Tovia atua como operadora dos dados coletados via plataforma, conforme nossa{' '}
            <Link to="/privacidade" className="text-primary hover:underline font-semibold">Política de Privacidade</Link>.
          </p>
        </Section>

        <Section title="7. Propriedade Intelectual">
          <p>
            Todo o código, design, marca, logotipo e conteúdo da plataforma Tovia são de propriedade exclusiva da BIGLAB Solutions. É proibida a reprodução, cópia ou distribuição sem autorização expressa.
          </p>
          <p>
            Os dados e conteúdos inseridos pelos organizadores (eventos, formulários, participantes) permanecem de propriedade do próprio organizador.
          </p>
        </Section>

        <Section title="8. Disponibilidade e Limitação de Responsabilidade">
          <p>
            A Tovia se esforça para manter a plataforma disponível 24h por dia, mas não garante disponibilidade ininterrupta. Não nos responsabilizamos por:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Perdas decorrentes de interrupções ou falhas no serviço.</li>
            <li>Dados perdidos por falhas fora do nosso controle.</li>
            <li>Ações ou omissões de organizadores perante os participantes de seus eventos.</li>
          </ul>
        </Section>

        <Section title="9. Alterações nos Termos">
          <p>
            Podemos atualizar estes Termos periodicamente. Alterações significativas serão comunicadas por e-mail ou aviso na plataforma. O uso contínuo após as alterações implica aceitação dos novos Termos.
          </p>
        </Section>

        <Section title="10. Foro e Legislação Aplicável">
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de São Paulo — SP para dirimir quaisquer controvérsias.
          </p>
        </Section>

        <div className="pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Para dúvidas sobre estes Termos, entre em contato:{' '}
            <a href="mailto:suporte@toviaapp.com.br" className="text-primary hover:underline">suporte@toviaapp.com.br</a>
          </p>
        </div>
      </main>
    </div>
  );
}
