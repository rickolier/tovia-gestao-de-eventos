import type { GatewayType } from './types.js';
import type { PaymentProvider } from './provider.js';
import { AsaasAdapter } from './asaas/adapter.js';

export function createPaymentProvider(
  type: GatewayType,
  apiKey: string,
  sandbox: boolean,
): PaymentProvider {
  switch (type) {
    case 'asaas':
      return new AsaasAdapter(apiKey, sandbox);
    default:
      throw new Error(`Gateway "${type}" não suportado.`);
  }
}
