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
    conteudo: `O Tovia é uma plataforma completa de gestão de eventos, desenvolvida para igrejas, ministérios, conferências e qualquer organização que precise organizar eventos com inscrições, pagamentos e equipe.

A plataforma foi criada para simplificar o que normalmente é complicado: receber inscrições, controlar pagamentos, gerenciar participantes e coordenar a equipe — tudo em um só lugar, sem precisar de planilhas ou ferramentas separadas.

Ao acessar o Tovia, você encontrará uma barra lateral com as principais seções: Início (seus eventos), Meu Perfil, Agenda, Calculadora, Relatórios e Faturamento. Cada evento criado tem suas próprias abas internas: Visão Geral, Ingressos, Páginas de Inscrição, Participantes e outras funcionalidades conforme o plano contratado.

O Tovia é organizado em três planos: Start (gratuito, ideal para eventos simples), Essencial (com controle financeiro online) e Pro (com recursos avançados como equipe, grupos e tarefas). Você pode evoluir de plano conforme seu evento crescer.

Explore cada seção usando o tutorial guiado ou consulte esta Base de Conhecimento sempre que precisar entender melhor alguma funcionalidade. Boas organizações de eventos!`,
    banner_url: '',
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
    conteudo: `O perfil da sua organização é a identidade que aparece em todos os pontos de contato com os participantes: nas páginas de inscrição, nos e-mails de confirmação e na página pública da organização.

Para configurar seu perfil, acesse a aba Meu Perfil na barra lateral. Lá você pode adicionar o nome da organização, logo, bio, contatos (e-mail, WhatsApp, site), endereço e redes sociais.

A logo é especialmente importante: ela aparece no topo das páginas de inscrição e nos e-mails enviados aos participantes, transmitindo profissionalismo e identidade visual ao seu evento.

O campo de descrição permite apresentar sua organização para os participantes que chegam pela página de inscrição sem conhecê-la previamente. Use-o para explicar quem vocês são e o que fazem.

Você também pode ativar uma página pública da organização, acessível por um link único (tovia.app/o/seu-usuario), que lista todos os seus eventos públicos. Essa página é uma vitrine para quem quiser conhecer o trabalho da sua organização.

Manter o perfil atualizado garante que as informações de contato nos e-mails automáticos estejam sempre corretas — isso evita que participantes fiquem sem resposta quando tiverem dúvidas.`,
    banner_url: '',
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
    conteudo: `A Agenda é uma visão calendário de todos os seus eventos. Ao clicar em Agenda na barra lateral, você verá um calendário mensal com os eventos distribuídos nos dias correspondentes às suas datas de início.

Cada evento aparece como um bloco colorido no calendário. Ao clicar em um evento, você é direcionado para a página interna desse evento, onde pode gerenciar ingressos, participantes e muito mais.

A Agenda é especialmente útil quando você organiza múltiplos eventos simultâneos ou em sequência. Em vez de navegar por uma lista, você consegue visualizar rapidamente se há conflito de datas, períodos de inscrição abertas e quando cada evento acontece.

Use os botões de navegação para avançar ou retroceder entre os meses. Eventos que se estendem por vários dias aparecem marcados em todos os dias do período.

Dica: antes de criar um novo evento, consulte a Agenda para garantir que não há sobreposição com outros eventos já programados, especialmente se você compartilha equipe ou espaço físico entre diferentes eventos.`,
    banner_url: '',
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
    conteudo: `A Calculadora de Eventos é uma ferramenta de planejamento que permite estimar a viabilidade financeira de um evento antes de criá-lo. Com ela, você define os parâmetros do evento e vê automaticamente os números calculados.

Na calculadora, você preenche: número de vagas, valor do ingresso (ou meta de arrecadação), custos fixos (aluguel de espaço, estrutura, etc.) e custos variáveis por participante (alimentação, material, etc.). A calculadora então mostra o ponto de equilíbrio — quantas inscrições você precisa para cobrir todos os custos.

Isso é muito útil para saber se o preço do ingresso está adequado ou se a capacidade planejada é suficiente para tornar o evento viável financeiramente.

No plano Essencial e Pro, após fazer os cálculos, você pode clicar em Criar Evento para que os dados da calculadora sejam transferidos automaticamente para as configurações financeiras do evento — evitando retrabalho.

No plano Start, a calculadora funciona apenas como ferramenta de planejamento, sem integração com as configurações financeiras do evento (que não estão disponíveis nesse plano).

Use a calculadora antes de divulgar qualquer evento. Definir o preço certo desde o início evita problemas financeiros durante o evento.`,
    banner_url: '',
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
    conteudo: `A aba Relatórios oferece uma visão consolidada de todos os seus eventos ativos e históricos. Em vez de acessar evento por evento, você tem uma visão macro da sua organização como um todo.

Os relatórios mostram: total de participantes inscritos em todos os eventos, capacidade total disponível, taxa de ocupação média, eventos ativos no momento e destaque de desempenho (qual evento tem mais inscrições).

Esses dados são úteis para entender o alcance da sua organização ao longo do tempo. Por exemplo, ao final do ano você consegue ver quantas pessoas passaram pelos seus eventos, qual foi o evento com maior engajamento e como a capacidade foi utilizada.

Os gráficos na seção de relatórios facilitam a visualização de tendências — crescimento no número de participantes, distribuição de eventos por período e outras métricas importantes para tomada de decisão.

Dica: use os relatórios também para apresentar resultados para parceiros, mantenedores ou lideranças da sua organização. Os dados consolidados mostram o impacto do trabalho de forma objetiva.

Os relatórios são atualizados automaticamente conforme novas inscrições são realizadas nos seus eventos, sem necessidade de ação manual.`,
    banner_url: '',
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
    conteudo: `A aba Faturamento mostra as informações da sua assinatura no Tovia: qual plano você contratou, os limites de eventos e participantes incluídos, e o histórico de pagamentos da plataforma.

Nessa página você encontra: o plano atual (Start, Essencial ou Pro), a data de renovação, o valor pago mensalmente e o status de cada cobrança (pago, pendente, vencido).

Os limites de cada plano são exibidos com indicadores de uso: por exemplo, "3 de 5 eventos utilizados" ou "148 de 200 participantes". Isso te ajuda a planejar quando pode ser necessário fazer upgrade para o próximo plano.

Para fazer upgrade, clique no botão de troca de plano na própria aba de Faturamento. Você será direcionado para a página de planos onde pode comparar as funcionalidades e escolher o plano adequado.

O Tovia não realiza cobranças dos participantes dos seus eventos — todas as transações financeiras dos seus eventos são gerenciadas por você. O Faturamento aqui se refere apenas à assinatura da plataforma Tovia.

Em caso de dúvidas sobre sua assinatura ou faturas, entre em contato com o suporte através do e-mail ou WhatsApp informado na página de planos.`,
    banner_url: '',
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
    conteudo: `A página Início é o ponto central do Tovia. Ao fazer login, você é direcionado para essa página, que lista todos os seus eventos — tanto os que você criou quanto os que você foi adicionado como membro de equipe.

Cada evento aparece como um card com: nome do evento, data, status (ativo, encerrado, rascunho), número de inscrições realizadas e capacidade total. Os eventos são organizados por data, com os mais próximos aparecendo primeiro.

Ao clicar em um card de evento, você entra na página interna desse evento, onde encontra todas as abas de gerenciamento: Visão Geral, Ingressos, Páginas de Inscrição, Participantes, e as abas avançadas conforme o plano.

O botão de status rápido em cada card permite arquivar ou encerrar um evento sem precisar entrar nele. Eventos encerrados ainda ficam acessíveis para consulta, mas não aceitam novas inscrições.

Também na página Início você encontra o botão Criar Evento (ou na barra lateral), que inicia o fluxo de criação de um novo evento.

Dica: mantenha o nome dos eventos claro e objetivo — ele aparece para os participantes nas páginas de inscrição e nos e-mails de confirmação.`,
    banner_url: '',
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
    conteudo: `Criar um evento no Tovia é rápido e direto. Clique no botão Criar Evento na barra lateral ou na página Início para iniciar o fluxo de criação.

Você precisará preencher: nome do evento, descrição, data de início, data de término (opcional), local (endereço ou link de evento online) e uma imagem de capa. Esses são os dados básicos que aparecerão para os participantes nas páginas de inscrição.

Após criar o evento, você é direcionado para a página interna, onde pode configurar ingressos, páginas de inscrição e demais detalhes. O evento começa como "ativo" — você pode alterar o status para rascunho se quiser continuar configurando antes de divulgar.

Pense na descrição do evento como a principal comunicação com os participantes. Uma boa descrição responde: o que é o evento, para quem é, o que vai acontecer e por que vale participar.

Para a imagem de capa, use uma foto ou arte com boa resolução (mínimo 800×450px). Ela é o primeiro impacto visual que o participante tem ao acessar a página de inscrição — vale caprichar.

Após criar o evento, a próxima etapa obrigatória é configurar pelo menos um ingresso. Sem ingressos, o evento não tem como receber inscrições.`,
    banner_url: '',
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
    conteudo: `Os ingressos definem como os participantes vão se inscrever no seu evento: se é gratuito, pago ou por doação. Todo evento precisa ter ao menos um ingresso configurado para receber inscrições.

Para configurar ingressos, entre no seu evento e clique na aba Ingressos. Ali você pode criar um ou mais tipos de ingresso para o mesmo evento — por exemplo, "Ingresso Geral" (gratuito) e "Ingresso VIP" (pago), ou "Adulto" e "Criança".

Cada ingresso tem: nome, tipo (gratuito, pago ou doação), valor (se pago), quantidade de vagas disponíveis e prazo de inscrições (data de abertura e encerramento). Você pode ativar ou desativar um ingresso sem precisar excluí-lo.

No tipo "doação", o participante decide o valor que quer contribuir, com ou sem um valor sugerido definido por você. Isso é muito usado em conferências e retiros que trabalham com ofertas livres.

As formas de pagamento aceitas em cada ingresso pago são configuradas junto com a conta de recebimento (disponível no Essencial e Pro). No plano Start, os ingressos são limitados ao tipo gratuito.

Dica: crie ingressos com nomes claros que ajudem os participantes a identificar qual categoria se aplica a eles. Evite termos técnicos ou internos que só fazem sentido para a equipe organizadora.`,
    banner_url: '',
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
    conteudo: `As Páginas de Inscrição são a interface pública do seu evento — o link que você compartilha nas redes sociais, no WhatsApp e onde quer que vá divulgar. Cada página pode ter ingressos específicos, formulário personalizado e design próprio.

Para criar uma página de inscrição, entre no evento e acesse a aba Páginas de Inscrição. Clique em Nova Página, defina um título, escolha quais ingressos serão oferecidos nessa página, e configure o formulário de dados que os participantes devem preencher.

Um evento pode ter múltiplas páginas de inscrição. Por exemplo: uma página pública com ingressos gerais, e outra página privada (com link específico) para inscrições de equipe ou voluntários, com campos diferentes.

O formulário de cada página é totalmente personalizável. Além dos campos padrão (nome, e-mail, telefone), você pode adicionar campos específicos do seu evento: tamanho de camiseta, restrição alimentar, cidade de origem, etc.

Ao ativar uma página, ela recebe um link público no formato tovia.app/e/id-do-evento/nome-da-pagina. Esse link pode ser compartilhado diretamente. Participantes que acessam esse link veem a página de inscrição sem precisar criar conta no Tovia.

A confirmação de inscrição é enviada automaticamente por e-mail para o participante, com os dados da inscrição e as informações de contato do organizador.`,
    banner_url: '',
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
    conteudo: `A aba Participantes exibe todas as inscrições recebidas no evento, com informações detalhadas de cada inscrito: nome, e-mail, telefone, ingresso escolhido, data da inscrição, status do pagamento e respostas do formulário personalizado.

Nessa aba você pode filtrar participantes por ingresso, por status de pagamento ou pesquisar pelo nome. Isso facilita encontrar um participante específico em eventos com muitas inscrições.

O status de cada inscrição indica a situação do pagamento: Pendente (ainda não pagou), Pago (confirmado), Cancelado e outros. Nos planos Essencial e Pro, o status é atualizado automaticamente quando o pagamento online é confirmado. No plano Start, a confirmação é feita manualmente.

Você pode registrar informações adicionais em cada inscrição, como observações internas ou notas da equipe — isso não é visível para o participante.

A lista de participantes pode ser exportada para planilha (formato CSV/Excel), com todos os campos preenchidos nos formulários. Isso é útil para geração de crachás, listas de presença e relatórios pós-evento.

Dica: use o campo de status para acompanhar o processo de confirmação em eventos com muitos participantes. Marcar como "Pago" manualmente após receber o comprovante evita cobranças duplicadas ou confusões na entrada do evento.`,
    banner_url: '',
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
    conteudo: `A Base de Conhecimento é o repositório de artigos e tutoriais sobre o Tovia. Aqui você encontra explicações detalhadas sobre cada funcionalidade da plataforma, dicas de uso e respostas para as perguntas mais frequentes.

Os artigos estão organizados na mesma sequência do Tutorial Guiado — seguindo a lógica de uso da plataforma, do básico ao avançado, e agrupados por plano (Start, Essencial, Pro).

Para encontrar um artigo específico, use a barra de busca no topo da página. A busca pesquisa dentro do título, das tags e do conteúdo dos artigos, então você pode buscar por termos como "ingresso", "página de inscrição" ou "exportar".

O conteúdo da Base de Conhecimento é atualizado pela equipe Tovia conforme novas funcionalidades são lançadas ou quando percebemos que muitos usuários têm dúvidas sobre algum ponto específico.

Se você não encontrar resposta para sua dúvida aqui, entre em contato com o suporte pelo WhatsApp ou e-mail informados na aba Faturamento do seu painel. Nossa equipe está disponível para ajudar.

Sugestões de novos artigos são bem-vindas — se você sentiu falta de alguma explicação, nos envie uma mensagem e faremos o possível para incluir na próxima atualização.`,
    banner_url: '',
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
    tags: ['pagamentos', 'financeiro', 'configuração', 'essencial'],
    autor: 'Equipe Tovia',
    conteudo: `A aba Configurações Financeiras (disponível nos planos Essencial e Pro) é onde você define as regras financeiras do evento: custo total previsto, meta de arrecadação, taxas e margens. O Tovia é um organizador financeiro — não processamos cobranças. Toda a gestão de recebimentos é feita por você.

Nessa aba você preenche: o custo total previsto do evento (soma de todos os gastos esperados, como local, alimentação, material), a meta de arrecadação com inscrições e doações, e as taxas ou margens que deseja considerar no planejamento.

Com esses dados preenchidos, o Tovia calcula automaticamente o ponto de equilíbrio: quantas inscrições você precisa confirmar para cobrir os custos. Isso é visível no painel financeiro do evento.

Você também pode definir taxas administrativas ou de processamento externo para que os valores reais apareçam corretamente nos relatórios. Por exemplo, se você recebe pagamentos via Pix e cobra uma taxa de organização, pode configurar isso aqui.

A comparação entre o custo previsto e o total arrecadado (registrado manualmente na aba Financeiro) aparece em tempo real, permitindo acompanhar se o evento está dentro do orçamento.

Importante: cada evento tem suas próprias configurações financeiras. Configure os dados de cada evento separadamente — os números de um evento não interferem nos outros.`,
    banner_url: '',
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
    tags: ['financeiro', 'pagamentos', 'fluxo de caixa', 'essencial'],
    autor: 'Equipe Tovia',
    conteudo: `A aba Financeiro (disponível nos planos Essencial e Pro) centraliza o registro e acompanhamento de todos os recebimentos do evento. O Tovia não processa cobranças — você recebe os pagamentos pelos seus próprios meios (Pix, dinheiro, transferência, etc.) e registra aqui o que foi recebido.

Para registrar um pagamento, clique em "Adicionar Pagamento", selecione o participante, informe o valor recebido, a forma de pagamento (Pix, dinheiro, cartão, transferência...) e a data. O status da inscrição correspondente é atualizado automaticamente para "Pago".

A aba mostra: o total arrecadado até o momento, o saldo pendente (participantes que ainda não tiveram o pagamento confirmado) e a comparação com a meta definida nas Configurações Financeiras.

Para pagamentos em parcelas, registre cada parcela separadamente informando o valor parcial. O sistema acumula as parcelas e você acompanha o total pago por participante com clareza.

Todos os registros são manuais e ficam visíveis apenas para você e sua equipe — os participantes não têm acesso ao painel financeiro.

Dica: mantenha o registro atualizado conforme os pagamentos vão chegando. Isso facilita a prestação de contas para parceiros, patrocinadores ou lideranças após o evento, e evita cobranças duplicadas na entrada.`,
    banner_url: '',
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
    tags: ['doações', 'contribuições', 'essencial'],
    autor: 'Equipe Tovia',
    conteudo: `A aba Doações (disponível nos planos Essencial e Pro) registra e exibe todas as contribuições recebidas no evento. O Tovia não processa cobranças — você recebe as doações pelos seus próprios meios e registra aqui o que chegou.

Para registrar uma doação, clique em "Alocar Doação", selecione o participante (ou informe um doador externo), defina o valor, a forma de pagamento e a data. O registro fica salvo no histórico e entra na soma total do evento.

Uma doação pode ser de valor livre (o doador decide quanto contribuir) ou com valor sugerido (você define um valor de referência visível na página de inscrição). Essa flexibilidade é ideal para retiros, conferências e eventos com cultura de oferta.

A aba exibe: o total de doações registradas, a média de contribuição por doador e o histórico completo com nome, valor, data e forma de pagamento.

As doações também entram no cálculo financeiro geral do evento, somando com os pagamentos de ingressos para compor o total arrecadado versus o custo previsto.

Dica: use o campo de observações ao registrar uma doação para anotar informações relevantes, como o número do comprovante Pix ou a designação específica da oferta (ex: "para o fundo de bolsas").`,
    banner_url: '',
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
    tags: ['recursos', 'equipamentos', 'espaços', 'pro'],
    autor: 'Equipe Tovia',
    conteudo: `A aba Recursos (disponível apenas no plano Pro) permite cadastrar e gerenciar tudo que o evento precisa de infraestrutura: equipamentos, espaços físicos, materiais e qualquer outro recurso que precise de controle de disponibilidade.

Para cada recurso você define: nome, tipo (equipamento, espaço, material, etc.), quantidade disponível, responsável e observações. Você pode então alocar recursos para horários específicos dentro do evento, garantindo que não haverá conflito de uso.

Isso é especialmente útil em eventos complexos com múltiplas salas e sessões simultâneas, onde o mesmo projetor ou espaço precisa ser compartilhado entre diferentes programações.

A visão de disponibilidade mostra, para cada recurso, em quais momentos ele está alocado e quando está livre. Isso facilita o planejamento da programação evitando conflitos.

Você pode também associar recursos a tarefas (aba Tarefas), de modo que a equipe responsável por uma atividade saiba quais recursos foram reservados para ela.

Dica: cadastre os recursos logo após criar o evento e antes de montar a programação. Assim você parte do inventário real disponível ao planejar as alocações.`,
    banner_url: '',
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
    tags: ['grupos', 'quartos', 'hospedagem', 'pro'],
    autor: 'Equipe Tovia',
    conteudo: `A aba Grupos (disponível apenas no plano Pro) permite dividir os participantes do evento em grupos, quartos, mesas ou qualquer outra estrutura de agrupamento. É ideal para acampamentos, retiros, conferências com hospedagem e eventos com mesas temáticas.

Para cada grupo você define: nome, capacidade máxima, tipo (quarto, mesa, ônibus, célula, etc.) e a lista de participantes alocados. A aba exibe quantas vagas cada grupo tem disponíveis e quem já foi alocado.

A alocação de participantes pode ser feita manualmente, um a um, ou usando filtros para selecionar participantes por critério (por exemplo, alocar todos de um determinado perfil em um grupo específico).

A visão geral dos grupos mostra a taxa de ocupação de cada grupo e o total disponível versus preenchido, permitindo uma gestão visual rápida da distribuição de participantes.

Nos retiros e acampamentos, é comum definir os grupos logo após o encerramento das inscrições, quando se conhece o número exato de participantes. Use a exportação de participantes para auxiliar na montagem dos grupos se preferir trabalhar em planilha antes.

Dica: dê nomes descritivos e intuitivos para os grupos — "Quarto 1" é menos útil do que "Quarto Azul (Homens)" ou "Mesa dos Líderes". Isso facilita a comunicação com a equipe no dia do evento.`,
    banner_url: '',
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
    tags: ['tarefas', 'cronograma', 'equipe', 'pro'],
    autor: 'Equipe Tovia',
    conteudo: `A aba Tarefas (disponível apenas no plano Pro) é onde você monta o cronograma operacional do evento, com cada atividade organizada em tarefas que podem ser atribuídas a membros da equipe.

Para cada tarefa você define: título, descrição, responsável, data/horário de início e término, status (a fazer, em andamento, concluída) e a prioridade. As tarefas aparecem em uma lista organizada por data, facilitando a visão do que precisa ser feito e quando.

Quando um membro da equipe acessa o evento, ele vê as tarefas atribuídas a ele com clareza. Isso elimina a necessidade de listas de WhatsApp ou planilhas paralelas para coordenar a equipe.

Ao longo do evento, a equipe pode atualizar o status das tarefas em tempo real — de "a fazer" para "em andamento" e depois para "concluída". O coordenador consegue ver o progresso geral de tudo de uma vez.

As tarefas podem ser associadas a recursos específicos (aba Recursos), de forma que a equipe saiba quais materiais e espaços estão disponíveis para cada atividade.

Dica: crie as tarefas com pelo menos uma semana de antecedência e atribua responsáveis com clareza. Evite tarefas genéricas como "organizar o evento" — prefira tarefas específicas como "montar palco da sessão da tarde" ou "receber participantes na portaria das 14h às 18h".`,
    banner_url: '',
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
  {
    id: 'equipe',
    slug: 'equipe',
    ordem: 19,
    titulo: 'Equipe!',
    resumo: 'Adicione colaboradores ao evento para que eles também possam gerenciar inscrições, financeiro e tarefas. Trabalhe junto com quem te ajuda.',
    tags: ['equipe', 'colaboradores', 'permissões', 'pro'],
    autor: 'Equipe Tovia',
    conteudo: `A aba Equipe (disponível apenas no plano Pro) permite adicionar colaboradores ao seu evento para que outras pessoas possam ajudar a gerenciar inscrições, financeiro, recursos e tarefas.

Para adicionar um membro, informe o e-mail da pessoa e defina as permissões que ela terá no evento. As permissões são modulares: você pode dar acesso apenas às Inscrições, apenas ao Financeiro, apenas à Gestão de Recursos, ou qualquer combinação.

Os membros da equipe recebem um convite por e-mail. Ao aceitar, eles conseguem acessar o evento diretamente pelo painel Tovia deles — o evento aparece na lista de eventos deles junto com os que criaram.

A pessoa adicionada como equipe não vê as configurações da conta do organizador (plano, faturamento), apenas o conteúdo do evento para o qual foi convidada.

Para remover um membro da equipe, acesse a aba Equipe e clique em remover ao lado do nome da pessoa. O acesso é revogado imediatamente.

Dica: use a aba Equipe para delegar funções antes do evento começar. Por exemplo: adicionar a secretaria como gestora de inscrições, o tesoureiro como gestor financeiro e os coordenadores de grupo como gestores de recursos. Isso distribui o trabalho e mantém o organizador principal focado na visão geral.`,
    banner_url: '',
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
    conteudo: `Parabéns por completar o tour do Tovia! Você agora conhece todas as ferramentas disponíveis na plataforma e como cada uma contribui para a organização de eventos de sucesso.

A jornada recomendada para um novo evento é: criar o evento → configurar ingressos → criar a página de inscrição → divulgar o link → acompanhar as inscrições e participantes → gerenciar o financeiro (Essencial/Pro) → coordenar equipe e recursos (Pro).

Para rever qualquer etapa do tutorial, clique em Tutorial na barra lateral do painel a qualquer momento. O tutorial foi pensado para ser consultado quantas vezes forem necessárias.

Esta Base de Conhecimento é sempre atualizada com novos artigos e melhorias nas explicações existentes. Se você sentiu falta de alguma informação ou encontrou algo que poderia ser mais claro, entre em contato com a equipe Tovia.

Novidades da plataforma são comunicadas por e-mail e no painel. Fique de olho nas notificações para saber quando novas funcionalidades ficarem disponíveis.

Boa sorte na organização dos seus próximos eventos! O Tovia foi feito para que você gaste menos tempo com planilhas e mais tempo com o que realmente importa: transformar vidas através de eventos incríveis.`,
    banner_url: '',
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
];
