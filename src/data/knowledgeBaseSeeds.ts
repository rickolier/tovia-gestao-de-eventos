import { ArtigoBC } from '../types';

const NOW = new Date().toISOString();

export const SEED_ARTIGOS: ArtigoBC[] = [
  {
    id: 'bem-vindo',
    slug: 'bem-vindo',
    ordem: 1,
    titulo: 'Bem-vindo ao Tovia!',
    resumo: 'Conheça a plataforma de gestão de eventos do Tovia e saiba como ela pode transformar a organização dos seus eventos.',
    tags: ['introdução', 'visão geral', 'plataforma'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=80&auto=format&fit=crop',
    conteudo: `O Tovia é uma plataforma completa de gestão de eventos, desenvolvida para igrejas, ministérios, conferências e qualquer organização que precise organizar eventos com inscrições, pagamentos e equipe.

A plataforma foi criada para simplificar o que normalmente é complicado: receber inscrições, controlar pagamentos, gerenciar participantes e coordenar a equipe — tudo em um só lugar, sem precisar de planilhas ou ferramentas separadas.

Ao acessar o Tovia, você encontrará uma barra lateral com as principais seções: Início (seus eventos), Meu Perfil, Agenda, Calculadora, Relatórios e Faturamento. Cada evento criado tem suas próprias abas internas: Visão Geral, Ingressos, Páginas de Inscrição, Participantes e outras funcionalidades conforme o plano contratado.

O Tovia é organizado em quatro planos com nomes em hebraico:
• Chinám (חינם) — gratuito, permanente. Ideal para começar.
• Pétach (פֶּתַח) — R$49/mês. Abre o controle financeiro e pagamentos manuais.
• Koách (כֹּחַ) — R$129/mês. Força total: equipe, grupos e tarefas.
• Chalém (שָׁלֵם) — R$299/mês. Completo: pagamentos automáticos e inscritos ilimitados.

Todo usuário começa com o plano Chinám e pode fazer upgrade conforme o evento crescer. Membros de equipe convidados por um organizador também recebem o plano Chinám gratuitamente — eles acessam o evento específico onde foram adicionados, com as permissões que o organizador definiu.

Explore cada seção usando o tutorial guiado ou consulte esta Base de Conhecimento sempre que precisar entender melhor alguma funcionalidade. Boas organizações de eventos!`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'perfil',
    slug: 'perfil',
    ordem: 2,
    titulo: 'Complete o seu perfil!',
    resumo: 'Adicione logo, nome da sua organização e dados de contato. Essas informações aparecem nas páginas de inscrição e nos e-mails enviados aos participantes.',
    tags: ['perfil', 'organização', 'configuração'],
    autor: 'Equipe Tovia',
    banner_url: 'https://plus.unsplash.com/premium_photo-1752230474021-5749c334925a?w=1200&q=80&auto=format&fit=crop',
    conteudo: `O perfil da sua organização é a identidade que aparece em todos os pontos de contato com os participantes: nas páginas de inscrição, nos e-mails de confirmação e na página pública da organização.

Para configurar seu perfil, acesse a aba Meu Perfil na barra lateral. Lá você pode adicionar o nome da organização, logo, bio, contatos (e-mail, WhatsApp, site), endereço e redes sociais.

A logo é especialmente importante: ela aparece no topo das páginas de inscrição e nos e-mails enviados aos participantes, transmitindo profissionalismo e identidade visual ao seu evento.

O campo de descrição permite apresentar sua organização para os participantes que chegam pela página de inscrição sem conhecê-la previamente. Use-o para explicar quem vocês são e o que fazem.

Você também pode ativar uma página pública da organização, acessível por um link único (tovia.app/o/seu-usuario), que lista todos os seus eventos públicos. Essa página é uma vitrine para quem quiser conhecer o trabalho da sua organização.

Manter o perfil atualizado garante que as informações de contato nos e-mails automáticos estejam sempre corretas — isso evita que participantes fiquem sem resposta quando tiverem dúvidas.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'agenda',
    slug: 'agenda',
    ordem: 3,
    titulo: 'Agenda de Eventos!',
    resumo: 'Visualize todos os seus eventos num calendário mensal. Ideal para nunca perder uma data importante.',
    tags: ['agenda', 'calendário', 'eventos'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1435527173128-983b87201f4d?w=1200&q=80&auto=format&fit=crop',
    conteudo: `A Agenda é uma visão calendário de todos os seus eventos. Ao clicar em Agenda na barra lateral, você verá um calendário mensal com os eventos distribuídos nos dias correspondentes às suas datas de início.

Cada evento aparece como um bloco colorido no calendário. Ao clicar em um evento, você é direcionado para a página interna desse evento, onde pode gerenciar ingressos, participantes e muito mais.

A Agenda é especialmente útil quando você organiza múltiplos eventos simultâneos ou em sequência. Em vez de navegar por uma lista, você consegue visualizar rapidamente se há conflito de datas, períodos de inscrição abertas e quando cada evento acontece.

Use os botões de navegação para avançar ou retroceder entre os meses. Eventos que se estendem por vários dias aparecem marcados em todos os dias do período.

Dica: antes de criar um novo evento, consulte a Agenda para garantir que não há sobreposição com outros eventos já programados, especialmente se você compartilha equipe ou espaço físico entre diferentes eventos.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'calculadora',
    slug: 'calculadora',
    ordem: 4,
    titulo: 'Calcule seu próximo evento!',
    resumo: 'Use a calculadora para estimar o investimento do seu evento antes de criá-lo — defina vagas, custos fixos e variáveis e veja a viabilidade financeira.',
    tags: ['calculadora', 'planejamento', 'financeiro'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80&auto=format&fit=crop',
    conteudo: `A Calculadora de Eventos é uma ferramenta de planejamento que permite estimar a viabilidade financeira de um evento antes de criá-lo. Com ela, você define os parâmetros do evento e vê automaticamente os números calculados.

Na calculadora, você preenche: número de vagas, valor do ingresso (ou meta de arrecadação), custos fixos (aluguel de espaço, estrutura, etc.) e custos variáveis por participante (alimentação, material, etc.). A calculadora então mostra o ponto de equilíbrio — quantas inscrições você precisa para cobrir todos os custos.

Isso é muito útil para saber se o preço do ingresso está adequado ou se a capacidade planejada é suficiente para tornar o evento viável financeiramente.

A calculadora está disponível em todos os planos — inclusive no Chinám (gratuito). Nos planos Pétach, Koách e Chalém, após fazer os cálculos, você pode clicar em Criar Evento para que os dados da calculadora sejam transferidos automaticamente para as configurações financeiras do evento.

Use a calculadora antes de divulgar qualquer evento. Definir o preço certo desde o início evita problemas financeiros durante o evento.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'relatorios',
    slug: 'relatorios',
    ordem: 5,
    titulo: 'Relatórios!',
    resumo: 'Acompanhe os números consolidados de todos os seus eventos: capacidade total, eventos ativos e destaque de desempenho.',
    tags: ['relatórios', 'métricas', 'análise'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80&auto=format&fit=crop',
    conteudo: `A aba Relatórios oferece uma visão consolidada de todos os seus eventos ativos e históricos. Em vez de acessar evento por evento, você tem uma visão macro da sua organização como um todo.

Os relatórios mostram: total de participantes inscritos em todos os eventos, capacidade total disponível, taxa de ocupação média, eventos ativos no momento e destaque de desempenho (qual evento tem mais inscrições).

Esses dados são úteis para entender o alcance da sua organização ao longo do tempo. Por exemplo, ao final do ano você consegue ver quantas pessoas passaram pelos seus eventos, qual foi o evento com maior engajamento e como a capacidade foi utilizada.

Os gráficos na seção de relatórios facilitam a visualização de tendências — crescimento no número de participantes, distribuição de eventos por período e outras métricas importantes para tomada de decisão.

Dica: use os relatórios também para apresentar resultados para parceiros, mantenedores ou lideranças da sua organização. Os dados consolidados mostram o impacto do trabalho de forma objetiva.

Os relatórios são atualizados automaticamente conforme novas inscrições são realizadas nos seus eventos, sem necessidade de ação manual.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'faturamento',
    slug: 'faturamento',
    ordem: 6,
    titulo: 'Faturamento!',
    resumo: 'Veja o plano que você contratou, seus limites de eventos e participantes, e o histórico de pagamentos da plataforma.',
    tags: ['faturamento', 'plano', 'assinatura'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1609429019995-8c40f49535a5?w=1200&q=80&auto=format&fit=crop',
    conteudo: `A aba Faturamento mostra as informações da sua assinatura no Tovia: qual plano você contratou, os limites de eventos e participantes incluídos, e o histórico de pagamentos da plataforma.

Nessa página você encontra: o plano atual (Chinám, Pétach, Koách ou Chalém), a data de renovação, o valor pago mensalmente e o status de cada cobrança (pago, pendente, vencido).

Os limites de cada plano são exibidos com indicadores de uso: por exemplo, "2 de 3 eventos utilizados" ou "87 de 200 participantes". Isso te ajuda a planejar quando pode ser necessário fazer upgrade para o próximo plano.

Para fazer upgrade, clique no botão de troca de plano na própria aba de Faturamento. Você será direcionado para a página de planos onde pode comparar as funcionalidades e escolher o plano adequado.

As transações financeiras dos seus eventos são gerenciadas inteiramente por você — o Faturamento aqui se refere à sua assinatura da plataforma Tovia.

Membros de equipe que foram convidados para eventos de terceiros utilizam o plano Chinám gratuito — eles não precisam assinar nenhum plano para acessar os eventos onde foram adicionados.

Em caso de dúvidas sobre sua assinatura ou faturas, entre em contato com o suporte através do e-mail ou WhatsApp informados na página de planos.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'seus-eventos',
    slug: 'seus-eventos',
    ordem: 7,
    titulo: 'Seus eventos!',
    resumo: 'Na página Início você encontra todos os seus eventos e acessa qualquer um deles com um clique.',
    tags: ['eventos', 'início', 'gestão'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80&auto=format&fit=crop',
    conteudo: `A página Início é o ponto central do Tovia. Ao fazer login, você é direcionado para essa página, que lista todos os seus eventos — tanto os que você criou quanto os que você foi adicionado como membro de equipe.

Cada evento aparece como um card com: nome do evento, data, status (ativo, encerrado, rascunho), número de inscrições realizadas e capacidade total. Os eventos são organizados por data, com os mais próximos aparecendo primeiro.

Ao clicar em um card de evento, você entra na página interna desse evento, onde encontra todas as abas de gerenciamento: Visão Geral, Ingressos, Páginas de Inscrição, Participantes, e as abas avançadas conforme o plano do organizador.

O botão de status rápido em cada card permite arquivar ou encerrar um evento sem precisar entrar nele. Eventos encerrados ainda ficam acessíveis para consulta, mas não aceitam novas inscrições.

Também na página Início você encontra o botão Criar Evento (ou na barra lateral), que inicia o fluxo de criação de um novo evento.

Dica: mantenha o nome dos eventos claro e objetivo — ele aparece para os participantes nas páginas de inscrição e nos e-mails de confirmação.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'criar-evento',
    slug: 'criar-evento',
    ordem: 8,
    titulo: 'Crie seu primeiro evento!',
    resumo: 'Clique aqui para criar um evento. Você define nome, data, local e todos os dados importantes sobre ele.',
    tags: ['criar evento', 'configuração', 'início'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1599739291060-4578e77dac5d?w=1200&q=80&auto=format&fit=crop',
    conteudo: `Criar um evento no Tovia é rápido e direto. Clique no botão Criar Evento na barra lateral ou na página Início para iniciar o fluxo de criação.

Você precisará preencher: nome do evento, descrição, data de início, data de término (opcional), local (endereço ou link de evento online) e uma imagem de capa. Esses são os dados básicos que aparecerão para os participantes nas páginas de inscrição.

Após criar o evento, você é direcionado para a página interna, onde pode configurar ingressos, páginas de inscrição e demais detalhes. O evento começa como "ativo" — você pode alterar o status para rascunho se quiser continuar configurando antes de divulgar.

Pense na descrição do evento como a principal comunicação com os participantes. Uma boa descrição responde: o que é o evento, para quem é, o que vai acontecer e por que vale participar.

Para a imagem de capa, use uma foto ou arte com boa resolução (mínimo 800×450px). Ela é o primeiro impacto visual que o participante tem ao acessar a página de inscrição — vale caprichar.

Após criar o evento, a próxima etapa obrigatória é configurar pelo menos um ingresso. Sem ingressos, o evento não tem como receber inscrições.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'ingressos',
    slug: 'ingressos',
    ordem: 9,
    titulo: 'Cada evento precisa dos seus ingressos!',
    resumo: 'Dentro de cada evento, configure os ingressos: gratuitos, pagos ou por doação. Você define vagas, prazo e as formas de pagamento aceitas.',
    tags: ['ingressos', 'tickets', 'vagas', 'pagamento'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80&auto=format&fit=crop',
    conteudo: `Os ingressos definem como os participantes vão se inscrever no seu evento: se é gratuito, pago ou por doação. Todo evento precisa ter ao menos um ingresso configurado para receber inscrições.

Para configurar ingressos, entre no seu evento e clique na aba Ingressos. Ali você pode criar um ou mais tipos de ingresso para o mesmo evento — por exemplo, "Ingresso Geral" (gratuito) e "Ingresso VIP" (pago), ou "Adulto" e "Criança".

Cada ingresso tem: nome, tipo (gratuito, pago ou doação), valor (se pago), quantidade de vagas disponíveis e prazo de inscrições (data de abertura e encerramento). Você pode ativar ou desativar um ingresso sem precisar excluí-lo.

No tipo "doação", o participante decide o valor que quer contribuir, com ou sem um valor sugerido definido por você. Isso é muito usado em conferências e retiros que trabalham com ofertas livres.

Disponibilidade por plano:
• Chinám — 1 ingresso por evento (gratuito)
• Pétach — até 3 ingressos por evento (gratuito, pago ou doação)
• Koách — até 5 ingressos por evento
• Chalém — até 10 ingressos por evento

Os pagamentos manuais (Pix, dinheiro, transferência) estão disponíveis a partir do plano Pétach. Os pagamentos automáticos via gateway (PIX, boleto e cartão online) são exclusivos do plano Chalém.

Dica: crie ingressos com nomes claros que ajudem os participantes a identificar qual categoria se aplica a eles. Evite termos técnicos ou internos que só fazem sentido para a equipe organizadora.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'paginas-inscricao',
    slug: 'paginas-inscricao',
    ordem: 10,
    titulo: 'Páginas de inscrição!',
    resumo: 'As páginas de inscrição são links públicos que você compartilha com os participantes. Cada página tem ingressos vinculados, formulário personalizado e confirmação automática por e-mail.',
    tags: ['páginas', 'inscrição', 'link', 'formulário'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1601342630314-8427c38bf5e6?w=1200&q=80&auto=format&fit=crop',
    conteudo: `As Páginas de Inscrição são a interface pública do seu evento — o link que você compartilha nas redes sociais, no WhatsApp e onde quer que vá divulgar. Cada página pode ter ingressos específicos, formulário personalizado e design próprio.

Para criar uma página de inscrição, entre no evento e acesse a aba Páginas de Inscrição. Clique em Nova Página, defina um título, escolha quais ingressos serão oferecidos nessa página, e configure o formulário de dados que os participantes devem preencher.

Um evento pode ter múltiplas páginas de inscrição (a partir do plano Koách). Por exemplo: uma página pública com ingressos gerais, e outra página privada (com link específico) para inscrições de equipe ou voluntários, com campos diferentes.

O formulário de cada página é totalmente personalizável. Além dos campos padrão (nome, e-mail, telefone), você pode adicionar campos específicos do seu evento: tamanho de camiseta, restrição alimentar, cidade de origem, etc.

Ao ativar uma página, ela recebe um link público no formato tovia.app/e/id-do-evento/nome-da-pagina. Esse link pode ser compartilhado diretamente. Participantes que acessam esse link veem a página de inscrição sem precisar criar conta no Tovia.

A confirmação de inscrição é enviada automaticamente por e-mail para o participante, com os dados da inscrição e as informações de contato do organizador.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'participantes',
    slug: 'participantes',
    ordem: 11,
    titulo: 'Participantes!',
    resumo: 'Aqui você vê todas as inscrições realizadas: nome, contato, ingresso escolhido, status do pagamento e muito mais. Também é possível exportar a lista.',
    tags: ['participantes', 'inscrições', 'lista', 'exportar'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80&auto=format&fit=crop',
    conteudo: `A aba Participantes exibe todas as inscrições recebidas no evento, com informações detalhadas de cada inscrito: nome, e-mail, telefone, ingresso escolhido, data da inscrição, status do pagamento e respostas do formulário personalizado.

Nessa aba você pode filtrar participantes por ingresso, por status de pagamento ou pesquisar pelo nome. Isso facilita encontrar um participante específico em eventos com muitas inscrições.

O status de cada inscrição indica a situação do pagamento: Pendente (ainda não pagou), Pago (confirmado), Cancelado e outros. Nos planos Pétach, Koách e Chalém, você pode atualizar o status manualmente conforme confirma os recebimentos. No plano Chalém com gateway conectado, o status é atualizado automaticamente quando o pagamento online é confirmado.

Você pode registrar informações adicionais em cada inscrição, como observações internas ou notas da equipe — isso não é visível para o participante.

A lista de participantes pode ser exportada para planilha (formato CSV/Excel), com todos os campos preenchidos nos formulários. Isso é útil para geração de crachás, listas de presença e relatórios pós-evento.

Dica: use o campo de status para acompanhar o processo de confirmação em eventos com muitos participantes. Marcar como "Pago" manualmente após receber o comprovante evita cobranças duplicadas ou confusões na entrada do evento.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'base-conhecimento',
    slug: 'base-conhecimento',
    ordem: 12,
    titulo: 'Base de Conhecimento!',
    resumo: 'Ficou com dúvida? Aqui você encontra tutoriais, explicações e respostas para as perguntas mais frequentes sobre o Tovia.',
    tags: ['ajuda', 'suporte', 'documentação', 'tutoriais'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1200&q=80&auto=format&fit=crop',
    conteudo: `A Base de Conhecimento é o repositório de artigos e tutoriais sobre o Tovia. Aqui você encontra explicações detalhadas sobre cada funcionalidade da plataforma, dicas de uso e respostas para as perguntas mais frequentes.

Os artigos estão organizados na mesma sequência do Tutorial Guiado — seguindo a lógica de uso da plataforma, do básico ao avançado, e agrupados por plano (Chinám, Pétach, Koách e Chalém).

Para encontrar um artigo específico, use a barra de busca no topo da página. A busca pesquisa dentro do título, das tags e do conteúdo dos artigos, então você pode buscar por termos como "ingresso", "página de inscrição" ou "exportar".

O conteúdo da Base de Conhecimento é atualizado pela equipe Tovia conforme novas funcionalidades são lançadas ou quando percebemos que muitos usuários têm dúvidas sobre algum ponto específico.

Se você não encontrar resposta para sua dúvida aqui, entre em contato com o suporte pelo WhatsApp ou e-mail informados na aba Faturamento do seu painel. Nossa equipe está disponível para ajudar.

Sugestões de novos artigos são bem-vindas — se você sentiu falta de alguma explicação, nos envie uma mensagem e faremos o possível para incluir na próxima atualização.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'configuracoes-financeiras',
    slug: 'configuracoes-financeiras',
    ordem: 13,
    titulo: 'Configure os pagamentos do seu evento!',
    resumo: 'Na aba Configurações Financeiras do evento, você pode definir as taxas, os valores reais do seu evento.',
    tags: ['pagamentos', 'financeiro', 'configuração', 'petach'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1707157284454-553ef0a4ed0d?w=1200&q=80&auto=format&fit=crop',
    conteudo: `A aba Configurações Financeiras (disponível a partir do plano Pétach) é onde você define as regras financeiras do evento: custo total previsto, meta de arrecadação, taxas e margens. O Tovia centraliza toda a organização financeira do evento — cada real registrado aqui reflete o que você recebeu nos seus próprios canais.

Nessa aba você preenche: o custo total previsto do evento (soma de todos os gastos esperados, como local, alimentação, material), a meta de arrecadação com inscrições e doações, e as taxas ou margens que deseja considerar no planejamento.

Com esses dados preenchidos, o Tovia calcula automaticamente o ponto de equilíbrio: quantas inscrições você precisa confirmar para cobrir os custos. Isso é visível no painel financeiro do evento.

Você também pode definir taxas administrativas ou de processamento externo para que os valores reais apareçam corretamente nos relatórios. Por exemplo, se você recebe pagamentos via Pix e cobra uma taxa de organização, pode configurar isso aqui.

A comparação entre o custo previsto e o total arrecadado (registrado manualmente na aba Financeiro) aparece em tempo real, permitindo acompanhar se o evento está dentro do orçamento.

Importante: cada evento tem suas próprias configurações financeiras. Configure os dados de cada evento separadamente — os números de um evento não interferem nos outros.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'financeiro',
    slug: 'financeiro',
    ordem: 14,
    titulo: 'Confira ou adicione os pagamentos!',
    resumo: 'Na aba Financeiro você registra e acompanha todos os pagamentos recebidos — parcelas, confirmações manuais e o fluxo de caixa do evento.',
    tags: ['financeiro', 'pagamentos', 'fluxo de caixa', 'petach'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1626266061368-46a8f578ddd6?w=1200&q=80&auto=format&fit=crop',
    conteudo: `A aba Financeiro (disponível a partir do plano Pétach) centraliza o registro e acompanhamento de todos os recebimentos do evento. Você recebe os pagamentos pelos seus próprios canais (Pix, dinheiro, transferência, etc.) e registra aqui o que foi recebido — o Tovia organiza e consolida tudo em tempo real.

Para registrar um pagamento, clique em "Adicionar Pagamento", selecione o participante, informe o valor recebido, a forma de pagamento (Pix, dinheiro, cartão, transferência...) e a data. O status da inscrição correspondente é atualizado automaticamente para "Pago".

A aba mostra: o total arrecadado até o momento, o saldo pendente (participantes que ainda não tiveram o pagamento confirmado) e a comparação com a meta definida nas Configurações Financeiras.

Para pagamentos em parcelas, registre cada parcela separadamente informando o valor parcial. O sistema acumula as parcelas e você acompanha o total pago por participante com clareza.

No plano Chalém com gateway conectado, os pagamentos via PIX, boleto e cartão são registrados automaticamente — sem necessidade de lançamento manual.

Todos os registros ficam visíveis apenas para você e sua equipe — os participantes não têm acesso ao painel financeiro.

Dica: mantenha o registro atualizado conforme os pagamentos vão chegando. Isso facilita a prestação de contas para parceiros, patrocinadores ou lideranças após o evento, e evita cobranças duplicadas na entrada.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'doacoes',
    slug: 'doacoes',
    ordem: 15,
    titulo: 'Aqui ficam todas as doações!',
    resumo: 'Na aba Doações você acompanha todas as contribuições realizadas no evento, sejam com valor livre ou com sugestão de valor definida por você. Você pode também alocar uma doação para um participante!',
    tags: ['doações', 'contribuições', 'petach'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1200&q=80&auto=format&fit=crop',
    conteudo: `A aba Doações (disponível a partir do plano Pétach) registra e exibe todas as contribuições recebidas no evento. Você recebe as doações pelos seus próprios canais e registra aqui o que chegou — o Tovia organiza tudo no histórico do evento.

Para registrar uma doação, clique em "Alocar Doação", selecione o participante (ou informe um doador externo), defina o valor, a forma de pagamento e a data. O registro fica salvo no histórico e entra na soma total do evento.

Uma doação pode ser de valor livre (o doador decide quanto contribuir) ou com valor sugerido (você define um valor de referência visível na página de inscrição). Essa flexibilidade é ideal para retiros, conferências e eventos com cultura de oferta.

A aba exibe: o total de doações registradas, a média de contribuição por doador e o histórico completo com nome, valor, data e forma de pagamento.

As doações também entram no cálculo financeiro geral do evento, somando com os pagamentos de ingressos para compor o total arrecadado versus o custo previsto.

Dica: use o campo de observações ao registrar uma doação para anotar informações relevantes, como o número do comprovante Pix ou a designação específica da oferta (ex: "para o fundo de bolsas").`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'recursos',
    slug: 'recursos',
    ordem: 16,
    titulo: 'Recursos!',
    resumo: 'Na aba Recursos você cadastra tudo que o evento precisa: equipamentos, espaços, materiais. Gerencie disponibilidade e alocações em um só lugar.',
    tags: ['recursos', 'equipamentos', 'espaços', 'koach'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1629327896333-7ecec1515ae5?w=1200&q=80&auto=format&fit=crop',
    conteudo: `A aba Recursos (disponível nos planos Koách e Chalém) permite cadastrar e gerenciar tudo que o evento precisa de infraestrutura: equipamentos, espaços físicos, materiais e qualquer outro recurso que precise de controle de disponibilidade.

Para cada recurso você define: nome, tipo (equipamento, espaço, material, etc.), quantidade disponível, responsável e observações. Você pode então alocar recursos para horários específicos dentro do evento, garantindo que não haverá conflito de uso.

Isso é especialmente útil em eventos complexos com múltiplas salas e sessões simultâneas, onde o mesmo projetor ou espaço precisa ser compartilhado entre diferentes programações.

A visão de disponibilidade mostra, para cada recurso, em quais momentos ele está alocado e quando está livre. Isso facilita o planejamento da programação evitando conflitos.

Você pode também associar recursos a tarefas (aba Tarefas), de modo que a equipe responsável por uma atividade saiba quais recursos foram reservados para ela.

Dica: cadastre os recursos logo após criar o evento e antes de montar a programação. Assim você parte do inventário real disponível ao planejar as alocações.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'grupos',
    slug: 'grupos',
    ordem: 17,
    titulo: 'Grupos!',
    resumo: 'Divida os participantes em grupos, quartos, mesas ou qualquer outra estrutura. Ideal para acampamentos, retiros e eventos com hospedagem.',
    tags: ['grupos', 'quartos', 'hospedagem', 'koach'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1630068846062-3ffe78aa5049?w=1200&q=80&auto=format&fit=crop',
    conteudo: `A aba Grupos (disponível nos planos Koách e Chalém) permite dividir os participantes do evento em grupos, quartos, mesas ou qualquer outra estrutura de agrupamento. É ideal para acampamentos, retiros, conferências com hospedagem e eventos com mesas temáticas.

Para cada grupo você define: nome, capacidade máxima, tipo (quarto, mesa, ônibus, célula, etc.) e a lista de participantes alocados. A aba exibe quantas vagas cada grupo tem disponíveis e quem já foi alocado.

A alocação de participantes pode ser feita manualmente, um a um, ou usando filtros para selecionar participantes por critério (por exemplo, alocar todos de um determinado perfil em um grupo específico).

A visão geral dos grupos mostra a taxa de ocupação de cada grupo e o total disponível versus preenchido, permitindo uma gestão visual rápida da distribuição de participantes.

Nos retiros e acampamentos, é comum definir os grupos logo após o encerramento das inscrições, quando se conhece o número exato de participantes. Use a exportação de participantes para auxiliar na montagem dos grupos se preferir trabalhar em planilha antes.

Dica: dê nomes descritivos e intuitivos para os grupos — "Quarto 1" é menos útil do que "Quarto Azul (Homens)" ou "Mesa dos Líderes". Isso facilita a comunicação com a equipe no dia do evento.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'tarefas',
    slug: 'tarefas',
    ordem: 18,
    titulo: 'Tarefas!',
    resumo: 'Organize o cronograma do evento em tarefas com responsáveis e prazos. Cada membro da equipe sabe exatamente o que precisa fazer e quando.',
    tags: ['tarefas', 'cronograma', 'equipe', 'koach'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1754548930574-6a995e5eb5a7?w=1200&q=80&auto=format&fit=crop',
    conteudo: `A aba Tarefas (disponível nos planos Koách e Chalém) é onde você monta o cronograma operacional do evento, com cada atividade organizada em tarefas que podem ser atribuídas a membros da equipe.

Para cada tarefa você define: título, descrição, responsável, data/horário de início e término, status (a fazer, em andamento, concluída) e a prioridade. As tarefas aparecem em uma lista organizada por data, facilitando a visão do que precisa ser feito e quando.

Quando um membro da equipe acessa o evento, ele vê as tarefas atribuídas a ele com clareza. Isso elimina a necessidade de listas de WhatsApp ou planilhas paralelas para coordenar a equipe.

Ao longo do evento, a equipe pode atualizar o status das tarefas em tempo real — de "a fazer" para "em andamento" e depois para "concluída". O coordenador consegue ver o progresso geral de tudo de uma vez.

As tarefas podem ser associadas a recursos específicos (aba Recursos), de forma que a equipe saiba quais materiais e espaços estão disponíveis para cada atividade.

Dica: crie as tarefas com pelo menos uma semana de antecedência e atribua responsáveis com clareza. Evite tarefas genéricas como "organizar o evento" — prefira tarefas específicas como "montar palco da sessão da tarde" ou "receber participantes na portaria das 14h às 18h".`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'equipe',
    slug: 'equipe',
    ordem: 19,
    titulo: 'Equipe!',
    resumo: 'Adicione colaboradores ao evento para que eles também possam gerenciar inscrições, financeiro e tarefas. Membros convidados têm o plano Chinám gratuito — sem custo para eles.',
    tags: ['equipe', 'colaboradores', 'permissões', 'koach'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=1200&q=80&auto=format&fit=crop',
    conteudo: `A aba Equipe (disponível nos planos Koách e Chalém) permite adicionar colaboradores ao seu evento para que outras pessoas possam ajudar a gerenciar inscrições, financeiro, recursos e tarefas.

COMO FUNCIONA PARA O MEMBRO CONVIDADO:
A pessoa convidada não precisa assinar nenhum plano pago. Ao criar uma conta no Tovia, ela recebe automaticamente o plano Chinám (gratuito) e acessa o evento específico onde foi adicionada — com as permissões que você definiu. O custo do Tovia é do organizador, não da equipe.

COMO ADICIONAR UM MEMBRO:
Informe o e-mail da pessoa e defina as permissões que ela terá no evento. As permissões são modulares — você pode dar acesso apenas a áreas específicas:
• Inscrições — vê e gerencia a lista de participantes
• Financeiro — registra e acompanha pagamentos
• Gestão (Grupos e Recursos) — organiza grupos e equipamentos
• Tarefas — vê e atualiza as tarefas atribuídas a ela
• Check-in — confirma presenças no dia do evento

Os membros da equipe recebem um convite por e-mail. Ao aceitar, o evento aparece no painel deles junto com os eventos próprios (se tiverem algum).

A pessoa adicionada como equipe não vê as configurações da conta do organizador (plano, faturamento), apenas o conteúdo do evento para o qual foi convidada.

Para remover um membro da equipe, acesse a aba Equipe e clique em remover ao lado do nome da pessoa. O acesso é revogado imediatamente.

Dica: use a aba Equipe para delegar funções antes do evento começar. Por exemplo: adicionar a secretaria como gestora de inscrições, o tesoureiro como gestor financeiro e os coordenadores de grupo como gestores de recursos. Isso distribui o trabalho e mantém o organizador principal focado na visão geral.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'tudo-pronto',
    slug: 'tudo-pronto',
    ordem: 20,
    titulo: 'Tudo pronto!',
    resumo: 'Você conhece tudo que o Tovia tem a oferecer! Para rever este tour a qualquer momento, clique em Tutorial na barra lateral.',
    tags: ['conclusão', 'próximos passos', 'suporte'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1503266980949-bd30d04d0b7a?w=1200&q=80&auto=format&fit=crop',
    conteudo: `Parabéns por completar o tour do Tovia! Você agora conhece todas as ferramentas disponíveis na plataforma e como cada uma contribui para a organização de eventos de sucesso.

A jornada recomendada para um novo evento é: criar o evento → configurar ingressos → criar a página de inscrição → divulgar o link → acompanhar as inscrições e participantes → gerenciar o financeiro (Pétach+) → coordenar equipe, grupos e tarefas (Koách+) → pagamentos automáticos (Chalém).

Para rever qualquer etapa do tutorial, clique em Tutorial na barra lateral do painel a qualquer momento. O tutorial foi pensado para ser consultado quantas vezes forem necessárias.

Esta Base de Conhecimento é sempre atualizada com novos artigos e melhorias nas explicações existentes. Se você sentiu falta de alguma informação ou encontrou algo que poderia ser mais claro, entre em contato com a equipe Tovia.

Novidades da plataforma são comunicadas por e-mail e no painel. Fique de olho nas notificações para saber quando novas funcionalidades ficarem disponíveis.

Boa sorte na organização dos seus próximos eventos! O Tovia foi feito para que você gaste menos tempo com planilhas e mais tempo com o que realmente importa: transformar vidas através de eventos incríveis.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },

  // ─── Artigos faltantes do tutorial (mapeados 1-a-1 com os passos) ───────────

  {
    id: 'cupons',
    slug: 'cupons',
    ordem: 21,
    titulo: 'Cupons de desconto!',
    resumo: 'Crie cupons percentuais ou de valor fixo para seus eventos. Compartilhe com o público certo e acompanhe os usos em tempo real.',
    tags: ['cupons', 'desconto', 'promoção', 'inscrições'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=1200&q=80&auto=format&fit=crop',
    conteudo: `Os cupons de desconto permitem oferecer preços diferenciados para grupos específicos de participantes — membros da organização, parceiros ou qualquer outro perfil.

Para criar um cupom, entre no evento e acesse a aba Cupons. Clique em Novo Cupom e defina: código (ex: "LIDER2025"), tipo (percentual ou valor fixo), valor do desconto, quantidade máxima de usos e prazo de validade.

O código do cupom é inserido pelo participante na página de inscrição, antes de confirmar. O desconto é aplicado automaticamente ao valor do ingresso escolhido. Cupons expirados ou esgotados são recusados com mensagem clara.

Você pode criar múltiplos cupons para o mesmo evento — por exemplo: um cupom de 20% para membros da sua base, outro de valor fixo (R$50 off) para parceiros e um terceiro para influenciadores com código personalizado.

Na listagem de cupons você acompanha, para cada código: quantas vezes foi usado, o total de desconto concedido e se ainda está ativo. Isso permite medir o alcance de cada ação promocional.

Dica: evite cupons com desconto de 100% em eventos pagos — prefira criar um ingresso gratuito separado para isenções, assim você mantém o controle de quem tem acesso gratuito sem comprometer a integridade financeira dos relatórios.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },

  {
    id: 'check-in',
    slug: 'check-in',
    ordem: 22,
    titulo: 'Check-in no dia do evento!',
    resumo: 'Use a tela de check-in para confirmar a presença dos participantes. Busque por nome, CPF ou leia o QR Code do ingresso.',
    tags: ['check-in', 'presença', 'qr code', 'dia do evento'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=1200&q=80&auto=format&fit=crop',
    conteudo: `A tela de Check-in foi projetada para funcionar na entrada do evento: confirma presenças de forma rápida, mesmo com muitos participantes na fila.

Para acessar o check-in, entre no evento e clique na aba Check-in, ou use o link direto disponível nessa aba — ideal para abrir no celular de quem está na portaria sem precisar acessar o painel completo.

Na tela de check-in você pode confirmar presença de três formas:
1. Busca por nome: comece a digitar o nome e os participantes aparecem filtrados em tempo real.
2. Busca por CPF ou campo personalizado: se o formulário incluía CPF, telefone ou outro identificador, você pode buscar por esse dado.
3. Leitura de QR Code: cada confirmação de inscrição enviada por e-mail contém um QR Code único. Aponte a câmera do celular para o QR Code e a presença é confirmada instantaneamente.

Ao confirmar uma presença, o status da inscrição muda para "Presente" e o registro é salvo com horário. Isso garante uma lista de presença fiel ao final do evento.

Se um participante chega sem QR Code (perdeu o e-mail), busque pelo nome ou CPF. Nunca deixe alguém sem entrar por falta do QR Code — a busca manual existe justamente para isso.

Dica: abra a tela de check-in em um tablet na portaria. Com tela maior, a busca por nome fica mais prática e visível para a equipe. Se possível, tenha uma segunda pessoa buscando na lista enquanto outra recebe as pessoas.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },

  // ─── Mapas de uso por plano ───────────────────────────────────────────────────

  {
    id: 'caminho-start',
    slug: 'caminho-start',
    ordem: 30,
    titulo: 'Plano Chinám: o caminho mais eficiente',
    resumo: 'Você está no plano gratuito. Veja o passo a passo para tirar o máximo proveito do Chinám e quando faz sentido fazer upgrade.',
    tags: ['chinam', 'gratuito', 'caminho', 'guia de uso', 'mapa'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1780478474266-d9375abd5d99?w=1200&q=80&auto=format&fit=crop',
    conteudo: `O plano Chinám é gratuito e permanente — você pode usar o Tovia sem pagar enquanto o Chinám atender suas necessidades. Chinám (חינם) significa "gratuito" em hebraico. Ele é ideal para quem está começando ou organiza eventos pequenos e esporádicos.

O que você pode fazer no Chinám:
• 1 evento ativo por vez (eventos encerrados não contam no limite)
• Até 100 participantes por evento
• 1 tipo de ingresso por evento (gratuito)
• 1 página de inscrição por evento, com formulário personalizado
• Confirmação de inscrição por e-mail automática
• Lista de participantes com exportação
• Check-in por nome ou QR Code
• Cupons de desconto
• Agenda mensal de eventos
• Calculadora de evento
• Relatórios consolidados

Caminho recomendado no Chinám:
1. Complete seu perfil (logo, nome da organização, contato) → aparece em todos os e-mails e páginas de inscrição
2. Crie seu evento (nome, data, local, imagem de capa)
3. Configure 1 ingresso gratuito com número de vagas e prazo
4. Crie a página de inscrição e personalize o formulário
5. Copie o link da página e divulgue
6. Acompanhe as inscrições na aba Participantes
7. No dia do evento, use o Check-in para confirmar presenças

Quando considerar upgrade para o Pétach:
• Se você precisa de ingressos pagos (cobrar dos participantes)
• Se organiza mais de 1 evento simultâneo
• Se precisa de mais de 100 participantes por evento
• Se quer controlar o financeiro do evento (entradas, doações, saldo)

O upgrade não exclui nenhum dado — tudo que foi criado no Chinám continua disponível nos planos seguintes.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },

  {
    id: 'caminho-essencial',
    slug: 'caminho-essencial',
    ordem: 31,
    titulo: 'Plano Pétach: o caminho mais eficiente',
    resumo: 'Você tem o plano Pétach com controle financeiro manual. Veja como configurar seu evento do zero até o relatório final.',
    tags: ['petach', 'financeiro', 'caminho', 'guia de uso', 'mapa'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1699771913117-a747414bafd2?w=1200&q=80&auto=format&fit=crop',
    conteudo: `O plano Pétach é ideal para organizações que precisam cobrar pelos eventos e controlar os recebimentos. Pétach (פֶּתַח) significa "abertura" em hebraico — a porta de entrada para eventos com cobrança. Você recebe via Pix, dinheiro, transferência ou qualquer meio de sua preferência, e o Tovia organiza tudo no painel financeiro do evento.

O que você pode fazer no Pétach:
• Até 3 eventos ativos simultaneamente
• Até 200 participantes por evento
• Até 3 tipos de ingresso por evento (gratuito, pago, doação)
• 1 página de inscrição por evento
• Tudo do Chinám, mais:
• Registro manual de pagamentos por participante
• Módulo de doações com alocação por participante
• Configuração financeira do evento (custo previsto, meta de arrecadação)
• Relatório financeiro: total arrecadado vs. custo previsto

Caminho recomendado no Pétach:

ANTES DO EVENTO:
1. Complete o perfil (logo, contato, bio)
2. Crie o evento (nome, data, local, capa)
3. Configure os tipos de ingresso (ex: "Geral R$150", "Early Bird R$120", "Doação livre")
4. Crie a página de inscrição com os ingressos e formulário personalizado
5. Configure as finanças do evento: custo previsto e meta de arrecadação
6. Divulgue o link da página de inscrição

DURANTE AS INSCRIÇÕES:
7. Acompanhe novas inscrições na aba Participantes
8. À medida que receber pagamentos (Pix, dinheiro): registre na aba Financeiro
9. O status de cada participante é atualizado para "Pago" conforme você registra
10. Crie cupons de desconto para grupos específicos se necessário

NO DIA DO EVENTO:
11. Use o Check-in para confirmar presenças

PÓS-EVENTO:
12. Consulte o relatório financeiro para prestação de contas
13. Exporte a lista de participantes para registro

Quando considerar upgrade para o Koách:
• Se você organiza mais de 3 eventos simultâneos
• Se precisa de mais de 200 participantes por evento
• Se quer adicionar colaboradores como gestores do evento (equipe)
• Se precisa organizar grupos/quartos de participantes
• Se quer gestão de tarefas e cronograma com a equipe`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },

  {
    id: 'caminho-pro',
    slug: 'caminho-pro',
    ordem: 32,
    titulo: 'Plano Koách: o caminho mais eficiente',
    resumo: 'Você tem o plano Koách com gestão completa. Veja como usar equipe, grupos, tarefas e recursos para eventos mais complexos.',
    tags: ['koach', 'equipe', 'gestão', 'caminho', 'guia de uso', 'mapa'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1748356804570-1df85cbdcfb8?w=1200&q=80&auto=format&fit=crop',
    conteudo: `O plano Koách libera a gestão completa do Tovia: equipe colaborativa, grupos de participantes, tarefas com cronograma e recursos do evento. Koách (כֹּחַ) significa "força" em hebraico. É ideal para organizações que realizam eventos com equipe e logística mais complexa.

O que você pode fazer no Koách (além de tudo do Pétach):
• Até 5 eventos ativos simultaneamente
• Até 500 participantes por evento
• Até 5 tipos de ingresso e 5 páginas de inscrição por evento
• Até 5 membros de equipe por evento
• Equipe: adicione colaboradores com permissões específicas
• Grupos/Quartos: organize participantes em grupos, mesas, quartos ou ônibus
• Tarefas: monte o cronograma operacional com responsáveis e prazos
• Recursos: gerencie equipamentos, espaços e materiais

Caminho recomendado no Koách:

PLANEJAMENTO (semanas antes):
1. Use a Calculadora de Evento para estimar viabilidade financeira
2. Crie o evento com base nos resultados da calculadora
3. Configure os ingressos e múltiplas páginas de inscrição por perfil de público
4. Monte as Tarefas do evento com responsáveis e prazos
5. Adicione os membros da Equipe com permissões adequadas

Obs: cada membro convidado recebe o plano Chinám gratuito — não há custo adicional para a equipe.

DIVULGAÇÃO:
6. Divulgue as páginas de inscrição e acompanhe em tempo real
7. Crie cupons de desconto por perfil de público

ORGANIZAÇÃO (dias antes):
8. Organize os participantes em Grupos/Quartos conforme inscrições chegam
9. Aloque Recursos nas tarefas
10. Registre pagamentos na aba Financeiro

NO DIA:
11. A equipe acessa as tarefas atribuídas pelo próprio painel
12. Check-in na entrada — por nome ou QR Code
13. Atualização de status de tarefas em tempo real

PÓS-EVENTO:
14. Consulte relatório financeiro e exporte participantes

Quando considerar upgrade para o Chalém:
• Se você precisa de pagamentos automáticos via PIX, boleto ou cartão online
• Se seus eventos ultrapassam 500 participantes
• Se organiza mais de 5 eventos simultâneos
• Se precisa de mais de 5 membros de equipe ou mais de 5 ingressos por evento`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },

  {
    id: 'caminho-chalem',
    slug: 'caminho-chalem',
    ordem: 33,
    titulo: 'Plano Chalém: o caminho mais eficiente',
    resumo: 'Você tem o plano Chalém — completo e sem limites de inscritos. Veja como usar pagamentos automáticos e gerir eventos de grande porte.',
    tags: ['chalem', 'pagamentos automáticos', 'gateway', 'caminho', 'guia de uso', 'mapa'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1592205644721-2fe5214762ae?w=1200&q=80&auto=format&fit=crop',
    conteudo: `O plano Chalém é o mais completo do Tovia: inscritos ilimitados, pagamentos automáticos via PIX, boleto e cartão, e equipe com até 10 membros por evento. Chalém (שָׁלֵם) significa "completo" ou "pleno" em hebraico — da mesma raiz de Shalom.

O que você pode fazer no Chalém (além de tudo do Koách):
• Até 10 eventos ativos simultaneamente
• Participantes ilimitados por evento
• Até 10 tipos de ingresso e 10 páginas de inscrição por evento
• Até 10 membros de equipe por evento
• Pagamentos automáticos via PIX, boleto e cartão de crédito (BYOG)
• Os valores vão direto da inscrição para a sua conta bancária

BYOG — Bring Your Own Gateway (Traga Seu Próprio Gateway):
O modelo de pagamento do Tovia é o BYOG: você conecta o seu próprio gateway de pagamento (Asaas) ao evento. Assim, os valores das inscrições vão diretamente para a sua conta bancária, sem passar pelo Tovia. O Tovia só cuida da organização — não da intermediação financeira.

Caminho recomendado no Chalém:

ANTES DE QUALQUER EVENTO:
1. Acesse Configurações → Gateway de Pagamento e conecte sua conta Asaas
2. Defina as taxas que você vai absorver ou repassar nos ingressos pagos

PLANEJAMENTO DO EVENTO:
3. Use a Calculadora para planejar a viabilidade
4. Crie o evento, os ingressos e as páginas de inscrição
5. Nos ingressos pagos, ative os métodos de pagamento desejados (PIX, boleto, cartão)
6. Configure as regras de parcelamento se quiser oferecer essa opção

DURANTE AS INSCRIÇÕES:
7. Os pagamentos chegam automaticamente na aba Financeiro após confirmação pelo gateway
8. Participantes com pagamento confirmado têm status atualizado automaticamente para "Pago"
9. Cupons de desconto funcionam normalmente

GESTÃO DE EQUIPE E LOGÍSTICA:
10. Adicione até 10 membros de equipe por evento (gratuito para eles — plano Chinám)
11. Organize grupos/quartos, tarefas e recursos conforme o Koách

NO DIA:
12. Check-in ágil — por nome, CPF ou QR Code

Dica: mesmo com pagamentos automáticos, mantenha um olho no painel financeiro. Pagamentos por boleto podem atrasar — verifique o status antes do evento para evitar surpresas na entrada.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },

  {
    id: 'financeiro-gateway',
    slug: 'financeiro-gateway',
    ordem: 34,
    titulo: 'Como acompanhar os pagamentos do evento com gateway?',
    resumo: 'Com o gateway conectado, os pagamentos são registrados automaticamente no Tovia. Veja onde acompanhar cada cobrança, o saldo da conta e o histórico completo.',
    tags: ['gateway', 'asaas', 'pagamentos automáticos', 'financeiro', 'chalem'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80&auto=format&fit=crop',
    conteudo: `Com o plano Chalém e o gateway de pagamento conectado, o Tovia passa a registrar automaticamente cada pagamento confirmado — sem precisar de lançamento manual. O dinheiro vai diretamente para a sua conta bancária vinculada ao gateway, e o Tovia cuida de organizar tudo por evento.

ONDE ACOMPANHAR NO TOVIA:

Na aba Financeiro do evento você tem a visão completa de cada inscrição: valor pago, forma de pagamento (PIX, boleto, cartão), data de confirmação e status. Todos os pagamentos processados automaticamente aparecem aqui assim que confirmados pelo gateway.

O painel também mostra: total arrecadado até o momento, inscrições pendentes de pagamento e a comparação com a meta definida nas Configurações Financeiras. Essa é a sua central de controle financeiro por evento.

ONDE ACOMPANHAR NO GATEWAY:

Cada cobrança gerada pelo Tovia aparece na sua conta Asaas com uma referência única por evento. Lá você acompanha o saldo disponível para saque, o histórico de transferências para o seu banco e o status de cada cobrança emitida.

O Asaas é a sua conta bancária do evento — o Tovia é o painel de gestão. Use o Tovia para entender os números do evento (quem pagou, quanto falta, qual a meta) e o Asaas para acompanhar saques e o saldo da conta.

IMPORTANTE — NÚMEROS DO TOVIA vs. SALDO DO ASAAS:

Os valores exibidos no Tovia refletem apenas as cobranças geradas pelo próprio Tovia. Se você usa a mesma conta Asaas para receber pagamentos de outras fontes (vendas avulsas, outras plataformas, cobranças manuais feitas direto no painel do Asaas), esses valores NÃO aparecem no Tovia. Ou seja: o saldo e o extrato que você vê no Asaas podem ser maiores do que os números mostrados no painel financeiro do Tovia. O Tovia mostra a fatia do evento — o Asaas mostra o todo da sua conta.

PAGAMENTOS PENDENTES:

Boletos têm prazo de compensação de 1 a 2 dias úteis após o pagamento. PIX é compensado em segundos. Cartão de crédito pode ter confirmação imediata ou em alguns minutos, dependendo da operadora.

O status no Tovia é atualizado automaticamente quando o gateway confirma o pagamento — sem nenhuma ação necessária da sua parte.

Dica: antes do evento, filtre a lista de participantes por "Pagamento pendente" para saber quem ainda não confirmou. Entre em contato com antecedência — isso reduz surpresas na entrada e melhora o fluxo de caixa antes da data.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },

  {
    id: 'seus-dados-exclusao',
    slug: 'seus-dados-exclusao',
    ordem: 35,
    titulo: 'Seus dados e direito de exclusão',
    resumo: 'Saiba quais dados o Tovia coleta, como acessá-los, e como solicitar a exclusão completa da sua conta e informações pessoais.',
    tags: ['privacidade', 'lgpd', 'exclusão', 'dados pessoais', 'conta'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=1200&q=80&auto=format&fit=crop',
    conteudo: `O Tovia respeita seus direitos sobre seus dados pessoais, conforme a Lei Geral de Proteção de Dados (LGPD). Este artigo resume o que coletamos, como usamos e como você pode solicitar acesso ou exclusão.

QUAIS DADOS O TOVIA COLETA?

Como organizador:
• Nome, e-mail e senha (para criar sua conta)
• Foto de perfil, bio, redes sociais e contatos (opcionais)
• Dados fiscais como CNPJ e endereço (para cobrança de planos via Asaas)

Como participante de eventos:
• Nome, e-mail e telefone
• Dados adicionais solicitados pelo organizador no formulário de inscrição (gênero, cidade, restrição alimentar, etc.)

COMO SEUS DADOS SÃO USADOS?

Usamos seus dados exclusivamente para:
• Operar a plataforma (criar conta, gerenciar eventos, processar inscrições)
• Enviar comunicações transacionais (confirmação de cadastro, inscrição e pagamento)
• Processar pagamentos de planos via gateway Asaas
• Cumprir obrigações legais (retenção fiscal)

Não vendemos nem compartilhamos seus dados com terceiros para fins publicitários.

SEUS DIREITOS (LGPD Art. 18)

Você pode, a qualquer momento:
• Acessar uma cópia dos seus dados pessoais
• Corrigir dados incompletos ou desatualizados
• Solicitar a exclusão da sua conta e dados
• Revogar o consentimento para uso dos seus dados
• Solicitar a portabilidade dos seus dados em formato estruturado

COMO SOLICITAR A EXCLUSÃO DA CONTA

Se você deseja excluir sua conta e todos os dados associados:

1. Envie um e-mail para suporte@toviaapp.com.br com o assunto "Exclusão de conta"
2. Informe o e-mail cadastrado na plataforma
3. Receberá confirmação de recebimento em até 2 dias úteis
4. A exclusão será concluída em até 15 dias úteis
5. Receberá um e-mail final confirmando que o processo foi concluído

O QUE É EXCLUÍDO:
• Perfil completo (nome, e-mail, foto, contatos)
• Todos os eventos e dados associados (ingressos, páginas, participantes)
• Registros financeiros do painel Tovia
• Configurações de gateway de pagamento
• Tarefas, grupos, recursos e dados de equipe
• Registros de acesso (logs de login)

O QUE PODE SER RETIDO:
• Dados fiscais (CNPJ, endereço) por até 5 anos — obrigação tributária brasileira
• Transações processadas pelo gateway Asaas — armazenadas pelo próprio Asaas

ATENÇÃO: a exclusão é irreversível. Recomendamos exportar seus dados (lista de participantes, relatórios financeiros) antes de solicitar.

PARA PARTICIPANTES DE EVENTOS:
Se você se inscreveu em um evento e deseja que seus dados de inscrição sejam removidos, entre em contato diretamente com o organizador do evento. O organizador é o controlador dos dados de inscrição e pode removê-los pela plataforma. Se não conseguir contato com o organizador, envie um e-mail para suporte@toviaapp.com.br e intermediaremos a solicitação.

CONTATO:
Para qualquer questão sobre seus dados pessoais: suporte@toviaapp.com.br
Para reclamações: Autoridade Nacional de Proteção de Dados (ANPD) — www.gov.br/anpd`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },

  // ─── Mapas de uso por perfil de público ─────────────────────────────────────

  {
    id: 'mapa-igrejas',
    slug: 'mapa-igrejas',
    ordem: 40,
    titulo: 'Tovia para Igrejas e Ministérios',
    resumo: 'Como igrejas, ministérios e comunidades de fé usam o Tovia para cultos especiais, células, conferências e eventos de evangelismo.',
    tags: ['igrejas', 'ministérios', 'comunidade', 'mapa', 'perfil'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?w=1200&q=80&auto=format&fit=crop',
    conteudo: `Igrejas e ministérios são um dos principais perfis de usuário do Tovia. O contexto de fé tem algumas particularidades que a plataforma atende bem: mistura de inscrições gratuitas e por doação, necessidade de confirmação por e-mail, eventos recorrentes e equipe voluntária.

USOS COMUNS:
• Conferências anuais (jovens, mulheres, casais, liderança)
• Retiros e acampamentos com hospedagem
• Cultos especiais com inscrição (Natal, Páscoa, Semana Santa)
• Eventos de evangelismo abertos ao público
• Células e pequenos grupos com controle de presença
• Congressos com programação paralela e múltiplas salas

CONFIGURAÇÃO TÍPICA:
Chinám → ideal para evento único gratuito com até 100 participantes (culto especial pequeno, reunião de célula)
Pétach → ideal para eventos com oferta/contribuição manual (retiros com taxa de participação)
Koách → ideal para conferências com equipe, grupos de hospedagem e programação de múltiplas salas
Chalém → ideal para conferências de grande porte com checkout online e inscritos ilimitados

INGRESSOS RECOMENDADOS:
• "Inscrição Geral" (gratuita) para eventos abertos
• "Contribuição de R$X" para retiros e conferências com custos
• "Doação Livre" para quem não tem condição de pagar o valor cheio
• Cupom "LIDER" com desconto para líderes de célula ou pastores

GRUPOS/QUARTOS (Koách/Chalém):
Retiros e acampamentos se beneficiam muito da aba Grupos. Configure quartos separados por gênero e faixa etária (ex: "Feminino Adulto", "Masculino Jovem") e aloque os participantes conforme chegam as inscrições.

EQUIPE (Koách/Chalém):
Adicione a secretaria como gestora de inscrições e o tesoureiro como gestor financeiro. Os membros de equipe têm o plano Chinám gratuito — não precisam pagar para ajudar no evento. Cada um cuida da sua área sem precisar compartilhar senha.

DICA PARA IGREJAS:
Use o campo "Observações" no formulário de inscrição para perguntas específicas: qual célula frequenta, se é membro ou visitante, se tem restrição alimentar. Essas informações são exportáveis e facilitam o planejamento.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },

  {
    id: 'mapa-retiros',
    slug: 'mapa-retiros',
    ordem: 41,
    titulo: 'Tovia para Retiros e Acampamentos',
    resumo: 'Como usar o Tovia para eventos com hospedagem: grupos, quartos, alimentação e logística de participantes.',
    tags: ['retiros', 'acampamentos', 'hospedagem', 'grupos', 'mapa', 'perfil'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1584068921546-2d799f7aaf1d?w=1200&q=80&auto=format&fit=crop',
    conteudo: `Retiros e acampamentos têm desafios únicos de logística: hospedagem em grupos, alimentação, transporte e cronograma operacional com equipe. Os planos Koách e Chalém do Tovia foram projetados para esse cenário.

CARACTERÍSTICAS DO PERFIL:
• Participantes precisam ser organizados em quartos, cabanas ou ônibus
• Existe uma taxa de participação (alimentação + hospedagem) — às vezes com bolsas para quem não pode pagar
• A programação envolve múltiplas equipes simultâneas (recepção, cozinha, louvor, ministração, limpeza)
• O financeiro precisa equilibrar receita de inscrições com custos de local, alimentação e staff

FLUXO RECOMENDADO:

1. PLANEJAMENTO (1-2 meses antes)
Use a Calculadora de Evento: defina número de vagas, valor da taxa de participação, custos fixos (local, staff) e variáveis (alimentação por participante). Veja o ponto de equilíbrio e ajuste o valor se necessário.

2. CONFIGURAÇÃO
• Crie o evento com data de início e término (ex: sexta a domingo)
• Configure ingressos: "Taxa Geral R$X", "Bolsa 50%" para necessitados, "Voluntário" (gratuito para staff)
• Crie cupons para líderes, membros antigos ou parcerias

3. INSCRIÇÕES E PAGAMENTOS
• Abra as inscrições com antecedência suficiente
• Registre os pagamentos na aba Financeiro conforme chegam (Pétach/Koách)
• No Chalém com gateway conectado, os pagamentos são registrados automaticamente
• Acompanhe o total arrecadado vs. custo previsto em tempo real

4. ORGANIZAÇÃO (semana antes)
• Acesse a aba Grupos e crie os quartos/cabanas com capacidade
• Aloque os participantes considerando gênero, faixa etária e amizades relatadas no formulário
• Configure as Tarefas da equipe: montagem, recepção, cozinha, limpeza, programação
• Cada voluntário adicionado como equipe tem o plano Chinám gratuito — sem custo adicional

5. NO DIA
• Use o Check-in para confirmar chegada (por nome ou QR Code)
• A equipe acompanha e atualiza as tarefas pelo próprio painel

DICA:
Inclua no formulário de inscrição: restrição alimentar, tamanho de camiseta (se houver uniforme/brinde), condição de saúde relevante e contato de emergência. Essas informações são exportáveis e essenciais para a logística.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },

  {
    id: 'mapa-conferencias',
    slug: 'mapa-conferencias',
    ordem: 42,
    titulo: 'Tovia para Conferências e Congressos',
    resumo: 'Como usar o Tovia para conferências com múltiplas sessões, palestrantes, ingressos VIP e grande volume de participantes.',
    tags: ['conferências', 'congressos', 'palestrantes', 'mapa', 'perfil'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1200&q=80&auto=format&fit=crop',
    conteudo: `Conferências e congressos reúnem grande volume de participantes, múltiplos ingressos (meia, inteira, VIP, estudante) e uma equipe numerosa na organização. Os planos Koách e Chalém atendem esse perfil com recursos de gestão de equipe, múltiplos ingressos e check-in ágil.

CARACTERÍSTICAS DO PERFIL:
• Volume alto de participantes (centenas a milhares)
• Diferentes categorias de acesso e valores
• Programação com múltiplas trilhas simultâneas
• Equipe grande dividida em funções (recepção, credenciamento, imprensa, técnica, segurança)
• Necessidade de credenciamento rápido na entrada

FLUXO RECOMENDADO:

1. PLANEJAMENTO
Comece pela Calculadora de Evento. Em conferências, os custos fixos (local, AV, palestrantes) são altos — calcule o ponto de equilíbrio com realismo antes de definir o preço dos ingressos.

2. INGRESSOS (Koách: até 5 / Chalém: até 10)
Crie múltiplos tipos de ingresso:
• "Inteira" — valor cheio
• "Meia" — estudantes com carteirinha
• "VIP" — com acesso a sessão exclusiva ou kit premium
• "Early Bird" — desconto por tempo limitado (defina prazo de encerramento)
• "Equipe" — gratuito para voluntários e staff

3. PÁGINAS DE INSCRIÇÃO (Koách: até 5 / Chalém: até 10)
• Crie uma página principal para o público geral
• Crie uma segunda para imprensa e parceiros (com link exclusivo e formulário diferente)
• Crie uma terceira para credenciamento interno da equipe

4. CUPONS
• Cupom de porcentagem para organizações parceiras
• Cupom de valor fixo para influenciadores e embaixadores

5. EQUIPE (Koách: até 5 membros / Chalém: até 10 membros)
Adicione cada coordenador de área com a permissão correspondente. Os membros de equipe têm o plano Chinám gratuito — não há custo adicional para eles.
• Coordenador de inscrições → acesso a Participantes e Check-in
• Tesoureiro → acesso ao Financeiro
• Coordenador de logística → acesso a Recursos e Tarefas

6. PAGAMENTOS AUTOMÁTICOS (Chalém)
Com o gateway conectado (Asaas), os participantes pagam via PIX, boleto ou cartão diretamente na página de inscrição — sem precisar enviar comprovante.

7. CHECK-IN
Com muitos participantes, o check-in por QR Code é essencial. Distribua tablets na entrada, um por fila. Cada tablet abre a tela de Check-in do evento.

DICA:
Envie um e-mail de lembrete para os inscritos alguns dias antes com o QR Code — isso agiliza muito o credenciamento no dia.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },

  {
    id: 'mapa-cursos',
    slug: 'mapa-cursos',
    ordem: 43,
    titulo: 'Tovia para Cursos e Treinamentos',
    resumo: 'Como usar o Tovia para cursos presenciais, treinamentos de equipe e capacitações com controle de presença e certificação.',
    tags: ['cursos', 'treinamentos', 'capacitação', 'mapa', 'perfil'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80&auto=format&fit=crop',
    conteudo: `Cursos e treinamentos presenciais têm uma lógica diferente de outros eventos: as inscrições costumam ser controladas, há um valor de matrícula, o grupo é pequeno e o controle de presença é obrigatório para certificação.

CARACTERÍSTICAS DO PERFIL:
• Vagas limitadas e processo de inscrição controlado
• Taxa de matrícula ou mensalidade
• Presença obrigatória (para emissão de certificado)
• Turmas que se repetem (mesmo curso, datas diferentes)

FLUXO RECOMENDADO:

1. CRIAÇÃO DO EVENTO
Crie um evento por turma (ex: "Curso de Liderança — Turma Jan/2026"). Isso permite controlar inscrições e presença separadamente por turma.

2. INGRESSOS
• "Matrícula Geral" — valor cheio
• "Matrícula com Desconto" — para membros antigos, parceiros ou grupos
Use o prazo de encerramento das inscrições para fechar a matrícula antes do início do curso.

3. FORMULÁRIO
Inclua campos relevantes para certificação:
• Nome completo (exatamente como deve aparecer no certificado)
• CPF
• Ocupação / Função
• Organização ou empresa

4. CONTROLE DE PRESENÇA (múltiplos dias)
Se o curso tem múltiplos encontros, use o Check-in a cada aula para registrar presença. Exporte a lista de participantes ao final para calcular a frequência — quem tem X% de presença recebe o certificado.

5. TURMAS RECORRENTES
Para a próxima turma do mesmo curso, duplique as configurações criando um novo evento com o mesmo formulário e ingressos. O Tovia mantém os participantes de cada turma separados, facilitando o controle por turma.

DICA:
Use cupons com código do nome da turma (ex: "LIDER-JAN26") para facilitar a identificação de inscrições de parceiros ou indicações. Isso também permite medir a eficácia de cada canal de divulgação.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },

  {
    id: 'mapa-ongs',
    slug: 'mapa-ongs',
    ordem: 44,
    titulo: 'Tovia para ONGs e Projetos Sociais',
    resumo: 'Como ONGs, institutos e projetos sociais usam o Tovia para eventos com bolsas, inscrições gratuitas e prestação de contas a patrocinadores.',
    tags: ['ongs', 'projetos sociais', 'bolsas', 'gratuito', 'mapa', 'perfil'],
    autor: 'Equipe Tovia',
    banner_url: 'https://images.unsplash.com/photo-1758599668178-d9716bbda9d5?w=1200&q=80&auto=format&fit=crop',
    conteudo: `ONGs e projetos sociais têm um perfil específico: eventos muitas vezes gratuitos ou subsidiados, necessidade de prestação de contas e público que nem sempre tem acesso fácil à tecnologia. O Tovia atende bem esse perfil com inscrições simples e acessíveis.

CARACTERÍSTICAS DO PERFIL:
• Eventos gratuitos ou com taxa simbólica
• Sistema de bolsas para participantes de baixa renda
• Necessidade de relatórios para prestação de contas a patrocinadores e financiadores
• Participantes com perfil diverso (diferentes idades, regiões, acesso a tecnologia)

CONFIGURAÇÃO TÍPICA:
Chinám → ideal para ONGs com 1 evento por vez e até 100 participantes — custo zero para a organização
Pétach → quando há uma taxa de participação ou controle de doações
Koách → quando há múltiplos eventos simultâneos com equipe voluntária
Chalém → para eventos de grande impacto com inscrições ilimitadas e pagamento online

INGRESSOS RECOMENDADOS:
• "Inscrição Gratuita" — para o público geral (Chinám é suficiente para isso)
• "Bolsa Integral" — gratuito, via código de cupom controlado (distribua apenas para quem for aprovado na seleção)
• "Contribuição Voluntária" — tipo doação, para quem quiser apoiar financeiramente

FORMULÁRIO PARA PRESTAÇÃO DE CONTAS:
Inclua campos que os patrocinadores costumam exigir:
• Cidade e estado de origem
• Faixa de renda familiar
• Grau de escolaridade
• Como ficou sabendo do evento

Esses dados são exportáveis e podem compor o relatório de impacto social entregue ao patrocinador.

EQUIPE VOLUNTÁRIA:
Voluntários adicionados como membros de equipe têm o plano Chinám gratuito — sem custo adicional para a ONG. Eles acessam o evento com as permissões definidas pelo organizador.

DOAÇÕES:
Na aba Doações (Pétach+), registre contribuições de apoiadores e mantenedores do projeto. Separe do financeiro de inscrições para clareza na prestação de contas — é importante distinguir o que veio das inscrições e o que veio de doações.

DICA:
A página de inscrição pública do Tovia é simples de usar no celular — o que é essencial quando o público atendido tem acesso limitado a computadores. Teste o fluxo de inscrição no celular antes de divulgar para garantir uma boa experiência.`,
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
];
