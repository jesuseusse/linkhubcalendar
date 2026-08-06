'use client';

import { ScheduleDraft, saveDraft, DEFAULT_DAY_SCHEDULE, validateDaySchedule } from './scheduleTypes';
import { DayScheduleForm } from './DayScheduleForm';

interface Props {
	draft: ScheduleDraft;
	onChange: (draft: ScheduleDraft) => void;
	onNext: () => void;
	onBack: () => void;
}

export function StepDefaultSchedule({ draft, onChange, onNext, onBack }: Props) {
	const schedule = draft.defaultSchedule ?? DEFAULT_DAY_SCHEDULE;

	const update = (s: import('./scheduleTypes').DaySchedule) => {
		const updated = { ...draft, defaultSchedule: s };
		saveDraft(updated);
		onChange(updated);
	};

	const error = validateDaySchedule(schedule);
	const canContinue = error === null;

	return (
		<div className='space-y-6'>
			<div>
				<h2 className='text-base font-semibold text-foreground mb-1'>
					Horario de atención
				</h2>
				<p className='text-sm text-muted-foreground'>
					Este horario aplicará a todos tus días de atención.
				</p>
			</div>
			<DayScheduleForm schedule={schedule} onChange={update} error={error} />
			<div className='flex gap-3'>
				<button
					type='button'
					onClick={onBack}
					className='px-4 py-2 text-sm border border-border text-foreground hover:border-foreground transition-colors'
				>
					← Regresar
				</button>
				<button
					type='button'
					disabled={!canContinue}
					onClick={onNext}
					title={canContinue ? undefined : error ?? undefined}
					className='flex-1 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors'
				>
					Siguiente →
				</button>
			</div>
		</div>
	);
}
