import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend | null;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async sendOrderConfirmation(to: string, orderNumber: string, total: number) {
    return this.send({
      to,
      subject: `Commande ${orderNumber} confirmée — FoodStack`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#111">Votre commande est confirmée ! 🎉</h2>
          <p>Merci pour votre commande <strong>${orderNumber}</strong>.</p>
          <p>Total : <strong>${total.toFixed(2)}€</strong></p>
          <p>Vous recevrez une notification dès qu'elle sera prête.</p>
          <hr/>
          <p style="color:#666;font-size:12px">FoodStack — Plateforme de restauration</p>
        </div>
      `,
    });
  }

  async sendPasswordReset(to: string, resetUrl: string) {
    return this.send({
      to,
      subject: 'Réinitialisation de votre mot de passe FoodStack',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#111">Réinitialisation du mot de passe</h2>
          <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#1EFF6A;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
            Réinitialiser mon mot de passe
          </a>
          <p style="color:#666;font-size:12px">Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        </div>
      `,
    });
  }

  async sendWelcome(to: string, name: string) {
    return this.send({
      to,
      subject: `Bienvenue sur FoodStack, ${name} !`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#111">Bienvenue sur FoodStack ! 👋</h2>
          <p>Bonjour <strong>${name}</strong>,</p>
          <p>Votre compte a été créé avec succès. Profitez de nos meilleurs restaurants et de la livraison rapide.</p>
          <hr/>
          <p style="color:#666;font-size:12px">FoodStack — Plateforme de restauration</p>
        </div>
      `,
    });
  }

  private async send({ to, subject, html }: { to: string; subject: string; html: string }) {
    if (!this.resend) {
      this.logger.warn(`Email not sent (no RESEND_API_KEY): ${subject} → ${to}`);
      return { id: 'dev-mock', to, subject };
    }
    try {
      const { data, error } = await this.resend.emails.send({
        from: 'FoodStack <noreply@foodstack.app>',
        to,
        subject,
        html,
      });
      if (error) throw error;
      return data;
    } catch (err) {
      this.logger.error(`Email send failed: ${subject} → ${to}`, err);
      throw err;
    }
  }
}
