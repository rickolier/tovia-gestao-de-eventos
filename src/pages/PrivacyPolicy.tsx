import React from 'react';
import { Link } from 'react-router-dom';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-lg font-black text-gray-900">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
  </section>
);

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity">
            <span className="text-sm font-light text-gray-400 tracking-tight">feito com</span>
            <span className="font-logo font-bold text-2xl tracking-tight text-primary leading-none">tovia</span>
          </Link>
          <Link to="/" className="text-xs font-black text-primary hover:underline">
            Voltar ao início →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Política de Privacidade e Termos de Uso</h1>
          <p className="text-sm text-gray-400 mt-2">Última atualização: junho de 2026</p>
        </div>

        <Section title="1. Quem somos">
          <p>
            A <strong className="font-semibold text-gray-800">Tovia</strong> é uma plataforma de gestão e inscrição em eventos. Somos os controladores dos dados pessoais coletados nesta plataforma, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </p>
          <p>Para contato relacionado a dados pessoais: <a href="mailto:privacidade@toviaapp.com.br" className="text-primary hover:underline font-semibold">privacidade@toviaapp.com.br</a></p>
        </Section>

        <Section title="2. Quais dados coletamos">
          <p><strong className="font-semibold text-gray-800">Organizadores (usuários da plataforma):</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nome, e-mail e senha (para criação de conta)</li>
            <li>Dados de perfil: foto, cargo, bio, redes sociais, links (opcionais)</li>
            <li>Dados de contato: telefone, e-mail de contato, site (opcionais)</li>
            <li>Dados fiscais: CNPJ, endereço (para emissão de cobranças via Asaas)</li>
          </ul>
          <p className="pt-1"><strong className="font-semibold text-gray-800">Participantes de eventos:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nome, sobrenome e e-mail</li>
            <li>Telefone, gênero, estado civil e data de nascimento (quando exigidos pelo evento)</li>
            <li>Nome e telefone do responsável legal (obrigatório para menores de 18 anos)</li>
            <li>Respostas de formulários customizados definidos pelos organizadores</li>
          </ul>
        </Section>

        <Section title="3. Para que usamos seus dados">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="font-semibold text-gray-800">Prestação do serviço:</strong> criação de conta, gestão de eventos, processamento de inscrições</li>
            <li><strong className="font-semibold text-gray-800">Comunicações transacionais:</strong> confirmação de cadastro, inscrição e pagamento (você pode solicitar cancelamento)</li>
            <li><strong className="font-semibold text-gray-800">Processamento de pagamentos:</strong> enviamos dados fiscais ao gateway Asaas para gerar cobranças de planos</li>
            <li><strong className="font-semibold text-gray-800">Cumprimento legal:</strong> retenção de registros conforme exigido pela legislação brasileira</li>
          </ul>
        </Section>

        <Section title="4. Bases legais (LGPD Art. 7º e 11)">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="font-semibold text-gray-800">Consentimento (Art. 7º, I):</strong> coleta de dados em formulários de inscrição e cadastro de organizadores</li>
            <li><strong className="font-semibold text-gray-800">Execução de contrato (Art. 7º, V):</strong> processamento de inscrições e pagamentos de planos</li>
            <li><strong className="font-semibold text-gray-800">Cumprimento de obrigação legal (Art. 7º, II):</strong> retenção de dados fiscais e financeiros</li>
            <li><strong className="font-semibold text-gray-800">Legítimo interesse (Art. 7º, IX):</strong> segurança da plataforma e prevenção de fraudes</li>
          </ul>
        </Section>

        <Section title="5. Compartilhamento com terceiros">
          <p>Compartilhamos dados pessoais apenas com os seguintes parceiros, todos com medidas adequadas de proteção:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="font-semibold text-gray-800">Asaas</strong> (gateway de pagamento, Brasil) — recebe nome, CPF/CNPJ, endereço e telefone dos organizadores para processamento de assinaturas de planos.
            </li>
            <li>
              <strong className="font-semibold text-gray-800">Resend</strong> (serviço de e-mail, EUA) — recebe nome e e-mail para envio de comunicações transacionais.
            </li>
            <li>
              <strong className="font-semibold text-gray-800">Firebase / Google Cloud</strong> (infraestrutura, EUA) — todos os dados são armazenados em servidores Google com criptografia em trânsito e em repouso. O Google mantém adequações para transferência internacional de dados (Standard Contractual Clauses).
            </li>
            <li>
              <strong className="font-semibold text-gray-800">Vercel</strong> (hospedagem e funções serverless, EUA) — processa requisições da plataforma.
            </li>
          </ul>
          <p>Não vendemos nem compartilhamos seus dados com terceiros para fins publicitários.</p>
        </Section>

        <Section title="6. Dados de menores de 18 anos">
          <p>
            Conforme o Art. 14 da LGPD, o tratamento de dados pessoais de crianças e adolescentes exige consentimento específico de pelo menos um dos pais ou responsável legal. Quando um participante menor de 18 anos se inscreve em um evento, coletamos obrigatoriamente o nome e telefone do responsável legal.
          </p>
          <p>
            Organizadores que coletam dados de menores são responsáveis por obter e documentar o consentimento dos responsáveis legais antes do evento.
          </p>
        </Section>

        <Section title="7. Retenção de dados">
          <ul className="list-disc pl-5 space-y-1">
            <li>Dados de conta de organizadores: mantidos enquanto a conta estiver ativa. Após exclusão, excluídos em até 30 dias, salvo obrigações legais.</li>
            <li>Dados de inscrição em eventos: mantidos pelo organizador do evento pelo período que este definir.</li>
            <li>Dados fiscais (CNPJ, endereço para pagamentos): retidos por 5 anos conforme obrigações tributárias.</li>
          </ul>
        </Section>

        <Section title="8. Seus direitos (LGPD Art. 18)">
          <p>Você tem os seguintes direitos sobre seus dados pessoais:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="font-semibold text-gray-800">Acesso:</strong> solicitar confirmação e cópia dos dados que temos sobre você</li>
            <li><strong className="font-semibold text-gray-800">Correção:</strong> solicitar atualização de dados incompletos, inexatos ou desatualizados</li>
            <li><strong className="font-semibold text-gray-800">Eliminação:</strong> solicitar exclusão de dados tratados com base em consentimento</li>
            <li><strong className="font-semibold text-gray-800">Portabilidade:</strong> solicitar seus dados em formato estruturado</li>
            <li><strong className="font-semibold text-gray-800">Revogação do consentimento:</strong> retirar consentimento a qualquer momento</li>
            <li><strong className="font-semibold text-gray-800">Oposição:</strong> opor-se ao tratamento realizado com fundamento em legítimo interesse</li>
          </ul>
          <p>
            Para exercer seus direitos, entre em contato: <a href="mailto:privacidade@toviaapp.com.br" className="text-primary hover:underline font-semibold">privacidade@toviaapp.com.br</a>. Responderemos em até 15 dias úteis.
          </p>
        </Section>

        <Section title="9. Segurança">
          <p>
            Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo: criptografia em trânsito (HTTPS/TLS), controle de acesso baseado em autenticação Firebase, regras de acesso por coleção no Firestore e armazenamento de chaves de API exclusivamente em variáveis de ambiente seguras.
          </p>
        </Section>

        <Section title="10. Alterações nesta política">
          <p>
            Podemos atualizar esta política periodicamente. Notificaremos sobre alterações materiais por e-mail ou através de aviso na plataforma. O uso continuado da plataforma após as alterações implica aceitação da política revisada.
          </p>
        </Section>

        <Section title="11. Contato e encarregado (DPO)">
          <p>
            Para questões relacionadas a esta política ou ao tratamento de seus dados pessoais:<br />
            <a href="mailto:privacidade@toviaapp.com.br" className="text-primary hover:underline font-semibold">privacidade@toviaapp.com.br</a>
          </p>
          <p>
            Você também pode registrar reclamações perante a Autoridade Nacional de Proteção de Dados (ANPD): <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">www.gov.br/anpd</a>
          </p>
        </Section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white mt-8">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between gap-4 text-xs text-gray-400">
          <span>© 2026 Tovia. Todos os direitos reservados.</span>
          <Link to="/" className="font-black text-primary hover:underline">Ir para o início →</Link>
        </div>
      </footer>
    </div>
  );
}
