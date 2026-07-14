'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { authService, profileService } from '@/services/serviceFactory';
import { Header } from '@/components/Common/Header';
import { ScheduleStepper } from '@/components/Calendar/Schedule/ScheduleStepper';
import { ScheduleCalendar } from '@/components/Calendar/ScheduleCalendar';
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

	if (!user || !profile) {
		return (
			<p className='text-center text-muted-foreground py-16 text-sm'>Cargando...</p>
		);
	}

	const handleSaveSchedule = async (schedule: WeeklySchedule) => {
		await saveWeeklySchedule(schedule);
	};

	const handleDeleteSchedule = async () => {
		if (!confirm('¿Eliminar todos los horarios? Esta acción no se puede deshacer.')) return;
		clearDraft();
		await saveWeeklySchedule(null);
	};

	const handleUpdateExceptions = async (exceptions: ScheduleException[]) => {
		await updateScheduleExceptions(exceptions);
	};

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
					{profile.weeklySchedule ? (
						<div className='space-y-6'>
							<ScheduleCalendar
								weeklySchedule={profile.weeklySchedule}
								exceptions={profile.scheduleExceptions ?? []}
								onUpdateExceptions={handleUpdateExceptions}
							/>
							<div className='border-t border-border pt-4 flex flex-col sm:flex-row gap-3'>
								<button
									type='button'
									onClick={handleDeleteSchedule}
									disabled={loading}
									className='px-4 py-2 text-sm border border-error text-error hover:bg-error-light disabled:opacity-50 transition-colors'
								>
									Eliminar todos los horarios
								</button>
								<button
									type='button'
									onClick={() => {
										clearDraft();
										window.location.href = '?step=1';
									}}
									disabled={loading}
									className='px-4 py-2 text-sm border border-border text-foreground hover:border-foreground disabled:opacity-50 transition-colors'
								>
									Reconfigurar horarios
								</button>
							</div>
						</div>
					) : (
						<ScheduleStepper onSave={handleSaveSchedule} />
					)}
				</div>
			</main>
		</div>
	);
}
