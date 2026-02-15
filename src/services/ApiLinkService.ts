import { ILinkService } from '@/interfaces/ILinkService';
import { apiClient } from './apiClient';
import { UserDto } from '@/dtos/user.dto';
import { CreateLinkDto, UpdateLinkDto } from '@/dtos/link.dto';

export class ApiLinkService implements ILinkService {
  async addLink(_token: string, dto: CreateLinkDto): Promise<UserDto> {
    return apiClient('/api/links', { method: 'POST', body: JSON.stringify(dto) });
  }

  async updateLink(_token: string, linkId: string, dto: UpdateLinkDto): Promise<UserDto> {
    return apiClient(`/api/links/${linkId}`, { method: 'PUT', body: JSON.stringify(dto) });
  }

  async deleteLink(_token: string, linkId: string): Promise<UserDto> {
    return apiClient(`/api/links/${linkId}`, { method: 'DELETE' });
  }
}
