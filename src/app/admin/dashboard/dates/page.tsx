'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAppointments } from '@/hooks/useAppointments';
import { authService, profileService } from '@/services/serviceFactory';
import { Header } from '@/components/Common/Header';
import { AppointmentList } from '@/components/Appointments/AppointmentList';

export default function AppointmentsDashboardPage() {
	const { logout, user } = useAuth(authService);
	const {
		appointments,
		loading,
		page,
		totalPages,
		total,
		goToPage,
		deleteAppointment,
		confirmAppointment,
		releaseAppointmentSlot
	} = useAppointments(profileService);

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
						href='/admin/dashboard'
						className='text-sm text-muted-foreground hover:text-foreground transition-colors'
					>
						&larr; Dashboard
					</Link>
				</div>
				<section className='bg-surface border border-border p-6 rounded'>
					<h2 className='text-sm font-semibold text-foreground mb-4 uppercase tracking-wider'>
						Citas
					</h2>
					<AppointmentList
						appointments={appointments}
						loading={loading}
						page={page}
						totalPages={totalPages}
						total={total}
						onPageChange={goToPage}
						onDelete={deleteAppointment}
						onConfirm={confirmAppointment}
						onReleaseSlot={releaseAppointmentSlot}
					/>
				</section>
			</main>
		</div>
	);
}
