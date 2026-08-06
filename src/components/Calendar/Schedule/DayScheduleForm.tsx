'use client';

import { DaySchedule, DURATION_PRESETS, DEFAULT_DAY_SCHEDULE } from './scheduleTypes';
import { SlotPreview } from './SlotPreview';

interface Props {
	label?: string;
	schedule: DaySchedule;
	onChange: (schedule: DaySchedule) => void;
	onCopyPrevious?: () => void;
	/** Validation message shown inline, e.g. "La hora de inicio debe ser anterior a la hora de fin." */
	error?: string | null;
}

export function DayScheduleForm({ label, schedule, onChange, onCopyPrevious, error }: Props) {
	const update = (patch: Partial<DaySchedule>) => {
		onChange({ ...schedule, ...patch });
	};

	const excludeSlot = (startTime: string) => {
		update({ excludedStartTimes: [...(schedule.excludedStartTimes ?? []), startTime] });
	};

	const restoreSlot = (startTime: string) => {
		update({ excludedStartTimes: (schedule.excludedStartTimes ?? []).filter(t => t !== startTime) });
	};

	return (
		<div className='space-y-3'>
			{label && (
				<div className='flex items-center justify-between'>
					<p className='text-sm font-semibold text-foreground'>{label}</p>
					{onCopyPrevious && (
						<button
							type='button'
							onClick={onCopyPrevious}
							className='text-xs text-muted-foreground hover:text-foreground transition-colors underline'
						>
							Mismo que día anterior
						</button>
					)}
				</div>
			)}
			<div className='flex flex-wrap gap-3 items-end'>
				<div>
					<label className='block text-xs text-muted-foreground mb-1'>Desde</label>
					<input
						type='time'
						value={schedule.startTime}
						onChange={(e) => update({ startTime: e.target.value, excludedStartTimes: [] })}
						className='px-2 py-1.5 text-sm border border-border focus:outline-none focus:border-foreground'
					/>
				</div>
				<div>
					<label className='block text-xs text-muted-foreground mb-1'>Hasta</label>
					<input
						type='time'
						value={schedule.endTime}
						onChange={(e) => update({ endTime: e.target.value, excludedStartTimes: [] })}
						className='px-2 py-1.5 text-sm border border-border focus:outline-none focus:border-foreground'
					/>
				</div>
				<div>
					<label className='block text-xs text-muted-foreground mb-1'>Duración</label>
					<div className='flex gap-1'>
						{DURATION_PRESETS.map((min) => (
							<button
								key={min}
								type='button'
								onClick={() => update({ durationMinutes: min, excludedStartTimes: [] })}
								className={`px-2 py-1.5 text-xs border transition-colors ${
									schedule.durationMinutes === min
										? 'bg-primary text-primary-foreground border-primary'
										: 'border-border text-foreground hover:border-foreground'
								}`}
							>
								{min}m
							</button>
						))}
						<input
							type='number'
							min={10}
							max={480}
							step={5}
							placeholder='custom'
							value={DURATION_PRESETS.includes(schedule.durationMinutes) ? '' : schedule.durationMinutes}
							onChange={(e) => {
								const v = parseInt(e.target.value, 10);
								if (v > 0) update({ durationMinutes: v, excludedStartTimes: [] });
							}}
							className='w-16 px-2 py-1.5 text-xs border border-border focus:outline-none focus:border-foreground'
						/>
					</div>
				</div>
			</div>
			{error && (
				<p className='text-xs text-error flex items-center gap-1' role='alert'>
					<span aria-hidden='true'>⚠</span> {error}
				</p>
			)}
			{schedule.startTime && schedule.endTime && schedule.durationMinutes > 0 && (
				<div>
					<p className='text-xs text-muted-foreground mb-2'>
						Slots generados — toca × para excluir, ↺ para restaurar:
					</p>
					<SlotPreview schedule={schedule} onExclude={excludeSlot} onRestore={restoreSlot} />
				</div>
			)}
		</div>
	);
}

export { DEFAULT_DAY_SCHEDULE };
