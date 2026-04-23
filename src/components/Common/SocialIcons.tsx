import type { SVGProps, ReactElement } from 'react';

type SvgProps = SVGProps<SVGSVGElement> & { className?: string };

export function WhatsappIcon({ className, ...props }: SvgProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      className={className}
      aria-hidden='true'
      {...props}
    >
      <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z' />
      <path d='M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.12 1.532 5.849L.057 23.486a.5.5 0 0 0 .609.61l5.637-1.475A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.877 9.877 0 0 1-5.034-1.378l-.361-.214-3.741.98.999-3.648-.235-.374A9.862 9.862 0 0 1 2.118 12C2.118 6.53 6.53 2.118 12 2.118c5.47 0 9.882 4.412 9.882 9.882 0 5.47-4.412 9.882-9.882 9.882z' />
    </svg>
  );
}

export function TiktokIcon({ className, ...props }: SvgProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      className={className}
      aria-hidden='true'
      {...props}
    >
      <path d='M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z' />
    </svg>
  );
}

export function InstagramIcon({ className, ...props }: SvgProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      className={className}
      aria-hidden='true'
      {...props}
    >
      <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z' />
    </svg>
  );
}

// ── Icon lookup by URL ──────────────────────────────────────────────────────

interface SocialIconMatch {
  pattern: RegExp;
  Icon: (props: SvgProps) => ReactElement;
  color: string;
  label: string;
}

const SOCIAL_ICON_MAP: SocialIconMatch[] = [
  { pattern: /wa\.me|api\.whatsapp\.com|whatsapp\.com/i, Icon: WhatsappIcon, color: '#25D366', label: 'WhatsApp' },
  { pattern: /instagram\.com/i,                           Icon: InstagramIcon, color: '#E1306C', label: 'Instagram' },
  { pattern: /tiktok\.com/i,                              Icon: TiktokIcon,    color: 'currentColor', label: 'TikTok' },
];

/**
 * Returns the branded SVG icon component and its brand color for a given URL,
 * or null if no social match is found (caller should fall back to material-icons).
 */
export function getSocialIcon(url: string): { Icon: (props: SvgProps) => ReactElement; color: string; label: string } | null {
  for (const entry of SOCIAL_ICON_MAP) {
    if (entry.pattern.test(url)) {
      return { Icon: entry.Icon, color: entry.color, label: entry.label };
    }
  }
  return null;
}
