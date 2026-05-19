import { Plan } from '../permissions/plans';
import { LinkDto } from './link.dto';

export interface CalendarSlotDto {
	id: string;
	date: string;
	startTime: string;
	endTime: string;
	booked?: boolean;
}

export interface CreateCalendarSlotDto {
	date: string;
	startTime: string;
	endTime: string;
}

export interface ThemeDto {
	backgroundColor: string;
	textColor: string;
	buttonColor: string;
	buttonTextColor: string;
	accentColor: string;
}

export interface UserDto {
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
	referredBy?: string;
	contactFormEnabled: boolean;
	calendarEnabled: boolean;
	theme?: ThemeDto;
	links: LinkDto[];
	calendarSlots: CalendarSlotDto[];
}

export interface UpdateProfileDto {
	name?: string;
	description?: string;
	email?: string;
}

export interface UpdateUsernameDto {
	username: string;
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
	theme?: ThemeDto;
	links: LinkDto[];
	calendarSlots: CalendarSlotDto[];
}

export interface PublicCalendarDto {
	name: string;
	username: string;
	profilePhoto?: string;
	calendarSlots: CalendarSlotDto[];
}

export type LeadStatus = 'attended' | 'canceled' | 'contacted';

export interface LeadDto {
	id: string;
	name: string;
	email: string;
	phone: string;
	message: string;
	status?: LeadStatus;
	createdAt: number;
}

export interface CreateLeadDto {
	name: string;
	email: string;
	phone: string;
	message: string;
}

export interface PaginatedLeadsDto {
	leads: LeadDto[];
	cursor: string | null;
	hasMore: boolean;
}

export interface AppointmentDto {
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

export interface CreateAppointmentDto {
	slotId: string;
	name: string;
	email: string;
	phone: string;
	reason: string;
}

export interface PaginatedAppointmentsDto {
	appointments: AppointmentDto[];
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

export interface SupportTicketDto {
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

export interface TicketCommentDto {
	id: string;
	content: string;
	userName: string;
	userEmail: string;
	createdAt: number;
}

export interface TicketDetailDto {
	ticket: SupportTicketDto;
	comments: TicketCommentDto[];
}

export interface CreateSupportTicketDto {
	type: TicketType;
	title: string;
	description: string;
	deviceType?: DeviceType;
	deviceOther?: string;
	whatsappPhone?: string;
}
