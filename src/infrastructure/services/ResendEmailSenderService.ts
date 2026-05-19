import { Resend } from 'resend';
import {
	IEmailSenderService,
	EmailSenderConfig,
	AppointmentNotificationData,
	ContactNotificationData,
	SupportTicketNotificationData,
	UpcomingRenewalData
} from '@/domain/interfaces/IEmailSenderService';
import { getVerificationEmailTemplate, getAppointmentNotificationTemplate, getContactNotificationTemplate, getUpcomingRenewalTemplate, getSupportTicketNotificationTemplate } from './emailTemplates';

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

	async sendAppointmentNotification(
		config: EmailSenderConfig,
		ownerEmail: string,
		appointment: AppointmentNotificationData,
		dashboardUrl: string,
		companyName?: string
	): Promise<void> {
		const resend = new Resend(config.apiKey);
		const name = companyName || 'LinkHub';
		const template = getAppointmentNotificationTemplate(config.tenantId);

		const { error } = await resend.emails.send({
			from: config.fromEmail,
			to: ownerEmail,
			subject: template.subject(appointment),
			html: template.html(appointment, dashboardUrl, name)
		});

		if (error) {
			throw new Error(`Error al enviar correo: ${error.message}`);
		}
	}

	async sendContactNotification(
		config: EmailSenderConfig,
		ownerEmail: string,
		data: ContactNotificationData,
		dashboardUrl: string,
		companyName?: string
	): Promise<void> {
		const resend = new Resend(config.apiKey);
		const name = companyName || 'LinkHub';
		const template = getContactNotificationTemplate(config.tenantId);

		const { error } = await resend.emails.send({
			from: config.fromEmail,
			to: ownerEmail,
			subject: template.subject(data),
			html: template.html(data, dashboardUrl, name)
		});

		if (error) {
			throw new Error(`Error al enviar correo: ${error.message}`);
		}
	}

	async sendUpcomingRenewalEmail(
		config: EmailSenderConfig,
		data: UpcomingRenewalData,
		companyName?: string
	): Promise<void> {
		const resend = new Resend(config.apiKey);
		const name = companyName || 'LinkHub';
		const template = getUpcomingRenewalTemplate(config.tenantId);

		const { error } = await resend.emails.send({
			from: config.fromEmail,
			to: data.email,
			subject: template.subject(name),
			html: template.html(data, name)
		});

		if (error) {
			throw new Error(`Error al enviar correo: ${error.message}`);
		}
	}

	async sendSupportTicketNotification(
		config: EmailSenderConfig,
		adminEmails: string[],
		data: SupportTicketNotificationData,
		companyName?: string
	): Promise<void> {
		if (adminEmails.length === 0) return;
		const resend = new Resend(config.apiKey);
		const name = companyName || 'LinkHub';
		const template = getSupportTicketNotificationTemplate(config.tenantId);

		const { error } = await resend.emails.send({
			from: config.fromEmail,
			to: adminEmails,
			subject: template.subject(data),
			html: template.html(data, name)
		});

		if (error) {
			throw new Error(`Error al enviar correo: ${error.message}`);
		}
	}
}
