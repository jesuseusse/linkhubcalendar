'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { PublicProfileDto } from '@/dtos/user.dto';
import { getPlatformIcon } from '@/utils/platformIcons';
import { getSocialIcon } from '@/components/Common/SocialIcons';
import { getProfilePhotoUrl } from '@/utils/profilePhoto';
import { ContactForm } from '@/components/Contact/ContactForm';
import { isPlanExpired } from '@/utils/planExpiration';
import { hasPermission, PERMISSIONS, type Plan } from '@/permissions/plans';
import Image from 'next/image';

interface Props {
	profile: PublicProfileDto;
}

export function PublicProfileClient({ profile }: Props) {
	const plan = (profile.plan || 'free') as Plan;
	const expired = isPlanExpired(profile.planExpiredAt);
	const effectivePlan: Plan = expired ? 'free' : plan;

	const [photoOpen, setPhotoOpen] = useState(false);

	useEffect(() => {
		if (!photoOpen) return;
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPhotoOpen(false); };
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [photoOpen]);

	const theme = hasPermission(effectivePlan, PERMISSIONS.THEME_CUSTOMIZE)
		? profile.theme
		: undefined;
	const showContact =
		profile.contactFormEnabled &&
		hasPermission(effectivePlan, PERMISSIONS.CONTACT_FORM);
	const showCalendar =
		profile.calendarEnabled &&
		hasPermission(effectivePlan, PERMISSIONS.CALENDAR);

	return (
		<>
			<style>{`
				@keyframes scaleIn {
					from { opacity: 0; transform: scale(0.8); }
					to   { opacity: 1; transform: scale(1); }
				}
				@keyframes fadeInUp {
					from { opacity: 0; transform: translateY(20px); }
					to   { opacity: 1; transform: translateY(0); }
				}
				@keyframes overlayIn {
					from { opacity: 0; }
					to   { opacity: 1; }
				}
				@keyframes photoIn {
					from { opacity: 0; transform: scale(0.88); }
					to   { opacity: 1; transform: scale(1); }
				}
				.anim-avatar {
					animation: scaleIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
				}
				.anim-name {
					animation: fadeInUp 0.45s ease both;
					animation-delay: 0.15s;
				}
				.anim-link {
					animation: fadeInUp 0.4s ease both;
					opacity: 0;
				}
				.anim-overlay {
					animation: overlayIn 0.2s ease both;
				}
				.anim-photo {
					animation: photoIn 0.25s cubic-bezier(0.34, 1.2, 0.64, 1) both;
				}
			`}</style>

			<div
				className='min-h-screen flex flex-col items-center justify-start py-16 px-5 bg-background'
				style={theme ? { backgroundColor: theme.backgroundColor } : undefined}
			>
				<div className='w-full max-w-sm flex flex-col items-center'>

					{/* Avatar */}
					<div className='anim-avatar mb-5'>
						{profile.profilePhoto ? (
							<button
								type='button'
								onClick={() => setPhotoOpen(true)}
								className='rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-zoom-in'
								aria-label='Ver foto de perfil'
							>
								<Image
									src={getProfilePhotoUrl(profile.profilePhoto)}
									alt={profile.name}
									className='w-28 h-28 rounded-full object-cover shadow-2xl ring-4 ring-primary/15'
									width={112}
									height={112}
								/>
							</button>
						) : (
							<div
								className='w-28 h-28 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-4xl font-bold shadow-2xl ring-4 ring-primary/15'
								style={
									theme
										? {
												backgroundColor: theme.buttonColor,
												color: theme.buttonTextColor,
											}
										: undefined
								}
							>
								{profile.name.charAt(0).toUpperCase()}
							</div>
						)}
					</div>

					{/* Name & handle */}
					<div className='anim-name text-center mb-8'>
						<h1
							className='text-2xl font-bold tracking-tight text-foreground'
							style={theme ? { color: theme.textColor } : undefined}
						>
							{profile.name}
						</h1>
						<p
							className='text-sm mt-1 text-muted-foreground'
							style={theme ? { color: `${theme.textColor}70` } : undefined}
						>
							@{profile.username}
						</p>
						{profile.description && (
							<p
								className='text-sm mt-3 text-muted-foreground leading-relaxed max-w-xs mx-auto'
								style={theme ? { color: `${theme.textColor}90` } : undefined}
							>
								{profile.description}
							</p>
						)}
					</div>

					{/* Links */}
					<div className='w-full space-y-3'>
						{profile.links.length > 0 ? (
							profile.links.map((link, index) => {
								const { icon } = getPlatformIcon(link.url);
								const socialIcon = getSocialIcon(link.url);
								return (
									<a
										key={link.id}
										href={link.url}
										target='_blank'
										rel='noopener noreferrer'
										className='anim-link relative flex items-center gap-3 w-full px-5 py-4 rounded-2xl text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 bg-primary text-primary-foreground'
										style={{
											animationDelay: `${0.25 + index * 0.08}s`,
											...(theme
												? {
														backgroundColor: theme.buttonColor,
														color: theme.buttonTextColor,
													}
												: undefined),
										}}
									>
										{socialIcon ? (
											<socialIcon.Icon className='w-[18px] h-[18px] shrink-0' style={{ fill: 'currentColor' }} />
										) : (
											<span className='material-icons text-[18px]' aria-hidden='true'>
												{icon}
											</span>
										)}
										<span className='flex-1 text-center pr-4.5'>{link.title}</span>
									</a>
								);
							})
						) : (
							<p
								className='text-sm text-center text-muted-foreground'
								style={theme ? { color: `${theme.textColor}60` } : undefined}
							>
								Sin enlaces aún
							</p>
						)}

						{/* Calendar CTA */}
						{showCalendar && (
							<Link
								href={`/${profile.username}/calendar`}
								className='anim-link flex items-center justify-center gap-2 w-full px-5 py-4 rounded-2xl text-sm font-semibold border-2 border-primary text-primary bg-transparent hover:bg-primary/5 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200'
								style={{
									animationDelay: `${0.25 + profile.links.length * 0.08}s`,
									...(theme
										? {
												borderColor: theme.accentColor,
												color: theme.accentColor,
											}
										: undefined),
								}}
							>
								<span className='material-icons text-[18px]' aria-hidden='true'>
									calendar_month
								</span>
								Ver calendario
							</Link>
						)}
					</div>

					{/* Contact Form */}
					{showContact && (
						<div
							className='anim-link w-full mt-6'
							style={{
								animationDelay: `${0.25 + (profile.links.length + (showCalendar ? 1 : 0)) * 0.08}s`,
							}}
						>
							<ContactForm username={profile.username} theme={theme} />
						</div>
					)}

					{/* Footer */}
					<p
						className='mt-14 text-xs text-foreground/25'
						style={theme ? { color: `${theme.textColor}35` } : undefined}
					>
						Powered by Link Hub
					</p>
				</div>
			</div>
			{/* Photo lightbox */}
			{photoOpen && profile.profilePhoto && (
				<div
					className='anim-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4'
					onClick={() => setPhotoOpen(false)}
					role='dialog'
					aria-modal='true'
					aria-label='Foto de perfil'
				>
					<Image
						src={getProfilePhotoUrl(profile.profilePhoto)}
						alt={profile.name}
						className='anim-photo rounded-2xl object-cover shadow-2xl w-full'
						style={{ maxWidth: 680 }}
						width={680}
						height={680}
						onClick={e => e.stopPropagation()}
					/>
					<button
						type='button'
						onClick={() => setPhotoOpen(false)}
						className='absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors'
						aria-label='Cerrar'
					>
						<span className='material-icons text-xl'>close</span>
					</button>
				</div>
			)}
		</>
	);
}
