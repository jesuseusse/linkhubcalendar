export type AppointmentStatus = "pending" | "confirmed";

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
  createdAt: Date;
}
