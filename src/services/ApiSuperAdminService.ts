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
}
