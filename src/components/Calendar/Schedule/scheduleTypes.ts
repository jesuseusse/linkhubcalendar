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
	return {
		days: draft.selectedDays,
		sameForAllDays,
		defaultSchedule: sameForAllDays ? (draft.defaultSchedule ?? DEFAULT_DAY_SCHEDULE) : undefined,
		perDaySchedule: !sameForAllDays ? draft.perDaySchedules : undefined,
	};
}
