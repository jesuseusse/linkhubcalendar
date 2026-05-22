interface TrackingPayload {
  c: string; // campaignId
  t: string; // tenantId
  e: string; // recipientEmail
  u: string; // originalUrl
}

export function encodeTrackingToken(payload: TrackingPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeTrackingToken(token: string): TrackingPayload | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as Record<string, unknown>).c === 'string' &&
      typeof (parsed as Record<string, unknown>).t === 'string' &&
      typeof (parsed as Record<string, unknown>).e === 'string' &&
      typeof (parsed as Record<string, unknown>).u === 'string'
    ) {
      return parsed as TrackingPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export function buildTrackingUrl(
  appBaseUrl: string,
  payload: TrackingPayload
): string {
  const token = encodeTrackingToken(payload);
  return `${appBaseUrl}/api/track?r=${token}`;
}

const HREF_REGEX = /href=(["'])([^"']+)\1/gi;

export function injectTrackingLinks(
  html: string,
  tenantId: string,
  campaignId: string,
  recipientEmail: string,
  appBaseUrl: string
): string {
  return html.replace(HREF_REGEX, (match, quote, url: string) => {
    if (
      url.startsWith('mailto:') ||
      url.startsWith('tel:') ||
      url.startsWith('#') ||
      url.includes('/api/track')
    ) {
      return match;
    }
    const trackUrl = buildTrackingUrl(appBaseUrl, {
      c: campaignId,
      t: tenantId,
      e: recipientEmail,
      u: url,
    });
    return `href=${quote}${trackUrl}${quote}`;
  });
}
