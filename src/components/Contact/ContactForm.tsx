'use client';

import { useState } from 'react';
import { profileService } from '@/services/serviceFactory';
import { ThemeDto } from '@/dtos/user.dto';
import { InputPhone } from '@/components/Common/InputPhone';

interface Props {
	username: string;
	theme?: ThemeDto;
}

export function ContactForm({ username, theme }: Props) {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
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
			await profileService.submitLead(username, { name, email, phone, message });
			setSuccess(true);
			setName('');
			setEmail('');
			setPhone('');
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
		<div className='mt-8 border-t border-border pt-6' style={borderStyle}>
			<h2
				className='text-sm font-semibold text-foreground mb-4'
				style={textStyle}
			>
				Contacto
			</h2>
			{error && <p className='text-xs text-error mb-2'>{error}</p>}
			{success && (
				<p className='text-xs text-success mb-2'>
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
					className='w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-foreground rounded'
					style={borderStyle}
				/>
				<input
					type='email'
					placeholder='Correo electrónico'
					value={email}
					onChange={e => setEmail(e.target.value)}
					required
					className='w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-foreground rounded'
					style={borderStyle}
				/>
				<InputPhone
					value={phone}
					onChange={setPhone}
					required
					borderStyle={borderStyle}
				/>
				<textarea
					placeholder='Mensaje'
					value={message}
					onChange={e => setMessage(e.target.value)}
					required
					rows={3}
					className='w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-foreground rounded resize-none'
					style={borderStyle}
				/>
				<button
					type='submit'
					disabled={loading || success}
					className='w-full py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors'
					style={buttonStyle}
				>
					{loading ? 'Enviando...' : 'Enviar'}
				</button>
			</form>
		</div>
	);
}
