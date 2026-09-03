export interface FormField {
  id: string;
  label: string;
  tipo: 'text' | 'number' | 'email' | 'select' | 'checkbox';
  obrigatorio: boolean;
  opcoes?: string[];
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

export interface MembroEquipeGlobal {
  id: string;
  donoId: string;
  userId?: string;
  email: string;
  nome: string;
  adicionadoEm: string;
  status: 'ativo' | 'pendente';
}

export interface Evento {
  id: string;
  codigo?: string;
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

  config_pagamento: {
    pix: PaymentMethodConfig;
    cartao_credito: PaymentMethodConfig & { parcelas_max: number };
    boleto: PaymentMethodConfig;
    parcelamento_limite_data: boolean;
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
