import { Appointment } from "../entities/Appointment";
import { CalendarSlot } from "../entities/User";

export interface IAppointmentRepository {
  // Appointment methods
  create(tenantId: string, appointment: Omit<Appointment, "id" | "createdAt">): Promise<Appointment>;
  findById(tenantId: string, userId: string, id: string): Promise<Appointment | null>;
  findByUserId(tenantId: string, userId: string, page: number, limit: number, filter?: 'upcoming' | 'past'): Promise<{ appointments: Appointment[]; total: number }>;
  findBySlotId(tenantId: string, userId: string, slotId: string): Promise<Appointment[]>;
  deleteById(tenantId: string, userId: string, id: string): Promise<boolean>;
  updateStatus(tenantId: string, userId: string, id: string, status: Appointment["status"]): Promise<Appointment | null>;

  // Slot methods (stored in same subcollection with type: "slot")
  addSlot(tenantId: string, userId: string, slot: Omit<CalendarSlot, "id">): Promise<CalendarSlot>;
  upsertSlots(tenantId: string, userId: string, slots: Omit<CalendarSlot, "id">[]): Promise<void>;
  findAllSlots(tenantId: string, userId: string): Promise<CalendarSlot[]>;
  findAvailableSlots(tenantId: string, userId: string): Promise<CalendarSlot[]>;
  findSlotById(tenantId: string, userId: string, slotId: string): Promise<CalendarSlot | null>;
  deleteSlot(tenantId: string, userId: string, slotId: string): Promise<void>;

  // Atomic operations — encapsulate Firestore transactions.
  // bookSlotAtomically reads slot date/time from Firestore inside the transaction.
  bookSlotAtomically(
    tenantId: string,
    userId: string,
    slotId: string,
    appointmentData: Pick<Appointment, "userId" | "name" | "email" | "phone" | "reason">
  ): Promise<Appointment>;
  releaseSlotAtomically(tenantId: string, userId: string, appointmentId: string, slotId: string): Promise<void>;
  markSlotBookedAtomically(tenantId: string, userId: string, appointmentId: string, slotId: string): Promise<void>;

  // Schedule-based methods (inverted model — no slot documents needed)
  findAppointmentsByMonth(tenantId: string, userId: string, year: number, month: number): Promise<Appointment[]>;
  bookScheduleSlotAtomically(
    tenantId: string,
    userId: string,
    data: { date: string; startTime: string; endTime: string; userId: string; name: string; email: string; phone: string; reason: string }
  ): Promise<Appointment>;
}
