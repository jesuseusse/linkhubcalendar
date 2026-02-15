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
			className='mt-3 p-3 bg-zinc-50 border border-zinc-200 space-y-2'
		>
			{error && <p className='text-xs text-red-600'>{error}</p>}
			{success && (
				<p className='text-xs text-emerald-600'>Cita reservada exitosamente</p>
			)}
			<input
				type='text'
				placeholder={'Nombre'}
				value={name}
				onChange={e => setName(e.target.value)}
				required
				className='w-full px-2 py-1.5 text-sm border border-zinc-300 focus:outline-none focus:border-zinc-900'
			/>
			<input
				type='email'
				placeholder={'Correo electrónico'}
				value={email}
				onChange={e => setEmail(e.target.value)}
				required
				className='w-full px-2 py-1.5 text-sm border border-zinc-300 focus:outline-none focus:border-zinc-900'
			/>
			<input
				type='tel'
				placeholder={'Teléfono'}
				value={phone}
				onChange={e => setPhone(e.target.value)}
				required
				className='w-full px-2 py-1.5 text-sm border border-zinc-300 focus:outline-none focus:border-zinc-900'
			/>
			<textarea
				placeholder={'Motivo de la cita'}
				value={reason}
				onChange={e => setReason(e.target.value)}
				required
				rows={2}
				className='w-full px-2 py-1.5 text-sm border border-zinc-300 focus:outline-none focus:border-zinc-900 resize-none'
			/>
			<button
				type='submit'
				disabled={loading || success}
				className='w-full py-1.5 text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors'
			>
				{loading ? 'Reservando...' : 'Reservar cita'}
			</button>
		</form>
	);
}
