import { unstable_cache, revalidateTag } from 'next/cache';
import { adminDb } from '@/lib/firebase/admin';
import { CacheTags } from '@/lib/cache/tags';
import { TenantRegistryData } from '@/interfaces/ITenantRegistryData';
import {
	ITenantRegistryRepository,
	CreateTenantRegistryData
} from '@/domain/interfaces/ITenantRegistryRepository';

const COLLECTION = 'tenant_registry';

function docToTenantRegistry(
	hostname: string,
	data: FirebaseFirestore.DocumentData
): TenantRegistryData {
	return {
		tenantId: data.tenantId,
		theme: data.theme ?? null,
		domain: data.domain ?? null,
		companyName: data.companyName ?? null,
		logoUrl: data.logoUrl ?? null,
		resendApiKey: data.resendApiKey ?? null,
		resendFromEmail: data.resendFromEmail ?? null
	};
}

export class FirestoreTenantRegistryRepository implements ITenantRegistryRepository {
	private col() {
		return adminDb.collection(COLLECTION);
	}

	async getByHostname(hostname: string): Promise<TenantRegistryData | null> {
		const getCached = unstable_cache(
			async (host: string): Promise<TenantRegistryData | null> => {
				const doc = await this.col().doc(host).get();
				if (!doc.exists) return null;
				return docToTenantRegistry(host, doc.data()!);
			},
			['tenant-registry-by-hostname'],
			{ tags: [CacheTags.tenant(hostname)] }
		);

		return getCached(hostname);
	}

	async getByTenantId(tenantId: string): Promise<TenantRegistryData | null> {
		const getCached = unstable_cache(
			async (tId: string): Promise<TenantRegistryData | null> => {
				const snap = await this.col()
					.where('tenantId', '==', tId)
					.limit(1)
					.get();
				if (snap.empty) return null;
				const doc = snap.docs[0];
				return docToTenantRegistry(doc.id, doc.data());
			},
			['tenant-registry-by-tenant-id'],
			{ tags: [CacheTags.tenantById(tenantId)] }
		);

		return getCached(tenantId);
	}

	async updateByHostname(
		hostname: string,
		data: Partial<CreateTenantRegistryData>
	): Promise<TenantRegistryData> {
		const ref = this.col().doc(hostname);
		const doc = await ref.get();
		if (!doc.exists) {
			throw new Error(`Tenant registry not found for hostname: ${hostname}`);
		}

		await ref.update({ ...data, updatedAt: Date.now() });

		const existingData = doc.data()!;
		const tenantId = data.tenantId ?? existingData.tenantId;

		revalidateTag(CacheTags.tenant(hostname), { expire: 0 });
		revalidateTag(CacheTags.tenantById(tenantId), { expire: 0 });

		const updated = await ref.get();
		return docToTenantRegistry(hostname, updated.data()!);
	}

	async create(
		hostname: string,
		data: CreateTenantRegistryData
	): Promise<TenantRegistryData> {
		const ref = this.col().doc(hostname);
		const now = Date.now();
		await ref.set({ ...data, createdAt: now });

		revalidateTag(CacheTags.tenant(hostname), { expire: 0 });
		revalidateTag(CacheTags.tenantById(data.tenantId), { expire: 0 });

		return docToTenantRegistry(hostname, { ...data, createdAt: now });
	}
}
