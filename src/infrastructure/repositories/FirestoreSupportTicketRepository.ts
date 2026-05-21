import { adminDb } from '@/lib/firebase/admin';
import { ISupportTicketRepository, TicketWithComments } from '@/domain/interfaces/ISupportTicketRepository';
import { SupportTicket, TicketComment, TicketStatus, TicketType } from '@/domain/entities/SupportTicket';

function docToTicket(id: string, data: FirebaseFirestore.DocumentData): SupportTicket {
  return {
    id,
    userId: data.userId,
    type: data.type,
    status: data.status,
    title: data.title,
    description: data.description,
    deviceType: data.deviceType ?? undefined,
    deviceOther: data.deviceOther ?? undefined,
    screenshotUrl: data.screenshotUrl ?? undefined,
    whatsappPhone: data.whatsappPhone ?? undefined,
    createdAt: data.createdAt?.toMillis?.() ?? (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
    updatedAt: data.updatedAt?.toMillis?.() ?? (typeof data.updatedAt === 'number' ? data.updatedAt : Date.now()),
  };
}

function docToComment(id: string, data: FirebaseFirestore.DocumentData): TicketComment {
  return {
    id,
    ticketId: data.ticketId,
    userId: data.userId,
    userName: data.userName,
    userEmail: data.userEmail,
    content: data.content,
    createdAt: data.createdAt?.toMillis?.() ?? (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
  };
}

export class FirestoreSupportTicketRepository implements ISupportTicketRepository {
  private col(tenantId: string, userId: string) {
    return adminDb.collection(`tenants/${tenantId}/users/${userId}/support_tickets`);
  }

  async create(
    tenantId: string,
    ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SupportTicket> {
    const now = Date.now();
    const ref = this.col(tenantId, ticket.userId).doc();
    const data = Object.fromEntries(
      Object.entries({ ...ticket, createdAt: now, updatedAt: now }).filter(([, v]) => v !== undefined)
    );
    await ref.set(data);
    return { ...ticket, id: ref.id, createdAt: now, updatedAt: now };
  }

  async findByUserId(tenantId: string, userId: string): Promise<SupportTicket[]> {
    const snap = await this.col(tenantId, userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((doc) => docToTicket(doc.id, doc.data()));
  }

  async findOpenByType(
    tenantId: string,
    userId: string,
    type: TicketType
  ): Promise<SupportTicket | null> {
    const snap = await this.col(tenantId, userId)
      .where('status', '==', 'open')
      .where('type', '==', type)
      .limit(1)
      .get();

    if (snap.empty) return null;
    const doc = snap.docs[0];
    return docToTicket(doc.id, doc.data());
  }

  async findByIdWithComments(
    tenantId: string,
    userId: string,
    ticketId: string
  ): Promise<TicketWithComments | null> {
    const ref = this.col(tenantId, userId).doc(ticketId);
    const snap = await ref.get();

    if (!snap.exists) return null;

    const ticket = docToTicket(snap.id, snap.data()!);
    const commentSnap = await ref.collection('comments')
      .orderBy('createdAt', 'asc')
      .get();
    const comments = commentSnap.docs.map((doc) => docToComment(doc.id, doc.data()));

    return { ticket, comments };
  }

  async updateStatus(
    tenantId: string,
    userId: string,
    ticketId: string,
    status: TicketStatus
  ): Promise<SupportTicket> {
    const ref = this.col(tenantId, userId).doc(ticketId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Support ticket not found');

    const now = Date.now();
    await ref.update({ status, updatedAt: now });

    const updated = await ref.get();
    return docToTicket(ticketId, updated.data()!);
  }

  async findAllByTenant(tenantId: string, userIds: string[]): Promise<SupportTicket[]> {
    const results = await Promise.all(
      userIds.map((userId) => this.findByUserId(tenantId, userId))
    );
    return results.flat();
  }

  async addComment(
    tenantId: string,
    userId: string,
    ticketId: string,
    comment: Omit<TicketComment, 'id' | 'createdAt'>
  ): Promise<TicketComment> {
    const ticketRef = this.col(tenantId, userId).doc(ticketId);
    const now = Date.now();
    const commentRef = ticketRef.collection('comments').doc();
    const data = { ...comment, createdAt: now };
    await commentRef.set(data);

    // Bump ticket updatedAt
    await ticketRef.update({ updatedAt: now });

    return { ...data, id: commentRef.id, createdAt: now };
  }
}
