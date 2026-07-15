import { TicketIcon, DollarSign, Wallet, Globe, Users, BarChart3, Heart, CheckSquare } from 'lucide-react';

export const NAV_LINKS = [
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Para quem é', href: '#para-quem' },
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Planos', href: '#planos' },
];

export const NAV_ROUTE_LINKS: { label: string; to: string }[] = [];

export const FEATURES = [
  {
    icon: TicketIcon,
    title: 'Ingressos & Inscrições',
    description: 'Crie ingressos gratuitos ou pagos, configure vagas e colete os dados que precisar no formulário de inscrição.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Globe,
    title: 'Páginas de Inscrição',
    description: 'Cada evento ganha uma página pública com link próprio — você cria, personaliza e compartilha em minutos, direto no Tovia.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Users,
    title: 'Gestão de Participantes',
    description: 'Visualize inscrições em tempo real, filtre por status ou tipo de ingresso, aplique cupons de desconto e faça check-in diretamente pela plataforma.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: DollarSign,
    title: 'Controle Financeiro',
    description: 'Registre entradas, saídas e doações por categoria e acompanhe o saldo do evento em tempo real. No Plano 4 - Chalém, conecte seu próprio gateway e receba PIX, boleto e cartão direto na sua conta.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Wallet,
    title: 'Gestão do Evento',
    description: 'Organize tarefas com responsáveis e prazos, gerencie recursos como quartos e grupos de hospedagem e mantenha sua equipe alinhada em um só lugar.',
    color: 'bg-pink-50 text-pink-600',
  },
  {
    icon: BarChart3,
    title: 'Relatórios',
    description: 'Acompanhe os principais indicadores do seu evento: total de inscrições, receita, taxa de ocupação, crescimento e distribuição de público, com filtros por evento e período.',
    color: 'bg-amber-50 text-amber-600',
  },
];

export const DEMO_TABS = [
  { id: 'vendas', label: 'Páginas de Inscrição', icon: Globe },
  { id: 'doacoes', label: 'Doações', icon: Heart },
  { id: 'tarefas', label: 'Tarefas', icon: CheckSquare },
];

export const FAQ_ITEMS = [
  {
    q: 'O que é o Tovia?',
    a: 'O Tovia é uma plataforma de gestão de eventos — você cria páginas de inscrição, gerencia participantes, controla o financeiro, organiza sua equipe e faz o check-in no dia do evento, tudo centralizado em um único lugar.',
  },
  {
    q: 'Para quem é o Tovia?',
    a: 'Para qualquer organização que realiza eventos com propósito: igrejas, ministérios, retiros, conferências, ONGs, cursos e treinamentos. Se você precisa receber inscrições e organizar pessoas, o Tovia foi feito para você.',
  },
  {
    q: 'Como o participante se inscreve no meu evento?',
    a: 'Você cria uma página de inscrição pública com link próprio e compartilha onde quiser. O participante acessa o link, preenche o formulário e recebe a confirmação por e-mail com os dados da inscrição e um QR Code para o check-in.',
  },
  {
    q: 'Posso cobrar pelos ingressos?',
    a: 'Sim. No Plano 2 - Pétach você define o valor dos ingressos e registra os pagamentos manualmente (Pix, dinheiro, transferência). No Plano 4 - Chalém você conecta seu próprio gateway de pagamento e os participantes pagam online — com PIX, boleto ou cartão.',
  },
  {
    q: 'O dinheiro das inscrições passa pelo Tovia?',
    a: 'O dinheiro vai direto para a sua conta. No Plano 2 - Pétach, você recebe pelos seus próprios meios e registra no painel. No Plano 4 - Chalém, você conecta seu próprio gateway (como o Asaas) — as transações acontecem entre o participante e o seu gateway, com o valor caindo direto na sua conta.',
  },
  {
    q: 'O que dá para controlar financeiramente?',
    a: 'Entradas, saídas e doações por categoria, com saldo atualizado em tempo real. As doações podem ser livres — vão direto para o caixa — ou vinculadas a um inscrito, para cobrir o valor da inscrição dele. Tudo comparado com o custo previsto do evento.',
  },
  {
    q: 'Como funciona o check-in no dia do evento?',
    a: 'Cada inscrito recebe um QR Code por e-mail na confirmação. Na entrada do evento, abra o Tovia em qualquer celular ou tablet e escaneie o código — a presença é confirmada na hora. Se o participante não tiver o QR Code, é possível buscar pelo nome.',
  },
  {
    q: 'O Tovia tem um plano gratuito?',
    a: 'Sim. O Plano 1 - Chinám é gratuito para sempre — cadastre-se agora e já comece a organizar. Você cria até 1 evento com até 100 participantes e 1 ingresso gratuito. Quando crescer, é só fazer upgrade para o Plano 2 - Pétach ou superior.',
  },
];
