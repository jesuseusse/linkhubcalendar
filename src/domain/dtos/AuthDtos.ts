import { Plan } from '@/permissions/plans';

export interface ThemeResponseDto {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  accentColor: string;
}

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  username?: string;
  usernameChangedAt?: string;
  profilePhoto?: string;
  plan?: Plan;
  planExpiredAt?: string | null;
  contactFormEnabled: boolean;
  calendarEnabled: boolean;
  theme?: ThemeResponseDto;
  links: LinkResponseDto[];
  calendarSlots: CalendarSlotResponseDto[];
}

export interface LinkResponseDto {
  id: string;
  title: string;
  url: string;
}

export interface CalendarSlotResponseDto {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  booked: boolean;
}

export interface CreateCalendarSlotDto {
  date: string;
  startTime: string;
  endTime: string;
}

export interface CreateLinkDto {
  title: string;
  url: string;
}

export interface UpdateLinkDto {
  title: string;
  url: string;
}

export interface UpdateProfileDto {
  name?: string;
  email?: string;
}

export interface UpdateUsernameDto {
  username: string;
}

export interface CreateLeadDto {
  name: string;
  email: string;
  message: string;
}

export interface LeadResponseDto {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface UpdateThemeDto {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  accentColor: string;
}

export interface PublicProfileDto {
  name: string;
  username: string;
  profilePhoto?: string;
  plan?: Plan;
  planExpiredAt?: string | null;
  contactFormEnabled: boolean;
  calendarEnabled: boolean;
  theme?: ThemeResponseDto;
  links: LinkResponseDto[];
  calendarSlots: CalendarSlotResponseDto[];
}

export interface CreateAppointmentDto {
  slotId: string;
  name: string;
  email: string;
  phone: string;
  reason: string;
}

export interface AppointmentResponseDto {
  id: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  email: string;
  phone: string;
  reason: string;
  status: string;
  createdAt: string;
}

export interface PaginatedAppointmentsDto {
  appointments: AppointmentResponseDto[];
  total: number;
  page: number;
  totalPages: number;
}
