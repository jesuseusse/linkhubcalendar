import { adminDb } from '@/lib/firebase/admin';
import { IAppointmentRepository } from '@/domain/interfaces/IAppointmentRepository';
import { Appointment } from '@/domain/entities/Appointment';

function docToAppointment(id: string, data: FirebaseFirestore.DocumentData): Appointment {
  return {
    id,
    userId: data.userId,
    slotId: data.slotId,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    name: data.name,
    email: data.email,
    phone: data.phone,
    reason: data.reason,
    status: data.status ?? 'pending',
    createdAt: data.createdAt?.toMillis?.() ?? (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
  };
}

export class FirestoreAppointmentRepository implements IAppointmentRepository {
  private col(tenantId: string, userId: string) {
    return adminDb.collection(`tenants/${tenantId}/users/${userId}/appointments`);
  }

  async create(tenantId: string, appointment: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    const now = Date.now();
    const ref = this.col(tenantId, appointment.userId).doc();
    const data = { ...appointment, createdAt: now };
    await ref.set(data);
    return { ...data, id: ref.id, createdAt: now };
  }

  async findById(tenantId: string, userId: string, id: string): Promise<Appointment | null> {
    const doc = await this.col(tenantId, userId).doc(id).get();
    if (!doc.exists) return null;
    return docToAppointment(doc.id, doc.data()!);
  }

  async findByUserId(tenantId: string, userId: string, page: number, limit: number): Promise<{ appointments: Appointment[]; total: number }> {
    const col = this.col(tenantId, userId);
    const countSnap = await col.count().get();
    const total = countSnap.data().count;

    const offset = (page - 1) * limit;
    const snap = await col
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(limit)
      .get();

    const appointments = snap.docs.map((doc) => docToAppointment(doc.id, doc.data()));
    return { appointments, total };
  }

  async findBySlotId(tenantId: string, userId: string, slotId: string): Promise<Appointment[]> {
    const snap = await this.col(tenantId, userId).where('slotId', '==', slotId).get();
    return snap.docs.map((doc) => docToAppointment(doc.id, doc.data()));
  }

  async deleteById(tenantId: string, userId: string, id: string): Promise<boolean> {
    const col = this.col(tenantId, userId);
    const doc = await col.doc(id).get();
    if (!doc.exists) return false;
    await col.doc(id).delete();
    return true;
  }

  async updateStatus(tenantId: string, userId: string, id: string, status: Appointment['status']): Promise<Appointment | null> {
    const ref = this.col(tenantId, userId).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    await ref.update({ status });
    const updated = await ref.get();
    return docToAppointment(id, updated.data()!);
  }
}
