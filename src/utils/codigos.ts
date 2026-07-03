const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** Código numérico de 4 dígitos para identificar o produtor (ex: 3554) */
export function gerarCodigoProdutor(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** Código alfanumérico de 10 chars para identificar o evento (ex: 82shyt6238) */
export function gerarCodigoEvento(): string {
  return Array.from({ length: 10 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}
