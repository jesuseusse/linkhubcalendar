import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { UserResponseDto } from '../../domain/dtos/AuthDtos';
import { toUserResponse } from './mappers';
import { RESERVED_USERNAMES } from '../../lib/constants';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/;

export class UpdateUsernameUseCase {
	constructor(private userRepository: IUserRepository) {}

	async execute(
		tenantId: string,
		userId: string,
		username: string
	): Promise<UserResponseDto> {
		if (!USERNAME_REGEX.test(username)) {
			throw new Error(
				'Username must be 3-30 characters and contain only letters, numbers, hyphens, or underscores'
			);
		}

		if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
			throw new Error('Este nombre de usuario no esta disponible');
		}

		const user = await this.userRepository.findById(tenantId, userId);
		if (!user) {
			throw new Error('User not found');
		}

		if (user.usernameChangedAt) {
			const elapsed = Date.now() - user.usernameChangedAt;
			if (elapsed < THIRTY_DAYS_MS) {
				const daysLeft = Math.ceil(
					(THIRTY_DAYS_MS - elapsed) / (24 * 60 * 60 * 1000)
				);
				throw new Error(
					`Username can only be changed every 30 days. ${daysLeft} day(s) remaining`
				);
			}
		}

		const existing = await this.userRepository.findByUsername(
			tenantId,
			username
		);
		if (existing && existing.id !== userId) {
			throw new Error('Usuario no disponible');
		}

		const updated = await this.userRepository.updateUsername(
			tenantId,
			userId,
			username
		);
		if (!updated) {
			throw new Error('User not found');
		}

		return toUserResponse(updated);
	}
}
