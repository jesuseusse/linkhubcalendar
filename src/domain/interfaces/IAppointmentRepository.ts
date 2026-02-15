import { Appointment } from "../entities/Appointment";

export interface IAppointmentRepository {
  create(tenantId: string, appointment: Omit<Appointment, "id" | "createdAt">): Promise<Appointment>;
  findById(tenantId: string, id: string): Promise<Appointment | null>;
  findByUserId(tenantId: string, userId: string, page: number, limit: number): Promise<{ appointments: Appointment[]; total: number }>;
  findBySlotId(tenantId: string, slotId: string): Promise<Appointment[]>;
  deleteById(tenantId: string, id: string): Promise<boolean>;
  updateStatus(tenantId: string, id: string, status: Appointment["status"]): Promise<Appointment | null>;
}
