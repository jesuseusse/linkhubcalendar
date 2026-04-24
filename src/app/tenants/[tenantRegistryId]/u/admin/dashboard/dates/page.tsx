'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAppointments } from '@/hooks/useAppointments';
import { authService, profileService } from '@/services/serviceFactory';
import { Header } from '@/components/Common/Header';
import { AppointmentList } from '@/components/Appointments/AppointmentList';
import { SlotTakenModal } from '@/components/Appointments/SlotTakenModal';

type Filter = 'upcoming' | 'past';

export default function AppointmentsDashboardPage() {
	const { logout, user } = useAuth(authService);
	const [filter, setFilter] = useState<Filter>('upcoming');
	const {
		appointments,
		loading,
		page,
		totalPages,
		total,
		goToPage,
		cancelAppointment,
		confirmAppointment,
		rescheduleAppointment,
	} = useAppointments(profileService, filter);

	const [showSlotTakenModal, setShowSlotTakenModal] = useState(false);

	const handleReschedule = async (id: string) => {
		const { slotTaken } = await rescheduleAppointment(id);
		if (slotTaken) setShowSlotTakenModal(true);
	};

	const handleFilterChange = (newFilter: Filter) => {
		setFilter(newFilter);
	};

	if (!user) {
		return (
			<p className='text-center text-muted-foreground py-16 text-sm'>
				Cargando...
			</p>
		);
	}

	return (
		<div className='min-h-screen bg-background'>
			<Header userName={user.name} isAuthenticated onLogout={logout} />
			<main className='max-w-5xl mx-auto py-8 px-4'>
				<div className='flex items-center gap-4 mb-6'>
					<Link
						href='/u/admin/dashboard'
						className='text-sm text-muted-foreground hover:text-foreground transition-colors'
					>
						&larr; Dashboard
					</Link>
				</div>
				<section className='bg-surface border border-border p-6 rounded'>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
						<h2 className='text-sm font-semibold text-foreground uppercase tracking-wider'>
							Citas
						</h2>
						<div className='flex gap-2'>
							<button
								onClick={() => handleFilterChange('upcoming')}
								className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
									filter === 'upcoming'
										? 'bg-primary text-primary-foreground'
										: 'bg-muted text-muted-foreground hover:bg-muted/80'
								}`}
							>
								Próximas citas
							</button>
							<button
								onClick={() => handleFilterChange('past')}
								className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
									filter === 'past'
										? 'bg-primary text-primary-foreground'
										: 'bg-muted text-muted-foreground hover:bg-muted/80'
								}`}
							>
								Citas anteriores
							</button>
						</div>
					</div>
					<AppointmentList
						appointments={appointments}
						loading={loading}
						page={page}
						totalPages={totalPages}
						total={total}
						onPageChange={goToPage}
						onCancel={cancelAppointment}
						onConfirm={confirmAppointment}
						onReschedule={handleReschedule}
					/>
				</section>
			</main>
			{showSlotTakenModal && (
				<SlotTakenModal onClose={() => setShowSlotTakenModal(false)} />
			)}
		</div>
	);
}
