import {
  SupportTicketDto,
  TicketDetailDto,
  TicketCommentDto,
  CreateSupportTicketDto,
  TicketStatus,
} from '@/dtos/user.dto';

/** Client-side service interface for support ticket operations. */
export interface ISupportService {
  /** Returns all support tickets for the authenticated user. */
  getTickets(token: string): Promise<SupportTicketDto[]>;

  /**
   * Creates a new support ticket.
   * @param token - Firebase ID token.
   * @param formData - FormData containing ticket fields and optional screenshot file.
   */
  createTicket(token: string, formData: FormData): Promise<SupportTicketDto>;

  /** Returns a ticket and its comment thread. */
  getTicketDetail(token: string, ticketId: string): Promise<TicketDetailDto>;

  /**
   * Updates the status of a ticket.
   * @param token - Firebase ID token.
   * @param ticketId - Ticket to update.
   * @param status - New status value.
   */
  updateTicketStatus(token: string, ticketId: string, status: TicketStatus): Promise<SupportTicketDto>;

  /**
   * Adds a comment to a ticket. Only succeeds when the ticket is `open`.
   * @param token - Firebase ID token.
   * @param ticketId - Target ticket.
   * @param content - Comment text.
   */
  addComment(token: string, ticketId: string, content: string): Promise<TicketCommentDto>;
}
