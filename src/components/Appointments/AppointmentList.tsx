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
			<p className='text-sm text-zinc-400 text-center py-8'>
				Cargando citas...
			</p>
		);
	}

	if (appointments.length === 0) {
		return (
			<div className='text-center py-8'>
				<span
					className='material-icons text-zinc-300 text-4xl mb-2'
					aria-hidden='true'
				>
					event_busy
				</span>
				<p className='text-sm text-zinc-400'>No hay citas programadas</p>
			</div>
		);
	}

	return (
		<div>
			<div className='overflow-x-auto'>
				<table className='w-full text-sm'>
					<thead>
						<tr className='border-b border-zinc-200'>
							<th className='text-left py-2 px-2 text-xs font-medium text-zinc-500 uppercase'>
								Fecha
							</th>
							<th className='text-left py-2 px-2 text-xs font-medium text-zinc-500 uppercase'>
								Hora
							</th>
							<th className='text-left py-2 px-2 text-xs font-medium text-zinc-500 uppercase'>
								Nombre
							</th>
							<th className='text-left py-2 px-2 text-xs font-medium text-zinc-500 uppercase'>
								Correo
							</th>
							<th className='text-left py-2 px-2 text-xs font-medium text-zinc-500 uppercase'>
								Teléfono
							</th>
							<th className='text-left py-2 px-2 text-xs font-medium text-zinc-500 uppercase'>
								Motivo
							</th>
							<th className='text-left py-2 px-2 text-xs font-medium text-zinc-500 uppercase'>
								Estado
							</th>
							<th className='text-left py-2 px-2 text-xs font-medium text-zinc-500 uppercase'>
								Acciones
							</th>
						</tr>
					</thead>
					<tbody>
						{appointments.map(a => (
							<tr key={a.id} className='border-b border-zinc-100'>
								<td className='py-2 px-2 text-zinc-700'>{a.date}</td>
								<td className='py-2 px-2 text-zinc-700'>
									{a.startTime} - {a.endTime}
								</td>
								<td className='py-2 px-2 text-zinc-700'>{a.name}</td>
								<td className='py-2 px-2 text-zinc-700'>{a.email}</td>
								<td className='py-2 px-2 text-zinc-700'>{a.phone}</td>
								<td className='py-2 px-2 text-zinc-700 max-w-[150px] truncate'>
									{a.reason}
								</td>
								<td className='py-2 px-2'>
									<span
										className={`px-2 py-0.5 text-xs font-medium ${
											a.status === 'confirmed'
												? 'bg-emerald-100 text-emerald-700'
												: 'bg-amber-100 text-amber-700'
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
												className='text-xs text-emerald-600 hover:text-emerald-800'
											>
												Confirmar
											</button>
										)}
										<button
											onClick={() => onReleaseSlot(a.id)}
											className='text-xs text-blue-600 hover:text-blue-800'
										>
											Liberar horario
										</button>
										<button
											onClick={() => onDelete(a.id)}
											className='text-xs text-red-500 hover:text-red-700'
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
			<div className='flex items-center justify-between mt-4 pt-4 border-t border-zinc-200'>
				<p className='text-xs text-zinc-500'>Total de registros: {total}</p>
				<div className='flex items-center gap-2'>
					<button
						onClick={() => onPageChange(page - 1)}
						disabled={page <= 1}
						className='px-3 py-1 text-xs font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 disabled:opacity-50 transition-colors'
					>
						Anterior
					</button>
					<span className='text-xs text-zinc-500'>
						Página {page} de {totalPages}
					</span>
					<button
						onClick={() => onPageChange(page + 1)}
						disabled={page >= totalPages}
						className='px-3 py-1 text-xs font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 disabled:opacity-50 transition-colors'
					>
						Siguiente
					</button>
				</div>
			</div>
		</div>
	);
}
