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
  contactFormEnabled: boolean;
  calendarEnabled: boolean;
  theme?: ThemeConfig;
  links: Link[];
  calendarSlots: CalendarSlot[];
  lastVerificationEmailSentAt?: number;
  createdAt: number;
  updatedAt: number;
}
