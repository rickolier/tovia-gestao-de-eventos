export interface Pagamento {
  id: string;
  inscricaoId: string;
  eventoId: string;
  valor: number;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado' | 'estornado';
  gateway_payment_id?: string;
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

export interface Estorno {
  id: string;
  eventoId: string;
  inscricaoId: string;
  pagamentoId: string;
  gateway_payment_id: string;
  valor: number;
  tipo: 'total' | 'parcial';
  status: 'solicitado' | 'processando' | 'concluido' | 'negado';
  metodo_original: string;
  solicitado_em: string;
  concluido_em?: string;
  motivo?: string;
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
