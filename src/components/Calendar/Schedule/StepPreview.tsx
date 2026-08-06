'use client';

import { ScheduleDraft, DAY_LABELS, ORDERED_DAYS, DEFAULT_DAY_SCHEDULE, draftToWeeklySchedule, effectiveDaySchedule } from './scheduleTypes';
import { generateSlotsForDay } from '@/lib/utils/scheduleGenerator';

interface Props {
	draft: ScheduleDraft;
	onBack: () => void;
	onSave: (schedule: import('./scheduleTypes').WeeklySchedule) => Promise<void>;
	saving: boolean;
}

export function StepPreview({ draft, onBack, onSave, saving }: Props) {
	const activeDays = ORDERED_DAYS.filter((d) => draft.selectedDays.includes(d));

	const getSchedule = (day: number) => {
		if (draft.sameForAllDays) return draft.defaultSchedule ?? DEFAULT_DAY_SCHEDULE;
		return effectiveDaySchedule(draft.perDaySchedules, day);
	};

	const handleSave = async () => {
		await onSave(draftToWeeklySchedule(draft));
	};

	return (
		<div className='space-y-6'>
			<div>
				<h2 className='text-base font-semibold text-foreground mb-1'>
					Vista previa de tu horario
				</h2>
				<p className='text-sm text-muted-foreground'>
					Revisa tu configuración antes de guardar.
				</p>
			</div>
			<div className='border border-border overflow-hidden'>
				<table className='w-full text-sm'>
					<thead className='bg-muted text-muted-foreground'>
						<tr>
							<th className='text-left px-3 py-2 text-xs font-medium'>Día</th>
							<th className='text-left px-3 py-2 text-xs font-medium'>Desde</th>
							<th className='text-left px-3 py-2 text-xs font-medium'>Hasta</th>
							<th className='text-right px-3 py-2 text-xs font-medium'>Slots</th>
						</tr>
					</thead>
					<tbody>
						{activeDays.map((day) => {
							const s = getSchedule(day);
							const count = generateSlotsForDay(s).length;
							return (
								<tr key={day} className='border-t border-border'>
									<td className='px-3 py-2 text-foreground'>{DAY_LABELS[day]}</td>
									<td className='px-3 py-2 text-foreground'>{s.startTime}</td>
									<td className='px-3 py-2 text-foreground'>{s.endTime}</td>
									<td className='px-3 py-2 text-right text-muted-foreground'>{count}</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			<p className='text-xs text-muted-foreground'>
				💡 Puedes desactivar fechas o slots específicos más adelante desde el calendario.
			</p>
			<div className='flex gap-3'>
				<button
					type='button'
					onClick={onBack}
					disabled={saving}
					className='px-4 py-2 text-sm border border-border text-foreground hover:border-foreground transition-colors disabled:opacity-50'
				>
					← Regresar
				</button>
				<button
					type='button'
					onClick={handleSave}
					disabled={saving}
					className='flex-1 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors'
				>
					{saving ? 'Guardando...' : 'Guardar horario'}
				</button>
			</div>
		</div>
	);
}
