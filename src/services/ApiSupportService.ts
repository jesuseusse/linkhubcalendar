import { apiClient } from './apiClient';
import { ISupportService } from '@/interfaces/ISupportService';
import {
  SupportTicketDto,
  TicketDetailDto,
  TicketCommentDto,
  TicketStatus,
} from '@/dtos/user.dto';

/**
 * Client-side service for support ticket API operations.
 * All methods rely on `apiClient` which automatically attaches the Firebase ID token.
 */
export class ApiSupportService implements ISupportService {
  async getTickets(_token: string): Promise<SupportTicketDto[]> {
    return apiClient('/api/support');
  }

  async createTicket(_token: string, formData: FormData): Promise<SupportTicketDto> {
    return apiClient('/api/support', { method: 'POST', body: formData });
  }

  async getTicketDetail(_token: string, ticketId: string): Promise<TicketDetailDto> {
    return apiClient(`/api/support/${ticketId}`);
  }

  async updateTicketStatus(
    _token: string,
    ticketId: string,
    status: TicketStatus
  ): Promise<SupportTicketDto> {
    return apiClient(`/api/support/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async addComment(
    _token: string,
    ticketId: string,
    content: string
  ): Promise<TicketCommentDto> {
    return apiClient(`/api/support/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }
}
