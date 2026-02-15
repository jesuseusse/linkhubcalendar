import { TenantTheme } from '@/interfaces/ITenantTheme';

/**
 * Subset of CSS custom properties from @theme that a tenant can override.
 * All values are CSS color strings (hex, rgb, hsl, etc.).
 * Only defined keys are overridden; omitted keys keep the @theme defaults.
 */

const THEME_TO_CSS_VAR: Record<keyof TenantTheme, string> = {
	primary: '--color-primary',
	primaryForeground: '--color-primary-foreground',
	secondary: '--color-secondary',
	secondaryForeground: '--color-secondary-foreground',
	background: '--color-background',
	foreground: '--color-foreground',
	surface: '--color-surface',
	surfaceAlt: '--color-surface-alt',
	muted: '--color-muted',
	mutedForeground: '--color-muted-foreground',
	border: '--color-border',
	ring: '--color-ring',
	accent: '--color-accent',
	accentForeground: '--color-accent-foreground',
	success: '--color-success',
	successLight: '--color-success-light',
	warning: '--color-warning',
	warningLight: '--color-warning-light',
	error: '--color-error',
	errorLight: '--color-error-light',
	info: '--color-info',
	infoLight: '--color-info-light',
	radiusSm: '--radius-sm',
	radiusMd: '--radius-md',
	radiusLg: '--radius-lg',
	radiusXl: '--radius-xl'
};

/**
 * Converts a TenantTheme to a CSS custom property record
 * suitable for React's style prop on <html>.
 */
export function tenantThemeToCssVars(
	theme: TenantTheme
): Record<string, string> {
	const vars: Record<string, string> = {};
	for (const [key, cssVar] of Object.entries(THEME_TO_CSS_VAR)) {
		const value = theme[key as keyof TenantTheme];
		if (value !== undefined && value !== '') {
			vars[cssVar] = value;
		}
	}
	return vars;
}
