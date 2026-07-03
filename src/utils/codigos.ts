import { nanoid } from 'nanoid';

/** Código curto do produtor — 6 chars URL-safe (ex: V4UM9x) */
export function gerarCodigoProdutor(): string {
  return nanoid(6);
}

/** Código do evento — 10 chars URL-safe (ex: IRpjDZNTb3) */
export function gerarCodigoEvento(): string {
  return nanoid(10);
}

/** Código da página de venda — 8 chars URL-safe (ex: aB3xZ9kR) */
export function gerarCodigoPagina(): string {
  return nanoid(8);
}
