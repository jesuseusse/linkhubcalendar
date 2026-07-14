import { IAuthService } from '@/interfaces/IAuthService';
import { LoginDto, SignUpDto, AuthResponseDto } from '@/dtos/auth.dto';
import { auth, tenantReady } from '@/lib/firebase/client';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  confirmPasswordReset as fbConfirmPasswordReset,
} from 'firebase/auth';
import { apiClient } from './apiClient';

export class ApiAuthService implements IAuthService {
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    await tenantReady;
    const cred = await signInWithEmailAndPassword(auth, dto.email, dto.password);
    const token = await cred.user.getIdToken();
    const user = await apiClient('/api/profile');
    return { token, user };
  }

  async confirmPasswordReset(oobCode: string, newPassword: string): Promise<void> {
    await tenantReady;
    await fbConfirmPasswordReset(auth, oobCode, newPassword);
  }

  async signUp(dto: SignUpDto): Promise<AuthResponseDto> {
    await tenantReady;
    const cred = await createUserWithEmailAndPassword(auth, dto.email, dto.password);
    await updateProfile(cred.user, { displayName: dto.name });
    const token = await cred.user.getIdToken();
    const user = await apiClient('/api/auth/signup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: dto.name, email: dto.email, referredBy: dto.referredBy }),
    });
    return { token, user };
  }
}
