import nodemailer, { type Transporter } from "nodemailer";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Sends email through SMTP_URL. Without it (local development) emails are printed to
 * the log instead, so links such as password resets can still be followed.
 */
export class Mailer {
  private readonly transport: Transporter | null;

  constructor(
    smtpUrl: string | undefined,
    private readonly from: string
  ) {
    this.transport = smtpUrl ? nodemailer.createTransport(smtpUrl) : null;
  }

  async send(mail: Mail): Promise<void> {
    if (!this.transport) {
      console.log(`📧 (no SMTP_URL set, not sent) To: ${mail.to}\nSubject: ${mail.subject}\n${mail.text}`);
      return;
    }
    await this.transport.sendMail({ from: this.from, ...mail });
  }
}
