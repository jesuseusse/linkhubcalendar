'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/services/apiClient';
import { SeoConfig } from '@/interfaces/ISeoConfig';

const DEFAULT_FORM: SeoConfig = {
	siteName: '',
	title: '',
	description: '',
	keywords: [],
	ogImage: null,
	favicon: null,
	canonicalUrl: null,
	locale: 'es_ES',
	twitterHandle: null,
	organizationType: 'Organization'
};

function FieldHint({ children }: { children: string }) {
	return <p className='text-xs text-muted-foreground mt-1'>{children}</p>;
}

function Label({ htmlFor, children }: { htmlFor: string; children: string }) {
	return (
		<label
			htmlFor={htmlFor}
			className='block text-xs font-medium text-foreground mb-1'
		>
			{children}
		</label>
	);
}

const inputClass =
	'w-full px-3 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground';

export function SeoConfigClient() {
	const [form, setForm] = useState<SeoConfig>(DEFAULT_FORM);
	const [keywordsInput, setKeywordsInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		apiClient('/api/profile/seo')
			.then((data: { seoConfig: SeoConfig | null }) => {
				if (data?.seoConfig) {
					setForm({ ...DEFAULT_FORM, ...data.seoConfig });
					setKeywordsInput((data.seoConfig.keywords ?? []).join(', '));
				}
			})
			.catch(() => {})
			.finally(() => setFetching(false));
	}, []);

	function set(field: keyof SeoConfig, value: string | null) {
		setForm(prev => ({ ...prev, [field]: value }));
		setSuccess(false);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setSuccess(false);

		const payload: SeoConfig = {
			...form,
			keywords: keywordsInput
				.split(',')
				.map(k => k.trim())
				.filter(Boolean),
			twitterHandle: form.twitterHandle || null
		};

		try {
			const data: { seoConfig: SeoConfig | null } = await apiClient(
				'/api/profile/seo',
				{ method: 'PUT', body: JSON.stringify(payload) }
			);
			if (data?.seoConfig) {
				setForm(data.seoConfig);
				setKeywordsInput((data.seoConfig.keywords ?? []).join(', '));
			}
			setSuccess(true);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: 'Ocurrió un error, intenta de nuevo'
			);
		} finally {
			setLoading(false);
		}
	}

	if (fetching) {
		return <p className='text-sm text-muted-foreground py-4'>Cargando...</p>;
	}

	return (
		<form onSubmit={handleSubmit} className='space-y-6'>
			{/* Basic metadata */}
			<div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
				<div>
					<Label htmlFor='siteName'>Nombre del sitio</Label>
					<input
						id='siteName'
						type='text'
						className={inputClass}
						value={form.siteName}
						onChange={e => set('siteName', e.target.value)}
						placeholder='Mi Empresa'
					/>
					<FieldHint>
						Aparece en pestañas del navegador y resultados de búsqueda.
					</FieldHint>
				</div>

				<div>
					<Label htmlFor='title'>Título de la página principal</Label>
					<input
						id='title'
						type='text'
						className={inputClass}
						value={form.title}
						onChange={e => set('title', e.target.value)}
						placeholder='Mi Empresa — Servicios'
					/>
					<FieldHint>Máx. 60 caracteres recomendado.</FieldHint>
				</div>
			</div>

			<div>
				<Label htmlFor='description'>Descripción</Label>
				<textarea
					id='description'
					rows={3}
					className={inputClass}
					value={form.description}
					onChange={e => set('description', e.target.value)}
					placeholder='Describe tu sitio en pocas palabras...'
				/>
				<FieldHint>
					Texto que aparece bajo el título en Google. Máx. 160 caracteres
					recomendado.
				</FieldHint>
			</div>

			<div>
				<Label htmlFor='keywords'>Palabras clave</Label>
				<input
					id='keywords'
					type='text'
					className={inputClass}
					value={keywordsInput}
					onChange={e => {
						setKeywordsInput(e.target.value);
						setSuccess(false);
					}}
					placeholder='diseño web, freelance, México'
				/>
				<FieldHint>Separadas por coma.</FieldHint>
			</div>

			{/* Social */}
			<div className='border-t border-border pt-5'>
				<h3 className='text-xs font-semibold text-foreground uppercase tracking-wider mb-4'>
					Redes sociales
				</h3>
				<div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
					<div>
						<Label htmlFor='twitterHandle'>Usuario de Twitter/X</Label>
						<input
							id='twitterHandle'
							type='text'
							className={inputClass}
							value={form.twitterHandle ?? ''}
							onChange={e => set('twitterHandle', e.target.value || null)}
							placeholder='@micuenta'
						/>
						<FieldHint>
							Incluye el @. Se usa en la tarjeta de Twitter.
						</FieldHint>
					</div>
				</div>
			</div>

			{/* Feedback */}
			{error && (
				<p className='text-sm text-error bg-error-light border border-error/20 p-3 rounded'>
					{error}
				</p>
			)}
			{success && (
				<p className='text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded'>
					Configuración SEO guardada correctamente.
				</p>
			)}

			<button
				type='submit'
				disabled={loading}
				className='px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 rounded'
			>
				{loading && (
					<span className='inline-block w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin' />
				)}
				{loading ? 'Guardando...' : 'Guardar configuración'}
			</button>
		</form>
	);
}
