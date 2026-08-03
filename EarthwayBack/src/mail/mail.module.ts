import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { join } from 'path';
import { BullModule } from '@nestjs/bull';
import { MailProcessor } from './mail.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { ImpactModule } from '../impact/impact.module';

@Module({
  imports: [
    MailerModule.forRoot({
      // transport: 'smtps://user@example.com:topsecret@smtp.example.com',
      // or
      transport: {
        host: process.env.MAIL_HOST,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      },
      defaults: {
        from: `"No Reply" <${process.env.MAIL_FROM}>`,
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(), // or new PugAdapter() or new EjsAdapter()
        options: {
          strict: true,
        },
      },
    }),
    BullModule.registerQueue({
      name: 'mail',
    }),
    PrismaModule,
    ImpactModule,
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService], // 👈 export for DI
})
export class MailModule { }
