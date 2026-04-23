'use client';

import { getProfilePhotoUrl } from '@/utils/profilePhoto';
import { ImageCropUpload } from '@/components/Common/ImageCropUpload';

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
	return (
		<div className='flex items-start gap-4 mb-4'>
			<div className='w-24 shrink-0'>
				<ImageCropUpload
					initialUrl={profilePhoto ? getProfilePhotoUrl(profilePhoto) : undefined}
					onUpload={onPhotoUpload}
					label='Subir foto'
					loading={loading}
				/>
			</div>
			<div className='pt-1 min-w-0'>
				<p className='text-sm font-semibold text-foreground truncate'>{name}</p>
				<p className='text-xs text-muted-foreground truncate'>{email}</p>
				{description && (
					<p className='text-xs text-muted-foreground mt-1 line-clamp-2'>{description}</p>
				)}
			</div>
		</div>
	);
}
