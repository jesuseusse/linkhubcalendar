import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { ILeadRepository, LeadQueryOptions, PaginatedLeads } from '@/domain/interfaces/ILeadRepository';
import { Lead, LeadStatus } from '@/domain/entities/Lead';

const COLLECTION = 'leads';

function docToLead(id: string, data: FirebaseFirestore.DocumentData): Lead {
  return {
    id,
    userId: data.userId,
    name: data.name,
    email: data.email,
    phone: data.phone ?? '',
    message: data.message,
    status: data.status ?? undefined,
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

  async findByUserIdPaginated(
    tenantId: string,
    userId: string,
    opts: LeadQueryOptions
  ): Promise<PaginatedLeads> {
    const direction = opts.order === 'older' ? 'asc' : 'desc';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = this.col(tenantId).where('userId', '==', userId);

    if (opts.status) {
      query = query.where('status', '==', opts.status);
    }

    if (opts.order === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      query = query
        .where('createdAt', '>=', todayStart.getTime())
        .where('createdAt', '<=', todayEnd.getTime());
    }

    query = query.orderBy('createdAt', direction);

    if (opts.cursor) {
      const cursorDoc = await this.col(tenantId).doc(opts.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.limit(opts.limit + 1).get();
    const hasMore = snap.docs.length > opts.limit;
    const docs = hasMore ? snap.docs.slice(0, opts.limit) : snap.docs;
    const leads = docs.map((doc) => docToLead(doc.id, doc.data()));
    const cursor = hasMore ? docs[docs.length - 1].id : null;

    return { leads, cursor, hasMore };
  }

  async updateStatus(
    tenantId: string,
    leadId: string,
    userId: string,
    status: LeadStatus | null
  ): Promise<Lead> {
    const ref = this.col(tenantId).doc(leadId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Lead not found');
    const data = snap.data()!;
    if (data.userId !== userId) throw new Error('Forbidden');

    if (status === null) {
      await ref.update({ status: FieldValue.delete() });
    } else {
      await ref.update({ status });
    }

    const updated = await ref.get();
    return docToLead(leadId, updated.data()!);
  }
}
