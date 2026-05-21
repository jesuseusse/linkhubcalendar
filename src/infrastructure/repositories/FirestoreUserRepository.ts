import { adminDb } from '@/lib/firebase/admin';
import { IUserRepository } from '@/domain/interfaces/IUserRepository';
import { User, Link, ThemeConfig, GalleryPhoto } from '@/domain/entities/User';

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
		galleryEnabled: data.galleryEnabled ?? false,
		galleryPhotos: data.galleryPhotos ?? [],
		theme: data.theme,
		links: data.links ?? [],
		lastVerificationEmailSentAt: toMillis(data.lastVerificationEmailSentAt),
		referredBy: typeof data.referredBy === 'string' ? data.referredBy : undefined,
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

	async findAll(tenantId: string): Promise<User[]> {
		const snap = await this.col(tenantId).get();
		return snap.docs.map((doc) => docToUser(doc.id, doc.data()));
	}

	async updateGalleryEnabled(
		tenantId: string,
		userId: string,
		enabled: boolean
	): Promise<User | null> {
		const ref = this.col(tenantId).doc(userId);
		const doc = await ref.get();
		if (!doc.exists) return null;
		await ref.update({ galleryEnabled: enabled, updatedAt: Date.now() });
		const updated = await ref.get();
		return docToUser(userId, updated.data()!);
	}

	async updateGalleryPhotos(
		tenantId: string,
		userId: string,
		photos: GalleryPhoto[]
	): Promise<User | null> {
		const ref = this.col(tenantId).doc(userId);
		const doc = await ref.get();
		if (!doc.exists) return null;
		await ref.update({ galleryPhotos: photos, updatedAt: Date.now() });
		const updated = await ref.get();
		return docToUser(userId, updated.data()!);
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
