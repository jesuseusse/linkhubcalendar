'use client';

import { getProfilePhotoUrl } from '@/utils/profilePhoto';
import Image from 'next/image';

interface Props {
	name: string;
	description?: string;
	email: string;
	profilePhoto?: string;
	onPhotoUpload: (file: File) => Promise<void>;
	loading: boolean;
}

export function ProfileCard({
	name,
	description,
	email,
	profilePhoto,
	onPhotoUpload,
	loading
}: Props) {
	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			await onPhotoUpload(file);
		}
	};

	return (
		<div className='flex items-center gap-4'>
			<div className='relative'>
				{profilePhoto ? (
					<Image
						src={getProfilePhotoUrl(profilePhoto)}
						alt={name}
						className='w-16 h-16 object-cover'
						width={64}
						height={64}
					/>
				) : (
					<div className='w-16 h-16 bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold'>
						{name.charAt(0).toUpperCase()}
					</div>
				)}
				<label className='absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 cursor-pointer transition-opacity'>
					<span className='text-primary-foreground text-xs font-medium'>
						{loading ? '...' : 'Cambiar foto'}
					</span>
					<input
						type='file'
						accept='image/jpeg,image/png,image/webp'
						onChange={handleFileChange}
						className='hidden'
						disabled={loading}
					/>
				</label>
			</div>
			<div>
				<p className='text-sm font-semibold text-foreground'>{name}</p>
				<p className='text-xs text-muted-foreground'>{email}</p>
				{description && (
					<p className='text-xs text-muted-foreground mt-1 line-clamp-2'>{description}</p>
				)}
			</div>
		</div>
	);
}
