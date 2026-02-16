'use client';

import { useState } from 'react';
import { CalendarSlotDto, CreateAppointmentDto } from '@/dtos/user.dto';

interface Props {
	slot: CalendarSlotDto;
	loading: boolean;
	onSubmit: (dto: CreateAppointmentDto) => Promise<void>;
}

export function AppointmentBookingForm({ slot, loading, onSubmit }: Props) {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [reason, setReason] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(false);
		try {
			await onSubmit({ slotId: slot.id, name, email, phone, reason });
			setSuccess(true);
			setName('');
			setEmail('');
			setPhone('');
			setReason('');
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Error al reservar la cita');
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className='mt-3 p-3 bg-surface border border-border space-y-2'
		>
			{error && <p className='text-xs text-error'>{error}</p>}
			{success && (
				<p className='text-xs text-success'>Cita reservada exitosamente</p>
			)}
			<input
				type='text'
				placeholder={'Nombre'}
				value={name}
				onChange={e => setName(e.target.value)}
				required
				className='w-full px-2 py-1.5 text-sm border border-border focus:outline-none focus:border-foreground'
			/>
			<input
				type='email'
				placeholder={'Correo electrónico'}
				value={email}
				onChange={e => setEmail(e.target.value)}
				required
				className='w-full px-2 py-1.5 text-sm border border-border focus:outline-none focus:border-foreground'
			/>
			<input
				type='tel'
				placeholder={'Teléfono'}
				value={phone}
				onChange={e => setPhone(e.target.value)}
				required
				className='w-full px-2 py-1.5 text-sm border border-border focus:outline-none focus:border-foreground'
			/>
			<textarea
				placeholder={'Motivo de la cita'}
				value={reason}
				onChange={e => setReason(e.target.value)}
				required
				rows={2}
				className='w-full px-2 py-1.5 text-sm border border-border focus:outline-none focus:border-foreground resize-none'
			/>
			<button
				type='submit'
				disabled={loading || success}
				className='w-full py-1.5 text-xs font-medium bg-success text-primary-foreground hover:bg-success disabled:opacity-50 transition-colors'
			>
				{loading ? 'Reservando...' : 'Reservar cita'}
			</button>
		</form>
	);
}
