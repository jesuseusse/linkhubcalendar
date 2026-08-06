import { DaySchedule, WeeklySchedule } from '@/domain/entities/User';

export type { DaySchedule, WeeklySchedule };

export interface ScheduleDraft {
	selectedDays: number[];
	sameForAllDays: boolean | null;
	defaultSchedule: DaySchedule | null;
	perDaySchedules: Partial<Record<number, DaySchedule>>;
}

export const DRAFT_KEY = 'linkhub_schedule_draft';

export const DAY_LABELS: Record<number, string> = {
	1: 'Lunes',
	2: 'Martes',
	3: 'Miércoles',
	4: 'Jueves',
	5: 'Viernes',
	6: 'Sábado',
	0: 'Domingo',
};

export const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0];

export const DURATION_PRESETS = [30, 60, 90, 120];

export const DEFAULT_DAY_SCHEDULE: DaySchedule = {
	startTime: '09:00',
	endTime: '18:00',
	durationMinutes: 60,
};

export function buildEmptyDraft(): ScheduleDraft {
	return {
		selectedDays: [1, 2, 3, 4, 5],
		sameForAllDays: null,
		defaultSchedule: null,
		perDaySchedules: {},
	};
}

export function loadDraft(): ScheduleDraft {
	if (typeof window === 'undefined') return buildEmptyDraft();
	try {
		const raw = localStorage.getItem(DRAFT_KEY);
		if (!raw) return buildEmptyDraft();
		return JSON.parse(raw) as ScheduleDraft;
	} catch {
		return buildEmptyDraft();
	}
}

export function saveDraft(draft: ScheduleDraft): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft(): void {
	if (typeof window === 'undefined') return;
	localStorage.removeItem(DRAFT_KEY);
}

export function draftToWeeklySchedule(draft: ScheduleDraft): WeeklySchedule {
	const sameForAllDays = draft.sameForAllDays ?? true;
	// getDaySchedule() in scheduleGenerator.ts does NOT fall back to DEFAULT_DAY_SCHEDULE for
	// missing per-day entries — it returns null, which means zero bookable slots for that day.
	// A day the user never touched (and so is absent from perDaySchedules) must still be
	// written out explicitly here, or the saved schedule silently has no availability on it.
	const perDaySchedule = !sameForAllDays
		? Object.fromEntries(
				draft.selectedDays.map((day) => [day, effectiveDaySchedule(draft.perDaySchedules, day)])
			)
		: undefined;
	return {
		days: draft.selectedDays,
		sameForAllDays,
		defaultSchedule: sameForAllDays ? (draft.defaultSchedule ?? DEFAULT_DAY_SCHEDULE) : undefined,
		perDaySchedule,
	};
}

/**
 * Seeds a stepper draft from an already-saved schedule (the "Reconfigurar horarios" flow).
 * Without this, reconfiguring always started from a blank draft — the user had to re-pick
 * every day and re-enter every time from scratch even though nothing needed to change.
 */
export function weeklyScheduleToDraft(schedule: WeeklySchedule): ScheduleDraft {
	return {
		selectedDays: schedule.days,
		sameForAllDays: schedule.sameForAllDays,
		defaultSchedule: schedule.sameForAllDays ? (schedule.defaultSchedule ?? null) : null,
		perDaySchedules: !schedule.sameForAllDays ? { ...(schedule.perDaySchedule ?? {}) } : {},
	};
}

/** Effective schedule for a day: an explicit entry, falling back to the shared default. */
export function effectiveDaySchedule(
	perDaySchedules: Partial<Record<number, DaySchedule>>,
	day: number
): DaySchedule {
	return perDaySchedules[day] ?? DEFAULT_DAY_SCHEDULE;
}

/** Human-readable reason a DaySchedule can't be used yet, or null if it's valid. */
export function validateDaySchedule(schedule: DaySchedule): string | null {
	if (!(schedule.startTime < schedule.endTime)) {
		return 'La hora de inicio debe ser anterior a la hora de fin.';
	}
	if (!(schedule.durationMinutes > 0)) {
		return 'Selecciona una duración válida.';
	}
	return null;
}
