import type { GatewayType } from './types.js';
import type { PaymentProvider } from './provider.js';
import { AsaasAdapter } from './asaas/adapter.js';
import { EfiAdapter } from './efi/adapter.js';

export function createPaymentProvider(
  type: GatewayType,
  apiKey: string,
  sandbox: boolean,
  certificate?: Buffer,
): PaymentProvider {
  switch (type) {
    case 'asaas':
      return new AsaasAdapter(apiKey, sandbox);
    case 'efi':
      return new EfiAdapter(apiKey, sandbox, certificate);
    default:
      throw new Error(`Gateway "${type}" não suportado.`);
  }
}
