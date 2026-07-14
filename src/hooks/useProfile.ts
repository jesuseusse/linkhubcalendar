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
		async (dto: CreateCalendarSlotDto | CreateCalendarSlotDto[]) => {
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

	const uploadGalleryPhoto = useCallback(
		async (file: File) => {
			if (!token || !user) return;
			setLoading(true);
			setError(null);
			try {
				const photos = await profileService.uploadGalleryPhoto(token, file);
				updateUser({ ...user, galleryPhotos: photos });
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Upload failed';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, user, profileService, updateUser]
	);

	const deleteGalleryPhoto = useCallback(
		async (photoId: string) => {
			if (!token || !user) return;
			setLoading(true);
			setError(null);
			try {
				const photos = await profileService.deleteGalleryPhoto(token, photoId);
				updateUser({ ...user, galleryPhotos: photos });
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Delete failed';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, user, profileService, updateUser]
	);

	const reorderGalleryPhotos = useCallback(
		async (orderedIds: string[]) => {
			if (!token || !user) return;
			setLoading(true);
			setError(null);
			try {
				const photos = await profileService.reorderGalleryPhotos(token, orderedIds);
				updateUser({ ...user, galleryPhotos: photos });
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Reorder failed';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, user, profileService, updateUser]
	);

	const saveWeeklySchedule = useCallback(
		async (schedule: import('@/dtos/user.dto').WeeklySchedule | null) => {
			if (!token) return;
			setLoading(true);
			setError(null);
			try {
				const data = await profileService.saveWeeklySchedule(token, schedule);
				updateUser(data);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Failed to save schedule';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, profileService, updateUser]
	);

	const updateScheduleExceptions = useCallback(
		async (exceptions: import('@/dtos/user.dto').ScheduleException[]) => {
			if (!token) return;
			setLoading(true);
			setError(null);
			try {
				const data = await profileService.updateScheduleExceptions(token, exceptions);
				updateUser(data);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Failed to update exceptions';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, profileService, updateUser]
	);

	const removeScheduleException = useCallback(
		async (date: string) => {
			if (!token) return;
			setLoading(true);
			setError(null);
			try {
				const data = await profileService.removeScheduleException(token, date);
				updateUser(data);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Failed to remove exception';
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, profileService, updateUser]
	);

	const toggleGallery = useCallback(
		async (enabled: boolean) => {
			if (!token) return;
			setLoading(true);
			setError(null);
			try {
				const data = await profileService.toggleGallery(token, enabled);
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
		saveWeeklySchedule,
		updateScheduleExceptions,
		removeScheduleException,
		addCalendarSlot,
		deleteCalendarSlot,
		releaseCalendarSlot,
		leads,
		leadsLoading,
		sendVerificationEmail,
		uploadGalleryPhoto,
		deleteGalleryPhoto,
		reorderGalleryPhotos,
		toggleGallery,
		refetchLeads: fetchLeads,
		refetch: fetchProfile
	};
}
