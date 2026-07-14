'use client';

import { DaySchedule } from './scheduleTypes';
import { generateSlotsForDay } from '@/lib/utils/scheduleGenerator';

interface Props {
	schedule: DaySchedule;
	onExclude: (startTime: string) => void;
}

export function SlotPreview({ schedule, onExclude }: Props) {
	const slots = generateSlotsForDay(schedule);
	if (slots.length === 0) {
		return (
			<p className='text-xs text-muted-foreground'>No se generan slots con este horario.</p>
		);
	}
	return (
		<div className='flex flex-wrap gap-2'>
			{slots.map((startTime) => {
				const [h, m] = startTime.split(':').map(Number);
				const endMin = h * 60 + m + schedule.durationMinutes;
				const endTime = `${Math.floor(endMin / 60).toString().padStart(2, '0')}:${(endMin % 60).toString().padStart(2, '0')}`;
				return (
					<span
						key={startTime}
						className='inline-flex items-center gap-1 px-2 py-1 text-xs bg-surface border border-border text-foreground'
					>
						{startTime}–{endTime}
						<button
							type='button'
							onClick={() => onExclude(startTime)}
							className='text-muted-foreground hover:text-error transition-colors'
							aria-label={`Eliminar slot ${startTime}`}
						>
							×
						</button>
					</span>
				);
			})}
		</div>
	);
}
