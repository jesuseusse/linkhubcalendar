import { describe, it, expect } from 'vitest';
import {
  encodeTrackingToken,
  decodeTrackingToken,
  buildTrackingUrl,
  injectTrackingLinks,
} from './trackingUrl';

const PAYLOAD = { c: 'campaign-1', t: 'tenant-1', e: 'user@example.com', u: 'https://example.com/promo' };

describe('encodeTrackingToken / decodeTrackingToken', () => {
  it('roundtrips a valid payload', () => {
    const token = encodeTrackingToken(PAYLOAD);
    const decoded = decodeTrackingToken(token);
    expect(decoded).toEqual(PAYLOAD);
  });

  it('returns null for invalid base64', () => {
    expect(decodeTrackingToken('!!!not_base64!!!')).toBeNull();
  });

  it('returns null when a required field is missing', () => {
    const bad = Buffer.from(JSON.stringify({ c: 'x', t: 'y' })).toString('base64url');
    expect(decodeTrackingToken(bad)).toBeNull();
  });

  it('returns null for non-object JSON', () => {
    const bad = Buffer.from('"just a string"').toString('base64url');
    expect(decodeTrackingToken(bad)).toBeNull();
  });
});

describe('buildTrackingUrl', () => {
  it('includes the token as a query param', () => {
    const url = buildTrackingUrl('https://app.example.com', PAYLOAD);
    expect(url).toMatch(/^https:\/\/app\.example\.com\/api\/track\?r=/);
    const token = new URL(url).searchParams.get('r')!;
    expect(decodeTrackingToken(token)).toEqual(PAYLOAD);
  });
});

describe('injectTrackingLinks', () => {
  const BASE = 'https://app.example.com';
  const TENANT = 'tenant-1';
  const CAMPAIGN = 'campaign-1';
  const EMAIL = 'user@example.com';

  it('replaces href attributes with tracking URLs', () => {
    const html = '<a href="https://mysite.com/offer">Oferta</a>';
    const result = injectTrackingLinks(html, TENANT, CAMPAIGN, EMAIL, BASE);
    expect(result).toContain('/api/track?r=');
    expect(result).not.toContain('href="https://mysite.com/offer"');
  });

  it('replaces single-quoted href too', () => {
    const html = "<a href='https://mysite.com'>Click</a>";
    const result = injectTrackingLinks(html, TENANT, CAMPAIGN, EMAIL, BASE);
    expect(result).toContain('/api/track?r=');
  });

  it('skips mailto: links', () => {
    const html = '<a href="mailto:hello@example.com">Email</a>';
    const result = injectTrackingLinks(html, TENANT, CAMPAIGN, EMAIL, BASE);
    expect(result).toBe(html);
  });

  it('skips tel: links', () => {
    const html = '<a href="tel:+1234567890">Llamar</a>';
    const result = injectTrackingLinks(html, TENANT, CAMPAIGN, EMAIL, BASE);
    expect(result).toBe(html);
  });

  it('skips anchor-only links', () => {
    const html = '<a href="#section">Sección</a>';
    const result = injectTrackingLinks(html, TENANT, CAMPAIGN, EMAIL, BASE);
    expect(result).toBe(html);
  });

  it('skips already-tracking URLs', () => {
    const alreadyTracked = `${BASE}/api/track?r=sometoken`;
    const html = `<a href="${alreadyTracked}">link</a>`;
    const result = injectTrackingLinks(html, TENANT, CAMPAIGN, EMAIL, BASE);
    expect(result).toBe(html);
  });

  it('replaces multiple links independently', () => {
    const html = '<a href="https://a.com">A</a><a href="https://b.com">B</a>';
    const result = injectTrackingLinks(html, TENANT, CAMPAIGN, EMAIL, BASE);
    const matches = result.match(/\/api\/track\?r=/g);
    expect(matches).toHaveLength(2);
  });

  it('the injected token decodes to the correct original URL', () => {
    const original = 'https://shop.example.com/deal?code=50OFF';
    const html = `<a href="${original}">Comprar</a>`;
    const result = injectTrackingLinks(html, TENANT, CAMPAIGN, EMAIL, BASE);
    const tokenMatch = result.match(/\/api\/track\?r=([^"']+)/);
    expect(tokenMatch).toBeTruthy();
    const decoded = decodeTrackingToken(tokenMatch![1]);
    expect(decoded?.u).toBe(original);
    expect(decoded?.e).toBe(EMAIL);
    expect(decoded?.c).toBe(CAMPAIGN);
    expect(decoded?.t).toBe(TENANT);
  });
});
