// lib/cache/cache-tags.ts

export const CacheTags = {
	tenant: (domain: string) => `tenant:${domain}`,
	tenantById: (tenantId: string) => `tenant-by-id:${tenantId}`,
	user: (id: string) => `user:${id}`,
	users: () => 'users',
	landingPage: (tenantId: string) => `landing-page:${tenantId}`,
	appointmentsCount: (tenantId: string, userId: string) => `appointments-count:${tenantId}:${userId}`
} as const;
