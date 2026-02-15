'use client';

import { useState } from 'react';
import { CreateLinkDto } from '@/dtos/link.dto';
import { LinkDto } from '@/dtos/link.dto';

interface Props {
	onSubmit: (dto: CreateLinkDto) => Promise<void>;
	loading: boolean;
	existingLinks: LinkDto[];
}

export function AddLinkForm({ onSubmit, loading, existingLinks }: Props) {
	const [title, setTitle] = useState('');
	const [url, setUrl] = useState('');
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		if (
			existingLinks.some(l => l.title.toLowerCase() === title.toLowerCase())
		) {
			setError('Ya existe un enlace con este nombre');
			return;
		}
		if (existingLinks.some(l => l.url.toLowerCase() === url.toLowerCase())) {
			setError('Ya existe un enlace con esta URL');
			return;
		}
		try {
			await onSubmit({ title, url });
			setTitle('');
			setUrl('');
		} catch (err: unknown) {
			setError(
				err instanceof Error ? err.message : 'Error al agregar el enlace'
			);
		}
	};

	return (
		<form onSubmit={handleSubmit} className='space-y-3'>
			{error && <p className='text-xs text-red-600'>{error}</p>}
			<div className='flex gap-2'>
				<input
					type='text'
					placeholder='Título'
					value={title}
					onChange={e => setTitle(e.target.value)}
					required
					className='flex-1 px-3 py-2 text-sm border border-zinc-300 focus:outline-none focus:border-zinc-900'
				/>
				<input
					type='url'
					placeholder='URL'
					value={url}
					onChange={e => setUrl(e.target.value)}
					required
					className='flex-1 px-3 py-2 text-sm border border-zinc-300 focus:outline-none focus:border-zinc-900'
				/>
				<button
					type='submit'
					disabled={loading}
					className='px-4 py-2 text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors'
				>
					{loading ? 'Agregando...' : 'Agregar'}
				</button>
			</div>
		</form>
	);
}
