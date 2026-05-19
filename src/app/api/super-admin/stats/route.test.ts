import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

vi.mock('@/lib/auth/checkSuperAdmin', () => ({
  checkSuperAdmin: vi.fn(),
  ForbiddenError: class ForbiddenError extends Error {
    readonly status = 403;
    constructor(msg = 'Forbidden') { super(msg); }
  },
}));

vi.mock('@/infrastructure/container', () => ({
  container: {
    getSuperAdminStatsUseCase: {
      execute: vi.fn().mockResolvedValue({ totalUsers: 5, usersWithActivePaidPlan: 2 }),
    },
  },
}));

import { checkSuperAdmin, ForbiddenError } from '@/lib/auth/checkSuperAdmin';
import { GET } from './route';

function makeReq() {
  return new NextRequest('http://localhost/api/super-admin/stats');
}

describe('GET /api/super-admin/stats', () => {
  beforeEach(() => {
    vi.mocked(checkSuperAdmin).mockResolvedValue({
      userId: 'u1',
      tenantId: 'tenant-1',
      email: 'admin@example.com',
      emailVerified: true,
      tenantRegistry: { tenantId: 'tenant-1', theme: null, domain: null } as never,
    });
  });

  it('returns 200 with stats on happy path', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ totalUsers: 5, usersWithActivePaidPlan: 2 });
  });

  it('returns 403 when checkSuperAdmin throws ForbiddenError', async () => {
    vi.mocked(checkSuperAdmin).mockRejectedValue(new ForbiddenError());
    const res = await GET(makeReq());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });
});
