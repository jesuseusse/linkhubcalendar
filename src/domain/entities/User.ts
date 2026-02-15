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
  password?: string;
  name: string;
  username?: string;
  usernameChangedAt?: Date;
  profilePhoto?: string;
  plan?: Plan;
  planExpiredAt?: Date | null;
  contactFormEnabled: boolean;
  calendarEnabled: boolean;
  theme?: ThemeConfig;
  links: Link[];
  calendarSlots: CalendarSlot[];
  createdAt: Date;
  updatedAt: Date;
}
