export type Plan = "free" | "pro" | "team";

export const PERMISSIONS = {
	LINKS_EDIT: "links:edit",
	THEME_CUSTOMIZE: "theme:customize",
	CONTACT_FORM: "contact:form",
	CALENDAR: "calendar:manage",
	LEADS_VIEW: "leads:view",
	ANALYTICS_VIEW: "analytics:view",
	GALLERY_MANAGE: "gallery:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PLAN_PERMISSIONS: Record<Plan, Permission[]> = {
	free: [PERMISSIONS.LINKS_EDIT],
	pro: [
		PERMISSIONS.LINKS_EDIT,
		PERMISSIONS.THEME_CUSTOMIZE,
		PERMISSIONS.CONTACT_FORM,
		PERMISSIONS.CALENDAR,
		PERMISSIONS.LEADS_VIEW,
		PERMISSIONS.GALLERY_MANAGE,
	],
	team: [
		PERMISSIONS.LINKS_EDIT,
		PERMISSIONS.THEME_CUSTOMIZE,
		PERMISSIONS.CONTACT_FORM,
		PERMISSIONS.CALENDAR,
		PERMISSIONS.LEADS_VIEW,
		PERMISSIONS.ANALYTICS_VIEW,
		PERMISSIONS.GALLERY_MANAGE,
	],
};

export function hasPermission(plan: Plan, permission: Permission): boolean {
	return PLAN_PERMISSIONS[plan]?.includes(permission) ?? false;
}
