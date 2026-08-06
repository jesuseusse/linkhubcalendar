'use client';

import {
	ScheduleDraft,
	saveDraft,
	ORDERED_DAYS,
	DAY_LABELS,
	DaySchedule,
	effectiveDaySchedule,
	validateDaySchedule,
} from './scheduleTypes';
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
		const prevSchedule = effectiveDaySchedule(draft.perDaySchedules, prev);
		updateDay(day, { ...prevSchedule });
	};

	// A day the user never touched still has a valid, visible schedule — the same
	// DEFAULT_DAY_SCHEDULE fallback shown in the form below. Requiring an explicit
	// draft entry per day (the previous check) blocked "Siguiente" on every untouched
	// day even though nothing was actually wrong with it. Validate what's effectively
	// configured, not whether the user happened to interact with the inputs.
	const dayErrors = new Map<number, string>();
	for (const day of activeDays) {
		const error = validateDaySchedule(effectiveDaySchedule(draft.perDaySchedules, day));
		if (error) dayErrors.set(day, error);
	}
	const canContinue = dayErrors.size === 0;
	const invalidDayLabels = [...dayErrors.keys()].map((d) => DAY_LABELS[d]);

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
							schedule={effectiveDaySchedule(draft.perDaySchedules, day)}
							onChange={(s) => updateDay(day, s)}
							onCopyPrevious={idx > 0 ? () => copyFromPrevious(day) : undefined}
							error={dayErrors.get(day)}
						/>
					</div>
				))}
			</div>
			{!canContinue && (
				<p className='text-xs text-error' role='alert'>
					⚠ Corrige el horario de: {invalidDayLabels.join(', ')}
				</p>
			)}
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
					title={canContinue ? undefined : `Corrige el horario de: ${invalidDayLabels.join(', ')}`}
					className='flex-1 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors'
				>
					Siguiente →
				</button>
			</div>
		</div>
	);
}
