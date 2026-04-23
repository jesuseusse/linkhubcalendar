'use client';

import { useState } from 'react';
import { LinkDto, UpdateLinkDto } from '@/dtos/link.dto';
import { getPlatformIcon } from '@/utils/platformIcons';
import { getSocialIcon } from '@/components/Common/SocialIcons';

interface Props {
	link: LinkDto;
	existingLinks: LinkDto[];
	onUpdate: (linkId: string, dto: UpdateLinkDto) => Promise<void>;
	onDelete: (linkId: string) => Promise<void>;
}

export function LinkItem({ link, existingLinks, onUpdate, onDelete }: Props) {
	const [editing, setEditing] = useState(false);
	const [title, setTitle] = useState(link.title);
	const [url, setUrl] = useState(link.url);
	const [error, setError] = useState<string | null>(null);
	const { icon } = getPlatformIcon(link.url);
	const socialIcon = getSocialIcon(link.url);

	const handleSave = async () => {
		setError(null);
		const others = existingLinks.filter(l => l.id !== link.id);
		if (others.some(l => l.title.toLowerCase() === title.toLowerCase())) {
			setError('Ya existe un enlace con este nombre');
			return;
		}
		if (others.some(l => l.url.toLowerCase() === url.toLowerCase())) {
			setError('Ya existe un enlace con esta URL');
			return;
		}
		try {
			await onUpdate(link.id, { title, url });
			setEditing(false);
		} catch (err: unknown) {
			setError(
				err instanceof Error ? err.message : 'Error al actualizar el enlace'
			);
		}
	};

	if (editing) {
		return (
			<div className='border border-border p-3 space-y-2'>
				{error && <p className='text-xs text-error'>{error}</p>}
				<input
					type='text'
					value={title}
					onChange={e => setTitle(e.target.value)}
					placeholder='Título'
					className='w-full px-2 py-1 text-sm border border-border focus:outline-none focus:border-foreground'
				/>
				<input
					type='url'
					value={url}
					onChange={e => setUrl(e.target.value)}
					placeholder='URL'
					className='w-full px-2 py-1 text-sm border border-border focus:outline-none focus:border-foreground'
				/>
				<div className='flex gap-2'>
					<button
						onClick={handleSave}
						className='px-3 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
					>
						Guardar
					</button>
					<button
						onClick={() => {
							setEditing(false);
							setTitle(link.title);
							setUrl(link.url);
							setError(null);
						}}
						className='px-3 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted transition-colors'
					>
						Cancelar
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className='flex items-center justify-between border border-border px-3 py-2'>
			<div className='flex items-center gap-2 min-w-0'>
				{socialIcon ? (
					<socialIcon.Icon
						className='w-4 h-4 shrink-0'
						style={{ fill: socialIcon.color }}
					/>
				) : (
					<span className='material-icons text-muted-foreground text-base' aria-hidden='true'>
						{icon}
					</span>
				)}
				<div className='min-w-0'>
					<p className='text-sm font-medium text-foreground truncate'>
						{link.title}
					</p>
					<p className='text-xs text-muted-foreground truncate'>{link.url}</p>
				</div>
			</div>
			<div className='flex gap-1 shrink-0'>
				<button
					onClick={() => setEditing(true)}
					className='px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors'
				>
					Editar
				</button>
				<button
					onClick={() => onDelete(link.id)}
					className='px-2 py-1 text-xs text-error hover:text-error transition-colors'
				>
					Eliminar
				</button>
			</div>
		</div>
	);
}
