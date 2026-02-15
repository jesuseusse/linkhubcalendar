'use client';

import { useState } from 'react';
import { LinkDto, UpdateLinkDto } from '@/dtos/link.dto';
import { getPlatformIcon } from '@/utils/platformIcons';

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
			<div className='border border-zinc-200 p-3 space-y-2'>
				{error && <p className='text-xs text-red-600'>{error}</p>}
				<input
					type='text'
					value={title}
					onChange={e => setTitle(e.target.value)}
					placeholder='Título'
					className='w-full px-2 py-1 text-sm border border-zinc-300 focus:outline-none focus:border-zinc-900'
				/>
				<input
					type='url'
					value={url}
					onChange={e => setUrl(e.target.value)}
					placeholder='URL'
					className='w-full px-2 py-1 text-sm border border-zinc-300 focus:outline-none focus:border-zinc-900'
				/>
				<div className='flex gap-2'>
					<button
						onClick={handleSave}
						className='px-3 py-1 text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors'
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
						className='px-3 py-1 text-xs font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors'
					>
						Cancelar
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className='flex items-center justify-between border border-zinc-200 px-3 py-2'>
			<div className='flex items-center gap-2 min-w-0'>
				<span
					className='material-icons text-zinc-400 text-base'
					aria-hidden='true'
				>
					{icon}
				</span>
				<div className='min-w-0'>
					<p className='text-sm font-medium text-zinc-900 truncate'>
						{link.title}
					</p>
					<p className='text-xs text-zinc-400 truncate'>{link.url}</p>
				</div>
			</div>
			<div className='flex gap-1 shrink-0'>
				<button
					onClick={() => setEditing(true)}
					className='px-2 py-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors'
				>
					Editar
				</button>
				<button
					onClick={() => onDelete(link.id)}
					className='px-2 py-1 text-xs text-red-500 hover:text-red-700 transition-colors'
				>
					Eliminar
				</button>
			</div>
		</div>
	);
}
