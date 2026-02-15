import { AppointmentDto, CreateAppointmentDto, CreateCalendarSlotDto, CreateLeadDto, LeadDto, PaginatedAppointmentsDto, PublicCalendarDto, PublicProfileDto, ThemeDto, UpdateProfileDto, UpdateUsernameDto, UserDto } from "../dtos/user.dto";

export interface IProfileService {
  getProfile(token: string): Promise<UserDto>;
  updateProfile(token: string, dto: UpdateProfileDto): Promise<UserDto>;
  uploadPhoto(token: string, file: File): Promise<UserDto>;
  updateUsername(token: string, dto: UpdateUsernameDto): Promise<UserDto>;
  toggleContactForm(token: string, enabled: boolean): Promise<UserDto>;
  updateTheme(token: string, theme: ThemeDto): Promise<UserDto>;
  toggleCalendar(token: string, enabled: boolean): Promise<UserDto>;
  addCalendarSlot(token: string, dto: CreateCalendarSlotDto): Promise<UserDto>;
  deleteCalendarSlot(token: string, slotId: string): Promise<UserDto>;
  releaseCalendarSlot(token: string, slotId: string): Promise<UserDto>;
  getPublicProfile(username: string): Promise<PublicProfileDto>;
  getPublicCalendar(username: string): Promise<PublicCalendarDto>;
  bookAppointment(username: string, dto: CreateAppointmentDto): Promise<AppointmentDto>;
  getAppointments(token: string, page: number): Promise<PaginatedAppointmentsDto>;
  deleteAppointment(token: string, appointmentId: string): Promise<void>;
  confirmAppointment(token: string, appointmentId: string): Promise<AppointmentDto>;
  releaseAppointmentSlot(token: string, appointmentId: string): Promise<void>;
  submitLead(username: string, dto: CreateLeadDto): Promise<LeadDto>;
  getLeads(token: string): Promise<LeadDto[]>;
  downgradePlan(token: string): Promise<UserDto>;
}
