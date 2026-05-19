import { NextRequest } from 'next/server';
import { checkAuth, AuthResult } from './checkAuth';

export class ForbiddenError extends Error {
  readonly status = 403;
}

export async function checkSuperAdmin(req: NextRequest): Promise<AuthResult> {
  const auth = await checkAuth(req);
  const allowed = (process.env.NEXT_SUPER_ADMINS_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!auth.email || !allowed.includes(auth.email.toLowerCase())) {
    throw new ForbiddenError('Forbidden');
  }
  return auth;
}
