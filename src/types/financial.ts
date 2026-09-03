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
