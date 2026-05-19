import { SupportTicket, TicketComment, TicketStatus, TicketType } from '../entities/SupportTicket';

/** Full ticket data including its comment thread. */
export interface TicketWithComments {
  ticket: SupportTicket;
  comments: TicketComment[];
}

export interface ISupportTicketRepository {
  /**
   * Creates a new support ticket.
   * @param tenantId - Tenant scope.
   * @param ticket - Ticket data without auto-generated fields.
   */
  create(
    tenantId: string,
    ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SupportTicket>;

  /**
   * Returns all tickets for a user, ordered by creation date descending.
   * @param tenantId - Tenant scope.
   * @param userId - User to list tickets for.
   */
  findByUserId(tenantId: string, userId: string): Promise<SupportTicket[]>;

  /**
   * Returns the single open ticket of a given type for a user, or null if none exists.
   * Used to enforce the one-open-ticket-per-type constraint.
   * @param tenantId - Tenant scope.
   * @param userId - User to check.
   * @param type - Ticket type to look up.
   */
  findOpenByType(
    tenantId: string,
    userId: string,
    type: TicketType
  ): Promise<SupportTicket | null>;

  /**
   * Returns a ticket together with its comment subcollection.
   * @param tenantId - Tenant scope.
   * @param userId - Owner of the ticket.
   * @param ticketId - Ticket document ID.
   */
  findByIdWithComments(
    tenantId: string,
    userId: string,
    ticketId: string
  ): Promise<TicketWithComments | null>;

  /**
   * Updates the status of a ticket.
   * @param tenantId - Tenant scope.
   * @param userId - Owner of the ticket.
   * @param ticketId - Ticket document ID.
   * @param status - New status value.
   */
  updateStatus(
    tenantId: string,
    userId: string,
    ticketId: string,
    status: TicketStatus
  ): Promise<SupportTicket>;

  /**
   * Appends a comment to a ticket.
   * @param tenantId - Tenant scope.
   * @param userId - Owner of the ticket.
   * @param ticketId - Target ticket document ID.
   * @param comment - Comment data without auto-generated fields.
   */
  addComment(
    tenantId: string,
    userId: string,
    ticketId: string,
    comment: Omit<TicketComment, 'id' | 'createdAt'>
  ): Promise<TicketComment>;

  /** Returns all tickets across a set of users in a tenant, unordered. */
  findAllByTenant(tenantId: string, userIds: string[]): Promise<SupportTicket[]>;
}
