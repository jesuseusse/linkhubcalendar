'use client';

import { useState, useEffect, useCallback } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, eachDayOfInterval } from 'date-fns';
import { CalendarSlotDto, CreateCalendarSlotDto } from '@/dtos/user.dto';
import 'react-day-picker/style.css';

const DRAFT_KEY = 'linkhub_calendar_draft';

// 0 = Sunday … 6 = Saturday
const WEEK_DAYS = [
	{ index: 1, label: 'Lun', fullLabel: 'Lunes' },
	{ index: 2, label: 'Mar', fullLabel: 'Martes' },
	{ index: 3, label: 'Mié', fullLabel: 'Miércoles' },
	{ index: 4, label: 'Jue', fullLabel: 'Jueves' },
	{ index: 5, label: 'Vie', fullLabel: 'Viernes' },
	{ index: 6, label: 'Sáb', fullLabel: 'Sábado' },
	{ index: 0, label: 'Dom', fullLabel: 'Domingo' }
] as const;

const DURATION_PRESETS = [
	{ label: '30 min', minutes: 30 },
	{ label: '1 hr', minutes: 60 },
	{ label: '1.5 hr', minutes: 90 },
	{ label: '2 hr', minutes: 120 }
];

const DEFAULT_START = '08:00';
const DEFAULT_DURATION = 60;
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

interface DraftSlot {
	id: string;
	startTime: string;
	endTime: string;
}

interface Draft {
	dateFrom: string | null;
	dateTo: string | null;
	duration: number;
	activeDays: number[];
	slots: DraftSlot[];
}

function addMinutes(time: string, minutes: number): string {
	const [h, m] = time.split(':').map(Number);
	const total = h * 60 + m + minutes;
	return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function buildEmptyDraft(): Draft {
	return {
		dateFrom: null,
		dateTo: null,
		duration: DEFAULT_DURATION,
		activeDays: [...ALL_DAYS],
		slots: [
			{
				id: crypto.randomUUID(),
				startTime: DEFAULT_START,
				endTime: addMinutes(DEFAULT_START, DEFAULT_DURATION)
			}
		]
	};
}

function loadDraft(): Draft {
	if (typeof window === 'undefined') return buildEmptyDraft();
	try {
		const raw = localStorage.getItem(DRAFT_KEY);
		if (raw) {
			const parsed = JSON.parse(raw) as Draft;
			// back-fill activeDays for drafts saved before this field existed
			if (!parsed.activeDays) parsed.activeDays = [...ALL_DAYS];
			return parsed;
		}
	} catch {
		// ignore parse errors
	}
	return buildEmptyDraft();
}

interface Props {
	slots: CalendarSlotDto[];
	onAddSlot: (
		dto: CreateCalendarSlotDto | CreateCalendarSlotDto[]
	) => Promise<void>;
	onDeleteSlot: (slotId: string) => Promise<void>;
	onReleaseSlot: (slotId: string) => Promise<void>;
	onClose: () => void;
	loading: boolean;
}

export function ModalCalendarManager({
	slots,
	onAddSlot,
	onDeleteSlot,
	onReleaseSlot,
	onClose,
	loading
}: Props) {
	const [draft, setDraft] = useState<Draft>(buildEmptyDraft);
	const [saving, setSaving] = useState(false);
	// Local string for the custom-duration input so user can type freely
	const [customDurationStr, setCustomDurationStr] = useState(
		String(DEFAULT_DURATION)
	);

	useEffect(() => {
		const d = loadDraft();
		setDraft(d);
		setCustomDurationStr(String(d.duration));
	}, []);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
		}
	}, [draft]);

	const updateDraft = useCallback((updater: (prev: Draft) => Draft) => {
		setDraft(updater);
	}, []);

	// ── Duration ────────────────────────────────────────────────────────────────
	const applyDuration = useCallback(
		(minutes: number) => {
			const safe = Math.max(1, minutes);
			setCustomDurationStr(String(safe));
			updateDraft(prev => ({
				...prev,
				duration: safe,
				slots: prev.slots.map(slot => ({
					...slot,
					endTime: addMinutes(slot.startTime, safe)
				}))
			}));
		},
		[updateDraft]
	);

	const handlePresetClick = (minutes: number) => applyDuration(minutes);

	const handleCustomDurationChange = (raw: string) => {
		setCustomDurationStr(raw);
		const parsed = parseInt(raw, 10);
		if (!isNaN(parsed) && parsed > 0) applyDuration(parsed);
	};

	// ── Days of week ─────────────────────────────────────────────────────────────
	const toggleDay = (dayIndex: number) => {
		updateDraft(prev => {
			const has = prev.activeDays.includes(dayIndex);
			// prevent deselecting the last active day
			if (has && prev.activeDays.length === 1) return prev;
			return {
				...prev,
				activeDays: has
					? prev.activeDays.filter(d => d !== dayIndex)
					: [...prev.activeDays, dayIndex]
			};
		});
	};

	// ── Date range ───────────────────────────────────────────────────────────────
	const handleRangeSelect = (range: DateRange | undefined) => {
		updateDraft(prev => ({
			...prev,
			dateFrom: range?.from ? format(range.from, 'yyyy-MM-dd') : null,
			dateTo: range?.to ? format(range.to, 'yyyy-MM-dd') : null
		}));
	};

	// ── Slots ────────────────────────────────────────────────────────────────────
	const handleAddSlot = () => {
		updateDraft(prev => {
			const last = prev.slots[prev.slots.length - 1];
			const startTime = last?.endTime ?? DEFAULT_START;
			return {
				...prev,
				slots: [
					...prev.slots,
					{
						id: crypto.randomUUID(),
						startTime,
						endTime: addMinutes(startTime, prev.duration)
					}
				]
			};
		});
	};

	const handleRemoveSlot = (id: string) => {
		updateDraft(prev => ({
			...prev,
			slots: prev.slots.filter(s => s.id !== id)
		}));
	};

	const handleUpdateTime = (
		id: string,
		field: 'startTime' | 'endTime',
		value: string
	) => {
		updateDraft(prev => ({
			...prev,
			slots: prev.slots.map(s => (s.id === id ? { ...s, [field]: value } : s))
		}));
	};

	// ── Save ─────────────────────────────────────────────────────────────────────
	const handleSave = async () => {
		if (!draft.dateFrom || draft.slots.length === 0) return;
		setSaving(true);
		try {
			const from = new Date(draft.dateFrom + 'T00:00:00');
			const to = draft.dateTo ? new Date(draft.dateTo + 'T00:00:00') : from;
			const allDates = eachDayOfInterval({ start: from, end: to });
			const filteredDates = allDates.filter(d =>
				draft.activeDays.includes(d.getDay())
			);
			const dtos: CreateCalendarSlotDto[] = filteredDates.flatMap(date =>
				draft.slots.map(slot => ({
					date: format(date, 'yyyy-MM-dd'),
					startTime: slot.startTime,
					endTime: slot.endTime
				}))
			);
			await onAddSlot(dtos);
			localStorage.removeItem(DRAFT_KEY);
			setDraft(buildEmptyDraft());
			setCustomDurationStr(String(DEFAULT_DURATION));
			onClose();
		} finally {
			setSaving(false);
		}
	};

	// ── Derived ──────────────────────────────────────────────────────────────────
	const rangeValue: DateRange | undefined = draft.dateFrom
		? {
				from: new Date(draft.dateFrom + 'T00:00:00'),
				to: draft.dateTo ? new Date(draft.dateTo + 'T00:00:00') : undefined
			}
		: undefined;

	const sortedSlots = [...slots].sort((a, b) =>
		a.date !== b.date
			? a.date.localeCompare(b.date)
			: a.startTime.localeCompare(b.startTime)
	);

	const groupedSlots = sortedSlots.reduce<Record<string, CalendarSlotDto[]>>(
		(acc, slot) => {
			(acc[slot.date] ??= []).push(slot);
			return acc;
		},
		{}
	);

	const canSave =
		!saving && !loading && !!draft.dateFrom && draft.slots.length > 0;

	return (
		<>
			{/* Backdrop — only visible on md+ */}
			<div
				className='hidden md:block fixed inset-0 bg-black/40 z-40'
				onClick={onClose}
			/>

			{/* Panel: full screen on mobile, right drawer on md+ */}
			<div className='fixed inset-0 md:inset-auto md:top-0 md:right-0 md:h-full md:w-1/2 bg-background z-50 flex flex-col overflow-hidden shadow-2xl'>
				{/* Header */}
				<div className='flex items-center justify-between px-6 py-4 border-b border-border shrink-0'>
					<h2 className='text-base font-semibold text-foreground'>
						Gestión de calendario
					</h2>
					<button
						onClick={onClose}
						aria-label='Cerrar'
						className='text-muted-foreground hover:text-foreground text-2xl leading-none'
					>
						&times;
					</button>
				</div>

				{/* Scrollable body */}
				<div className='flex-1 overflow-y-auto p-6 space-y-6'>
					{/* ── Date range ── */}
					<section>
						<p className='text-sm font-medium text-foreground mb-3'>
							Seleccion una fecha inicial y una final (rango)
						</p>
						<div className='flex justify-center'>
							<DayPicker
								mode='range'
								selected={rangeValue}
								onSelect={handleRangeSelect}
								disabled={{ before: new Date() }}
							/>
						</div>
						{draft.dateFrom && (
							<p className='text-xs text-muted-foreground mt-1 text-center'>
								{draft.dateFrom}
								{draft.dateTo && draft.dateTo !== draft.dateFrom
									? ` → ${draft.dateTo}`
									: ''}
							</p>
						)}
					</section>

					{/* ── Days of week ── */}
					<section>
						<p className='text-sm font-medium text-foreground mb-2'>
							Días de la semana
						</p>
						<div className='flex gap-1.5 flex-wrap'>
							{WEEK_DAYS.map(({ index, label }) => {
								const active = draft.activeDays.includes(index);
								return (
									<button
										key={index}
										type='button'
										onClick={() => toggleDay(index)}
										className={`w-10 py-1.5 text-xs font-medium transition-colors rounded-sm ${
											active
												? 'bg-primary text-primary-foreground'
												: 'bg-muted text-muted-foreground hover:bg-primary/10'
										}`}
									>
										{label}
									</button>
								);
							})}
						</div>
						<p className='text-xs text-muted-foreground mt-1.5'>
							Solo se crearan horarios los días:{' '}
							{WEEK_DAYS.filter(d => draft.activeDays.includes(d.index))
								.map(d => d.fullLabel)
								.join(', ')}
						</p>
					</section>

					{/* ── Duration ── */}
					<section>
						<p className='text-sm font-medium text-foreground mb-2'>
							Duración por horario
						</p>
						<div className='flex items-center gap-2 flex-wrap'>
							{DURATION_PRESETS.map(opt => (
								<button
									key={opt.minutes}
									type='button'
									onClick={() => handlePresetClick(opt.minutes)}
									className={`px-3 py-1 text-xs font-medium transition-colors ${
										draft.duration === opt.minutes
											? 'bg-primary text-primary-foreground'
											: 'bg-muted text-muted-foreground hover:bg-primary/10'
									}`}
								>
									{opt.label}
								</button>
							))}
							<div className='flex items-center gap-1 ml-1'>
								<input
									type='number'
									min={1}
									max={480}
									value={customDurationStr}
									onChange={e => handleCustomDurationChange(e.target.value)}
									className='w-16 px-2 py-1 text-xs border border-border bg-background focus:outline-none focus:border-foreground text-center'
									aria-label='Duración personalizada en minutos'
								/>
								<span className='text-xs text-muted-foreground'>min</span>
							</div>
						</div>
					</section>

					{/* ── Draft slots ── */}
					<section>
						<p className='text-sm font-medium text-foreground mb-2'>
							Horarios del borrador
						</p>

						{draft.slots.length === 0 ? (
							<p className='text-xs text-muted-foreground'>
								Sin horarios agregados.
							</p>
						) : (
							<div className='space-y-2'>
								{draft.slots.map(slot => (
									<div
										key={slot.id}
										className='flex items-center gap-2 bg-surface border border-border px-3 py-2'
									>
										<input
											type='time'
											value={slot.startTime}
											onChange={e =>
												handleUpdateTime(slot.id, 'startTime', e.target.value)
											}
											className='px-2 py-1 text-sm border border-border bg-background focus:outline-none focus:border-foreground'
										/>
										<span className='text-xs text-muted-foreground'>—</span>
										<input
											type='time'
											value={slot.endTime}
											onChange={e =>
												handleUpdateTime(slot.id, 'endTime', e.target.value)
											}
											className='px-2 py-1 text-sm border border-border bg-background focus:outline-none focus:border-foreground'
										/>
										<button
											type='button'
											onClick={() => handleRemoveSlot(slot.id)}
											aria-label='Eliminar horario'
											className='ml-auto text-error hover:text-error/80 text-xl leading-none'
										>
											&times;
										</button>
									</div>
								))}
							</div>
						)}

						<button
							type='button'
							onClick={handleAddSlot}
							className='mt-3 text-xs font-medium text-primary hover:underline'
						>
							+ Agregar horario
						</button>
					</section>

					{/* ── Saved slots ── */}
					{Object.keys(groupedSlots).length > 0 && (
						<section className='border-t border-border pt-5'>
							<p className='text-sm font-medium text-foreground mb-3'>
								Horarios guardados
							</p>
							<div className='space-y-4'>
								{Object.entries(groupedSlots).map(([date, dateSlots]) => (
									<div key={date}>
										<p className='text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider'>
											{format(new Date(date + 'T00:00:00'), 'MMMM d, yyyy')}
										</p>
										<div className='space-y-1'>
											{dateSlots.map(slot => (
												<div
													key={slot.id}
													className='flex items-center justify-between bg-surface border border-border px-3 py-2'
												>
													<span className='text-sm text-foreground'>
														{slot.startTime} – {slot.endTime}
													</span>
													<div className='flex items-center gap-2'>
														{slot.booked ? (
															<>
																<span className='text-xs px-2 py-0.5 bg-warning-light border border-warning text-warning'>
																	Reservado
																</span>
																<button
																	onClick={() => onReleaseSlot(slot.id)}
																	disabled={loading}
																	className='text-xs text-info hover:underline disabled:opacity-50'
																>
																	Liberar
																</button>
															</>
														) : (
															<button
																onClick={() => onDeleteSlot(slot.id)}
																disabled={loading}
																className='text-xs text-error hover:underline disabled:opacity-50'
															>
																Eliminar
															</button>
														)}
													</div>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						</section>
					)}
				</div>

				{/* Footer */}
				<div className='px-6 py-4 border-t border-border flex gap-3 justify-end shrink-0'>
					<button
						type='button'
						onClick={onClose}
						className='px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors'
					>
						Cancelar
					</button>
					<button
						type='button'
						onClick={handleSave}
						disabled={!canSave}
						className='px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors'
					>
						{saving ? 'Guardando...' : 'Guardar'}
					</button>
				</div>
			</div>
		</>
	);
}
