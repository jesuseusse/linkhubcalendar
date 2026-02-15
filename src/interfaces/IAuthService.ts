import { LoginDto, SignUpDto, AuthResponseDto } from '../dtos/auth.dto';

export interface IAuthService {
  login(dto: LoginDto): Promise<AuthResponseDto>;
  signUp(dto: SignUpDto): Promise<AuthResponseDto>;
}
