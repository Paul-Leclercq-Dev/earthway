import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { ImpactService } from '../impact/impact.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private mailerService: MailerService,
    private readonly prisma: PrismaService,
    private readonly impactService: ImpactService,
    @InjectQueue('mail') private readonly mailQueue: Queue,
  ) {}

  async addEmailQueue() {
    await this.mailQueue.add('sendConfirmation', {});
    this.logger.log('Tâche ajoutée à la queue');
  }

  async sendVerificationEmail(email: string, firstName: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Bienvenue sur Earthway - Confirmez votre email',
      template: 'welcome',
      context: {
        firstName,
        verificationUrl,
        year: new Date().getFullYear(),
      },
    });
  }

  async sendPasswordResetEmail(email: string, firstName: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Earthway - Réinitialisation de votre mot de passe',
      template: 'reset-password',
      context: {
        firstName,
        resetUrl,
        year: new Date().getFullYear(),
      },
    });
  }

  async sendSubscriptionConfirmationEmail(
    email: string,
    firstName: string,
    tierName: string,
    price: number,
    activationDate: Date,
    nextBillingDate: Date,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    await this.mailerService.sendMail({
      to: email,
      subject: `Earthway - Votre abonnement ${tierName} est actif`,
      template: 'subscription-confirmation',
      context: {
        firstName,
        tierName,
        price,
        activationDate: activationDate.toLocaleDateString('fr-FR'),
        nextBillingDate: nextBillingDate.toLocaleDateString('fr-FR'),
        profileUrl: `${frontendUrl}/profile`,
        year: new Date().getFullYear(),
      },
    });
  }

  async sendSubscriptionCancellationEmail(
    email: string,
    firstName: string,
    endDate: Date | null,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const endDateStr = endDate
      ? endDate.toLocaleDateString('fr-FR')
      : 'la fin de votre période en cours';

    await this.mailerService.sendMail({
      to: email,
      subject: 'Earthway - Confirmation d\'annulation de votre abonnement',
      template: 'subscription-cancellation',
      context: {
        firstName,
        endDate: endDateStr,
        subscriptionsUrl: `${frontendUrl}/subscriptions`,
        year: new Date().getFullYear(),
      },
    });
  }

  async sendDonationConfirmationEmail(
    email: string,
    firstName: string,
    amount: number,
    cause: string,
    reference: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const causeNames: Record<string, string> = {
      trees: 'Reforestation',
      corals: 'Océans & Coraux',
      pollinators: 'Pollinisateurs',
      general: 'Cause générale',
    };

    await this.mailerService.sendMail({
      to: email,
      subject: `Earthway - Confirmation de votre don de ${amount} €`,
      template: 'donation-confirmation',
      context: {
        firstName,
        amount,
        causeName: causeNames[cause] ?? cause,
        date: new Date().toLocaleDateString('fr-FR'),
        reference: reference.slice(0, 20) + '...',
        profileUrl: `${frontendUrl}/profile`,
        year: new Date().getFullYear(),
      },
    });
  }

  async sendUserConfirmation() {
    try {
      await this.mailerService.sendMail({});
    } catch (error) {
      this.logger.error("Erreur lors de l'envoi du mail", error);
    }
  }

  /**
   * T135: Check if email type is enabled for a specific user
   * Defaults to true if no preferences are saved
   */
  async canSendEmail(
    userId: number,
    type: 'newsletter' | 'impact' | 'confirmations' | 'marketing',
  ): Promise<boolean> {
    const prefs = await this.prisma.emailPreference.findUnique({
      where: { userId },
    });
    if (!prefs) return true;
    return prefs[type] === true;
  }

  /**
   * Send monthly impact recap to all active subscribers
   * Runs on the 1st of every month at 8:00 AM
   * Respects user email preferences (impact opt-in)
   */
  @Cron('0 8 1 * *', { name: 'monthly-impact-emails' })
  async sendMonthlyImpactEmails(): Promise<void> {
    this.logger.log('🌿 Starting monthly impact email job...');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const now = new Date();
    const monthNames = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
    ];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();

    // Get all active subscribers who have opted in to impact emails
    const activeSubscribers = await this.prisma.user.findMany({
      where: {
        subscription: { status: 'active' },
        OR: [
          { emailPreferences: { impact: true } },
          { emailPreferences: null }, // default: opted in if no preference set
        ],
      },
      include: {
        impact: true,
        subscription: true,
      },
    });

    this.logger.log(`Found ${activeSubscribers.length} active subscribers to email`);

    let sent = 0;
    let failed = 0;

    for (const user of activeSubscribers) {
      try {
        // Calculate fresh impact data
        const impactData = await this.impactService.getMyImpact(user.id);

        await this.mailerService.sendMail({
          to: user.email,
          subject: `Earthway - Votre impact environnemental de ${month} ${year}`,
          template: 'monthly-impact',
          context: {
            firstName: user.firstName,
            month,
            year,
            treesPlanted: impactData.treesPlanted,
            coralsRestored: impactData.coralRestored,
            pollinatorsHelped: impactData.pollinatorsHelped,
            co2Offset: impactData.co2Offset,
            totalDonated: impactData.totalDonated.toFixed(2),
            subscriptionTier: impactData.subscriptionTier,
            level: user.level,
            levelTitle: 'Voir profil',
            profileUrl: `${frontendUrl}/profile`,
            preferencesUrl: `${frontendUrl}/profile#email-preferences`,
            unsubscribeUrl: `${frontendUrl}/profile#email-preferences`,
          },
        });

        sent++;
      } catch (error) {
        this.logger.error(`Failed to send monthly impact email to user ${user.id}: ${error.message}`);
        failed++;
      }
    }

    this.logger.log(`✅ Monthly impact emails: ${sent} sent, ${failed} failed`);
  }

  /**
   * Send monthly impact email to a specific user (for testing/manual trigger)
   */
  async sendMonthlyImpactEmailToUser(userId: number): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const now = new Date();
    const monthNames = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
    ];

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const impactData = await this.impactService.getMyImpact(userId);

    await this.mailerService.sendMail({
      to: user.email,
      subject: `Earthway - Votre impact de ${monthNames[now.getMonth()]} ${now.getFullYear()}`,
      template: 'monthly-impact',
      context: {
        firstName: user.firstName,
        month: monthNames[now.getMonth()],
        year: now.getFullYear(),
        treesPlanted: impactData.treesPlanted,
        coralsRestored: impactData.coralRestored,
        pollinatorsHelped: impactData.pollinatorsHelped,
        co2Offset: impactData.co2Offset,
        totalDonated: impactData.totalDonated.toFixed(2),
        subscriptionTier: impactData.subscriptionTier,
        level: user.level,
        profileUrl: `${frontendUrl}/profile`,
        preferencesUrl: `${frontendUrl}/profile#email-preferences`,
        unsubscribeUrl: `${frontendUrl}/profile#email-preferences`,
      },
    });
  }
}
