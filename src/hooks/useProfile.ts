'use client';

import { useState, useCallback, useEffect } from 'react';
import { IProfileService } from '@/interfaces/IProfileService';
import {
	CreateCalendarSlotDto,
	LeadDto,
	ThemeDto,
	UpdateProfileDto
} from '@/dtos/user.dto';
import { useAuthContext } from '@/context/AuthContext';

export function useProfile(profileService: IProfileService) {
	const { token, user, updateUser } = useAuthContext();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fetched, setFetched] = useState(false);
	const [leads, setLeads] = useState<LeadDto[]>([]);
	const [leadsLoading, setLeadsLoading] = useState(false);

	const fetchProfile = useCallback(async () => {
		if (!token) return;
		setLoading(true);
		setError(null);
		try {
			const data = await profileService.getProfile(token);
			updateUser(data);
			setFetched(true);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to load profile');
		} finally {
			setLoading(false);
		}
	}, [token, profileService, updateUser]);

	const updateProfile = useCallback(
		async (dto: UpdateProfileDto) => {
			if (!token) return;
			setLoading(true);
			setError(null);
			try {
				const data = await profileService.updateProfile(token, dto);
				updateUser(data);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Update failed';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, profileService, updateUser]
	);

	const uploadPhoto = useCallback(
		async (file: File) => {
			if (!token) return;
			setLoading(true);
			setError(null);
			try {
				const data = await profileService.uploadPhoto(token, file);
				updateUser(data);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Upload failed';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, profileService, updateUser]
	);

	const updateUsername = useCallback(
		async (username: string) => {
			if (!token) return;
			setLoading(true);
			setError(null);
			try {
				const data = await profileService.updateUsername(token, { username });
				updateUser(data);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Update failed';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, profileService, updateUser]
	);

	const updateTheme = useCallback(
		async (theme: ThemeDto) => {
			if (!token) return;
			setLoading(true);
			setError(null);
			try {
				const data = await profileService.updateTheme(token, theme);
				updateUser(data);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Update failed';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, profileService, updateUser]
	);

	const toggleContactForm = useCallback(
		async (enabled: boolean) => {
			if (!token) return;
			setLoading(true);
			setError(null);
			try {
				const data = await profileService.toggleContactForm(token, enabled);
				updateUser(data);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Update failed';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, profileService, updateUser]
	);

	const toggleCalendar = useCallback(
		async (enabled: boolean) => {
			if (!token) return;
			setLoading(true);
			setError(null);
			try {
				const data = await profileService.toggleCalendar(token, enabled);
				updateUser(data);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Update failed';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, profileService, updateUser]
	);

	const addCalendarSlot = useCallback(
		async (dto: CreateCalendarSlotDto) => {
			if (!token) return;
			setLoading(true);
			setError(null);
			try {
				const data = await profileService.addCalendarSlot(token, dto);
				updateUser(data);
			} catch (err: unknown) {
				const message =
					err instanceof Error ? err.message : 'Failed to add slot';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, profileService, updateUser]
	);

	const deleteCalendarSlot = useCallback(
		async (slotId: string) => {
			if (!token) return;
			setLoading(true);
			setError(null);
			try {
				const data = await profileService.deleteCalendarSlot(token, slotId);
				updateUser(data);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Delete failed';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, profileService, updateUser]
	);

	const releaseCalendarSlot = useCallback(
		async (slotId: string) => {
			if (!token) return;
			setLoading(true);
			setError(null);
			try {
				const data = await profileService.releaseCalendarSlot(token, slotId);
				updateUser(data);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Release failed';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, profileService, updateUser]
	);

	const sendVerificationEmail = useCallback(async () => {
		if (!token) return;
		await profileService.sendVerificationEmail(token);
	}, [token, profileService]);

	const fetchLeads = useCallback(async () => {
		if (!token) return;
		setLeadsLoading(true);
		try {
			const data = await profileService.getLeads(token);
			setLeads(data);
		} catch {
			// silently fail
		} finally {
			setLeadsLoading(false);
		}
	}, [token, profileService]);

	useEffect(() => {
		fetchProfile();
		fetchLeads();
	}, [fetchProfile, fetchLeads]);

	return {
		profile: user,
		loading,
		error,
		fetched,
		updateProfile,
		uploadPhoto,
		updateUsername,
		updateTheme,
		toggleContactForm,
		toggleCalendar,
		addCalendarSlot,
		deleteCalendarSlot,
		releaseCalendarSlot,
		leads,
		leadsLoading,
		sendVerificationEmail,
		refetchLeads: fetchLeads,
		refetch: fetchProfile
	};
}
