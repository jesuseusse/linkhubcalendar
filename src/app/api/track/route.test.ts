import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { encodeTrackingToken } from '@/lib/campaign/trackingUrl';

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

vi.mock('@/infrastructure/container', () => ({
  campaignRepo: {
    recordClick: vi.fn().mockResolvedValue(undefined),
    incrementClicks: vi.fn().mockResolvedValue(undefined),
  },
}));

import { campaignRepo } from '@/infrastructure/container';
import { GET } from './route';

const VALID_PAYLOAD = {
  c: 'campaign-1',
  t: 'tenant-1',
  e: 'user@example.com',
  u: 'https://external.example.com/offer',
};

function makeReq(r?: string) {
  const url = r
    ? `http://localhost/api/track?r=${encodeURIComponent(r)}`
    : 'http://localhost/api/track';
  return new NextRequest(url);
}

describe('GET /api/track', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to originalUrl for a valid token', async () => {
    const token = encodeTrackingToken(VALID_PAYLOAD);
    const res = await GET(makeReq(token));
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(VALID_PAYLOAD.u);
  });

  it('records a click and increments counter', async () => {
    const token = encodeTrackingToken(VALID_PAYLOAD);
    await GET(makeReq(token));
    // Fire-and-forget — give promises a tick to resolve
    await new Promise((r) => setTimeout(r, 10));
    expect(campaignRepo.recordClick).toHaveBeenCalledWith(
      VALID_PAYLOAD.t,
      VALID_PAYLOAD.c,
      expect.objectContaining({ recipientEmail: VALID_PAYLOAD.e, originalUrl: VALID_PAYLOAD.u })
    );
    expect(campaignRepo.incrementClicks).toHaveBeenCalledWith(VALID_PAYLOAD.t, VALID_PAYLOAD.c);
  });

  it('redirects to fallback when no token is provided', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/');
  });

  it('redirects to fallback for an invalid token', async () => {
    const res = await GET(makeReq('!!!invalid!!!'));
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/');
  });

  it('redirects to fallback for a javascript: URL', async () => {
    const token = encodeTrackingToken({ ...VALID_PAYLOAD, u: 'javascript:alert(1)' });
    const res = await GET(makeReq(token));
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).not.toContain('javascript:');
  });

  it('does not block redirect when Firestore write fails', async () => {
    vi.mocked(campaignRepo.incrementClicks).mockRejectedValue(new Error('Firestore down'));
    const token = encodeTrackingToken(VALID_PAYLOAD);
    const res = await GET(makeReq(token));
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(VALID_PAYLOAD.u);
  });
});
