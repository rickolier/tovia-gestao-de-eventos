export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export interface EmailResult {
  id?: string;
  provider: string;
}

export interface EmailProvider {
  name: string;
  send(msg: EmailMessage): Promise<EmailResult>;
}
