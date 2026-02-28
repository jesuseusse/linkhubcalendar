import { IEmailSenderService } from '@/domain/interfaces/IEmailSenderService';
import { TenantRegistryData } from '@/interfaces/ITenantRegistryData';
import { ResendEmailSenderService } from './ResendEmailSenderService';
import { AwsSesEmailSenderService } from './AwsSesEmailSenderService';

export function createEmailSenderService(
	registry: TenantRegistryData
): IEmailSenderService {
	const ses = registry.sesConfig;
	if (ses?.accessKeyId && ses?.secretAccessKey && ses?.region && ses?.fromEmail) {
		return new AwsSesEmailSenderService(
			ses.accessKeyId,
			ses.secretAccessKey,
			ses.region
		);
	}

	if (registry.resendApiKey && registry.resendFromEmail) {
		return new ResendEmailSenderService();
	}

	throw new Error('Servicio de correo no configurado para este tenant');
}
