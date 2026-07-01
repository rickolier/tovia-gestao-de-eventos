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

  // ─── Artigos faltantes do tutorial (mapeados 1-a-1 com os passos) ───────────

  {
    id: 'cupons',
    slug: 'cupons',
    ordem: 21,
    titulo: 'Cupons de desconto!',
    resumo: 'Crie cupons percentuais ou de valor fixo para seus eventos. Compartilhe com o público certo e acompanhe os usos em tempo real.',
    tags: ['cupons', 'desconto', 'promoção', 'inscrições'],
    autor: 'Equipe Tovia',
    conteudo: `Os cupons de desconto permitem oferecer preços diferenciados para grupos específicos de participantes — early birds, membros da organização, parceiros ou qualquer outro perfil.

Para criar um cupom, entre no evento e acesse a aba Cupons. Clique em Novo Cupom e defina: código (ex: "LIDER2025"), tipo (percentual ou valor fixo), valor do desconto, quantidade máxima de usos e prazo de validade.

O código do cupom é inserido pelo participante na página de inscrição, antes de confirmar. O desconto é aplicado automaticamente ao valor do ingresso escolhido. Cupons expirados ou esgotados são recusados com mensagem clara.

Você pode criar múltiplos cupons para o mesmo evento — por exemplo: um cupom de 20% para membros da sua base, outro de valor fixo (R$50 off) para parceiros e um terceiro para influenciadores com código personalizado.

Na listagem de cupons você acompanha, para cada código: quantas vezes foi usado, o total de desconto concedido e se ainda está ativo. Isso permite medir o alcance de cada ação promocional.

Dica: evite cupons com desconto de 100% em eventos pagos — prefira criar um ingresso gratuito separado para isenções, assim você mantém o controle de quem tem acesso gratuito sem comprometer a integridade financeira dos relatórios.`,
    banner_url: '',
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
    conteudo: `A tela de Check-in foi projetada para funcionar na entrada do evento: confirma presenças de forma rápida, mesmo com muitos participantes na fila.

Para acessar o check-in, entre no evento e clique na aba Check-in, ou use o link direto disponível nessa aba — ideal para abrir no celular de quem está na portaria sem precisar acessar o painel completo.

Na tela de check-in você pode confirmar presença de três formas:
1. Busca por nome: comece a digitar o nome e os participantes aparecem filtrados em tempo real.
2. Busca por CPF ou campo personalizado: se o formulário incluía CPF, telefone ou outro identificador, você pode buscar por esse dado.
3. Leitura de QR Code: cada confirmação de inscrição enviada por e-mail contém um QR Code único. Aponte a câmera do celular para o QR Code e a presença é confirmada instantaneamente.

Ao confirmar uma presença, o status da inscrição muda para "Presente" e o registro é salvo com horário. Isso garante uma lista de presença fiel ao final do evento.

Se um participante chega sem QR Code (perdeu o e-mail), busque pelo nome ou CPF. Nunca deixe alguém sem entrar por falta do QR Code — a busca manual existe justamente para isso.

Dica: abra a tela de check-in em um tablet na portaria. Com tela maior, a busca por nome fica mais prática e visível para a equipe. Se possível, tenha uma segunda pessoa buscando na lista enquanto outra recebe as pessoas.`,
    banner_url: '',
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },

  // ─── Mapas de uso por plano ───────────────────────────────────────────────────

  {
    id: 'caminho-start',
    slug: 'caminho-start',
    ordem: 30,
    titulo: 'Plano Start: o caminho mais eficiente',
    resumo: 'Você está no plano gratuito. Veja o passo a passo para tirar o máximo proveito do Start e quando faz sentido fazer upgrade.',
    tags: ['start', 'gratuito', 'caminho', 'guia de uso', 'mapa'],
    autor: 'Equipe Tovia',
    conteudo: `O plano Start é gratuito e permanente — você pode usar o Tovia sem pagar enquanto o Start atender suas necessidades. Ele é ideal para quem está começando ou organiza eventos pequenos e esporádicos.

O que você pode fazer no Start:
• 1 evento ativo por vez (eventos encerrados não contam no limite)
• Até 200 participantes por evento
• 1 tipo de ingresso por evento (gratuito)
• Páginas de inscrição públicas com formulário personalizado
• Confirmação de inscrição por e-mail automática
• Lista de participantes com exportação
• Check-in por nome ou QR Code
• Cupons de desconto
• Agenda mensal de eventos
• Relatórios consolidados

Caminho recomendado no Start:
1. Complete seu perfil (logo, nome da organização, contato) → aparece em todos os e-mails e páginas de inscrição
2. Crie seu evento (nome, data, local, imagem de capa)
3. Configure 1 ingresso gratuito com número de vagas e prazo
4. Crie a página de inscrição e personalize o formulário
5. Copie o link da página e divulgue
6. Acompanhe as inscrições na aba Participantes
7. No dia do evento, use o Check-in para confirmar presenças

Quando considerar upgrade para o Essencial:
• Se você precisa de ingressos pagos (cobrar dos participantes)
• Se organiza mais de 1 evento simultâneo
• Se precisa de mais de 200 participantes por evento
• Se quer controlar o financeiro do evento (entradas, doações, saldo)

O upgrade não exclui nenhum dado — tudo que foi criado no Start continua disponível no Essencial ou Pro.`,
    banner_url: '',
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },

  {
    id: 'caminho-essencial',
    slug: 'caminho-essencial',
    ordem: 31,
    titulo: 'Plano Essencial: o caminho mais eficiente',
    resumo: 'Você tem o plano Essencial com controle financeiro manual. Veja como configurar seu evento do zero até o relatório final.',
    tags: ['essencial', 'financeiro', 'caminho', 'guia de uso', 'mapa'],
    autor: 'Equipe Tovia',
    conteudo: `O plano Essencial é ideal para organizações que precisam cobrar pelos eventos e controlar os recebimentos. O Tovia não processa pagamentos — você usa Pix, dinheiro, transferência ou qualquer meio e registra aqui o que foi recebido.

O que você pode fazer no Essencial:
• Até 3 eventos ativos simultaneamente
• Até 500 participantes por evento
• Até 3 tipos de ingresso por evento (gratuito, pago, doação)
• Tudo do Start, mais:
• Registro manual de pagamentos por participante
• Módulo de doações com alocação por participante
• Configuração financeira do evento (custo previsto, meta de arrecadação)
• Relatório financeiro: total arrecadado vs. custo previsto

Caminho recomendado no Essencial:

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

Quando considerar upgrade para o Pro:
• Se você organiza mais de 3 eventos simultâneos
• Se precisa de mais de 500 participantes por evento
• Se quer adicionar colaboradores como gestores do evento (equipe)
• Se precisa organizar grupos/quartos de participantes
• Se quer gestão de tarefas e cronograma com a equipe`,
    banner_url: '',
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },

  {
    id: 'caminho-pro',
    slug: 'caminho-pro',
    ordem: 32,
    titulo: 'Plano Pro: o caminho mais eficiente',
    resumo: 'Você tem o plano Pro com todos os recursos do Tovia. Veja como usar equipe, grupos, tarefas e recursos para eventos complexos.',
    tags: ['pro', 'equipe', 'gestão', 'caminho', 'guia de uso', 'mapa'],
    autor: 'Equipe Tovia',
    conteudo: `O plano Pro dá acesso a todos os recursos do Tovia sem limite de eventos ou participantes. É ideal para organizações que realizam eventos frequentes, com equipe, logística complexa ou hospedagem de participantes.

O que você pode fazer no Pro (além de tudo do Essencial):
• Eventos e participantes ilimitados
• Equipe: adicione colaboradores com permissões específicas
• Grupos/Quartos: organize participantes em grupos, mesas, quartos ou ônibus
• Tarefas: monte o cronograma operacional com responsáveis e prazos
• Recursos: gerencie equipamentos, espaços e materiais com controle de disponibilidade
• Calculadora de Evento: estime viabilidade financeira antes de criar o evento

Caminho recomendado no Pro:

PLANEJAMENTO (semanas antes):
1. Use a Calculadora de Evento para estimar viabilidade financeira (vagas × valor − custos = ponto de equilíbrio)
2. Crie o evento com base nos resultados da calculadora
3. Configure os ingressos (ilimitados: gratuito, pago, doação, early bird, VIP...)
4. Monte as Tarefas do evento com responsáveis e prazos
5. Adicione os membros da Equipe com permissões adequadas (inscrições, financeiro, gestão)

DIVULGAÇÃO:
6. Crie a página de inscrição com formulário personalizado
7. Crie cupons de desconto por perfil de público
8. Divulgue o link e acompanhe inscrições em tempo real

ORGANIZAÇÃO (dias antes):
9. Organize os participantes em Grupos/Quartos conforme inscrições chegam
10. Aloque Recursos (equipamentos, salas) nas tarefas
11. Registre pagamentos na aba Financeiro

NO DIA:
12. A equipe acessa as tarefas atribuídas pelo próprio painel
13. Check-in na entrada — por nome ou QR Code
14. Atualização de status de tarefas em tempo real

PÓS-EVENTO:
15. Consulte relatório financeiro e exporte participantes
16. Archive o evento para manter o painel organizado`,
    banner_url: '',
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
    conteudo: `Igrejas e ministérios são um dos principais perfis de usuário do Tovia. O contexto de fé tem algumas particularidades que a plataforma atende bem: mistura de inscrições gratuitas e por doação, necessidade de confirmação por e-mail, eventos recorrentes e equipe voluntária.

USOS COMUNS:
• Conferências anuais (jovens, mulheres, casais, liderança)
• Retiros e acampamentos com hospedagem
• Cultos especiais com inscrição (Natal, Páscoa, Semana Santa)
• Eventos de evangelismo abertos ao público
• Células e pequenos grupos com controle de presença
• Congressos com programação paralela e múltiplas salas

CONFIGURAÇÃO TÍPICA:
Plano Start → ideal para evento único gratuito (culto especial, retiro pequeno)
Plano Essencial → ideal para eventos com oferta/contribuição (retiros com taxa de participação)
Plano Pro → ideal para conferências com equipe, hospedagem em grupos e programação de múltiplas salas

INGRESSOS RECOMENDADOS:
• "Inscrição Geral" (gratuita) para eventos abertos
• "Contribuição de R$X" para retiros e conferências com custos
• "Doação Livre" para quem não tem condição de pagar o valor cheio
• Cupom "LIDER" com desconto para líderes de célula ou pastores

GRUPOS/QUARTOS:
Retiros e acampamentos se beneficiam muito da aba Grupos. Configure quartos separados por gênero e faixa etária (ex: "Feminino Adulto", "Masculino Jovem") e aloque os participantes conforme chegam as inscrições.

EQUIPE:
No plano Pro, adicione a secretaria como gestora de inscrições e o tesoureiro como gestor financeiro. Assim cada pessoa cuida da sua área sem precisar compartilhar senha.

DICA PARA IGREJAS:
Use o campo "Observações" no formulário de inscrição para perguntas específicas: qual célula frequenta, se é membro ou visitante, se tem restrição alimentar. Essas informações são exportáveis e facilitam o planejamento.`,
    banner_url: '',
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
    conteudo: `Retiros e acampamentos têm desafios únicos de logística: hospedagem em grupos, alimentação, transporte e cronograma operacional com equipe. O plano Pro do Tovia foi projetado para esse cenário.

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
• Registre os pagamentos na aba Financeiro conforme chegam
• Acompanhe o total arrecadado vs. custo previsto em tempo real

4. ORGANIZAÇÃO (semana antes)
• Acesse a aba Grupos e crie os quartos/cabanas com capacidade
• Aloque os participantes considerando gênero, faixa etária e amizades relatadas no formulário
• Configure as Tarefas da equipe: montagem, recepção, cozinha, limpeza, programação
• Certifique-se de que cada voluntário está adicionado como equipe e tem as tarefas atribuídas

5. NO DIA
• Use o Check-in para confirmar chegada (por nome ou QR Code)
• A equipe acompanha e atualiza as tarefas pelo próprio painel

DICA:
Inclua no formulário de inscrição: restrição alimentar, tamanho de camiseta (se houver uniforme/brinde), condição de saúde relevante e contato de emergência. Essas informações são exportáveis e essenciais para a logística.`,
    banner_url: '',
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
    conteudo: `Conferências e congressos reúnem grande volume de participantes, múltiplos ingressos (meia, inteira, VIP, estudante) e uma equipe numerosa na organização. O Tovia Pro atende esse perfil com recursos de gestão de equipe, múltiplos ingressos e check-in ágil.

CARACTERÍSTICAS DO PERFIL:
• Volume alto de participantes (centenas a milhares)
• Diferentes categorias de acesso e valores
• Programação com múltiplas trilhas simultâneas
• Equipe grande dividida em funções (recepção, credenciamento, imprensa, técnica, segurança)
• Necessidade de credenciamento rápido na entrada

FLUXO RECOMENDADO:

1. PLANEJAMENTO
Comece pela Calculadora de Evento. Em conferências, os custos fixos (local, AV, palestrantes) são altos — calcule o ponto de equilíbrio com realismo antes de definir o preço dos ingressos.

2. INGRESSOS
Crie múltiplos tipos de ingresso:
• "Inteira" — valor cheio
• "Meia" — estudantes com carteirinha
• "VIP" — com acesso a sessão exclusiva ou kit premium
• "Early Bird" — desconto por tempo limitado (defina prazo de encerramento)
• "Equipe" — gratuito para voluntários e staff

3. PÁGINAS DE INSCRIÇÃO
• Crie uma página principal para o público geral
• Crie uma segunda página para imprensa e parceiros (com link exclusivo e formulário diferente)
• Crie uma terceira para credenciamento interno da equipe

4. CUPONS
• Cupom de porcentagem para organizações parceiras e igrejas que divulgam
• Cupom de valor fixo para influenciadores e embaixadores

5. EQUIPE (Pro)
Adicione cada coordenador de área como membro da equipe com a permissão correspondente. Assim você delega sem perder controle:
• Coordenador de inscrições → acesso a Participantes e Check-in
• Tesoureiro → acesso ao Financeiro
• Coordenador de logística → acesso a Recursos e Tarefas

6. CHECK-IN
Com muitos participantes, o check-in por QR Code é essencial. Distribua tablets na entrada, um por fila. Cada tablet abre a tela de Check-in do evento — sem precisar de logins separados.

DICA:
Envie um e-mail de lembrete para os inscritos alguns dias antes (via sua ferramenta de e-mail, fora do Tovia) com o QR Code anexado — isso agiliza muito o credenciamento no dia.`,
    banner_url: '',
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
    banner_url: '',
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
    conteudo: `ONGs e projetos sociais têm um perfil específico: eventos muitas vezes gratuitos ou subsidiados, necessidade de prestação de contas e público que nem sempre tem acesso fácil à tecnologia. O Tovia atende bem esse perfil com inscrições simples e acessíveis.

CARACTERÍSTICAS DO PERFIL:
• Eventos gratuitos ou com taxa simbólica
• Sistema de bolsas para participantes de baixa renda
• Necessidade de relatórios para prestação de contas a patrocinadores e financiadores
• Participantes com perfil diverso (diferentes idades, regiões, acesso a tecnologia)

CONFIGURAÇÃO TÍPICA:
Plano Start → ideal para ONGs com poucos eventos por vez e até 200 participantes
Plano Essencial → quando há uma taxa de participação ou controle de doações
Plano Pro → quando há múltiplos eventos simultâneos com equipe grande

INGRESSOS RECOMENDADOS:
• "Inscrição Gratuita" — para o público geral (Start basta para isso)
• "Bolsa Integral" — gratuito, via código de cupom controlado (distribua apenas para quem for aprovado na seleção)
• "Contribuição Voluntária" — tipo doação, para quem quiser apoiar financeiramente

FORMULÁRIO PARA PRESTAÇÃO DE CONTAS:
Inclua campos que os patrocinadores costumam exigir:
• Cidade e estado de origem
• Faixa de renda familiar
• Grau de escolaridade
• Como ficou sabendo do evento

Esses dados são exportáveis e podem compor o relatório de impacto social entregue ao patrocinador.

DOAÇÕES:
Na aba Doações (Essencial/Pro), registre contribuições de apoiadores e mantenedores do projeto. Separe do financeiro de inscrições para clareza na prestação de contas — é importante distinguir o que veio das inscrições e o que veio de doações.

DICA:
A página de inscrição pública do Tovia é simples de usar no celular — o que é essencial quando o público atendido tem acesso limitado a computadores. Teste o fluxo de inscrição no celular antes de divulgar para garantir uma boa experiência.`,
    banner_url: '',
    video_url: '',
    criado_em: NOW,
    atualizado_em: NOW,
  },
];
