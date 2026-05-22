import { NextRequest, NextResponse } from 'next/server';
import { decodeTrackingToken } from '@/lib/campaign/trackingUrl';
import { campaignRepo } from '@/infrastructure/container';

const FALLBACK_URL = '/';

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('r');

  if (!token) {
    return NextResponse.redirect(new URL(FALLBACK_URL, req.url), 302);
  }

  const payload = decodeTrackingToken(token);
  if (!payload || !isSafeUrl(payload.u)) {
    return NextResponse.redirect(new URL(FALLBACK_URL, req.url), 302);
  }

  const { c: campaignId, t: tenantId, e: recipientEmail, u: originalUrl } = payload;

  // Fire-and-forget: record click without blocking the redirect
  Promise.all([
    campaignRepo.recordClick(tenantId, campaignId, {
      recipientEmail,
      originalUrl,
      clickedAt: Date.now(),
    }),
    campaignRepo.incrementClicks(tenantId, campaignId),
  ]).catch(() => {});

  return NextResponse.redirect(originalUrl, 302);
}
