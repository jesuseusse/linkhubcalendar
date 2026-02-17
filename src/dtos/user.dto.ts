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
	email: string;
	emailVerified: boolean;
	username?: string;
	usernameChangedAt?: string;
	profilePhoto?: string;
	plan?: Plan;
	planExpiredAt?: string | null;
	contactFormEnabled: boolean;
	calendarEnabled: boolean;
	theme?: ThemeDto;
	links: LinkDto[];
	calendarSlots: CalendarSlotDto[];
}

export interface UpdateProfileDto {
	name?: string;
	email?: string;
}

export interface UpdateUsernameDto {
	username: string;
}

export interface PublicProfileDto {
	name: string;
	username: string;
	profilePhoto?: string;
	plan?: Plan;
	planExpiredAt?: string | null;
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

export interface LeadDto {
	id: string;
	name: string;
	email: string;
	message: string;
	createdAt: string;
}

export interface CreateLeadDto {
	name: string;
	email: string;
	message: string;
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
	createdAt: string;
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
