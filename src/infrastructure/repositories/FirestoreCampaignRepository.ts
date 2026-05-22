import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { ICampaignRepository, CampaignQueryOptions, PaginatedCampaigns } from '@/domain/interfaces/ICampaignRepository';
import { Campaign, CampaignClick } from '@/domain/entities/Campaign';

function docToCampaign(id: string, data: FirebaseFirestore.DocumentData): Campaign {
  return {
    id,
    subject: data.subject ?? '',
    htmlBody: data.htmlBody ?? '',
    recipients: data.recipients ?? [],
    status: data.status ?? 'draft',
    createdAt: data.createdAt?.toMillis?.() ?? (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
    sentAt: data.sentAt?.toMillis?.() ?? (typeof data.sentAt === 'number' ? data.sentAt : undefined),
    stats: {
      totalRecipients: data.stats?.totalRecipients ?? 0,
      clicksCount: data.stats?.clicksCount ?? 0,
    },
  };
}

export class FirestoreCampaignRepository implements ICampaignRepository {
  private col(tenantId: string) {
    return adminDb.collection(`tenants/${tenantId}/campaigns`);
  }

  private clicksCol(tenantId: string, campaignId: string) {
    return adminDb.collection(`tenants/${tenantId}/campaigns/${campaignId}/clicks`);
  }

  async create(tenantId: string, data: Omit<Campaign, 'id' | 'createdAt'>): Promise<Campaign> {
    const now = Date.now();
    const ref = this.col(tenantId).doc();
    const payload = { ...data, createdAt: now };
    await ref.set(payload);
    return { ...payload, id: ref.id, createdAt: now };
  }

  async findById(tenantId: string, campaignId: string): Promise<Campaign | null> {
    const doc = await this.col(tenantId).doc(campaignId).get();
    if (!doc.exists) return null;
    return docToCampaign(doc.id, doc.data()!);
  }

  async findPaginated(tenantId: string, opts: CampaignQueryOptions): Promise<PaginatedCampaigns> {
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = this.col(tenantId).orderBy('createdAt', 'desc');

    if (opts.cursor) {
      const cursorDoc = await this.col(tenantId).doc(opts.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.limit(opts.limit + 1).get();
    const hasMore = snap.docs.length > opts.limit;
    const docs = hasMore ? snap.docs.slice(0, opts.limit) : snap.docs;

    return {
      campaigns: docs.map((d) => docToCampaign(d.id, d.data())),
      cursor: hasMore ? docs[docs.length - 1].id : null,
      hasMore,
    };
  }

  async markSent(tenantId: string, campaignId: string, sentAt: number): Promise<void> {
    await this.col(tenantId).doc(campaignId).update({ status: 'sent', sentAt });
  }

  async incrementClicks(tenantId: string, campaignId: string): Promise<void> {
    await this.col(tenantId).doc(campaignId).update({
      'stats.clicksCount': FieldValue.increment(1),
    });
  }

  async recordClick(
    tenantId: string,
    campaignId: string,
    click: Omit<CampaignClick, 'id'>
  ): Promise<void> {
    await this.clicksCol(tenantId, campaignId).add(click);
  }
}
