import { adminDb } from '@/lib/firebase/admin';
import { IUserRepository } from '@/domain/interfaces/IUserRepository';
import { User, Link, CalendarSlot, ThemeConfig } from '@/domain/entities/User';

const COLLECTION = 'users';

function toMillis(val: unknown): number | undefined {
	if (typeof val === 'number') return val;
	if (val && typeof (val as { toMillis?: unknown }).toMillis === 'function')
		return (val as { toMillis: () => number }).toMillis();
	return undefined;
}

function docToUser(id: string, data: FirebaseFirestore.DocumentData): User {
	return {
		id,
		email: data.email ?? '',
		emailVerified: data.emailVerified ?? false,
		name: data.name ?? '',
		description: data.description,
		username: data.username,
		usernameChangedAt: toMillis(data.usernameChangedAt),
		profilePhoto: data.profilePhoto,
		plan: data.plan,
		planExpiredAt: toMillis(data.planExpiredAt) ?? null,
		subscriptionCancelAtPeriodEnd: data.subscriptionCancelAtPeriodEnd === true ? true : undefined,
		subscriptionStatus: typeof data.subscriptionStatus === 'string' ? data.subscriptionStatus : undefined,
		stripeSubscriptionId: typeof data.stripeSubscriptionId === 'string' ? data.stripeSubscriptionId : undefined,
		contactFormEnabled: data.contactFormEnabled ?? false,
		calendarEnabled: data.calendarEnabled ?? false,
		theme: data.theme,
		links: data.links ?? [],
		calendarSlots: data.calendarSlots ?? [],
		lastVerificationEmailSentAt: toMillis(data.lastVerificationEmailSentAt),
		createdAt: toMillis(data.createdAt) ?? Date.now(),
		updatedAt: toMillis(data.updatedAt) ?? Date.now()
	};
}

export class FirestoreUserRepository implements IUserRepository {
	private col(tenantId: string) {
		return adminDb.collection(`tenants/${tenantId}/${COLLECTION}`);
	}

	async create(
		tenantId: string,
		user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
	): Promise<User> {
		const now = Date.now();
		const ref = this.col(tenantId).doc();
		const data = {
			...user,
			createdAt: now,
			updatedAt: now
		};
		await ref.set(data);
		return { ...data, id: ref.id, createdAt: now, updatedAt: now } as User;
	}

	async createWithId(
		tenantId: string,
		id: string,
		user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
	): Promise<User> {
		const now = Date.now();
		const data = {
			...user,
			createdAt: now,
			updatedAt: now
		};
		await this.col(tenantId).doc(id).set(data);
		return { ...data, id, createdAt: now, updatedAt: now } as User;
	}

	async findByEmail(tenantId: string, email: string): Promise<User | null> {
		const snap = await this.col(tenantId)
			.where('email', '==', email)
			.limit(1)
			.get();
		if (snap.empty) return null;
		const doc = snap.docs[0];
		return docToUser(doc.id, doc.data());
	}

	async findById(tenantId: string, id: string): Promise<User | null> {
		const doc = await this.col(tenantId).doc(id).get();
		if (!doc.exists) return null;
		return docToUser(doc.id, doc.data()!);
	}

	async findByUsername(
		tenantId: string,
		username: string
	): Promise<User | null> {
		const snap = await this.col(tenantId)
			.where('username', '==', username)
			.limit(1)
			.get();
		if (snap.empty) return null;
		const doc = snap.docs[0];
		return docToUser(doc.id, doc.data());
	}

	async updateProfile(
		tenantId: string,
		id: string,
		data: Partial<Pick<User, 'name' | 'email' | 'profilePhoto' | 'description'>>
	): Promise<User | null> {
		const ref = this.col(tenantId).doc(id);
		const doc = await ref.get();
		if (!doc.exists) return null;
		await ref.update({ ...data, updatedAt: Date.now() });
		const updated = await ref.get();
		return docToUser(id, updated.data()!);
	}

	async updateContactFormEnabled(
		tenantId: string,
		id: string,
		enabled: boolean
	): Promise<User | null> {
		const ref = this.col(tenantId).doc(id);
		const doc = await ref.get();
		if (!doc.exists) return null;
		await ref.update({ contactFormEnabled: enabled, updatedAt: Date.now() });
		const updated = await ref.get();
		return docToUser(id, updated.data()!);
	}

	async updateCalendarEnabled(
		tenantId: string,
		id: string,
		enabled: boolean
	): Promise<User | null> {
		const ref = this.col(tenantId).doc(id);
		const doc = await ref.get();
		if (!doc.exists) return null;
		await ref.update({ calendarEnabled: enabled, updatedAt: Date.now() });
		const updated = await ref.get();
		return docToUser(id, updated.data()!);
	}

	async updateUsername(
		tenantId: string,
		id: string,
		username: string
	): Promise<User | null> {
		const ref = this.col(tenantId).doc(id);
		const doc = await ref.get();
		if (!doc.exists) return null;
		await ref.update({
			username,
			usernameChangedAt: Date.now(),
			updatedAt: Date.now()
		});
		const updated = await ref.get();
		return docToUser(id, updated.data()!);
	}

	async addLink(
		tenantId: string,
		userId: string,
		link: Omit<Link, 'id'>
	): Promise<User | null> {
		const ref = this.col(tenantId).doc(userId);
		const doc = await ref.get();
		if (!doc.exists) return null;
		const data = doc.data()!;
		const links = data.links ?? [];
		const newLink = { ...link, id: crypto.randomUUID() };
		links.push(newLink);
		await ref.update({ links, updatedAt: Date.now() });
		const updated = await ref.get();
		return docToUser(userId, updated.data()!);
	}

	async updateLink(
		tenantId: string,
		userId: string,
		linkId: string,
		link: Omit<Link, 'id'>
	): Promise<User | null> {
		const ref = this.col(tenantId).doc(userId);
		const doc = await ref.get();
		if (!doc.exists) return null;
		const data = doc.data()!;
		const links = (data.links ?? []).map((l: Link) =>
			l.id === linkId ? { ...l, ...link } : l
		);
		await ref.update({ links, updatedAt: Date.now() });
		const updated = await ref.get();
		return docToUser(userId, updated.data()!);
	}

	async deleteLink(
		tenantId: string,
		userId: string,
		linkId: string
	): Promise<User | null> {
		const ref = this.col(tenantId).doc(userId);
		const doc = await ref.get();
		if (!doc.exists) return null;
		const data = doc.data()!;
		const links = (data.links ?? []).filter((l: Link) => l.id !== linkId);
		await ref.update({ links, updatedAt: Date.now() });
		const updated = await ref.get();
		return docToUser(userId, updated.data()!);
	}

	async addCalendarSlot(
		tenantId: string,
		userId: string,
		slot: Omit<CalendarSlot, 'id'>
	): Promise<User | null> {
		const ref = this.col(tenantId).doc(userId);
		const doc = await ref.get();
		if (!doc.exists) return null;
		const data = doc.data()!;
		const calendarSlots = data.calendarSlots ?? [];
		const newSlot = { ...slot, id: crypto.randomUUID() };
		calendarSlots.push(newSlot);
		await ref.update({ calendarSlots, updatedAt: Date.now() });
		const updated = await ref.get();
		return docToUser(userId, updated.data()!);
	}

	async upsertCalendarSlots(
		tenantId: string,
		userId: string,
		slots: Omit<CalendarSlot, 'id'>[]
	): Promise<User | null> {
		const ref = this.col(tenantId).doc(userId);
		const doc = await ref.get();
		if (!doc.exists) return null;
		const data = doc.data()!;
		let calendarSlots: CalendarSlot[] = data.calendarSlots ?? [];

		for (const slot of slots) {
			const existing = calendarSlots.find(
				(s) => s.date === slot.date && s.startTime === slot.startTime && s.endTime === slot.endTime
			);
			if (existing) {
				calendarSlots = calendarSlots.map((s) =>
					s.id === existing.id ? { ...s, ...slot } : s
				);
			} else {
				calendarSlots.push({ ...slot, id: crypto.randomUUID() });
			}
		}

		await ref.update({ calendarSlots, updatedAt: Date.now() });
		const updated = await ref.get();
		return docToUser(userId, updated.data()!);
	}

	async updateCalendarSlotBooked(
		tenantId: string,
		userId: string,
		slotId: string,
		booked: boolean
	): Promise<User | null> {
		const ref = this.col(tenantId).doc(userId);
		const doc = await ref.get();
		if (!doc.exists) return null;
		const data = doc.data()!;
		const calendarSlots = (data.calendarSlots ?? []).map((s: CalendarSlot) =>
			s.id === slotId ? { ...s, booked } : s
		);
		await ref.update({ calendarSlots, updatedAt: Date.now() });
		const updated = await ref.get();
		return docToUser(userId, updated.data()!);
	}

	async deleteCalendarSlot(
		tenantId: string,
		userId: string,
		slotId: string
	): Promise<User | null> {
		const ref = this.col(tenantId).doc(userId);
		const doc = await ref.get();
		if (!doc.exists) return null;
		const data = doc.data()!;
		const calendarSlots = (data.calendarSlots ?? []).filter(
			(s: CalendarSlot) => s.id !== slotId
		);
		await ref.update({ calendarSlots, updatedAt: Date.now() });
		const updated = await ref.get();
		return docToUser(userId, updated.data()!);
	}

	async updateTheme(
		tenantId: string,
		id: string,
		theme: ThemeConfig
	): Promise<User | null> {
		const ref = this.col(tenantId).doc(id);
		const doc = await ref.get();
		if (!doc.exists) return null;
		await ref.update({ theme, updatedAt: Date.now() });
		const updated = await ref.get();
		return docToUser(id, updated.data()!);
	}

	async updatePlan(
		tenantId: string,
		id: string,
		plan: string,
		planExpiredAt?: number | null,
		stripeSubscriptionId?: string | null
	): Promise<User | null> {
		const ref = this.col(tenantId).doc(id);
		const doc = await ref.get();
		if (!doc.exists) return null;
		const updateData: Record<string, unknown> = { plan, updatedAt: Date.now() };
		if (planExpiredAt !== undefined) {
			updateData.planExpiredAt = planExpiredAt ?? null;
		}
		if (stripeSubscriptionId !== undefined) {
			updateData.stripeSubscriptionId = stripeSubscriptionId ?? null;
		}
		await ref.update(updateData);
		const updated = await ref.get();
		return docToUser(id, updated.data()!);
	}

	async updateLastVerificationEmailSentAt(
		tenantId: string,
		id: string
	): Promise<User | null> {
		const ref = this.col(tenantId).doc(id);
		const doc = await ref.get();
		if (!doc.exists) return null;
		await ref.update({
			lastVerificationEmailSentAt: Date.now(),
			updatedAt: Date.now()
		});
		const updated = await ref.get();
		return docToUser(id, updated.data()!);
	}

	async updateSubscriptionFlags(
		tenantId: string,
		id: string,
		flags: { subscriptionCancelAtPeriodEnd?: boolean | null; subscriptionStatus?: string | null }
	): Promise<User | null> {
		const ref = this.col(tenantId).doc(id);
		const doc = await ref.get();
		if (!doc.exists) return null;
		const updateData: Record<string, unknown> = { updatedAt: Date.now() };
		if (flags.subscriptionCancelAtPeriodEnd !== undefined) {
			updateData.subscriptionCancelAtPeriodEnd = flags.subscriptionCancelAtPeriodEnd ?? null;
		}
		if (flags.subscriptionStatus !== undefined) {
			updateData.subscriptionStatus = flags.subscriptionStatus ?? null;
		}
		await ref.update(updateData);
		const updated = await ref.get();
		return docToUser(id, updated.data()!);
	}
}
