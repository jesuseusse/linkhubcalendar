import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetPublicProfileUseCase } from '@/application/use-cases/GetPublicProfileUseCase';
import { IUserRepository } from '@/domain/interfaces/IUserRepository';
import { User } from '@/domain/entities/User';

function createMockUser(overrides: Partial<User> = {}): User {
	return {
		id: 'user-1',
		email: 'test@example.com',
		name: 'Juan Pérez',
		username: 'juanperez',
		contactFormEnabled: true,
		calendarEnabled: false,
		links: [
			{ id: 'link-1', title: 'Mi sitio', url: 'https://example.com' },
			{ id: 'link-2', title: 'GitHub', url: 'https://github.com/juanperez' }
		],
		calendarSlots: [],
		plan: 'pro',
		planExpiredAt: null,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		...overrides
	};
}

function createMockUserRepository(
	findByUsernameResult: User | null = null
): IUserRepository {
	return {
		findByUsername: vi.fn().mockResolvedValue(findByUsernameResult),
		create: vi.fn(),
		createWithId: vi.fn(),
		findByEmail: vi.fn(),
		findById: vi.fn(),
		updateProfile: vi.fn(),
		updateContactFormEnabled: vi.fn(),
		updateCalendarEnabled: vi.fn(),
		updateUsername: vi.fn(),
		addLink: vi.fn(),
		updateLink: vi.fn(),
		deleteLink: vi.fn(),
		addCalendarSlot: vi.fn(),
		updateCalendarSlotBooked: vi.fn(),
		deleteCalendarSlot: vi.fn(),
		updateTheme: vi.fn(),
		updatePlan: vi.fn(),
		updateLastVerificationEmailSentAt: vi.fn()
	};
}

describe('GetPublicProfileUseCase', () => {
	const tenantId = 'tenant-123';

	it('devuelve el perfil público cuando el usuario existe', async () => {
		const user = createMockUser();
		const repo = createMockUserRepository(user);
		const useCase = new GetPublicProfileUseCase(repo);

		const profile = await useCase.execute(tenantId, 'juanperez');

		expect(repo.findByUsername).toHaveBeenCalledWith(tenantId, 'juanperez');
		expect(profile).toEqual({
			name: 'Juan Pérez',
			username: 'juanperez',
			profilePhoto: undefined,
			plan: 'pro',
			planExpiredAt: null,
			contactFormEnabled: true,
			calendarEnabled: false,
			theme: undefined,
			links: [
				{ id: 'link-1', title: 'Mi sitio', url: 'https://example.com' },
				{ id: 'link-2', title: 'GitHub', url: 'https://github.com/juanperez' }
			],
			calendarSlots: []
		});
	});

	it('lanza error cuando el usuario no existe', async () => {
		const repo = createMockUserRepository(null);
		const useCase = new GetPublicProfileUseCase(repo);

		await expect(useCase.execute(tenantId, 'noexiste')).rejects.toThrow(
			'Profile not found'
		);
	});

	it('lanza error cuando el usuario no tiene username', async () => {
		const user = createMockUser({ username: undefined });
		const repo = createMockUserRepository(user);
		const useCase = new GetPublicProfileUseCase(repo);

		await expect(useCase.execute(tenantId, 'test')).rejects.toThrow(
			'Profile not found'
		);
	});

	it('incluye theme cuando el usuario tiene tema configurado', async () => {
		const theme = {
			backgroundColor: '#ffffff',
			textColor: '#000000',
			buttonColor: '#4f46e5',
			buttonTextColor: '#ffffff',
			accentColor: '#4f46e5'
		};
		const user = createMockUser({ theme });
		const repo = createMockUserRepository(user);
		const useCase = new GetPublicProfileUseCase(repo);

		const profile = await useCase.execute(tenantId, 'juanperez');

		expect(profile.theme).toEqual(theme);
	});

	it('pasa planExpiredAt como unix timestamp', async () => {
		const expTimestamp = new Date('2026-12-31T00:00:00.000Z').getTime();
		const user = createMockUser({ planExpiredAt: expTimestamp });
		const repo = createMockUserRepository(user);
		const useCase = new GetPublicProfileUseCase(repo);

		const profile = await useCase.execute(tenantId, 'juanperez');

		expect(profile.planExpiredAt).toBe(expTimestamp);
	});

	it('usa plan "free" por defecto cuando no tiene plan', async () => {
		const user = createMockUser({ plan: undefined });
		const repo = createMockUserRepository(user);
		const useCase = new GetPublicProfileUseCase(repo);

		const profile = await useCase.execute(tenantId, 'juanperez');

		expect(profile.plan).toBe('free');
	});

	it('incluye calendarSlots cuando calendarEnabled es true', async () => {
		const slots = [
			{
				id: 'slot-1',
				date: '2026-03-01',
				startTime: '10:00',
				endTime: '11:00',
				booked: false
			}
		];
		const user = createMockUser({
			calendarEnabled: true,
			calendarSlots: slots
		});
		const repo = createMockUserRepository(user);
		const useCase = new GetPublicProfileUseCase(repo);

		const profile = await useCase.execute(tenantId, 'juanperez');

		expect(profile.calendarSlots).toEqual(slots);
	});

	it('devuelve calendarSlots vacío cuando calendarEnabled es false', async () => {
		const slots = [
			{
				id: 'slot-1',
				date: '2026-03-01',
				startTime: '10:00',
				endTime: '11:00',
				booked: false
			}
		];
		const user = createMockUser({
			calendarEnabled: false,
			calendarSlots: slots
		});
		const repo = createMockUserRepository(user);
		const useCase = new GetPublicProfileUseCase(repo);

		const profile = await useCase.execute(tenantId, 'juanperez');

		expect(profile.calendarSlots).toEqual([]);
	});

	it('incluye profilePhoto cuando existe', async () => {
		const user = createMockUser({
			profilePhoto: 'https://storage.example.com/photo.jpg'
		});
		const repo = createMockUserRepository(user);
		const useCase = new GetPublicProfileUseCase(repo);

		const profile = await useCase.execute(tenantId, 'juanperez');

		expect(profile.profilePhoto).toBe(
			'https://storage.example.com/photo.jpg'
		);
	});
});

describe('PublicProfilePage integration', () => {
	let mockExecute: ReturnType<typeof vi.fn>;
	let mockGetByHostname: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.resetModules();
		mockExecute = vi.fn();
		mockGetByHostname = vi.fn();
	});

	async function loadPage() {
		vi.doMock('@/infrastructure/container', () => ({
			container: {
				getPublicProfileUseCase: { execute: mockExecute },
				tenantRegistryRepo: { getByHostname: mockGetByHostname }
			}
		}));
		vi.doMock('next/navigation', () => ({
			notFound: vi.fn(() => {
				throw new Error('NEXT_NOT_FOUND');
			})
		}));
		vi.doMock('./PublicProfileClient', () => ({
			PublicProfileClient: ({ profile }: { profile: unknown }) => profile
		}));

		const mod = await import('../page');
		return mod.default;
	}

	it('devuelve el perfil cuando el usuario existe', async () => {
		const expectedProfile = {
			name: 'Juan Pérez',
			username: 'juanperez',
			links: [],
			calendarSlots: [],
			contactFormEnabled: false,
			calendarEnabled: false
		};
		mockGetByHostname.mockResolvedValue({ tenantId: 'tenant-123' });
		mockExecute.mockResolvedValue(expectedProfile);

		const PublicProfilePage = await loadPage();
		const result = await PublicProfilePage({
			params: Promise.resolve({
				username: 'juanperez',
				tenantRegistryId: 'example.com'
			})
		});

		expect(mockGetByHostname).toHaveBeenCalledWith('example.com');
		expect(mockExecute).toHaveBeenCalledWith('tenant-123', 'juanperez');
		expect(result.props.profile).toEqual(expectedProfile);
	});

	it('muestra "Profile not found" cuando el perfil es null', async () => {
		mockGetByHostname.mockResolvedValue({ tenantId: 'tenant-123' });
		mockExecute.mockResolvedValue(null);

		const PublicProfilePage = await loadPage();
		const result = await PublicProfilePage({
			params: Promise.resolve({
				username: 'noexiste',
				tenantRegistryId: 'example.com'
			})
		});

		expect(result).toBeTruthy();
		expect(result.props.children.props.children).toBe('Profile not found');
	});

	it('llama notFound cuando el tenant registry no existe', async () => {
		mockGetByHostname.mockResolvedValue(null);

		const PublicProfilePage = await loadPage();

		await expect(
			PublicProfilePage({
				params: Promise.resolve({
					username: 'juanperez',
					tenantRegistryId: 'unknown.com'
				})
			})
		).rejects.toThrow('NEXT_NOT_FOUND');

		expect(mockExecute).not.toHaveBeenCalled();
	});
});
