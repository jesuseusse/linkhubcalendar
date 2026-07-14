'use client';

import { ORDERED_DAYS, DAY_LABELS, ScheduleDraft, saveDraft } from './scheduleTypes';

interface Props {
	draft: ScheduleDraft;
	onChange: (draft: ScheduleDraft) => void;
	onNext: () => void;
}

export function StepDaySelector({ draft, onChange, onNext }: Props) {
	const toggle = (day: number) => {
		const next = draft.selectedDays.includes(day)
			? draft.selectedDays.filter((d) => d !== day)
			: [...draft.selectedDays, day];
		const updated = { ...draft, selectedDays: next };
		saveDraft(updated);
		onChange(updated);
	};

	return (
		<div className='space-y-6'>
			<div>
				<h2 className='text-base font-semibold text-foreground mb-1'>
					¿Qué días atiendes?
				</h2>
				<p className='text-sm text-muted-foreground'>
					Selecciona los días de la semana en que estás disponible.
				</p>
			</div>
			<div className='grid grid-cols-4 sm:grid-cols-7 gap-2'>
				{ORDERED_DAYS.map((day) => {
					const selected = draft.selectedDays.includes(day);
					return (
						<button
							key={day}
							type='button'
							onClick={() => toggle(day)}
							className={`py-3 text-xs font-medium border transition-colors ${
								selected
									? 'bg-primary text-primary-foreground border-primary'
									: 'bg-surface border-border text-foreground hover:border-foreground'
							}`}
						>
							{DAY_LABELS[day].slice(0, 3)}
						</button>
					);
				})}
			</div>
			<button
				type='button'
				disabled={draft.selectedDays.length === 0}
				onClick={onNext}
				className='w-full py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors'
			>
				Siguiente →
			</button>
		</div>
	);
}
