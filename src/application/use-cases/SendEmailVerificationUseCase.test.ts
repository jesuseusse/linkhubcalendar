import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SendEmailVerificationUseCase } from './SendEmailVerificationUseCase';
import type { IUserRepository } from '@/domain/interfaces/IUserRepository';
import type { IEmailVerificationService } from '@/domain/interfaces/IEmailVerificationService';
import type { IEmailSenderService } from '@/domain/interfaces/IEmailSenderService';
import type { User } from '@/domain/entities/User';

function makeUser(overrides: Partial<User> = {}): User {
	return {
		id: 'user-1',
		email: 'test@example.com',
		name: 'Test User',
		username: 'testuser',
		contactFormEnabled: false,
		calendarEnabled: false,
		galleryEnabled: false,
		galleryPhotos: [],
		links: [],
		plan: 'free',
		createdAt: Date.now(),
		updatedAt: Date.now(),
		...overrides
	};
}

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-1';
const EMAIL_CONFIG = {
	tenantId: TENANT_ID,
	apiKey: 'test-api-key',
	fromEmail: 'noreply@test.com'
};
const FAKE_LINK = 'https://example.com/verify?token=abc123';

describe('SendEmailVerificationUseCase', () => {
	let userRepo: IUserRepository;
	let emailVerificationService: IEmailVerificationService;
	let emailSenderService: IEmailSenderService;
	let useCase: SendEmailVerificationUseCase;

	beforeEach(() => {
		userRepo = {
			findById: vi.fn().mockResolvedValue(makeUser()),
			updateLastVerificationEmailSentAt: vi.fn().mockResolvedValue(makeUser()),
			create: vi.fn(),
			createWithId: vi.fn(),
			findByEmail: vi.fn(),
			findByUsername: vi.fn(),
			updateProfile: vi.fn(),
			updateContactFormEnabled: vi.fn(),
			updateCalendarEnabled: vi.fn(),
			updateUsername: vi.fn(),
			addLink: vi.fn(),
			updateLink: vi.fn(),
			deleteLink: vi.fn(),
			updateTheme: vi.fn(),
			updatePlan: vi.fn(),
			updateSubscriptionFlags: vi.fn(),
			updatePromoRateLimit: vi.fn(),
			updateGalleryEnabled: vi.fn(),
			updateGalleryPhotos: vi.fn(),
			updateWeeklySchedule: vi.fn(),
			updateScheduleExceptions: vi.fn(),
			findAll: vi.fn(),
			findAllPaginated: vi.fn(),
		};

		emailVerificationService = {
			generateVerificationLink: vi.fn().mockResolvedValue(FAKE_LINK)
		};

		emailSenderService = {
			sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
			sendAppointmentNotification: vi.fn().mockResolvedValue(undefined),
			sendUpcomingRenewalEmail: vi.fn().mockResolvedValue(undefined),
			sendContactNotification: vi.fn(),
			sendSupportTicketNotification: vi.fn(),
			sendCampaignEmail: vi.fn(),
			sendPasswordResetEmail: vi.fn(),
		};

		useCase = new SendEmailVerificationUseCase(
			userRepo,
			emailVerificationService,
			emailSenderService
		);
	});

	it('sends verification email successfully', async () => {
		const result = await useCase.execute({
			tenantId: TENANT_ID,
			userId: USER_ID,
			emailConfig: EMAIL_CONFIG,
			companyName: 'TestCo'
		});

		expect(result).toHaveProperty('sentAt');
		expect(emailVerificationService.generateVerificationLink).toHaveBeenCalledWith(
			TENANT_ID,
			'test@example.com'
		);
		expect(emailSenderService.sendVerificationEmail).toHaveBeenCalledWith(
			EMAIL_CONFIG,
			'test@example.com',
			FAKE_LINK,
			'TestCo'
		);
		expect(userRepo.updateLastVerificationEmailSentAt).toHaveBeenCalledWith(
			TENANT_ID,
			USER_ID
		);
	});

	it('throws when user not found', async () => {
		vi.mocked(userRepo.findById).mockResolvedValue(null);

		await expect(
			useCase.execute({
				tenantId: TENANT_ID,
				userId: USER_ID,
				emailConfig: EMAIL_CONFIG
			})
		).rejects.toThrow('User not found');

		expect(emailVerificationService.generateVerificationLink).not.toHaveBeenCalled();
		expect(emailSenderService.sendVerificationEmail).not.toHaveBeenCalled();
	});

	it('enforces 120s cooldown', async () => {
		const thirtySecondsAgo = Date.now() - 30_000;
		vi.mocked(userRepo.findById).mockResolvedValue(
			makeUser({ lastVerificationEmailSentAt: thirtySecondsAgo })
		);

		await expect(
			useCase.execute({
				tenantId: TENANT_ID,
				userId: USER_ID,
				emailConfig: EMAIL_CONFIG
			})
		).rejects.toThrow(/Debes esperar \d+ segundos antes de reenviar/);

		expect(emailSenderService.sendVerificationEmail).not.toHaveBeenCalled();
	});

	it('allows resend after cooldown expires', async () => {
		const twoMinutesAgo = Date.now() - 130_000;
		vi.mocked(userRepo.findById).mockResolvedValue(
			makeUser({ lastVerificationEmailSentAt: twoMinutesAgo })
		);

		const result = await useCase.execute({
			tenantId: TENANT_ID,
			userId: USER_ID,
			emailConfig: EMAIL_CONFIG
		});

		expect(result).toHaveProperty('sentAt');
		expect(emailSenderService.sendVerificationEmail).toHaveBeenCalled();
	});

	it('does not depend on user.emailVerified from the repository', async () => {
		vi.mocked(userRepo.findById).mockResolvedValue(
			makeUser({ emailVerified: false })
		);

		const result = await useCase.execute({
			tenantId: TENANT_ID,
			userId: USER_ID,
			emailConfig: EMAIL_CONFIG
		});

		expect(result).toHaveProperty('sentAt');
		expect(emailSenderService.sendVerificationEmail).toHaveBeenCalled();
	});
});
