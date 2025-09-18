export interface EmailOptions {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export interface MailProvider {
  sendEmail(options: EmailOptions): Promise<EmailResult>;
  isConfigured(): boolean;
  getName(): string;
}