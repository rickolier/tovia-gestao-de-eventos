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
  max_parcelas_credito?: number;
  max_parcelas_recorrente?: number;
  installment_logic?: 'free' | 'limited';
  exibir_preco?: boolean;
  valor_livre?: boolean;
  permite_direcionada?: boolean;
  permite_patrocinio?: boolean;
  valor_patrocinio?: number;
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

export interface CampoFormulario {
  id: string;
  tipo: 'texto' | 'email' | 'telefone' | 'numero' | 'select' | 'data' | 'checkbox' | 'textarea';
  label: string;
  obrigatorio: boolean;
  placeholder?: string;
  opcoes?: string[];
}

export interface PaginaVenda {
  id: string;
  eventoId: string;
  nome: string;
  slug: string;
  codigo?: string;
  ativa: boolean;
  descricao?: string;
  ticketIds: string[];
  campos_formulario: CampoFormulario[];
  link_pagamento?: string;
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
