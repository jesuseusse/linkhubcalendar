'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { ISuperAdminService } from '@/interfaces/ISuperAdminService';
import {
  SuperAdminStatsDto,
  UserSummaryDto,
  SuperAdminTicketDto,
  TicketDetailDto,
  TicketStatus,
  TicketType,
  CampaignDto,
  SendCampaignDto,
  SendCampaignResultDto,
} from '@/dtos/user.dto';
import { useAuthContext } from '@/context/AuthContext';

export function useSuperAdmin(service: ISuperAdminService) {
  const { token } = useAuthContext();

  // Stats
  const [stats, setStats] = useState<SuperAdminStatsDto | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Users
  const [users, setUsers] = useState<UserSummaryDto[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSortBy, setUsersSortBy] = useState<'createdAt' | 'updatedAt'>('createdAt');
  const [usersSortOrder, setUsersSortOrder] = useState<'asc' | 'desc'>('desc');
  const [usersVisibleCount, setUsersVisibleCount] = useState(5);

  // Tickets
  const [tickets, setTickets] = useState<SuperAdminTicketDto[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<TicketType | 'all'>('all');
  const [emailFilter, setEmailFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Ticket detail modal
  const [selectedTicket, setSelectedTicket] = useState<SuperAdminTicketDto | null>(null);
  const [ticketDetail, setTicketDetail] = useState<TicketDetailDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Campaigns list
  const [campaigns, setCampaigns] = useState<CampaignDto[]>([]);
  const [campaignsCursor, setCampaignsCursor] = useState<string | null>(null);
  const [campaignsHasMore, setCampaignsHasMore] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Campaign compose
  const [sendLoading, setSendLoading] = useState(false);
  const [sendResult, setSendResult] = useState<SendCampaignResultDto | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Recipient user picker
  const [recipientUsers, setRecipientUsers] = useState<UserSummaryDto[]>([]);
  const [recipientUsersCursor, setRecipientUsersCursor] = useState<string | null>(null);
  const [recipientUsersHasMore, setRecipientUsersHasMore] = useState(false);
  const [recipientUsersLoading, setRecipientUsersLoading] = useState(false);

  // Access control
  const [forbidden, setForbidden] = useState(false);
  const [checking, setChecking] = useState(true);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error && err.message === 'Forbidden') {
      setForbidden(true);
    }
  }, []);

  const loadStats = useCallback(async () => {
    if (!token) return;
    setStatsLoading(true);
    try {
      const result = await service.getStats(token);
      setStats(result);
    } catch (err) {
      handleError(err);
    } finally {
      setStatsLoading(false);
      setChecking(false);
    }
  }, [token, service, handleError]);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setUsersLoading(true);
    try {
      const result = await service.getUsers(token);
      setUsers(result);
    } catch (err) {
      handleError(err);
    } finally {
      setUsersLoading(false);
    }
  }, [token, service, handleError]);

  const loadTickets = useCallback(async () => {
    if (!token) return;
    setTicketsLoading(true);
    try {
      const result = await service.getTickets(token);
      setTickets(result);
    } catch (err) {
      handleError(err);
    } finally {
      setTicketsLoading(false);
    }
  }, [token, service, handleError]);

  // Load stats on mount (needed by dashboard and implicitly signals super-admin check)
  useEffect(() => {
    if (token) loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aVal = usersSortBy === 'createdAt' ? a.createdAt : a.updatedAt;
      const bVal = usersSortBy === 'createdAt' ? b.createdAt : b.updatedAt;
      return usersSortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [users, usersSortBy, usersSortOrder]);

  const visibleUsers = useMemo(
    () => sortedUsers.slice(0, usersVisibleCount),
    [sortedUsers, usersVisibleCount]
  );

  const hasMoreUsers = usersVisibleCount < sortedUsers.length;

  const toggleUsersSort = useCallback(
    (by: 'createdAt' | 'updatedAt') => {
      setUsersVisibleCount(5);
      if (usersSortBy === by) {
        setUsersSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
      } else {
        setUsersSortBy(by);
        setUsersSortOrder('desc');
      }
    },
    [usersSortBy]
  );

  const loadMoreUsers = useCallback(() => {
    setUsersVisibleCount((prev) => prev + 5);
  }, []);

  const filteredTickets = useMemo(() => {
    let result = tickets;
    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter);
    }
    if (emailFilter.trim()) {
      const q = emailFilter.trim().toLowerCase();
      result = result.filter((t) => t.userEmail.toLowerCase().includes(q));
    }
    return sortOrder === 'desc'
      ? [...result].sort((a, b) => b.createdAt - a.createdAt)
      : [...result].sort((a, b) => a.createdAt - b.createdAt);
  }, [tickets, typeFilter, emailFilter, sortOrder]);

  const toggleSort = useCallback(() => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  }, []);

  const selectTicket = useCallback(
    async (ticket: SuperAdminTicketDto) => {
      if (!token) return;
      setSelectedTicket(ticket);
      setTicketDetail(null);
      setLoadingDetail(true);
      try {
        const detail = await service.getTicketDetail(token, ticket.id, ticket.userId);
        setTicketDetail(detail);
      } catch (err) {
        handleError(err);
      } finally {
        setLoadingDetail(false);
      }
    },
    [token, service, handleError]
  );

  const clearSelectedTicket = useCallback(() => {
    setSelectedTicket(null);
    setTicketDetail(null);
  }, []);

  const updateTicketStatus = useCallback(
    async (status: TicketStatus) => {
      if (!token || !selectedTicket) return;
      const updated = await service.updateTicketStatus(
        token,
        selectedTicket.id,
        selectedTicket.userId,
        status
      );
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: updated.status } : t))
      );
      setSelectedTicket((prev) => (prev ? { ...prev, status: updated.status } : null));
      if (ticketDetail) {
        setTicketDetail((prev) =>
          prev ? { ...prev, ticket: { ...prev.ticket, status: updated.status } } : null
        );
      }
    },
    [token, service, selectedTicket, ticketDetail]
  );

  const addComment = useCallback(
    async (content: string) => {
      if (!token || !selectedTicket) return;
      const comment = await service.addComment(
        token,
        selectedTicket.id,
        selectedTicket.userId,
        content
      );
      setTicketDetail((prev) =>
        prev ? { ...prev, comments: [...prev.comments, comment] } : null
      );
    },
    [token, service, selectedTicket]
  );

  const loadCampaigns = useCallback(async () => {
    if (!token) return;
    setCampaignsLoading(true);
    try {
      const result = await service.getCampaigns(token);
      setCampaigns(result.campaigns);
      setCampaignsCursor(result.cursor);
      setCampaignsHasMore(result.hasMore);
    } catch (err) {
      handleError(err);
    } finally {
      setCampaignsLoading(false);
    }
  }, [token, service, handleError]);

  const loadMoreCampaigns = useCallback(async () => {
    if (!token || !campaignsCursor) return;
    setCampaignsLoading(true);
    try {
      const result = await service.getCampaigns(token, campaignsCursor);
      setCampaigns((prev) => [...prev, ...result.campaigns]);
      setCampaignsCursor(result.cursor);
      setCampaignsHasMore(result.hasMore);
    } catch (err) {
      handleError(err);
    } finally {
      setCampaignsLoading(false);
    }
  }, [token, service, campaignsCursor, handleError]);

  const submitCampaign = useCallback(
    async (data: SendCampaignDto) => {
      if (!token) return;
      setSendLoading(true);
      setSendError(null);
      setSendResult(null);
      try {
        const result = await service.sendCampaign(token, data);
        setSendResult(result);
        setCampaigns((prev) => [result.campaign, ...prev]);
      } catch (err) {
        setSendError(err instanceof Error ? err.message : 'Error al enviar campaña');
      } finally {
        setSendLoading(false);
      }
    },
    [token, service]
  );

  const loadRecipientUsers = useCallback(async () => {
    if (!token) return;
    setRecipientUsersLoading(true);
    try {
      const result = await service.getUsersPaginated(token);
      setRecipientUsers(result.users);
      setRecipientUsersCursor(result.cursor);
      setRecipientUsersHasMore(result.hasMore);
    } catch (err) {
      handleError(err);
    } finally {
      setRecipientUsersLoading(false);
    }
  }, [token, service, handleError]);

  const loadMoreRecipientUsers = useCallback(async () => {
    if (!token || !recipientUsersCursor) return;
    setRecipientUsersLoading(true);
    try {
      const result = await service.getUsersPaginated(token, recipientUsersCursor);
      setRecipientUsers((prev) => [...prev, ...result.users]);
      setRecipientUsersCursor(result.cursor);
      setRecipientUsersHasMore(result.hasMore);
    } catch (err) {
      handleError(err);
    } finally {
      setRecipientUsersLoading(false);
    }
  }, [token, service, recipientUsersCursor, handleError]);

  return {
    stats,
    statsLoading,
    users,
    usersLoading,
    loadUsers,
    visibleUsers,
    totalUsersCount: sortedUsers.length,
    allUserEmails: users.map((u) => u.email),
    usersSortBy,
    usersSortOrder,
    toggleUsersSort,
    hasMoreUsers,
    loadMoreUsers,
    tickets,
    ticketsLoading,
    loadTickets,
    typeFilter,
    setTypeFilter,
    emailFilter,
    setEmailFilter,
    sortOrder,
    toggleSort,
    filteredTickets,
    selectedTicket,
    ticketDetail,
    loadingDetail,
    selectTicket,
    clearSelectedTicket,
    updateTicketStatus,
    addComment,
    campaigns,
    campaignsLoading,
    campaignsHasMore,
    loadCampaigns,
    loadMoreCampaigns,
    sendLoading,
    sendResult,
    sendError,
    submitCampaign,
    recipientUsers,
    recipientUsersHasMore,
    recipientUsersLoading,
    loadRecipientUsers,
    loadMoreRecipientUsers,
    forbidden,
    checking,
  };
}
