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
  categoria: string;
  autor: string;
  criado_em: string;
  atualizado_em: string;
  visivel?: boolean;
}

export interface Quarto {
  id: string;
  eventoId: string;
  nome: string;
  numero: string;
  vagas: number;
  genero?: 'masculino' | 'feminino' | 'misto';
  hospedes: string[];
  responsaveis: string[];
  divisaoId?: string;
  criterio?: string;
}
