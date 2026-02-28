import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import {
	IEmailSenderService,
	EmailSenderConfig
} from '@/domain/interfaces/IEmailSenderService';
import { getVerificationEmailTemplate } from './emailTemplates';

export class AwsSesEmailSenderService implements IEmailSenderService {
	private client: SESClient;

	constructor(accessKeyId: string, secretAccessKey: string, region: string) {
		this.client = new SESClient({
			region,
			credentials: { accessKeyId, secretAccessKey }
		});
	}

	async sendVerificationEmail(
		config: EmailSenderConfig,
		to: string,
		verificationLink: string,
		companyName?: string
	): Promise<void> {
		const name = companyName || 'LinkHub';
		const template = getVerificationEmailTemplate(config.tenantId);

		const command = new SendEmailCommand({
			Source: config.fromEmail,
			Destination: { ToAddresses: [to] },
			Message: {
				Subject: {
					Data: template.subject(name),
					Charset: 'UTF-8'
				},
				Body: {
					Html: {
						Data: template.html(verificationLink, name),
						Charset: 'UTF-8'
					}
				}
			}
		});

		try {
			await this.client.send(command);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'SES send error';
			throw new Error(`Error al enviar correo via SES: ${message}`);
		}
	}
}
