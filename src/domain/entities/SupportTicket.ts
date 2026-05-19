/** Type of support ticket submitted by a user. */
export type TicketType = 'error' | 'suggestion';

/** Lifecycle status of a support ticket. */
export type TicketStatus = 'open' | 'closed' | 'solved' | 'cancelled';

/** Device category used to reproduce an error. */
export type DeviceType = 'ios' | 'android' | 'windows' | 'mac' | 'tablet' | 'other';

/** A support ticket submitted by a platform user. */
export interface SupportTicket {
  id: string;
  userId: string;
  type: TicketType;
  status: TicketStatus;
  title: string;
  description: string;
  /** Only present on `error` type tickets. */
  deviceType?: DeviceType;
  /** Free-form text when deviceType is 'other'. */
  deviceOther?: string;
  screenshotUrl?: string;
  whatsappPhone?: string;
  createdAt: number;
  updatedAt: number;
}

/** A comment on a support ticket. Only allowed while the ticket is `open`. */
export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  createdAt: number;
}
