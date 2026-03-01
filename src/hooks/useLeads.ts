'use client';

import { useState, useCallback, useEffect } from 'react';
import { IProfileService } from '@/interfaces/IProfileService';
import { LeadDto, LeadStatus, PaginatedLeadsDto } from '@/dtos/user.dto';
import type { LeadOrder } from '@/domain/interfaces/ILeadRepository';
import { useAuthContext } from '@/context/AuthContext';

export { type LeadOrder };

export function useLeads(profileService: IProfileService) {
	const { token } = useAuthContext();
	const [leads, setLeads] = useState<LeadDto[]>([]);
	const [loading, setLoading] = useState(false);
	const [cursor, setCursor] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(false);
	const [order, setOrder] = useState<LeadOrder>('recent');
	const [statusFilter, setStatusFilter] = useState<LeadStatus | undefined>(undefined);

	const fetchPage = useCallback(
		async (opts: {
			order: LeadOrder;
			status?: LeadStatus;
			cursor?: string;
			replace: boolean;
		}) => {
			if (!token) return;
			setLoading(true);
			try {
				const result: PaginatedLeadsDto = await profileService.getLeadsPaginated(token, {
					order: opts.order,
					status: opts.status,
					cursor: opts.cursor,
					limit: 25,
				});
				setLeads(prev => (opts.replace ? result.leads : [...prev, ...result.leads]));
				setCursor(result.cursor);
				setHasMore(result.hasMore);
			} finally {
				setLoading(false);
			}
		},
		[token, profileService]
	);

	// Reload when filters change
	useEffect(() => {
		fetchPage({ order, status: statusFilter, replace: true });
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [order, statusFilter]);

	const loadMore = useCallback(() => {
		if (!hasMore || loading || !cursor) return;
		fetchPage({ order, status: statusFilter, cursor, replace: false });
	}, [hasMore, loading, cursor, order, statusFilter, fetchPage]);

	const updateLeadStatus = useCallback(
		async (leadId: string, status: LeadStatus | null) => {
			if (!token) return;
			const updated = await profileService.updateLeadStatus(token, leadId, status);
			setLeads(prev => prev.map(l => (l.id === leadId ? updated : l)));
		},
		[token, profileService]
	);

	return {
		leads,
		loading,
		hasMore,
		order,
		setOrder,
		statusFilter,
		setStatusFilter,
		loadMore,
		updateLeadStatus,
	};
}
