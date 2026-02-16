'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useLinks } from '@/hooks/useLinks';
import {
	authService,
	profileService,
	linkService
} from '@/services/serviceFactory';
import { Header } from '@/components/Common/Header';
import { ProfileCard } from '@/components/Profile/ProfileCard';
import { EditProfileForm } from '@/components/Profile/EditProfileForm';
import { UsernameForm } from '@/components/Profile/UsernameForm';
import { PublicProfileLink } from '@/components/Profile/PublicProfileLink';
import { ContactFormToggle } from '@/components/Profile/ContactFormToggle';
import { AddLinkForm } from '@/components/Links/AddLinkForm';
import { LinkList } from '@/components/Links/LinkList';
import { ThemeCustomizer } from '@/components/Theme/ThemeCustomizer';
import { CalendarToggle } from '@/components/Calendar/CalendarToggle';
import { CalendarManager } from '@/components/Calendar/CalendarManager';
import { LeadList } from '@/components/Leads/LeadList';
import { RequirePermission } from '@/components/Common/RequirePermission';
import { PERMISSIONS } from '@/permissions/plans';

export default function DashboardPage() {
	const { logout, user } = useAuth(authService);
	const {
		profile,
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
		leadsLoading
	} = useProfile(profileService);
	const { addLink, updateLink, deleteLink } = useLinks(linkService);

	if (!fetched || !profile) {
		return (
			<p className='text-center text-muted-foreground py-16 text-sm'>
				Cargando...
			</p>
		);
	}

	return (
		<div className='min-h-screen bg-background'>
			<Header userName={profile.name} isAuthenticated onLogout={logout} />
			<main className='max-w-5xl mx-auto py-8 px-4 space-y-6'>
				{error && (
					<p className='text-sm text-error bg-error-light border border-error/20 p-3'>
						{error}
					</p>
				)}

				<section className='bg-surface border border-border p-6 rounded'>
					<ProfileCard
						name={profile.name}
						email={profile.email}
						profilePhoto={profile.profilePhoto}
						onPhotoUpload={uploadPhoto}
						loading={loading}
					/>
					<EditProfileForm
						name={profile.name}
						email={profile.email}
						onSubmit={updateProfile}
						loading={loading}
					/>
					<UsernameForm
						username={profile.username}
						usernameChangedAt={profile.usernameChangedAt}
						onSubmit={updateUsername}
						loading={loading}
					/>
					{profile.username && (
						<PublicProfileLink username={profile.username} />
					)}
				</section>

				<section className='bg-surface border border-border p-6 rounded'>
					<h2 className='text-sm font-semibold text-foreground mb-4 uppercase tracking-wider'>
						Mis Enlaces
					</h2>
					<AddLinkForm
						onSubmit={addLink}
						loading={loading}
						existingLinks={profile.links}
					/>
					<LinkList
						links={profile.links}
						onUpdate={updateLink}
						onDelete={deleteLink}
					/>
				</section>

				<RequirePermission
					plan={profile.plan}
					permission={PERMISSIONS.THEME_CUSTOMIZE}
					email={profile.email}
				>
					<section className='bg-surface border border-border p-6 rounded'>
						<h2 className='text-sm font-semibold text-foreground mb-4 uppercase tracking-wider'>
							Tema
						</h2>
						<ThemeCustomizer
							theme={profile.theme}
							onSave={updateTheme}
							loading={loading}
						/>
					</section>
				</RequirePermission>

				<RequirePermission
					plan={profile.plan}
					permission={PERMISSIONS.CONTACT_FORM}
					email={profile.email}
				>
					<section className='bg-surface border border-border p-6 rounded'>
						<h2 className='text-sm font-semibold text-foreground mb-4 uppercase tracking-wider'>
							Formulario de Contacto
						</h2>
						<ContactFormToggle
							enabled={profile.contactFormEnabled}
							onToggle={toggleContactForm}
							loading={loading}
						/>
					</section>
				</RequirePermission>

				<RequirePermission
					plan={profile.plan}
					permission={PERMISSIONS.CALENDAR}
					email={profile.email}
				>
					<section className='bg-surface border border-border p-6 rounded'>
						<h2 className='text-sm font-semibold text-foreground mb-4 uppercase tracking-wider'>
							Calendario
						</h2>
						<CalendarToggle
							enabled={profile.calendarEnabled}
							onToggle={toggleCalendar}
							loading={loading}
						/>
						{profile.calendarEnabled && (
							<CalendarManager
								slots={profile.calendarSlots}
								onAddSlot={addCalendarSlot}
								onDeleteSlot={deleteCalendarSlot}
								onReleaseSlot={releaseCalendarSlot}
								loading={loading}
							/>
						)}
						<Link
							href='/admin/dashboard/dates'
							className='inline-block mt-4 text-sm text-muted-foreground hover:text-foreground underline'
						>
							Ver Citas
						</Link>
					</section>
				</RequirePermission>

				<RequirePermission
					plan={profile.plan}
					permission={PERMISSIONS.LEADS_VIEW}
					email={profile.email}
				>
					<section className='bg-surface border border-border p-6 rounded'>
						<h2 className='text-sm font-semibold text-foreground mb-4 uppercase tracking-wider'>
							Contactos
						</h2>
						<LeadList leads={leads} loading={leadsLoading} />
					</section>
				</RequirePermission>
			</main>
		</div>
	);
}
