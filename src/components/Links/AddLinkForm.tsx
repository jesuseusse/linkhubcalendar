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
			{error && <p className='text-xs text-error'>{error}</p>}

			<div className='flex flex-col gap-2 w-full md:flex-row md:items-end'>
				<input
					type='text'
					placeholder='Título'
					value={title}
					onChange={e => setTitle(e.target.value)}
					required
					className='w-full md:flex-1 px-3 py-2 text-sm border border-border focus:outline-none focus:border-foreground rounded'
				/>

				<input
					type='url'
					placeholder='URL'
					value={url}
					onChange={e => setUrl(e.target.value)}
					required
					className='w-full md:flex-1 px-3 py-2 text-sm border border-border focus:outline-none focus:border-foreground rounded'
				/>

				<div className='w-full flex justify-start md:w-auto md:justify-end'>
					<button
						type='submit'
						disabled={loading}
						className='w-full md:w-auto px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors rounded'
					>
						{loading ? 'Agregando...' : 'Agregar'}
					</button>
				</div>
			</div>
		</form>
	);
}
