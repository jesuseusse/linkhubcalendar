import {
  SuperAdminStatsDto,
  UserSummaryDto,
  SuperAdminTicketDto,
  TicketDetailDto,
  SupportTicketDto,
  TicketCommentDto,
  TicketStatus,
} from '@/dtos/user.dto';

export interface ISuperAdminService {
  getStats(token: string): Promise<SuperAdminStatsDto>;
  getUsers(token: string): Promise<UserSummaryDto[]>;
  getTickets(token: string): Promise<SuperAdminTicketDto[]>;
  getTicketDetail(token: string, ticketId: string, userId: string): Promise<TicketDetailDto>;
  updateTicketStatus(token: string, ticketId: string, userId: string, status: TicketStatus): Promise<SupportTicketDto>;
  addComment(token: string, ticketId: string, userId: string, content: string): Promise<TicketCommentDto>;
}
