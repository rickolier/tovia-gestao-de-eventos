import type { EmailProvider, EmailMessage, EmailResult } from './types.js';

export class ResendProvider implements EmailProvider {
  name = 'resend';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(msg: EmailMessage): Promise<EmailResult> {
    const from = msg.from || process.env.EMAIL_FROM || 'Tovia <noreply@toviaapp.com.br>';
    const to = Array.isArray(msg.to) ? msg.to : [msg.to];

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject: msg.subject, html: msg.html }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Resend ${response.status}: ${JSON.stringify(err)}`);
    }

    const data = await response.json() as { id?: string };
    return { id: data.id, provider: this.name };
  }
}
