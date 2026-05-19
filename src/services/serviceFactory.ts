import { ApiAuthService } from './ApiAuthService';
import { ApiProfileService } from './ApiProfileService';
import { ApiLinkService } from './ApiLinkService';
import { ApiSupportService } from './ApiSupportService';

export const authService = new ApiAuthService();
export const profileService = new ApiProfileService();
export const linkService = new ApiLinkService();
export const supportService = new ApiSupportService();
