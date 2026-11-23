import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockResolveTenantId, mockFindByUsername, mockFindById } = vi.hoisted(() => ({
  mockResolveTenantId: vi.fn(),
  mockFindByUsername: vi.fn(),
  mockFindById: vi.fn(),
}));

vi.mock('@/lib/auth/resolveTenantId', () => ({ resolveTenantId: mockResolveTenantId }));
vi.mock('@/infrastructure/container', () => ({
  container: {
    userRepo: { findByUsername: mockFindByUsername },
    appointmentRepo: { findById: mockFindById },
  },
}));

import { GET } from './route';

const call = (username = 'ana', id = 'appt-1') =>
  GET(new NextRequest(`http://localhost/api/u/${username}/appointments/${id}`), {
    params: Promise.resolve({ username, id }),
  });

describe('GET /api/u/[username]/appointments/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveTenantId.mockResolvedValue('tenant-1');
    mockFindByUsername.mockResolvedValue({ id: 'user-1' });
  });

  it('returns only status and createdAt (no personal data)', async () => {
    mockFindById.mockResolvedValue({ id: 'appt-1', status: 'cancelled', createdAt: 5, email: 'x@y.z', name: 'N' });
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'cancelled', createdAt: 5 });
    expect(mockFindById).toHaveBeenCalledWith('tenant-1', 'user-1', 'appt-1');
  });

  it('returns 404 when the appointment does not exist', async () => {
    mockFindById.mockResolvedValue(null);
    expect((await call()).status).toBe(404);
  });

  it('returns 404 when the user does not exist', async () => {
    mockFindByUsername.mockResolvedValue(null);
    expect((await call()).status).toBe(404);
    expect(mockFindById).not.toHaveBeenCalled();
  });
});
