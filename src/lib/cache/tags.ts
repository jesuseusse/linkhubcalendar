// lib/cache/cache-tags.ts

export const CacheTags = {
	tenant: (domain: string) => `tenant:${domain}`,
	user: (id: string) => `user:${id}`,
	users: () => 'users',
	lessons: (tenant: string) => `lessons:${tenant}`
} as const;
