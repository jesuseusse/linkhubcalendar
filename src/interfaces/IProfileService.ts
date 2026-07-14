import { AppointmentDto, CreateAppointmentDto, CreateCalendarSlotDto, CreateLeadDto, CreateScheduleBookingDto, GalleryPhotoDto, LeadDto, LeadStatus, PaginatedAppointmentsDto, PaginatedLeadsDto, PublicCalendarDto, PublicProfileDto, ThemeDto, UpdateProfileDto, UpdateUsernameDto, UserDto, WeeklySchedule, ScheduleException } from "../dtos/user.dto";
import type { LeadOrder } from "../domain/interfaces/ILeadRepository";

export interface GetLeadsPaginatedParams {
  order: LeadOrder;
  status?: LeadStatus;
  cursor?: string;
  limit?: number;
}

export interface IProfileService {
  getProfile(token: string): Promise<UserDto>;
  updateProfile(token: string, dto: UpdateProfileDto): Promise<UserDto>;
  uploadPhoto(token: string, file: File): Promise<UserDto>;
  updateUsername(token: string, dto: UpdateUsernameDto): Promise<UserDto>;
  toggleContactForm(token: string, enabled: boolean): Promise<UserDto>;
  updateTheme(token: string, theme: ThemeDto): Promise<UserDto>;
  toggleCalendar(token: string, enabled: boolean): Promise<UserDto>;
  addCalendarSlot(token: string, dto: CreateCalendarSlotDto | CreateCalendarSlotDto[]): Promise<UserDto>;
  deleteCalendarSlot(token: string, slotId: string): Promise<UserDto>;
  releaseCalendarSlot(token: string, slotId: string): Promise<UserDto>;
  getPublicProfile(username: string): Promise<PublicProfileDto>;
  getPublicCalendar(username: string, month?: string): Promise<PublicCalendarDto>;
  saveWeeklySchedule(token: string, schedule: WeeklySchedule | null): Promise<UserDto>;
  updateScheduleExceptions(token: string, exceptions: ScheduleException[]): Promise<UserDto>;
  removeScheduleException(token: string, date: string): Promise<UserDto>;
  bookAppointment(username: string, dto: CreateAppointmentDto | CreateScheduleBookingDto): Promise<AppointmentDto>;
  getAppointments(token: string, page: number, filter?: 'upcoming' | 'past'): Promise<PaginatedAppointmentsDto>;
  cancelAppointment(token: string, appointmentId: string): Promise<AppointmentDto>;
  confirmAppointment(token: string, appointmentId: string): Promise<AppointmentDto>;
  rescheduleAppointment(token: string, appointmentId: string): Promise<AppointmentDto>;
  submitLead(username: string, dto: CreateLeadDto): Promise<LeadDto>;
  getLeads(token: string): Promise<LeadDto[]>;
  getLeadsPaginated(token: string, params: GetLeadsPaginatedParams): Promise<PaginatedLeadsDto>;
  updateLeadStatus(token: string, leadId: string, status: LeadStatus | null): Promise<LeadDto>;
  downgradePlan(token: string): Promise<UserDto>;
  sendVerificationEmail(token: string): Promise<void>;
  uploadGalleryPhoto(token: string, file: File): Promise<GalleryPhotoDto[]>;
  deleteGalleryPhoto(token: string, photoId: string): Promise<GalleryPhotoDto[]>;
  reorderGalleryPhotos(token: string, orderedIds: string[]): Promise<GalleryPhotoDto[]>;
  toggleGallery(token: string, enabled: boolean): Promise<UserDto>;
}
