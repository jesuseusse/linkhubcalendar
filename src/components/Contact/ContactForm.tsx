'use client';

import { useState } from 'react';
import { profileService } from '@/services/serviceFactory';
import { ThemeDto } from '@/dtos/user.dto';

interface Props {
	username: string;
	theme?: ThemeDto;
}

export function ContactForm({ username, theme }: Props) {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setSuccess(false);
		try {
			await profileService.submitLead(username, { name, email, message });
			setSuccess(true);
			setName('');
			setEmail('');
			setMessage('');
		} catch {
			setError('Ocurrió un error al enviar el mensaje. Inténtalo nuevamente.');
		} finally {
			setLoading(false);
		}
	};

	const buttonStyle = theme
		? { backgroundColor: theme.buttonColor, color: theme.buttonTextColor }
		: undefined;
	const textStyle = theme ? { color: theme.textColor } : undefined;
	const borderStyle = theme
		? { borderColor: `${theme.textColor}20` }
		: undefined;

	return (
		<div className='mt-8 border-t border-zinc-200 pt-6' style={borderStyle}>
			<h2
				className='text-sm font-semibold text-zinc-900 mb-4'
				style={textStyle}
			>
				Contacto
			</h2>
			{error && <p className='text-xs text-red-600 mb-2'>{error}</p>}
			{success && (
				<p className='text-xs text-emerald-600 mb-2'>
					Mensaje enviado correctamente.
				</p>
			)}
			<form onSubmit={handleSubmit} className='space-y-3'>
				<input
					type='text'
					placeholder='Nombre'
					value={name}
					onChange={e => setName(e.target.value)}
					required
					className='w-full px-3 py-2 text-sm border border-zinc-300 focus:outline-none focus:border-zinc-900'
					style={borderStyle}
				/>
				<input
					type='email'
					placeholder='Correo electrónico'
					value={email}
					onChange={e => setEmail(e.target.value)}
					required
					className='w-full px-3 py-2 text-sm border border-zinc-300 focus:outline-none focus:border-zinc-900'
					style={borderStyle}
				/>
				<textarea
					placeholder='Mensaje'
					value={message}
					onChange={e => setMessage(e.target.value)}
					required
					rows={3}
					className='w-full px-3 py-2 text-sm border border-zinc-300 focus:outline-none focus:border-zinc-900 resize-none'
					style={borderStyle}
				/>
				<button
					type='submit'
					disabled={loading || success}
					className='w-full py-2 text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors'
					style={buttonStyle}
				>
					{loading ? 'Enviando...' : 'Enviar'}
				</button>
			</form>
		</div>
	);
}
