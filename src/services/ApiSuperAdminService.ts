import { apiClient } from './apiClient';
import { ISuperAdminService } from '@/interfaces/ISuperAdminService';
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

export class ApiSuperAdminService implements ISuperAdminService {
  async getStats(_token: string): Promise<SuperAdminStatsDto> {
    return apiClient('/api/super-admin/stats');
  }

  async getUsers(_token: string): Promise<UserSummaryDto[]> {
    return apiClient('/api/super-admin/users');
  }

  async getTickets(_token: string): Promise<SuperAdminTicketDto[]> {
    return apiClient('/api/super-admin/tickets');
  }

  async getTicketDetail(
    _token: string,
    ticketId: string,
    userId: string
  ): Promise<TicketDetailDto> {
    return apiClient(`/api/super-admin/tickets/${ticketId}?userId=${encodeURIComponent(userId)}`);
  }

  async updateTicketStatus(
    _token: string,
    ticketId: string,
    userId: string,
    status: TicketStatus
  ): Promise<SupportTicketDto> {
    return apiClient(`/api/super-admin/tickets/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify({ userId, status }),
    });
  }

  async addComment(
    _token: string,
    ticketId: string,
    userId: string,
    content: string
  ): Promise<TicketCommentDto> {
    return apiClient(`/api/super-admin/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ userId, content }),
    });
  }

  async getCampaigns(_token: string, cursor?: string): Promise<PaginatedCampaignsDto> {
    const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    return apiClient(`/api/super-admin/campaigns${params}`);
  }

  async getCampaignDetail(_token: string, campaignId: string): Promise<CampaignDto> {
    return apiClient(`/api/super-admin/campaigns/${encodeURIComponent(campaignId)}`);
  }

  async sendCampaign(_token: string, data: SendCampaignDto): Promise<SendCampaignResultDto> {
    return apiClient('/api/super-admin/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUsersPaginated(_token: string, cursor?: string, plan?: string): Promise<PaginatedUsersDto> {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', '100');
    if (plan) params.set('plan', plan);
    const qs = params.toString();
    return apiClient(`/api/super-admin/users/paginated${qs ? `?${qs}` : ''}`);
  }
}
