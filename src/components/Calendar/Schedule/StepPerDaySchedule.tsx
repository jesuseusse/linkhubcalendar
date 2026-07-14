'use client';

import { ScheduleDraft, saveDraft, DEFAULT_DAY_SCHEDULE, ORDERED_DAYS, DAY_LABELS, DaySchedule } from './scheduleTypes';
import { DayScheduleForm } from './DayScheduleForm';

interface Props {
	draft: ScheduleDraft;
	onChange: (draft: ScheduleDraft) => void;
	onNext: () => void;
	onBack: () => void;
}

export function StepPerDaySchedule({ draft, onChange, onNext, onBack }: Props) {
	const activeDays = ORDERED_DAYS.filter((d) => draft.selectedDays.includes(d));

	const updateDay = (day: number, schedule: DaySchedule) => {
		const updated: ScheduleDraft = {
			...draft,
			perDaySchedules: { ...draft.perDaySchedules, [day]: schedule },
		};
		saveDraft(updated);
		onChange(updated);
	};

	const copyFromPrevious = (day: number) => {
		const idx = activeDays.indexOf(day);
		if (idx <= 0) return;
		const prev = activeDays[idx - 1];
		const prevSchedule = draft.perDaySchedules[prev] ?? DEFAULT_DAY_SCHEDULE;
		updateDay(day, { ...prevSchedule });
	};

	const canContinue = activeDays.every((d) => {
		const s = draft.perDaySchedules[d];
		return s && s.startTime < s.endTime && s.durationMinutes > 0;
	});

	return (
		<div className='space-y-6'>
			<div>
				<h2 className='text-base font-semibold text-foreground mb-1'>
					Horario por día
				</h2>
				<p className='text-sm text-muted-foreground'>
					Configura el horario de atención para cada día seleccionado.
				</p>
			</div>
			<div className='space-y-6'>
				{activeDays.map((day, idx) => (
					<div key={day} className='border border-border p-4'>
						<DayScheduleForm
							label={DAY_LABELS[day]}
							schedule={draft.perDaySchedules[day] ?? DEFAULT_DAY_SCHEDULE}
							onChange={(s) => updateDay(day, s)}
							onCopyPrevious={idx > 0 ? () => copyFromPrevious(day) : undefined}
						/>
					</div>
				))}
			</div>
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
					className='flex-1 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors'
				>
					Siguiente →
				</button>
			</div>
		</div>
	);
}
