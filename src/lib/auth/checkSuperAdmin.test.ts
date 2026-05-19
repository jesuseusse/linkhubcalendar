import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenError } from './checkSuperAdmin';

// ---------------------------------------------------------------------------
// Mock checkAuth at module level
// ---------------------------------------------------------------------------

vi.mock('./checkAuth', () => ({
  checkAuth: vi.fn(),
}));

import { checkAuth } from './checkAuth';
import { checkSuperAdmin } from './checkSuperAdmin';

function makeAuthResult(email: string | null) {
  return {
    userId: 'u1',
    tenantId: 'tenant-1',
    email,
    emailVerified: true,
    tenantRegistry: { tenantId: 'tenant-1', theme: null, domain: null },
  };
}

describe('checkSuperAdmin', () => {
  beforeEach(() => {
    vi.mocked(checkAuth).mockResolvedValue(makeAuthResult('admin@example.com') as never);
    vi.stubEnv('NEXT_SUPER_ADMINS_EMAILS', 'admin@example.com,ops@example.com');
  });

  it('passes when email is in the allow-list', async () => {
    const req = {} as never;
    const result = await checkSuperAdmin(req);
    expect(result.email).toBe('admin@example.com');
  });

  it('passes for second email in the comma-separated list', async () => {
    vi.mocked(checkAuth).mockResolvedValue(makeAuthResult('ops@example.com') as never);
    const result = await checkSuperAdmin({} as never);
    expect(result.email).toBe('ops@example.com');
  });

  it('throws ForbiddenError when email is not in the allow-list', async () => {
    vi.mocked(checkAuth).mockResolvedValue(makeAuthResult('other@example.com') as never);
    await expect(checkSuperAdmin({} as never)).rejects.toThrow(ForbiddenError);
    await expect(checkSuperAdmin({} as never)).rejects.toThrow('Forbidden');
  });

  it('is case-insensitive', async () => {
    vi.mocked(checkAuth).mockResolvedValue(makeAuthResult('ADMIN@EXAMPLE.COM') as never);
    const result = await checkSuperAdmin({} as never);
    expect(result.email).toBe('ADMIN@EXAMPLE.COM');
  });

  it('throws ForbiddenError when email is null', async () => {
    vi.mocked(checkAuth).mockResolvedValue(makeAuthResult(null) as never);
    await expect(checkSuperAdmin({} as never)).rejects.toThrow(ForbiddenError);
  });

  it('blocks all when env var is empty', async () => {
    vi.stubEnv('NEXT_SUPER_ADMINS_EMAILS', '');
    await expect(checkSuperAdmin({} as never)).rejects.toThrow(ForbiddenError);
  });
});
