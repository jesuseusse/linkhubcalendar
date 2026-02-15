"use client";

import { useState, useCallback, useEffect } from 'react';
import { IProfileService } from '@/interfaces/IProfileService';
import { AppointmentDto } from '@/dtos/user.dto';
import { useAuthContext } from '@/context/AuthContext';

export function useAppointments(profileService: IProfileService) {
	const { token } = useAuthContext();
	const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [total, setTotal] = useState(0);

	const fetchAppointments = useCallback(
		async (p: number) => {
			if (!token) return;
			setLoading(true);
			try {
				const data = await profileService.getAppointments(token, p);
				setAppointments(data.appointments);
				setTotalPages(data.totalPages);
				setTotal(data.total);
				setPage(data.page);
			} catch {
				// silently fail
			} finally {
				setLoading(false);
			}
		},
		[token, profileService]
	);

	const goToPage = useCallback(
		(p: number) => {
			fetchAppointments(p);
		},
		[fetchAppointments]
	);

	const deleteAppointment = useCallback(
		async (appointmentId: string) => {
			if (!token) return;
			await profileService.deleteAppointment(token, appointmentId);
			await fetchAppointments(page);
		},
		[token, profileService, fetchAppointments, page]
	);

	const confirmAppointment = useCallback(
		async (appointmentId: string) => {
			if (!token) return;
			const updated = await profileService.confirmAppointment(
				token,
				appointmentId
			);
			setAppointments(prev =>
				prev.map(a =>
					a.id === appointmentId ? { ...a, status: updated.status } : a
				)
			);
		},
		[token, profileService]
	);

	const releaseAppointmentSlot = useCallback(
		async (appointmentId: string) => {
			if (!token) return;
			await profileService.releaseAppointmentSlot(token, appointmentId);
			await fetchAppointments(page);
		},
		[token, profileService, fetchAppointments, page]
	);

	useEffect(() => {
		fetchAppointments(1);
	}, [fetchAppointments]);

	return {
		appointments,
		loading,
		page,
		totalPages,
		total,
		goToPage,
		deleteAppointment,
		confirmAppointment,
		releaseAppointmentSlot,
		refetch: () => fetchAppointments(page)
	};
}
