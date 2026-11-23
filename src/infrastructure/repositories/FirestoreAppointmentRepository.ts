import { unstable_cache } from 'next/cache';
import { adminDb } from '@/lib/firebase/admin';
import { CacheTags } from '@/lib/cache/tags';
import { IAppointmentRepository } from '@/domain/interfaces/IAppointmentRepository';
import { Appointment } from '@/domain/entities/Appointment';
import { CalendarSlot } from '@/domain/entities/User';

function docToAppointment(id: string, data: FirebaseFirestore.DocumentData): Appointment {
  return {
    type: "appointment",
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

function docToSlot(id: string, data: FirebaseFirestore.DocumentData): CalendarSlot {
  return {
    id,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    booked: data.booked ?? false,
  };
}

// Schedule-based appointments use a deterministic ID `${yyyymmdd}_${hhmm}` that doubles as the slot lock.
// Legacy slot-doc appointments reference a UUID slot document instead.
const SCHEDULE_SLOT_ID = /^\d{8}_\d{4}$/;

function isScheduleSlotId(slotId: string): boolean {
  return SCHEDULE_SLOT_ID.test(slotId);
}

export class FirestoreAppointmentRepository implements IAppointmentRepository {
  private col(tenantId: string, userId: string) {
    return adminDb.collection(`tenants/${tenantId}/users/${userId}/appointments`);
  }

  // ---------------------------------------------------------------------------
  // Appointment methods
  // ---------------------------------------------------------------------------

  async create(tenantId: string, appointment: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    const now = Date.now();
    const ref = this.col(tenantId, appointment.userId).doc();
    const data = { ...appointment, type: 'appointment', createdAt: now };
    await ref.set(data);
    return { ...data, id: ref.id, createdAt: now } as Appointment;
  }

  async findById(tenantId: string, userId: string, id: string): Promise<Appointment | null> {
    const doc = await this.col(tenantId, userId).doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    if (data.type === 'slot') return null;
    return docToAppointment(doc.id, data);
  }

  async findByUserId(tenantId: string, userId: string, page: number, limit: number, filter?: 'upcoming' | 'past'): Promise<{ appointments: Appointment[]; total: number }> {
    const col = this.col(tenantId, userId);
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    let query = col.where('type', '==', 'appointment') as FirebaseFirestore.Query;
    if (filter === 'upcoming') {
      query = query.where('date', '>=', today);
    } else if (filter === 'past') {
      query = query.where('date', '<', today);
    }
    const countSnap = await query.count().get();
    const total = countSnap.data().count;

    const offset = (page - 1) * limit;
    const snap = await query
      .orderBy('date', filter === 'past' ? 'desc' : 'asc')
      .offset(offset)
      .limit(limit)
      .get();

    const appointments = snap.docs.map((doc) => docToAppointment(doc.id, doc.data()));
    return { appointments, total };
  }

  async findBySlotId(tenantId: string, userId: string, slotId: string): Promise<Appointment[]> {
    const snap = await this.col(tenantId, userId)
      .where('type', '==', 'appointment')
      .where('slotId', '==', slotId)
      .get();
    return snap.docs.map((doc) => docToAppointment(doc.id, doc.data()));
  }

  async deleteById(tenantId: string, userId: string, id: string): Promise<boolean> {
    const col = this.col(tenantId, userId);
    const doc = await col.doc(id).get();
    if (!doc.exists || doc.data()?.type === 'slot') return false;
    await col.doc(id).delete();
    return true;
  }

  async updateStatus(tenantId: string, userId: string, id: string, status: Appointment['status']): Promise<Appointment | null> {
    const ref = this.col(tenantId, userId).doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.type === 'slot') return null;
    await ref.update({ status });
    const updated = await ref.get();
    return docToAppointment(id, updated.data()!);
  }

  // ---------------------------------------------------------------------------
  // Slot methods
  // ---------------------------------------------------------------------------

  async addSlot(tenantId: string, userId: string, slot: Omit<CalendarSlot, 'id'>): Promise<CalendarSlot> {
    const id = crypto.randomUUID();
    const data = { type: 'slot', ...slot, id };
    await this.col(tenantId, userId).doc(id).set(data);
    return { ...slot, id };
  }

  async upsertSlots(tenantId: string, userId: string, slots: Omit<CalendarSlot, 'id'>[]): Promise<void> {
    const col = this.col(tenantId, userId);
    const existingSnap = await col.where('type', '==', 'slot').get();
    const existing: CalendarSlot[] = existingSnap.docs.map((d) => docToSlot(d.id, d.data()));

    const batch = adminDb.batch();
    for (const slot of slots) {
      const found = existing.find(
        (s) => s.date === slot.date && s.startTime === slot.startTime && s.endTime === slot.endTime
      );
      if (found) {
        batch.update(col.doc(found.id), { ...slot });
      } else {
        const id = crypto.randomUUID();
        batch.set(col.doc(id), { type: 'slot', ...slot, id });
      }
    }
    await batch.commit();
  }

  async findAllSlots(tenantId: string, userId: string): Promise<CalendarSlot[]> {
    const snap = await this.col(tenantId, userId).where('type', '==', 'slot').get();
    return snap.docs.map((doc) => docToSlot(doc.id, doc.data()));
  }

  async findAvailableSlots(tenantId: string, userId: string): Promise<CalendarSlot[]> {
    const snap = await this.col(tenantId, userId)
      .where('type', '==', 'slot')
      .where('booked', '==', false)
      .get();
    return snap.docs.map((doc) => docToSlot(doc.id, doc.data()));
  }

  async findSlotById(tenantId: string, userId: string, slotId: string): Promise<CalendarSlot | null> {
    const doc = await this.col(tenantId, userId).doc(slotId).get();
    if (!doc.exists || doc.data()?.type !== 'slot') return null;
    return docToSlot(doc.id, doc.data()!);
  }

  async deleteSlot(tenantId: string, userId: string, slotId: string): Promise<void> {
    await this.col(tenantId, userId).doc(slotId).delete();
  }

  // ---------------------------------------------------------------------------
  // Atomic operations
  // ---------------------------------------------------------------------------

  async bookSlotAtomically(
    tenantId: string,
    userId: string,
    slotId: string,
    appointmentData: Pick<Appointment, 'userId' | 'name' | 'email' | 'phone' | 'reason'>
  ): Promise<Appointment> {
    const col = this.col(tenantId, userId);
    const slotRef = col.doc(slotId);
    const appointmentRef = col.doc();
    const now = Date.now();

    return adminDb.runTransaction(async (tx) => {
      const slotDoc = await tx.get(slotRef);
      if (!slotDoc.exists || slotDoc.data()?.type !== 'slot') {
        throw new Error('Time slot not found');
      }
      const slotData = slotDoc.data()!;
      if (slotData.booked === true) {
        throw new Error('Time slot is already booked');
      }

      const appointment: Appointment = {
        type: 'appointment',
        id: appointmentRef.id,
        slotId,
        date: slotData.date,
        startTime: slotData.startTime,
        endTime: slotData.endTime,
        status: 'pending',
        ...appointmentData,
        createdAt: now,
      };

      tx.set(appointmentRef, { ...appointment });
      tx.update(slotRef, { booked: true });

      return appointment;
    });
  }

  async findAppointmentsByMonth(tenantId: string, userId: string, year: number, month: number): Promise<Appointment[]> {
    const mm = month.toString().padStart(2, '0');
    const from = `${year}-${mm}-01`;
    const to = `${year}-${mm}-31`;
    const snap = await this.col(tenantId, userId)
      .where('type', '==', 'appointment')
      .where('date', '>=', from)
      .where('date', '<=', to)
      .get();
    // Cancelled appointments no longer hold their slot — they must not show as booked.
    return snap.docs
      .map((doc) => docToAppointment(doc.id, doc.data()))
      .filter((appt) => appt.status !== 'cancelled');
  }

  async bookScheduleSlotAtomically(
    tenantId: string,
    userId: string,
    data: { date: string; startTime: string; endTime: string; userId: string; name: string; email: string; phone: string; reason: string }
  ): Promise<Appointment> {
    const col = this.col(tenantId, userId);
    const deterministicId = `${data.date.replace(/-/g, '')}_${data.startTime.replace(':', '')}`;
    const appointmentRef = col.doc(deterministicId);
    const now = Date.now();

    return adminDb.runTransaction(async (tx) => {
      const existing = await tx.get(appointmentRef);
      if (existing.exists) {
        const existingData = existing.data()!;
        // A cancelled appointment left on the lock doc (created before cancellations archived it)
        // frees the slot; keep it as history under a new ID and take over the lock.
        if (existingData.type !== 'appointment' || existingData.status !== 'cancelled') {
          throw new Error('Slot no disponible');
        }
        const archiveRef = col.doc();
        tx.set(archiveRef, { ...existingData, id: archiveRef.id });
      }
      const appointment: Appointment = {
        type: 'appointment',
        id: deterministicId,
        slotId: deterministicId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        userId: data.userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        reason: data.reason,
        status: 'pending',
        createdAt: now,
      };
      tx.set(appointmentRef, { ...appointment });
      return appointment;
    });
  }

  async countInDateRange(tenantId: string, userId: string, fromDate: string, toDate: string): Promise<number> {
    const getCached = unstable_cache(
      async (tId: string, uId: string, from: string, to: string): Promise<number> => {
        const snap = await this.col(tId, uId)
          .where('type', '==', 'appointment')
          .where('date', '>=', from)
          .where('date', '<=', to)
          .count()
          .get();
        return snap.data().count;
      },
      ['appointments-count-in-range'],
      { tags: [CacheTags.appointmentsCount(tenantId, userId)], revalidate: 86400 }
    );

    return getCached(tenantId, userId, fromDate, toDate);
  }

  async releaseSlotAtomically(
    tenantId: string,
    userId: string,
    appointmentId: string,
    slotId: string
  ): Promise<Appointment> {
    const col = this.col(tenantId, userId);
    const appointmentRef = col.doc(appointmentId);

    return adminDb.runTransaction(async (tx) => {
      const apptDoc = await tx.get(appointmentRef);
      if (!apptDoc.exists || apptDoc.data()?.type !== 'appointment') {
        throw new Error('Appointment not found');
      }
      const data = apptDoc.data()!;

      if (isScheduleSlotId(slotId)) {
        // Schedule-based: the appointment doc IS the slot lock. Move the cancelled record to a
        // fresh ID and delete the lock doc so the slot can be booked (or re-booked) again.
        const archiveRef = col.doc();
        const archived = { ...data, id: archiveRef.id, status: 'cancelled' };
        tx.set(archiveRef, archived);
        tx.delete(appointmentRef);
        return docToAppointment(archiveRef.id, archived);
      }

      // Legacy slot-doc model: mark the appointment cancelled and re-open the slot document.
      tx.update(appointmentRef, { status: 'cancelled' });
      tx.update(col.doc(slotId), { booked: false });
      return docToAppointment(appointmentId, { ...data, status: 'cancelled' });
    });
  }

  async markSlotBookedAtomically(
    tenantId: string,
    userId: string,
    appointmentId: string,
    slotId: string
  ): Promise<Appointment> {
    const col = this.col(tenantId, userId);
    const appointmentRef = col.doc(appointmentId);
    const slotRef = col.doc(slotId);

    return adminDb.runTransaction(async (tx) => {
      const apptDoc = await tx.get(appointmentRef);
      if (!apptDoc.exists || apptDoc.data()?.type !== 'appointment') {
        throw new Error('Appointment not found');
      }
      const data = apptDoc.data()!;

      if (isScheduleSlotId(slotId)) {
        // Schedule-based: the slot is free only if no active appointment holds the lock doc.
        const lockDoc = slotRef.path === appointmentRef.path ? apptDoc : await tx.get(slotRef);
        if (lockDoc.exists) {
          const lockData = lockDoc.data()!;
          const lockIsFree = lockData.type === 'appointment' && lockData.status === 'cancelled';
          if (!lockIsFree) throw new Error('Slot already booked');
          if (lockDoc.ref.path !== appointmentRef.path) {
            // Another cancelled record sits on the lock doc — keep it as history.
            const archiveRef = col.doc();
            tx.set(archiveRef, { ...lockData, id: archiveRef.id });
          }
        }
        // Restore this appointment onto the lock doc and drop its archived copy.
        const restored = { ...data, id: slotId, status: 'pending' };
        tx.set(slotRef, restored);
        if (slotRef.path !== appointmentRef.path) tx.delete(appointmentRef);
        return docToAppointment(slotId, restored);
      }

      const slotDoc = await tx.get(slotRef);
      if (!slotDoc.exists || slotDoc.data()?.type !== 'slot') {
        throw new Error('Slot not found');
      }
      if (slotDoc.data()!.booked === true) {
        throw new Error('Slot already booked');
      }
      tx.update(slotRef, { booked: true });
      tx.update(appointmentRef, { status: 'pending' });
      return docToAppointment(appointmentId, { ...data, status: 'pending' });
    });
  }
}
