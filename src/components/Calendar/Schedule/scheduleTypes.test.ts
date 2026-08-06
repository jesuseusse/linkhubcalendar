import { describe, it, expect } from 'vitest';
import {
	buildEmptyDraft,
	draftToWeeklySchedule,
	weeklyScheduleToDraft,
	effectiveDaySchedule,
	validateDaySchedule,
	DEFAULT_DAY_SCHEDULE,
	ScheduleDraft,
} from './scheduleTypes';

describe('effectiveDaySchedule', () => {
	it('returns the explicit entry when present', () => {
		const custom = { startTime: '10:00', endTime: '14:00', durationMinutes: 30 };
		expect(effectiveDaySchedule({ 1: custom }, 1)).toEqual(custom);
	});

	it('falls back to DEFAULT_DAY_SCHEDULE for a day never touched by the user', () => {
		expect(effectiveDaySchedule({}, 1)).toEqual(DEFAULT_DAY_SCHEDULE);
	});
});

describe('validateDaySchedule', () => {
	it('accepts a well-formed schedule', () => {
		expect(validateDaySchedule(DEFAULT_DAY_SCHEDULE)).toBeNull();
	});

	it('rejects startTime >= endTime', () => {
		expect(
			validateDaySchedule({ startTime: '18:00', endTime: '09:00', durationMinutes: 60 })
		).toMatch(/anterior/);
	});

	it('rejects a non-positive duration', () => {
		expect(
			validateDaySchedule({ startTime: '09:00', endTime: '18:00', durationMinutes: 0 })
		).toMatch(/duración/);
	});
});

describe('draftToWeeklySchedule — per-day backfill', () => {
	function makeDraft(overrides: Partial<ScheduleDraft> = {}): ScheduleDraft {
		return { ...buildEmptyDraft(), sameForAllDays: false, selectedDays: [1, 2, 3], ...overrides };
	}

	it('writes an explicit DaySchedule for every selected day, even ones never touched', () => {
		// Regression test: getDaySchedule() in scheduleGenerator.ts has no fallback for
		// missing perDaySchedule entries — it returns null (zero bookable slots). A day
		// absent from perDaySchedules must never reach persistence as a gap.
		const draft = makeDraft({ perDaySchedules: { 1: { startTime: '08:00', endTime: '12:00', durationMinutes: 30 } } });
		const result = draftToWeeklySchedule(draft);

		expect(result.perDaySchedule?.[1]).toEqual({ startTime: '08:00', endTime: '12:00', durationMinutes: 30 });
		expect(result.perDaySchedule?.[2]).toEqual(DEFAULT_DAY_SCHEDULE);
		expect(result.perDaySchedule?.[3]).toEqual(DEFAULT_DAY_SCHEDULE);
	});

	it('omits perDaySchedule entirely when sameForAllDays is true, using defaultSchedule instead', () => {
		const draft = makeDraft({ sameForAllDays: true, defaultSchedule: null });
		const result = draftToWeeklySchedule(draft);

		expect(result.perDaySchedule).toBeUndefined();
		expect(result.defaultSchedule).toEqual(DEFAULT_DAY_SCHEDULE);
	});
});

describe('weeklyScheduleToDraft — seeding the wizard from a saved schedule', () => {
	it('round-trips a per-day schedule so "Reconfigurar horarios" starts prefilled', () => {
		const saved = {
			days: [1, 2],
			sameForAllDays: false,
			perDaySchedule: {
				1: { startTime: '08:00', endTime: '12:00', durationMinutes: 30 },
				2: { startTime: '09:00', endTime: '18:00', durationMinutes: 60 },
			},
		};

		const draft = weeklyScheduleToDraft(saved);

		expect(draft.selectedDays).toEqual([1, 2]);
		expect(draft.sameForAllDays).toBe(false);
		expect(draft.perDaySchedules).toEqual(saved.perDaySchedule);
		// Round-tripping back through draftToWeeklySchedule must reproduce the same data —
		// editing an already-valid saved schedule shouldn't require touching every input.
		expect(draftToWeeklySchedule(draft).perDaySchedule).toEqual(saved.perDaySchedule);
	});

	it('round-trips a shared (sameForAllDays) schedule', () => {
		const saved = {
			days: [1, 2, 3, 4, 5],
			sameForAllDays: true,
			defaultSchedule: { startTime: '10:00', endTime: '20:00', durationMinutes: 45 },
		};

		const draft = weeklyScheduleToDraft(saved);

		expect(draft.defaultSchedule).toEqual(saved.defaultSchedule);
		expect(draftToWeeklySchedule(draft).defaultSchedule).toEqual(saved.defaultSchedule);
	});
});
