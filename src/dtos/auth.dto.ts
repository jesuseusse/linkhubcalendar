import { UserDto } from './user.dto';

export interface LoginDto {
  email: string;
  password: string;
}

export interface SignUpDto {
  name: string;
  email: string;
  password: string;
  referredBy?: string;
}

export interface AuthResponseDto {
  token: string;
  user: UserDto;
}
