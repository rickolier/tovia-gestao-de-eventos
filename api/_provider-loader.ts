import { decrypt } from './_gateway-utils.js';
import { createPaymentProvider } from './_payments/factory.js';
import type { PaymentProvider } from './_payments/provider.js';
import type { GatewayType } from './_payments/types.js';

export interface OrganizerSecrets {
  type?: string;
  encrypted_api_key?: string;
  encrypted_certificate_p12?: string;
  sandbox?: boolean;
  webhook_token_hash?: string;
  [key: string]: unknown;
}

export function loadProvider(secrets: OrganizerSecrets, encKey: string): {
  provider: PaymentProvider;
  gatewayType: GatewayType;
  sandbox: boolean;
} {
  const apiKey = decrypt(secrets.encrypted_api_key!, encKey);
  const sandbox = secrets.sandbox ?? false;
  const gatewayType: GatewayType = (secrets.type as GatewayType) ?? 'asaas';

  let certificate: Buffer | undefined;
  if (gatewayType === 'efi' && secrets.encrypted_certificate_p12) {
    certificate = Buffer.from(decrypt(secrets.encrypted_certificate_p12, encKey), 'base64');
  }

  return {
    provider: createPaymentProvider(gatewayType, apiKey, sandbox, certificate),
    gatewayType,
    sandbox,
  };
}
