'use client';

import { useState, useCallback, useEffect } from 'react';
import { ISupportService } from '@/interfaces/ISupportService';
import {
  SupportTicketDto,
  TicketDetailDto,
  TicketCommentDto,
  CreateSupportTicketDto,
  TicketStatus,
  TicketType,
  DeviceType,
} from '@/dtos/user.dto';
import { useAuthContext } from '@/context/AuthContext';

export type { TicketStatus, TicketType, DeviceType };

export function useSupportTickets(supportService: ISupportService) {
  const { token } = useAuthContext();
  const [tickets, setTickets] = useState<SupportTicketDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetailDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await supportService.getTickets(token);
      setTickets(result);
    } finally {
      setLoading(false);
    }
  }, [token, supportService]);

  useEffect(() => {
    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const selectTicket = useCallback(
    async (ticketId: string) => {
      if (!token) return;
      setLoadingDetail(true);
      try {
        const detail = await supportService.getTicketDetail(token, ticketId);
        setSelectedTicket(detail);
      } finally {
        setLoadingDetail(false);
      }
    },
    [token, supportService]
  );

  const clearSelectedTicket = useCallback(() => setSelectedTicket(null), []);

  const createTicket = useCallback(
    async (dto: CreateSupportTicketDto, screenshotFile?: File | null): Promise<SupportTicketDto> => {
      if (!token) throw new Error('No autenticado');
      const formData = new FormData();
      formData.append('type', dto.type);
      formData.append('title', dto.title);
      formData.append('description', dto.description);
      if (dto.deviceType) formData.append('deviceType', dto.deviceType);
      if (dto.deviceOther) formData.append('deviceOther', dto.deviceOther);
      if (dto.whatsappPhone) formData.append('whatsappPhone', dto.whatsappPhone);
      if (screenshotFile) formData.append('screenshot', screenshotFile);

      const created = await supportService.createTicket(token, formData);
      setTickets((prev) => [created, ...prev]);
      return created;
    },
    [token, supportService]
  );

  const updateStatus = useCallback(
    async (ticketId: string, status: TicketStatus): Promise<void> => {
      if (!token) return;
      const updated = await supportService.updateTicketStatus(token, ticketId, status);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      if (selectedTicket?.ticket.id === ticketId) {
        setSelectedTicket((prev) => prev ? { ...prev, ticket: updated } : null);
      }
    },
    [token, supportService, selectedTicket]
  );

  const addComment = useCallback(
    async (ticketId: string, content: string): Promise<TicketCommentDto> => {
      if (!token) throw new Error('No autenticado');
      const comment = await supportService.addComment(token, ticketId, content);
      if (selectedTicket?.ticket.id === ticketId) {
        setSelectedTicket((prev) =>
          prev ? { ...prev, comments: [...prev.comments, comment] } : null
        );
      }
      return comment;
    },
    [token, supportService, selectedTicket]
  );

  /** Returns true if there is already an open ticket of the given type. */
  const hasOpenTicketOfType = useCallback(
    (type: TicketType): boolean => {
      return tickets.some((t) => t.type === type && t.status === 'open');
    },
    [tickets]
  );

  return {
    tickets,
    loading,
    selectedTicket,
    loadingDetail,
    refresh,
    selectTicket,
    clearSelectedTicket,
    createTicket,
    updateStatus,
    addComment,
    hasOpenTicketOfType,
  };
}
