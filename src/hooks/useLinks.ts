"use client";

import { useState, useCallback } from 'react';
import { ILinkService } from '@/interfaces/ILinkService';
import { CreateLinkDto, UpdateLinkDto } from '@/dtos/link.dto';
import { useAuthContext } from '@/context/AuthContext';

export function useLinks(linkService: ILinkService) {
	const { token, updateUser } = useAuthContext();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const addLink = useCallback(
		async (dto: CreateLinkDto) => {
			if (!token) return;
			setLoading(true);
			setError(null);
			try {
				const data = await linkService.addLink(token, dto);
				updateUser(data);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Failed to add link';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, linkService, updateUser]
	);

	const updateLink = useCallback(
		async (linkId: string, dto: UpdateLinkDto) => {
			if (!token) return;
			setLoading(true);
			setError(null);
			try {
				const data = await linkService.updateLink(token, linkId, dto);
				updateUser(data);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Failed to update link';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, linkService, updateUser]
	);

	const deleteLink = useCallback(
		async (linkId: string) => {
			if (!token) return;
			setLoading(true);
			setError(null);
			try {
				const data = await linkService.deleteLink(token, linkId);
				updateUser(data);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Failed to delete link';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, linkService, updateUser]
	);

	return { addLink, updateLink, deleteLink, loading, error };
}
