'use client';

import Link from 'next/link';
import { PublicProfileDto } from '@/dtos/user.dto';
import { getPlatformIcon } from '@/utils/platformIcons';
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
		<div
			className='min-h-screen flex flex-col items-center p-4 bg-surface'
			style={theme ? { backgroundColor: theme.backgroundColor } : undefined}
		>
			<div className='w-full max-w-md'>
				<div className='text-center mb-8'>
					{profile.profilePhoto ? (
						<Image
							src={getProfilePhotoUrl(profile.profilePhoto)}
							alt={profile.name}
							className='w-20 h-20 object-cover mx-auto mb-3'
							width={180}
							height={180}
						/>
					) : (
						<div className='w-20 h-20 bg-primary text-primary-foreground flex items-center justify-center text-3xl font-semibold mx-auto mb-3'>
							{profile.name.charAt(0).toUpperCase()}
						</div>
					)}
					<h1
						className='text-lg font-semibold text-foreground'
						style={theme ? { color: theme.textColor } : undefined}
					>
						{profile.name}
					</h1>
					<p
						className='text-xs mt-1 text-muted-foreground'
						style={theme ? { color: `${theme.textColor}80` } : undefined}
					>
						{profile.username}
					</p>
				</div>

				<div className='space-y-3'>
					{profile.links.length > 0 ? (
						profile.links.map(link => {
							const { icon } = getPlatformIcon(link.url);
							return (
								<a
									key={link.id}
									href={link.url}
									target='_blank'
									rel='noopener noreferrer'
									className='flex items-center gap-3 border px-4 py-3 text-sm font-medium transition-colors hover:opacity-80 bg-primary text-primary-foreground border-primary'
									style={
										theme
											? {
													backgroundColor: theme.buttonColor,
													color: theme.buttonTextColor,
													borderColor: theme.buttonColor
												}
											: undefined
									}
								>
									<span className='material-icons text-base' aria-hidden='true'>
										{icon}
									</span>
									{link.title}
								</a>
							);
						})
					) : (
						<p
							className='text-sm text-center text-muted-foreground'
							style={theme ? { color: `${theme.textColor}60` } : undefined}
						>
							No links yet
						</p>
					)}
				</div>

				{showContact && (
					<ContactForm username={profile.username} theme={theme} />
				)}

				{showCalendar && (
					<Link
						href={`/${profile.username}/calendar`}
						className='inline-block mt-6 text-sm font-medium underline text-muted-foreground'
						style={theme ? { color: theme.accentColor } : undefined}
					>
						Ver calendario
					</Link>
				)}

				<p
					className='mt-12 text-xs text-foreground/25'
					style={theme ? { color: `${theme.textColor}40` } : undefined}
				>
					Powered by Link Hub
				</p>
			</div>
		</div>
	);
}
