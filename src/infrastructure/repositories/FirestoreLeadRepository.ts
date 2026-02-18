import { adminDb } from '@/lib/firebase/admin';
import { ILeadRepository } from '@/domain/interfaces/ILeadRepository';
import { Lead } from '@/domain/entities/Lead';

const COLLECTION = 'leads';

function docToLead(id: string, data: FirebaseFirestore.DocumentData): Lead {
  return {
    id,
    userId: data.userId,
    name: data.name,
    email: data.email,
    message: data.message,
    createdAt: data.createdAt?.toMillis?.() ?? (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
  };
}

export class FirestoreLeadRepository implements ILeadRepository {
  private col(tenantId: string) {
    return adminDb.collection(`tenants/${tenantId}/${COLLECTION}`);
  }

  async create(tenantId: string, lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
    const now = Date.now();
    const ref = this.col(tenantId).doc();
    const data = { ...lead, createdAt: now };
    await ref.set(data);
    return { ...data, id: ref.id, createdAt: now };
  }

  async findByUserId(tenantId: string, userId: string): Promise<Lead[]> {
    const snap = await this.col(tenantId)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((doc) => docToLead(doc.id, doc.data()));
  }
}
