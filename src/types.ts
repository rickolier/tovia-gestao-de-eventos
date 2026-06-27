export type PlanLevel = 'start' | 'essencial' | 'pro' | 'personalizado';

export interface ArtigoBC {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  banner_url?: string;
  video_url?: string;
  tags: string[];
  ordem: number;
  slug: string;
  autor: string;
  criado_em: string;
  atualizado_em: string;
}

export interface GatewayConfig {
  type: 'asaas';
  encrypted_api_key: string;
  sandbox: boolean;
  connected_at: string;
  encrypted_webhook_token?: string;
}

export interface UserProfile {
  uid: string;
  nome: string;
  email: string;
  whatsapp?: string;
  instituicao?: string;
  cnpj?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  cargo?: string;
  bio?: string;
  descricao?: string;
  redes_social?: {
    instagram?: string;
  };
  link_importante_1?: string;
  link_importante_2?: string;
  contato_email?: string;
  site?: string;
  telefone?: string;
  imagem_url?: string;
  plano: PlanLevel | null;
  planoPendente?: string | null;
  asaasCustomerId?: string | null;
  asaasSubscriptionId?: string | null;
  isDemo?: boolean;
  pagina_publica?: boolean;
  desativado?: boolean;
  gateway_connected?: boolean;
  gateway?: GatewayConfig;
}

export interface FormField {
  id: string;
  label: string;
  tipo: 'text' | 'number' | 'email' | 'select' | 'checkbox';
  obrigatorio: boolean;
  opcoes?: string[]; // For select type
}

interface PaymentMethodConfig {
  ativo: boolean;
  taxa: number;
  tipo_taxa: 'fixo' | 'porcentagem';
}

export type EquipePermissao = 'registrations' | 'management' | 'rooms' | 'tasks' | 'checkin';

export interface ConvitePendente {
  id: string;
  email: string;
  eventoId: string;
  eventoNome: string;
  donoNome: string;
  permissoes: EquipePermissao[];
  criadoEm: string;
}

export interface EquipeMembro {
  userId: string;
  email: string;
  nome: string;
  permissoes: EquipePermissao[];
  adicionadoEm: string;
}

export interface Evento {
  id: string;
  nome: string;
  data_inicio: string;
  data_fim: string;
  local: string;
  instituicao: string;
  vagas_totais: number;
  descricao?: string;
  imagem_url?: string;
  criado_por: string;
  equipe?: EquipeMembro[];
  equipeIds?: string[];
  habilita_doacoes: boolean;
  ativo: boolean;
  cor_tema?: string;
  
  // New Settings
  config_pagamento: {
    pix: PaymentMethodConfig;
    cartao_credito: PaymentMethodConfig & { parcelas_max: number };
    boleto: PaymentMethodConfig;
    parcelamento_limite_data: boolean; // Must be paid before event
    installmentLogic: 'free' | 'limited';
  };
  
  config_comunicacao: {
    email_confirmacao: {
      assunto: string;
      corpo: string;
      ativo: boolean;
    };
    lembrete_evento: {
      dias_antes: number;
      assunto: string;
      corpo: string;
      ativo: boolean;
    };
  };
  
  campos_customizados: FormField[];
  margem_por_inscricao?: number;
}

export interface Ticket {
  id: string;
  eventoId: string;
  nome: string;
  tipo: 'pago' | 'gratuito' | 'doacao';
  valor: number;
  limite_vagas?: number;
  data_limite: string;
  permite_parcelamento: boolean;
  metodos_pagamento: string[];
  max_parcelas_credito?: number;      // 1–12; 1 = somente à vista
  max_parcelas_recorrente?: number;   // 2–12; 0/undefined = desabilitado
  installment_logic?: 'free' | 'limited'; // free = sem restrição de data; limited = limitado pela data do evento
  exibir_preco?: boolean;
  // opções exclusivas de doação
  valor_livre?: boolean;        // participante digita o valor
  permite_patrocinio?: boolean; // participante escolhe quantas inscrições patrocinar
  valor_patrocinio?: number;    // valor por inscrição patrocinada
}

export interface Pessoa {
  id: string;
  nome: string;
  idade: number;
  genero?: 'masculino' | 'feminino';
  cpf: string;
  email: string;
  telefone: string;
  celula?: string;
  nome_responsavel?: string;
  telefone_responsavel?: string;
}

export interface Inscricao {
  id: string;
  pessoaId?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  data_nascimento?: string;
  nome_responsavel?: string;
  telefone_responsavel?: string;
  eventoId: string;
  ticketId: string;
  ticket_nome?: string;
  status: 'pendente' | 'pagamento_iniciado' | 'pago' | 'ajuda_solicitada' | 'analise' | 'cancelada';
  valor_total: number;
  valor_pago: number;
  forma_pagamento?: string;
  precisa_ajuda: boolean;
  validada_manual: boolean;
  data_inscricao: string;
  paginaVendaId?: string;
  pagina_venda_id?: string;
  respostas_formulario?: Record<string, string | boolean>;
  presenca?: boolean;
  checkin_at?: string;
}

export interface Pagamento {
  id: string;
  inscricaoId: string;
  eventoId: string;
  valor: number;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  metodo: 'pix' | 'cartao' | 'credito_recorrencia' | 'boleto' | 'dinheiro' | 'transferencia';
  data_vencimento: string;
  data_pagamento?: string;
  comprovante_url?: string;
  isSignal?: boolean;
  isDonation?: boolean;
  doadorNome?: string;
  destino?: string;
  origem: 'manual' | 'automatico';
}

export interface FinancialTransaction {
  id: string;
  eventoId: string;
  tipo: 'entrada' | 'saida';
  categoria: string;
  valor: number;
  descricao: string;
  data: string;
}

export interface Donation {
  id: string;
  eventoId: string;
  valor: number;
  valorLiquido: number;
  taxaAdm: number;
  formaPagamento: string;
  dataPagamento: string;
  inscritoId?: string;
  doadorNome?: string;
  destino: 'inscrito' | 'livre';
  finalidade?: string;
  data: string;
  status: 'pendente' | 'aprovada' | 'cancelada';
  valorRestante: number;
}

export interface Quarto {
  id: string;
  eventoId: string;
  nome: string;
  numero: string;
  vagas: number;
  genero?: 'masculino' | 'feminino' | 'misto';
  hospedes: string[]; // IDs of Inscricao or Pessoa
  responsaveis: string[]; // IDs of Inscricao or Pessoa
}

export interface AppNotification {
  id: string;
  tipo: 'doacao_direcionada' | 'doacao_livre' | 'resumo_diario' | 'tarefa' | 'alerta' | 'doacao_pendente' | 'primeira_inscricao' | 'meta_inscricoes' | 'equipe_novo_membro' | 'perfil_incompleto' | 'plano_atualizado';
  titulo: string;
  mensagem: string;
  data: string;
  lida: boolean;
  acao_requirida?: boolean;
  dados_acao?: any;
  eventoId?: string;
  userId: string;
}

export interface CampoFormulario {
  id: string;
  tipo: 'texto' | 'email' | 'telefone' | 'numero' | 'select' | 'data' | 'checkbox' | 'textarea';
  label: string;
  obrigatorio: boolean;
  placeholder?: string;
  opcoes?: string[]; // for select type
}

export interface PaginaVenda {
  id: string;
  eventoId: string;
  nome: string;
  slug: string;
  ativa: boolean;
  descricao?: string;
  ticketIds: string[];
  campos_formulario: CampoFormulario[];
  criado_em: string;
}

export interface Cupom {
  id: string;
  eventoId: string;
  codigo: string;
  tipo: 'porcentagem' | 'fixo';
  valor: number;
  limite_usos?: number;
  usos: number;
  data_validade?: string;
  ativo: boolean;
  criado_em: string;
}

export interface Task {
  id: string;
  eventoId: string;
  titulo: string;
  descricao: string;
  categoria: string;
  responsavel: string;
  dataLimite: string;
  status: 'pendente' | 'em_progresso' | 'concluida' | 'atrasada';
  prioridade: 'baixa' | 'media' | 'alta';
  dataCriacao: string;
}
