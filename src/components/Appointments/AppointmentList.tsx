'use client';

import { AppointmentDto } from '@/dtos/user.dto';

interface Props {
	appointments: AppointmentDto[];
	loading: boolean;
	page: number;
	totalPages: number;
	total: number;
	onPageChange: (page: number) => void;
	onDelete: (id: string) => Promise<void>;
	onConfirm: (id: string) => Promise<void>;
	onReleaseSlot: (id: string) => Promise<void>;
}

export function AppointmentList({
	appointments,
	loading,
	page,
	totalPages,
	total,
	onPageChange,
	onDelete,
	onConfirm,
	onReleaseSlot
}: Props) {
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
				<p className='text-sm text-muted-foreground'>No hay citas programadas</p>
			</div>
		);
	}

	return (
		<div>
			<div className='overflow-x-auto'>
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
								<td className='py-2 px-2 text-foreground'>{a.phone}</td>
								<td className='py-2 px-2 text-foreground max-w-[150px] truncate'>
									{a.reason}
								</td>
								<td className='py-2 px-2'>
									<span
										className={`px-2 py-0.5 text-xs font-medium ${
											a.status === 'confirmed'
												? 'bg-success-light text-success'
												: 'bg-warning-light text-warning'
										}`}
									>
										{a.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
									</span>
								</td>
								<td className='py-2 px-2'>
									<div className='flex gap-1'>
										{a.status !== 'confirmed' && (
											<button
												onClick={() => onConfirm(a.id)}
												className='text-xs text-success hover:text-success'
											>
												Confirmar
											</button>
										)}
										<button
											onClick={() => onReleaseSlot(a.id)}
											className='text-xs text-info hover:text-info'
										>
											Liberar horario
										</button>
										<button
											onClick={() => onDelete(a.id)}
											className='text-xs text-error hover:text-error'
										>
											Eliminar
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className='flex items-center justify-between mt-4 pt-4 border-t border-border'>
				<p className='text-xs text-muted-foreground'>Total de registros: {total}</p>
				<div className='flex items-center gap-2'>
					<button
						onClick={() => onPageChange(page - 1)}
						disabled={page <= 1}
						className='px-3 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors'
					>
						Anterior
					</button>
					<span className='text-xs text-muted-foreground'>
						Página {page} de {totalPages}
					</span>
					<button
						onClick={() => onPageChange(page + 1)}
						disabled={page >= totalPages}
						className='px-3 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors'
					>
						Siguiente
					</button>
				</div>
			</div>
		</div>
	);
}
