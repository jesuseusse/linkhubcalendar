import { IProfileService } from '@/interfaces/IProfileService';
import { apiClient } from './apiClient';
import {
  UserDto,
  UpdateProfileDto,
  UpdateUsernameDto,
  ThemeDto,
  CreateCalendarSlotDto,
  PublicProfileDto,
  PublicCalendarDto,
  AppointmentDto,
  CreateAppointmentDto,
  PaginatedAppointmentsDto,
  LeadDto,
  LeadStatus,
  CreateLeadDto,
  PaginatedLeadsDto,
} from '@/dtos/user.dto';
import type { GetLeadsPaginatedParams } from '@/interfaces/IProfileService';

export class ApiProfileService implements IProfileService {
  async getProfile(): Promise<UserDto> {
    return apiClient('/api/profile');
  }

  async updateProfile(_token: string, dto: UpdateProfileDto): Promise<UserDto> {
    return apiClient('/api/profile', { method: 'PUT', body: JSON.stringify(dto) });
  }

  async uploadPhoto(_token: string, file: File): Promise<UserDto> {
    const formData = new FormData();
    formData.append('photo', file);
    return apiClient('/api/profile/photo', { method: 'POST', body: formData });
  }

  async updateUsername(_token: string, dto: UpdateUsernameDto): Promise<UserDto> {
    return apiClient('/api/profile/username', { method: 'PUT', body: JSON.stringify(dto) });
  }

  async toggleContactForm(_token: string, enabled: boolean): Promise<UserDto> {
    return apiClient('/api/profile/contact-form', { method: 'PUT', body: JSON.stringify({ enabled }) });
  }

  async updateTheme(_token: string, theme: ThemeDto): Promise<UserDto> {
    return apiClient('/api/profile/theme', { method: 'PUT', body: JSON.stringify(theme) });
  }

  async toggleCalendar(_token: string, enabled: boolean): Promise<UserDto> {
    return apiClient('/api/calendar/toggle', { method: 'PUT', body: JSON.stringify({ enabled }) });
  }

  async addCalendarSlot(_token: string, dto: CreateCalendarSlotDto | CreateCalendarSlotDto[]): Promise<UserDto> {
    const body = Array.isArray(dto) ? dto : [dto];
    return apiClient('/api/calendar/slots', { method: 'POST', body: JSON.stringify(body) });
  }

  async deleteCalendarSlot(_token: string, slotId: string): Promise<UserDto> {
    return apiClient(`/api/calendar/slots/${slotId}`, { method: 'DELETE' });
  }

  async releaseCalendarSlot(_token: string, slotId: string): Promise<UserDto> {
    return apiClient(`/api/calendar/slots/${slotId}/release`, { method: 'PUT' });
  }

  async getPublicProfile(username: string): Promise<PublicProfileDto> {
    return apiClient(`/api/u/${username}`);
  }

  async getPublicCalendar(username: string): Promise<PublicCalendarDto> {
    return apiClient(`/api/u/${username}/calendar`);
  }

  async bookAppointment(username: string, dto: CreateAppointmentDto): Promise<AppointmentDto> {
    return apiClient(`/api/u/${username}/appointments`, { method: 'POST', body: JSON.stringify(dto) });
  }

  async getAppointments(_token: string, page: number): Promise<PaginatedAppointmentsDto> {
    return apiClient(`/api/appointments?page=${page}`);
  }

  async cancelAppointment(_token: string, appointmentId: string): Promise<AppointmentDto> {
    return apiClient(`/api/appointments/${appointmentId}/cancel`, { method: 'PUT' });
  }

  async confirmAppointment(_token: string, appointmentId: string): Promise<AppointmentDto> {
    return apiClient(`/api/appointments/${appointmentId}/confirm`, { method: 'PUT' });
  }

  async rescheduleAppointment(_token: string, appointmentId: string): Promise<AppointmentDto> {
    return apiClient(`/api/appointments/${appointmentId}/reschedule`, { method: 'PUT' });
  }

  async submitLead(username: string, dto: CreateLeadDto): Promise<LeadDto> {
    return apiClient(`/api/u/${username}/contact`, { method: 'POST', body: JSON.stringify(dto) });
  }

  async getLeads(): Promise<LeadDto[]> {
    return apiClient('/api/leads');
  }

  async getLeadsPaginated(_token: string, params: GetLeadsPaginatedParams): Promise<PaginatedLeadsDto> {
    const qs = new URLSearchParams();
    qs.set('order', params.order);
    if (params.status) qs.set('status', params.status);
    if (params.cursor) qs.set('cursor', params.cursor);
    qs.set('limit', String(params.limit ?? 25));
    return apiClient(`/api/leads?${qs.toString()}`);
  }

  async updateLeadStatus(_token: string, leadId: string, status: LeadStatus | null): Promise<LeadDto> {
    return apiClient(`/api/leads/${leadId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  }

  async downgradePlan(): Promise<UserDto> {
    return apiClient('/api/profile', { method: 'PUT', body: JSON.stringify({ plan: 'free' }) });
  }

  async sendVerificationEmail(): Promise<void> {
    return apiClient('/api/auth/verify-email', { method: 'POST' });
  }
}
