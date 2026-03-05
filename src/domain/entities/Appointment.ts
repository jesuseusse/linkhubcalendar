export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export interface Appointment {
  id: string;
  userId: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  email: string;
  phone: string;
  reason: string;
  status: AppointmentStatus;
  createdAt: number;
}
