import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { UserResponseDto } from '../../domain/dtos/AuthDtos';
import { toUserResponse } from './mappers';
import { RESERVED_USERNAMES } from '../../lib/constants';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
// Allows lowercase letters, numbers, hyphen, underscore, and dot.
// Must start and end with alphanumeric; no consecutive dots; length 3–30.
const USERNAME_REGEX = /^(?!.*\.\.)[a-z0-9][a-z0-9._-]{1,28}[a-z0-9]$/;

export class UpdateUsernameUseCase {
	constructor(private userRepository: IUserRepository) {}

	async execute(
		tenantId: string,
		userId: string,
		username: string
	): Promise<UserResponseDto> {
		if (!USERNAME_REGEX.test(username)) {
			throw new Error(
				'El usuario debe tener 3-30 caracteres, solo letras minúsculas, números, punto, guión y guión bajo, e iniciar y terminar con letra o número'
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
