'use client';

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export interface StoredAppointment {
	name: string;
	date: string;
	startTime: string;
	endTime: string;
}

interface Props {
	appointment: StoredAppointment;
	onClose: () => void;
}

export function ReservedAppointmentModal({ appointment, onClose }: Props) {
	const date = parseISO(appointment.date);
	const dia = format(date, 'EEEE', { locale: es });
	const fecha = format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
	const hora = `${appointment.startTime} - ${appointment.endTime}`;

	return (
		<div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40'>
			<div className='w-full sm:max-w-sm bg-background border border-border p-6'>
				<p className='text-sm font-semibold text-foreground mb-4'>
					Hola {appointment.name}, ya tienes una cita reservada
				</p>
				<div className='space-y-1 mb-4'>
					<p className='text-sm text-foreground capitalize'>{dia}</p>
					<p className='text-sm text-foreground'>{hora}</p>
					<p className='text-sm text-foreground'>{fecha}</p>
				</div>
				<p className='text-xs text-muted-foreground mb-5'>
					Solo agenda si necesitas otra.
				</p>
				<button
					onClick={onClose}
					className='w-full py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
				>
					Entendido
				</button>
			</div>
		</div>
	);
}
