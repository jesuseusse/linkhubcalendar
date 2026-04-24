'use client';

import { useState } from 'react';
import { AppointmentDto } from '@/dtos/user.dto';

type Action = 'confirm' | 'cancel' | 'reschedule';

interface Props {
	appointments: AppointmentDto[];
	loading: boolean;
	page: number;
	totalPages: number;
	total: number;
	onPageChange: (page: number) => void;
	onCancel: (id: string) => Promise<void>;
	onConfirm: (id: string) => Promise<void>;
	onReschedule: (id: string) => Promise<void>;
}

function buildWhatsappLink(phone: string, name: string, date: string): string {
	const message = encodeURIComponent(
		`Hola, te escribe ${name}. Tienes una cita para el dia ${date}. Por favor confirma respondiendo este mensaje`
	);
	const digits = phone.replace(/\D/g, '');
	return `https://api.whatsapp.com/send?phone=${digits}&text=${message}`;
}

function StatusBadge({ status }: { status: string }) {
	const styles =
		status === 'confirmed'
			? 'bg-success-light text-success'
			: status === 'cancelled'
				? 'bg-error-light text-error'
				: 'bg-warning-light text-warning';
	const label =
		status === 'confirmed'
			? 'Confirmada'
			: status === 'cancelled'
				? 'Cancelada'
				: 'Pendiente';
	return (
		<span className={`px-2 py-0.5 text-xs font-medium rounded ${styles}`}>
			{label}
		</span>
	);
}

interface ActionButtonsProps {
	a: AppointmentDto;
	busy: { id: string; action: Action } | null;
	handle: (id: string, action: Action, fn: () => Promise<void>) => Promise<void>;
	onCancel: (id: string) => Promise<void>;
	onConfirm: (id: string) => Promise<void>;
	onReschedule: (id: string) => Promise<void>;
}

function ActionButtons({ a, busy, handle, onCancel, onConfirm, onReschedule }: ActionButtonsProps) {
	const isLoading = (action: Action) => busy?.id === a.id && busy.action === action;
	return (
		<div className='flex flex-wrap gap-2'>
			{a.status === 'pending' && (
				<button
					disabled={busy !== null}
					onClick={() => handle(a.id, 'confirm', () => onConfirm(a.id))}
					className='text-xs text-success hover:text-success disabled:opacity-50 disabled:cursor-not-allowed'
				>
					{isLoading('confirm') ? '...' : 'Confirmar'}
				</button>
			)}
			{a.status !== 'cancelled' && (
				<button
					disabled={busy !== null}
					onClick={() => handle(a.id, 'cancel', () => onCancel(a.id))}
					className='text-xs text-error hover:text-error disabled:opacity-50 disabled:cursor-not-allowed'
				>
					{isLoading('cancel') ? '...' : 'Cancelar'}
				</button>
			)}
			{a.status === 'cancelled' && (
				<button
					disabled={busy !== null}
					onClick={() => handle(a.id, 'reschedule', () => onReschedule(a.id))}
					className='text-xs text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed'
				>
					{isLoading('reschedule') ? '...' : 'Reagendar'}
				</button>
			)}
		</div>
	);
}

export function AppointmentList({
	appointments,
	loading,
	page,
	totalPages,
	total,
	onPageChange,
	onCancel,
	onConfirm,
	onReschedule
}: Props) {
	const [busy, setBusy] = useState<{ id: string; action: Action } | null>(null);

	const handle = async (id: string, action: Action, fn: () => Promise<void>) => {
		if (busy) return;
		setBusy({ id, action });
		try {
			await fn();
		} finally {
			setBusy(null);
		}
	};

	if (loading) {
		return (
			<p className='text-sm text-muted-foreground text-center py-8'>
				Cargando citas...
			</p>
		);
	}

	if (appointments.length === 0) {
		return (
			<div className='text-center py-8'>
				<span
					className='material-icons text-muted-foreground text-4xl mb-2'
					aria-hidden='true'
				>
					event_busy
				</span>
				<p className='text-sm text-muted-foreground'>
					No hay citas programadas
				</p>
			</div>
		);
	}

	return (
		<div>
			{/* Mobile: card list */}
			<div className='flex flex-col gap-3 sm:hidden'>
				{appointments.map(a => (
					<div
						key={a.id}
						className='border border-border rounded p-3 bg-background flex flex-col gap-2'
					>
						<div className='flex items-start justify-between gap-2'>
							<div>
								<p className='text-sm font-medium text-foreground'>{a.name}</p>
								<p className='text-xs text-muted-foreground'>
									{a.date} · {a.startTime} - {a.endTime}
								</p>
							</div>
							<StatusBadge status={a.status} />
						</div>
						{a.email && (
							<p className='text-xs text-muted-foreground truncate'>{a.email}</p>
						)}
						{a.phone && (
							<a
								href={buildWhatsappLink(a.phone, a.name, a.date)}
								target='_blank'
								rel='noopener noreferrer'
								className='text-xs text-success hover:underline'
							>
								{a.phone}
							</a>
						)}
						{a.reason && (
							<p className='text-xs text-muted-foreground line-clamp-2'>{a.reason}</p>
						)}
						<ActionButtons
							a={a}
							busy={busy}
							handle={handle}
							onCancel={onCancel}
							onConfirm={onConfirm}
							onReschedule={onReschedule}
						/>
					</div>
				))}
			</div>

			{/* Desktop: table */}
			<div className='hidden sm:block overflow-x-auto'>
				<table className='w-full text-sm'>
					<thead>
						<tr className='border-b border-border'>
							<th className='text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase'>
								Fecha
							</th>
							<th className='text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase'>
								Hora
							</th>
							<th className='text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase'>
								Nombre
							</th>
							<th className='text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase'>
								Correo
							</th>
							<th className='text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase'>
								Teléfono
							</th>
							<th className='text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase'>
								Motivo
							</th>
							<th className='text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase'>
								Estado
							</th>
							<th className='text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase'>
								Acciones
							</th>
						</tr>
					</thead>
					<tbody>
						{appointments.map(a => (
							<tr key={a.id} className='border-b border-border'>
								<td className='py-2 px-2 text-foreground'>{a.date}</td>
								<td className='py-2 px-2 text-foreground'>
									{a.startTime} - {a.endTime}
								</td>
								<td className='py-2 px-2 text-foreground'>{a.name}</td>
								<td className='py-2 px-2 text-foreground'>{a.email}</td>
								<td className='py-2 px-2'>
									{a.phone ? (
										<a
											href={buildWhatsappLink(a.phone, a.name, a.date)}
											target='_blank'
											rel='noopener noreferrer'
											className='text-success hover:underline'
										>
											{a.phone}
										</a>
									) : (
										<span className='text-muted-foreground'>—</span>
									)}
								</td>
								<td className='py-2 px-2 text-foreground max-w-[150px] truncate'>
									{a.reason}
								</td>
								<td className='py-2 px-2'>
									<StatusBadge status={a.status} />
								</td>
								<td className='py-2 px-2'>
									<ActionButtons
										a={a}
										busy={busy}
										handle={handle}
										onCancel={onCancel}
										onConfirm={onConfirm}
										onReschedule={onReschedule}
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className='flex items-center justify-between mt-4 pt-4 border-t border-border'>
				<p className='text-xs text-muted-foreground'>
					Total de registros: {total}
				</p>
				<div className='flex items-center gap-2'>
					<button
						onClick={() => onPageChange(page - 1)}
						disabled={page <= 1 || busy !== null}
						className='px-3 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors'
					>
						Anterior
					</button>
					<span className='text-xs text-muted-foreground'>
						Página {page} de {totalPages}
					</span>
					<button
						onClick={() => onPageChange(page + 1)}
						disabled={page >= totalPages || busy !== null}
						className='px-3 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors'
					>
						Siguiente
					</button>
				</div>
			</div>
		</div>
	);
}
