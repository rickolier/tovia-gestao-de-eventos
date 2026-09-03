export type PlanLevel = 'chinam' | 'petach' | 'koach' | 'chalem';

export interface GatewayConfig {
  type: 'asaas' | 'stripe' | 'mercadopago' | 'pagarme';
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
  codigo?: string;
  plano: PlanLevel | null;
  planoPendente?: string | null;
  asaasCustomerId?: string | null;
  asaasSubscriptionId?: string | null;
  subscriptionPeriod?: 'monthly' | 'annual' | null;
  subscriptionExpiresAt?: string | null;
  isDemo?: boolean;
  pagina_publica?: boolean;
  onboardingComplete?: boolean;
  desativado?: boolean;
  gateway_connected?: boolean;
  gateway?: GatewayConfig;
}

export interface AppNotification {
  id: string;
  tipo: 'doacao_direcionada' | 'doacao_livre' | 'resumo_diario' | 'tarefa' | 'alerta' | 'doacao_pendente' | 'primeira_inscricao' | 'meta_inscricoes' | 'equipe_novo_membro' | 'perfil_incompleto' | 'plano_atualizado' | 'ticket_criado' | 'ticket_respondido' | 'ticket_finalizado';
  titulo: string;
  mensagem: string;
  data: string;
  lida: boolean;
  acao_requirida?: boolean;
  dados_acao?: any;
  eventoId?: string;
  userId: string;
}
