import {
  SuperAdminStatsDto,
  UserSummaryDto,
  SuperAdminTicketDto,
  TicketDetailDto,
  SupportTicketDto,
  TicketCommentDto,
  TicketStatus,
  CampaignDto,
  PaginatedCampaignsDto,
  SendCampaignDto,
  SendCampaignResultDto,
  PaginatedUsersDto,
} from '@/dtos/user.dto';

export interface ISuperAdminService {
  getStats(token: string): Promise<SuperAdminStatsDto>;
  getUsers(token: string): Promise<UserSummaryDto[]>;
  getTickets(token: string): Promise<SuperAdminTicketDto[]>;
  getTicketDetail(token: string, ticketId: string, userId: string): Promise<TicketDetailDto>;
  updateTicketStatus(token: string, ticketId: string, userId: string, status: TicketStatus): Promise<SupportTicketDto>;
  addComment(token: string, ticketId: string, userId: string, content: string): Promise<TicketCommentDto>;
  getCampaigns(token: string, cursor?: string): Promise<PaginatedCampaignsDto>;
  getCampaignDetail(token: string, campaignId: string): Promise<CampaignDto>;
  sendCampaign(token: string, data: SendCampaignDto): Promise<SendCampaignResultDto>;
  getUsersPaginated(token: string, cursor?: string): Promise<PaginatedUsersDto>;
}
