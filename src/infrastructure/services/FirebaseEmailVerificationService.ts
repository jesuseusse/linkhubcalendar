import { adminAuth } from '@/lib/firebase/admin';
import { IEmailVerificationService } from '@/domain/interfaces/IEmailVerificationService';

export class FirebaseEmailVerificationService implements IEmailVerificationService {
	async generateVerificationLink(
		tenantId: string,
		email: string
	): Promise<string> {
		const tenantAuth = adminAuth.tenantManager().authForTenant(tenantId);
		return tenantAuth.generateEmailVerificationLink(email);
	}
}
