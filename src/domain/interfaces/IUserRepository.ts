import { User, Link, ThemeConfig } from "../entities/User";

export interface IUserRepository {
  create(tenantId: string, user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>;
  createWithId(tenantId: string, id: string, user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>;
  findByEmail(tenantId: string, email: string): Promise<User | null>;
  findById(tenantId: string, id: string): Promise<User | null>;
  findByUsername(tenantId: string, username: string): Promise<User | null>;
  updateProfile(tenantId: string, id: string, data: Partial<Pick<User, "name" | "email" | "profilePhoto" | "description">>): Promise<User | null>;
  updateContactFormEnabled(tenantId: string, id: string, enabled: boolean): Promise<User | null>;
  updateCalendarEnabled(tenantId: string, id: string, enabled: boolean): Promise<User | null>;
  updateUsername(tenantId: string, id: string, username: string): Promise<User | null>;
  addLink(tenantId: string, userId: string, link: Omit<Link, "id">): Promise<User | null>;
  updateLink(tenantId: string, userId: string, linkId: string, link: Omit<Link, "id">): Promise<User | null>;
  deleteLink(tenantId: string, userId: string, linkId: string): Promise<User | null>;
  updateTheme(tenantId: string, id: string, theme: ThemeConfig): Promise<User | null>;
  updatePlan(tenantId: string, id: string, plan: string, planExpiredAt?: number | null, stripeSubscriptionId?: string | null): Promise<User | null>;
  updateSubscriptionFlags(tenantId: string, id: string, flags: { subscriptionCancelAtPeriodEnd?: boolean | null; subscriptionStatus?: string | null }): Promise<User | null>;
  updateLastVerificationEmailSentAt(tenantId: string, id: string): Promise<User | null>;
  findAll(tenantId: string): Promise<User[]>;
}
