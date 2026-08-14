import { Plan } from '../permissions/plans';
import { LinkDto } from './link.dto';
import { WeeklySchedule, ScheduleException } from '@/domain/entities/User';

export interface GalleryPhotoDto {
	id: string;
	url: string;
	order: number;
}

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

export type { WeeklySchedule, ScheduleException };

export interface CreateScheduleBookingDto {
	date: string;
	startTime: string;
	endTime: string;
	name: string;
	email: string;
	phone: string;
	reason: string;
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
	billingInterval?: 'month' | 'year';
	referredBy?: string;
	contactFormEnabled: boolean;
	calendarEnabled: boolean;
	weeklySchedule?: WeeklySchedule | null;
	scheduleExceptions?: ScheduleException[];
	galleryEnabled: boolean;
	galleryPhotos: GalleryPhotoDto[];
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
	galleryEnabled: boolean;
	galleryPhotos: GalleryPhotoDto[];
	theme?: ThemeDto;
	links: LinkDto[];
	calendarSlots: CalendarSlotDto[];
}

export interface PublicCalendarDto {
	name: string;
	username: string;
	profilePhoto?: string;
	calendarSlots: CalendarSlotDto[];
	hasWeeklySchedule?: boolean;
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

// ---------------------------------------------------------------------------
// Super admin DTOs
// ---------------------------------------------------------------------------

export interface UserSummaryDto {
	id: string;
	email: string;
	name: string;
	username?: string;
	profilePhoto?: string;
	plan?: Plan;
	planExpiredAt?: number | null;
	subscriptionCancelAtPeriodEnd?: boolean;
	subscriptionStatus?: string;
	billingInterval?: 'month' | 'year';
	links: LinkDto[];
	appointmentsLast30d: number;
	createdAt: number;
	updatedAt: number;
}

export interface SuperAdminTicketDto {
	id: string;
	userId: string;
	userEmail: string;
	userName: string;
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

export interface SuperAdminStatsDto {
	totalUsers: number;
	usersWithActivePaidPlan: number;
}

// ---------------------------------------------------------------------------
// Email campaigns
// ---------------------------------------------------------------------------

export type CampaignStatus = 'draft' | 'sent';

export interface CampaignDto {
	id: string;
	subject: string;
	htmlBody: string;
	recipients: string[];
	status: CampaignStatus;
	createdAt: number;
	sentAt?: number;
	stats: { totalRecipients: number; clicksCount: number };
}

export interface PaginatedCampaignsDto {
	campaigns: CampaignDto[];
	cursor: string | null;
	hasMore: boolean;
}

export interface SendCampaignDto {
	subject: string;
	htmlBody: string;
	recipientEmails: string[];
}

export interface SendCampaignResultDto {
	campaign: CampaignDto;
	failedCount: number;
}

export interface PaginatedUsersDto {
	users: UserSummaryDto[];
	cursor: string | null;
	hasMore: boolean;
}
