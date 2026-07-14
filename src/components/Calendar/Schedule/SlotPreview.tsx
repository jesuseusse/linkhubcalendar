'use client';

import { DaySchedule } from './scheduleTypes';
import { generateSlotsForDay } from '@/lib/utils/scheduleGenerator';

interface Props {
	schedule: DaySchedule;
	onExclude: (startTime: string) => void;
	onRestore: (startTime: string) => void;
}

function endTime(startTime: string, durationMinutes: number): string {
	const [h, m] = startTime.split(':').map(Number);
	const endMin = h * 60 + m + durationMinutes;
	return `${Math.floor(endMin / 60).toString().padStart(2, '0')}:${(endMin % 60).toString().padStart(2, '0')}`;
}

export function SlotPreview({ schedule, onExclude, onRestore }: Props) {
	// Generate all possible slots ignoring exclusions
	const allSlots = generateSlotsForDay({ ...schedule, excludedStartTimes: [] });

	if (allSlots.length === 0) {
		return (
			<p className='text-xs text-muted-foreground'>No se generan slots con este horario.</p>
		);
	}

	const excluded = new Set(schedule.excludedStartTimes ?? []);

	return (
		<div className='flex flex-wrap gap-2'>
			{allSlots.map((start) => {
				const end = endTime(start, schedule.durationMinutes);
				const isExcluded = excluded.has(start);
				return (
					<div key={start} className={`flex flex-col border overflow-hidden ${isExcluded ? 'border-error/40' : 'border-border'}`}>
						<span
							className={`px-2 py-0.5 text-center font-medium leading-tight ${
								isExcluded
									? 'bg-error text-white'
									: 'bg-success text-white'
							}`}
							style={{ fontSize: '9px' }}
						>
							{isExcluded ? 'No disponible' : 'Disponible'}
						</span>
						<span
							className={`inline-flex items-center gap-1 px-2 py-1 text-xs ${
								isExcluded
									? 'bg-error/5 text-muted-foreground line-through'
									: 'bg-surface text-foreground'
							}`}
						>
							{start}–{end}
							{isExcluded ? (
								<button
									type='button'
									onClick={() => onRestore(start)}
									className='no-underline text-success hover:opacity-70 transition-opacity ml-0.5'
									aria-label={`Restaurar slot ${start}`}
									title='Restaurar'
								>
									↺
								</button>
							) : (
								<button
									type='button'
									onClick={() => onExclude(start)}
									className='text-muted-foreground hover:text-error transition-colors ml-0.5'
									aria-label={`Eliminar slot ${start}`}
								>
									×
								</button>
							)}
						</span>
					</div>
				);
			})}
		</div>
	);
}
