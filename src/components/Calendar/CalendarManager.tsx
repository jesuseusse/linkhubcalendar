'use client';

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { CalendarSlotDto, CreateCalendarSlotDto } from '@/dtos/user.dto';
import 'react-day-picker/style.css';

interface Props {
	slots: CalendarSlotDto[];
	onAddSlot: (dto: CreateCalendarSlotDto) => Promise<void>;
	onDeleteSlot: (slotId: string) => Promise<void>;
	onReleaseSlot: (slotId: string) => Promise<void>;
	loading: boolean;
}

export function CalendarManager({
	slots,
	onAddSlot,
	onDeleteSlot,
	onReleaseSlot,
	loading
}: Props) {
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [startTime, setStartTime] = useState('09:00');
	const [endTime, setEndTime] = useState('10:00');

	const selectedDateStr = selectedDate
		? format(selectedDate, 'yyyy-MM-dd')
		: '';
	const slotsForDate = slots.filter(s => s.date === selectedDateStr);

	const datesWithSlots = slots.reduce<Record<string, number>>((acc, slot) => {
		acc[slot.date] = (acc[slot.date] || 0) + 1;
		return acc;
	}, {});

	const highlightedDays = Object.keys(datesWithSlots).map(
		d => new Date(d + 'T00:00:00')
	);

	const handleAddSlot = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedDateStr) return;
		await onAddSlot({ date: selectedDateStr, startTime, endTime });
	};

	const sortedSlots = [...slots].sort((a, b) => {
		if (a.date !== b.date) return a.date.localeCompare(b.date);
		return a.startTime.localeCompare(b.startTime);
	});

	const groupedSlots = sortedSlots.reduce<Record<string, typeof sortedSlots>>(
		(acc, slot) => {
			if (!acc[slot.date]) acc[slot.date] = [];
			acc[slot.date].push(slot);
			return acc;
		},
		{}
	);

	return (
		<div className='space-y-4'>
			<h3 className='text-sm font-semibold text-foreground'>
				Gestión de calendario
			</h3>
			<div className='flex flex-col md:flex-row gap-6'>
				<div className='shrink-0'>
					<DayPicker
						mode='single'
						selected={selectedDate}
						onSelect={setSelectedDate}
						modifiers={{ hasSlots: highlightedDays }}
						modifiersStyles={{
							hasSlots: { backgroundColor: '#d1fae5', borderRadius: '100%' }
						}}
					/>
				</div>
				<div className='flex-1'>
					{selectedDate ? (
						<div>
							<h4 className='text-sm font-medium text-foreground mb-3'>
								{format(selectedDate, 'MMMM d, yyyy')}
							</h4>
							<form onSubmit={handleAddSlot} className='flex gap-2 mb-4'>
								<input
									type='time'
									value={startTime}
									onChange={e => setStartTime(e.target.value)}
									className='px-2 py-1 text-sm border border-border focus:outline-none focus:border-foreground'
								/>
								<input
									type='time'
									value={endTime}
									onChange={e => setEndTime(e.target.value)}
									className='px-2 py-1 text-sm border border-border focus:outline-none focus:border-foreground'
								/>
								<button
									type='submit'
									disabled={loading}
									className='px-3 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors'
								>
									{loading ? 'Agregando...' : 'Agregar'}
								</button>
							</form>
							{slotsForDate.length > 0 ? (
								<ul className='space-y-2'>
									{slotsForDate.map(slot => (
										<li
											key={slot.id}
											className='flex items-center justify-between bg-surface border border-border px-3 py-2'
										>
											<span className='text-sm text-foreground'>
												{slot.startTime} - {slot.endTime}
											</span>
											<div className='flex gap-1'>
												{slot.booked ? (
													<>
														<span className='text-xs text-warning px-2 py-0.5 bg-warning-light border border-warning'>
															Reservado
														</span>
														<button
															onClick={() => onReleaseSlot(slot.id)}
															className='text-xs text-info hover:text-info px-2 py-0.5'
														>
															Liberar
														</button>
													</>
												) : (
													<button
														onClick={() => onDeleteSlot(slot.id)}
														className='text-xs text-error hover:text-error px-2 py-0.5'
													>
														Eliminar
													</button>
												)}
											</div>
										</li>
									))}
								</ul>
							) : (
								<p className='text-xs text-muted-foreground'>
									No hay horarios para esta fecha
								</p>
							)}
						</div>
					) : (
						<div className='py-8 text-center'>
							<p className='text-sm text-muted-foreground'>Selecciona una fecha</p>
						</div>
					)}
				</div>
			</div>
			{Object.keys(groupedSlots).length > 0 && (
				<div className='border-t border-border pt-4'>
					<h4 className='text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider'>
						Gestión de calendario
					</h4>
					<div className='space-y-3'>
						{Object.entries(groupedSlots).map(([date, dateSlots]) => (
							<div key={date}>
								<p className='text-xs font-medium text-muted-foreground mb-1'>
									{format(new Date(date + 'T00:00:00'), 'MMMM d, yyyy')}
								</p>
								<div className='flex flex-wrap gap-2'>
									{dateSlots.map(slot => (
										<span
											key={slot.id}
											className={`inline-block px-3 py-1 text-xs border ${
												slot.booked
													? 'bg-warning-light border-warning text-warning'
													: 'bg-success-light border-success text-success'
											}`}
										>
											{slot.startTime} - {slot.endTime}
											{slot.booked ? ' (Reservado)' : ''}
										</span>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
