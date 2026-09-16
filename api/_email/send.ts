import type { EmailMessage, EmailResult, EmailProvider } from './types.js';
import { ResendProvider } from './resend.js';

let providers: EmailProvider[] | null = null;

function getProviders(): EmailProvider[] {
  if (providers) return providers;
  providers = [];
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) providers.push(new ResendProvider(resendKey));
  return providers;
}

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const list = getProviders();
  if (list.length === 0) {
    console.warn('[email] Nenhum provider configurado — e-mail ignorado.');
    return { provider: 'none' };
  }

  let lastError: Error | null = null;
  for (const provider of list) {
    try {
      return await provider.send(msg);
    } catch (err) {
      lastError = err as Error;
      console.error(`[email] ${provider.name} falhou: ${lastError.message}`);
    }
  }

  throw lastError ?? new Error('Todos os providers de e-mail falharam.');
}
