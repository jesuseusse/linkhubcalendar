'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
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
import { ContactFormToggle } from '@/components/Profile/ContactFormToggle';
import { AddLinkForm } from '@/components/Links/AddLinkForm';
import { LinkList } from '@/components/Links/LinkList';
import { AddWhatsappModal } from '@/components/Links/AddWhatsappModal';
import { AddInstagramModal } from '@/components/Links/AddInstagramModal';
import { AddTiktokModal } from '@/components/Links/AddTiktokModal';
import { WhatsappIcon, InstagramIcon, TiktokIcon } from '@/components/Common/SocialIcons';
import { ThemeCustomizer } from '@/components/Theme/ThemeCustomizer';
import { CalendarToggle } from '@/components/Calendar/CalendarToggle';
import { ModalCalendarManager } from '@/components/Calendar/ModalCalendarManager';
import { LeadList } from '@/components/Leads/LeadList';
import { RequirePermission } from '@/components/Common/RequirePermission';
import { PERMISSIONS } from '@/permissions/plans';
import { InfoVerifyEmail } from '@/components/Profile/InfoVerifyEmail';
import { StripeResultModal } from '@/components/Common/StripeResultModal';
import { QRDownloadButton } from '@/components/QR/QRDownloadButton';

export default function DashboardPage() {
	const { logout } = useAuth(authService);
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const [calendarModalOpen, setCalendarModalOpen] = useState(false);
	const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
	const [instagramModalOpen, setInstagramModalOpen] = useState(false);
	const [tiktokModalOpen, setTiktokModalOpen] = useState(false);

	const stripeParam = searchParams.get('successStripe');
	const stripeModal =
		stripeParam === 'true'
			? 'success'
			: stripeParam === 'false'
				? 'failure'
				: null;

	function handleCloseStripeModal() {
		const params = new URLSearchParams(searchParams.toString());
		params.delete('successStripe');
		const query = params.toString();
		router.replace(pathname + (query ? `?${query}` : ''));
	}
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
		sendVerificationEmail,
		leads,
		leadsLoading
	} = useProfile(profileService);
	const { addLink, updateLink, deleteLink } = useLinks(linkService);

	const domain = window.location.host.replace(/^www\./, '');
	const url = `${domain}/${profile?.username}`;

	const WHATSAPP_REGEX = /wa\.me|api\.whatsapp\.com|whatsapp\.com/i;
	const hasWhatsapp = profile?.links.some(l => WHATSAPP_REGEX.test(l.url)) ?? false;

	const INSTAGRAM_REGEX = /instagram\.com/i;
	const hasInstagram = profile?.links.some(l => INSTAGRAM_REGEX.test(l.url)) ?? false;

	const TIKTOK_REGEX = /tiktok\.com/i;
	const hasTiktok = profile?.links.some(l => TIKTOK_REGEX.test(l.url)) ?? false;

	if (!fetched || !profile) {
		return (
			<p className='text-center text-muted-foreground py-16 text-sm'>
				Cargando...
			</p>
		);
	}

	return (
		<div className='min-h-screen bg-background'>
			{stripeModal && (
				<StripeResultModal
					success={stripeModal === 'success'}
					onClose={handleCloseStripeModal}
				/>
			)}
			<Header userName={profile.name} isAuthenticated onLogout={logout} />
			<main className='max-w-5xl mx-auto py-8 px-4 space-y-6'>
				{profile.emailVerified === false && (
					<InfoVerifyEmail
						onSendEmail={sendVerificationEmail}
						loading={loading}
					/>
				)}
				{error && (
					<p className='text-sm text-error bg-error-light border border-error/20 p-3'>
						{error}
					</p>
				)}

				<section className='bg-surface border border-border p-6 rounded'>
					<ProfileCard
						name={profile.name}
						description={profile.description}
						email={profile.email}
						profilePhoto={profile.profilePhoto}
						onPhotoUpload={uploadPhoto}
						loading={loading}
					/>
					<EditProfileForm
						name={profile.name}
						description={profile.description}
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
				</section>

				<section className='bg-surface border border-border p-6 rounded'>
					<h2 className='text-sm font-semibold text-foreground mb-4 uppercase tracking-wider'>
						Mis Enlaces
					</h2>
					<LinkList
						links={profile.links}
						onUpdate={updateLink}
						onDelete={deleteLink}
					/>
					<div className='mt-3 flex flex-wrap gap-2'>
						{!hasWhatsapp && (
							<button
								type='button'
								onClick={() => setWhatsappModalOpen(true)}
								className='w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors'
							>
								<WhatsappIcon className='w-4 h-4 fill-[#25D366] shrink-0' />
								Agregar WhatsApp
							</button>
						)}
						{!hasInstagram && (
							<button
								type='button'
								onClick={() => setInstagramModalOpen(true)}
								className='w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors'
							>
								<InstagramIcon className='w-4 h-4 fill-[#E1306C] shrink-0' />
								Agregar Instagram
							</button>
						)}
						{!hasTiktok && (
							<button
								type='button'
								onClick={() => setTiktokModalOpen(true)}
								className='w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors'
							>
								<TiktokIcon className='w-4 h-4 fill-foreground shrink-0' />
								Agregar TikTok
							</button>
						)}
					</div>
					{whatsappModalOpen && (
						<AddWhatsappModal
							onConfirm={async dto => { await addLink(dto); setWhatsappModalOpen(false); }}
							onClose={() => setWhatsappModalOpen(false)}
							loading={loading}
						/>
					)}
					{instagramModalOpen && (
						<AddInstagramModal
							onConfirm={async dto => { await addLink(dto); setInstagramModalOpen(false); }}
							onClose={() => setInstagramModalOpen(false)}
							loading={loading}
						/>
					)}
					{tiktokModalOpen && (
						<AddTiktokModal
							onConfirm={async dto => { await addLink(dto); setTiktokModalOpen(false); }}
							onClose={() => setTiktokModalOpen(false)}
							loading={loading}
						/>
					)}
					<AddLinkForm
						onSubmit={addLink}
						loading={loading}
						existingLinks={profile.links}
					/>
				</section>

				{profile.username && (
					<RequirePermission
						plan={profile.plan}
						permission={PERMISSIONS.THEME_CUSTOMIZE}
					>
						<QRDownloadButton
							theme={profile.theme}
							username={profile.username}
							profileUrl={url}
						/>
					</RequirePermission>
				)}

				<RequirePermission
					plan={profile.plan}
					permission={PERMISSIONS.THEME_CUSTOMIZE}
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
				>
					<section className='bg-surface border border-border p-6 rounded'>
						<h2 className='text-sm font-semibold text-foreground uppercase tracking-wider'>
							Formulario de Contacto
						</h2>
						<span className='text-xs text-muted-foreground'>
							(para que tus clientes dejen sus datos y su interés)
						</span>
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
							<>
								<button
									type='button'
									onClick={() => setCalendarModalOpen(true)}
									className='mt-4 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
								>
									Gestionar horarios
								</button>
								{calendarModalOpen && (
									<ModalCalendarManager
										slots={profile.calendarSlots}
										onAddSlot={addCalendarSlot}
										onDeleteSlot={deleteCalendarSlot}
										onReleaseSlot={releaseCalendarSlot}
										onClose={() => setCalendarModalOpen(false)}
										loading={loading}
									/>
								)}
							</>
						)}
						<Link
							href='/u/admin/dashboard/dates'
							className='inline-block ml-4 mt-4 text-sm text-muted-foreground hover:text-foreground underline'
						>
							Ver Citas
						</Link>
					</section>
				</RequirePermission>

				<RequirePermission
					plan={profile.plan}
					permission={PERMISSIONS.LEADS_VIEW}
				>
					<section className='bg-surface border border-border p-6 rounded'>
						<h2 className='text-sm font-semibold text-foreground mb-4 uppercase tracking-wider'>
							Contactos
						</h2>
						<LeadList leads={leads} loading={leadsLoading} />
					</section>
				</RequirePermission>

				<section className='bg-surface border border-border p-6 rounded'>
					<div className='flex items-center justify-between'>
						<div>
							<h2 className='text-sm font-semibold text-foreground uppercase tracking-wider'>
								Suscripción
							</h2>
							<p className='text-xs text-muted-foreground mt-1'>
								Plan actual:{' '}
								<span className='font-medium capitalize'>
									{profile.plan ?? 'free'}
								</span>
							</p>
						</div>
						<Link
							href='/u/admin/dashboard/billing'
							className='text-sm text-muted-foreground hover:text-foreground underline transition-colors'
						>
							Gestionar suscripción
						</Link>
					</div>
				</section>

				<section className='bg-surface border border-border p-6 rounded'>
					<div className='flex items-center justify-between'>
						<div>
							<h2 className='text-sm font-semibold text-foreground uppercase tracking-wider'>
								SEO
							</h2>
							<p className='text-xs text-muted-foreground mt-1'>
								Título, descripción y metadatos de búsqueda del sitio.
							</p>
						</div>
						<Link
							href='/u/admin/dashboard/seo'
							className='text-sm text-muted-foreground hover:text-foreground underline transition-colors'
						>
							Configurar SEO
						</Link>
					</div>
				</section>
			</main>
		</div>
	);
}
