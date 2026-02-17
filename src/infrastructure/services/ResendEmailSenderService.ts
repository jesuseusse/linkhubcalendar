import { Resend } from 'resend';
import {
	IEmailSenderService,
	EmailSenderConfig
} from '@/domain/interfaces/IEmailSenderService';
import { getVerificationEmailTemplate } from './emailTemplates';

export class ResendEmailSenderService implements IEmailSenderService {
	async sendVerificationEmail(
		config: EmailSenderConfig,
		to: string,
		verificationLink: string,
		companyName?: string
	): Promise<void> {
		const resend = new Resend(config.apiKey);
		const name = companyName || 'LinkHub';
		const template = getVerificationEmailTemplate(config.tenantId);

		const { error } = await resend.emails.send({
			from: config.fromEmail,
			to,
			subject: template.subject(name),
			html: template.html(verificationLink, name)
		});

		if (error) {
			throw new Error(`Error al enviar correo: ${error.message}`);
		}
	}
}
