export interface GalleryPhoto {
  id: string;
  url: string;
  order: number;
}

export interface Link {
  id: string;
  title: string;
  url: string;
}

export interface CalendarSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  booked: boolean;
}

export interface DaySchedule {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  excludedStartTimes?: string[];
}

export interface WeeklySchedule {
  days: number[];
  sameForAllDays: boolean;
  defaultSchedule?: DaySchedule;
  perDaySchedule?: Partial<Record<number, DaySchedule>>;
}

export interface ScheduleException {
  date: string;
  disabledSlotTimes?: string[];
}

export interface ThemeConfig {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  accentColor: string;
}

import { Plan } from '@/permissions/plans';

export interface User {
  id: string;
  email: string;
  emailVerified?: boolean;
  password?: string;
  name: string;
  description?: string;
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
  galleryPhotos: GalleryPhoto[];
  theme?: ThemeConfig;
  links: Link[];
  promoInvalidAttempts?: number;
  promoInvalidAttemptsDate?: string;
  promoLastAppliedAt?: number;
  lastVerificationEmailSentAt?: number;
  createdAt: number;
  updatedAt: number;
}
