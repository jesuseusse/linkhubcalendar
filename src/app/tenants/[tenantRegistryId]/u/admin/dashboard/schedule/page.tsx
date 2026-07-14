'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { authService, profileService } from '@/services/serviceFactory';
import { Header } from '@/components/Common/Header';
import { ScheduleStepper } from '@/components/Calendar/Schedule/ScheduleStepper';
import { ScheduleCalendar } from '@/components/Calendar/ScheduleCalendar';
import { ConfirmModal } from '@/components/Common/ConfirmModal';
import { WeeklySchedule, ScheduleException } from '@/domain/entities/User';
import { clearDraft } from '@/components/Calendar/Schedule/scheduleTypes';

export default function SchedulePage() {
	const { logout, user } = useAuth(authService);
	const {
		profile,
		loading,
		saveWeeklySchedule,
		updateScheduleExceptions,
	} = useProfile(profileService);

	const [reconfiguring, setReconfiguring] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

	if (!user || !profile) {
		return (
			<p className='text-center text-muted-foreground py-16 text-sm'>Cargando...</p>
		);
	}

	const handleSaveSchedule = async (schedule: WeeklySchedule) => {
		await saveWeeklySchedule(schedule);
		setReconfiguring(false);
	};

	const handleDeleteConfirmed = async () => {
		clearDraft();
		await saveWeeklySchedule(null);
		await updateScheduleExceptions([]);
		setConfirmDeleteOpen(false);
		setReconfiguring(false);
	};

	const handleReconfigure = () => {
		clearDraft();
		setReconfiguring(true);
	};

	const handleUpdateExceptions = async (exceptions: ScheduleException[]) => {
		await updateScheduleExceptions(exceptions);
	};

	const showStepper = reconfiguring || !profile.weeklySchedule;

	return (
		<div className='min-h-screen bg-background'>
			<Header userName={user.name} isAuthenticated onLogout={logout} />
			<main className='max-w-2xl mx-auto py-8 px-4'>
				<div className='flex items-center gap-4 mb-6'>
					<Link
						href='../dashboard'
						className='text-sm text-muted-foreground hover:text-foreground transition-colors'
					>
						← Dashboard
					</Link>
				</div>

				<div className='mb-6'>
					<h1 className='text-lg font-semibold text-foreground'>Gestión de horarios</h1>
					<p className='text-sm text-muted-foreground mt-1'>
						Define tu disponibilidad semanal y desactiva días o slots específicos.
					</p>
				</div>

				<div className='bg-surface border border-border p-6'>
					{showStepper ? (
						<div className='space-y-4'>
							{reconfiguring && (
								<div className='flex items-center justify-between pb-3 border-b border-border'>
									<p className='text-xs text-muted-foreground'>Reconfigurando horario actual</p>
									<button
										type='button'
										onClick={() => setReconfiguring(false)}
										className='text-xs text-muted-foreground hover:text-foreground transition-colors underline'
									>
										Cancelar
									</button>
								</div>
							)}
							<ScheduleStepper onSave={handleSaveSchedule} />
						</div>
					) : (
						<div className='space-y-6'>
							<ScheduleCalendar
								weeklySchedule={profile.weeklySchedule!}
								exceptions={profile.scheduleExceptions ?? []}
								onUpdateExceptions={handleUpdateExceptions}
							/>
							<div className='border-t border-border pt-4 flex flex-col sm:flex-row gap-3'>
								<button
									type='button'
									onClick={() => setConfirmDeleteOpen(true)}
									disabled={loading}
									className='px-4 py-2 text-sm border border-error text-error hover:bg-error-light disabled:opacity-50 transition-colors'
								>
									Eliminar todos los horarios
								</button>
								<button
									type='button'
									onClick={handleReconfigure}
									disabled={loading}
									className='px-4 py-2 text-sm border border-border text-foreground hover:border-foreground disabled:opacity-50 transition-colors'
								>
									Reconfigurar horarios
								</button>
							</div>
						</div>
					)}
				</div>
			</main>

			{confirmDeleteOpen && (
				<ConfirmModal
					title='Eliminar todos los horarios'
					message='Se eliminarán tu horario semanal y todos los días desactivados. Esta acción no se puede deshacer.'
					confirmLabel='Eliminar'
					variant='danger'
					loading={loading}
					onConfirm={handleDeleteConfirmed}
					onCancel={() => setConfirmDeleteOpen(false)}
				/>
			)}
		</div>
	);
}
