import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { MailService } from './mail.service';

@Processor('mail') // Associe ce processeur à la queue "mail"
export class MailProcessor {
    constructor(private readonly mailService: MailService) { }

    @Process('sendConfirmation') // Type spécifique de tâche
    async handleSendConfirmation(job: Job<any>) {
        const { user, data, location } = job.data;
        // Ajouter votre logique pour envoyer un email
        try {
            await this.mailService.sendUserConfirmation()
        } catch (error) {
            console.log('Email non envoyé', error)
        }
    }
}
