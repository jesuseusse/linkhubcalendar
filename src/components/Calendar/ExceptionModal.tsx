'use client';

import { useState } from 'react';
import { WeeklySchedule, ScheduleException } from '@/domain/entities/User';
import { generateSlotsForDay } from '@/lib/utils/scheduleGenerator';

interface Props {
	date: string;
	weeklySchedule: WeeklySchedule;
	existingException?: ScheduleException;
	onSave: (exception: ScheduleException | null) => Promise<void>;
	onClose: () => void;
}

function getDaySchedule(ws: WeeklySchedule, dayOfWeek: number) {
	if (ws.sameForAllDays) return ws.defaultSchedule ?? null;
	return ws.perDaySchedule?.[dayOfWeek] ?? null;
}

function formatDate(dateStr: string) {
	const [y, m, d] = dateStr.split('-').map(Number);
	const date = new Date(y, m - 1, d);
	return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function ExceptionModal({ date, weeklySchedule, existingException, onSave, onClose }: Props) {
	const dayOfWeek = new Date(date + 'T00:00:00').getDay();
	const daySchedule = getDaySchedule(weeklySchedule, dayOfWeek);
	const allSlots = daySchedule ? generateSlotsForDay(daySchedule) : [];

	const isFullDayDisabled = existingException && !existingException.disabledSlotTimes;
	const [fullDay, setFullDay] = useState(isFullDayDisabled ?? false);
	const [disabledSlots, setDisabledSlots] = useState<Set<string>>(
		new Set(existingException?.disabledSlotTimes ?? [])
	);
	const [saving, setSaving] = useState(false);

	const toggleSlot = (startTime: string) => {
		setDisabledSlots((prev) => {
			const next = new Set(prev);
			if (next.has(startTime)) next.delete(startTime);
			else next.add(startTime);
			return next;
		});
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			if (fullDay) {
				await onSave({ date });
			} else if (disabledSlots.size > 0) {
				await onSave({ date, disabledSlotTimes: [...disabledSlots] });
			} else {
				await onSave(null);
			}
			onClose();
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-foreground/20'>
			<div className='w-full max-w-sm bg-background border border-border p-5 space-y-4'>
				<div className='flex items-start justify-between'>
					<div>
						<h3 className='text-sm font-semibold text-foreground'>
							Gestionar disponibilidad
						</h3>
						<p className='text-xs text-muted-foreground mt-0.5 capitalize'>
							{formatDate(date)}
						</p>
					</div>
					<button
						type='button'
						onClick={onClose}
						className='text-muted-foreground hover:text-foreground text-lg leading-none'
					>
						×
					</button>
				</div>

				{/* Full day toggle */}
				<label className='flex items-center gap-3 cursor-pointer'>
					<button
						type='button'
						role='switch'
						aria-checked={fullDay}
						onClick={() => {
							setFullDay(!fullDay);
							if (!fullDay) setDisabledSlots(new Set());
						}}
						className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
							fullDay ? 'bg-primary' : 'bg-border'
						}`}
					>
						<span
							className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
								fullDay ? 'translate-x-4' : 'translate-x-0.5'
							}`}
						/>
					</button>
					<span className='text-sm text-foreground'>Deshabilitar día completo</span>
				</label>

				{/* Individual slot toggles */}
				{!fullDay && allSlots.length > 0 && (
					<div>
						<p className='text-xs text-muted-foreground mb-2'>
							Desactiva slots específicos:
						</p>
						<div className='flex flex-wrap gap-2'>
							{allSlots.map((startTime) => {
								const disabled = disabledSlots.has(startTime);
								return (
									<button
										key={startTime}
										type='button'
										onClick={() => toggleSlot(startTime)}
										className={`px-2 py-1 text-xs border transition-colors ${
											disabled
												? 'bg-muted text-muted-foreground border-border line-through'
												: 'bg-surface border-border text-foreground hover:border-foreground'
										}`}
									>
										{startTime}
									</button>
								);
							})}
						</div>
					</div>
				)}

				{allSlots.length === 0 && (
					<p className='text-xs text-muted-foreground'>
						No hay slots configurados para este día.
					</p>
				)}

				<div className='flex gap-2 pt-1'>
					<button
						type='button'
						onClick={onClose}
						disabled={saving}
						className='flex-1 py-2 text-sm border border-border text-foreground hover:border-foreground transition-colors disabled:opacity-50'
					>
						Cancelar
					</button>
					<button
						type='button'
						onClick={handleSave}
						disabled={saving}
						className='flex-1 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors'
					>
						{saving ? 'Guardando...' : 'Guardar'}
					</button>
				</div>
			</div>
		</div>
	);
}
