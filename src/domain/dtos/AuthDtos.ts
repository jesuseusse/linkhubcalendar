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
  description?: string;
  email: string;
  emailVerified: boolean;
  username?: string;
  usernameChangedAt?: number;
  profilePhoto?: string;
  plan?: Plan;
  planExpiredAt?: number | null;
  subscriptionCancelAtPeriodEnd?: boolean;
  subscriptionStatus?: string;
  stripeSubscriptionId?: string;
  billingInterval?: 'month' | 'year';
  contactFormEnabled: boolean;
  calendarEnabled: boolean;
  galleryEnabled: boolean;
  galleryPhotos: GalleryPhotoResponseDto[];
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
  description?: string;
  email?: string;
}

export interface UpdateUsernameDto {
  username: string;
}

export interface CreateLeadDto {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export type LeadStatus = 'attended' | 'canceled' | 'contacted';

export interface LeadResponseDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status?: LeadStatus;
  createdAt: number;
}

export interface PaginatedLeadsResponseDto {
  leads: LeadResponseDto[];
  cursor: string | null;
  hasMore: boolean;
}

export interface UpdateThemeDto {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  accentColor: string;
}

export interface GalleryPhotoResponseDto {
  id: string;
  url: string;
  order: number;
}

export interface PublicProfileDto {
  name: string;
  description?: string;
  username: string;
  profilePhoto?: string;
  plan?: Plan;
  planExpiredAt?: number | null;
  contactFormEnabled: boolean;
  calendarEnabled: boolean;
  galleryEnabled: boolean;
  galleryPhotos: GalleryPhotoResponseDto[];
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
  createdAt: number;
}

export interface PaginatedAppointmentsDto {
  appointments: AppointmentResponseDto[];
  total: number;
  page: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Support tickets
// ---------------------------------------------------------------------------

export type TicketType = 'error' | 'suggestion';
export type TicketStatus = 'open' | 'closed' | 'solved' | 'cancelled';
export type DeviceType = 'ios' | 'android' | 'windows' | 'mac' | 'tablet' | 'other';

export interface CreateSupportTicketDto {
  type: TicketType;
  title: string;
  description: string;
  deviceType?: DeviceType;
  deviceOther?: string;
  whatsappPhone?: string;
}

export interface SupportTicketResponseDto {
  id: string;
  type: TicketType;
  status: TicketStatus;
  title: string;
  description: string;
  deviceType?: DeviceType;
  deviceOther?: string;
  screenshotUrl?: string;
  whatsappPhone?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TicketCommentResponseDto {
  id: string;
  content: string;
  userName: string;
  userEmail: string;
  createdAt: number;
}

export interface TicketDetailResponseDto {
  ticket: SupportTicketResponseDto;
  comments: TicketCommentResponseDto[];
}
