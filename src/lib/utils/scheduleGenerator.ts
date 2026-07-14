import { WeeklySchedule, DaySchedule, ScheduleException } from '@/domain/entities/User';
import { CalendarSlotDto } from '@/dtos/user.dto';

function pad(n: number): string {
	return n.toString().padStart(2, '0');
}

function timeToMinutes(time: string): number {
	const [h, m] = time.split(':').map(Number);
	return h * 60 + m;
}

function minutesToTime(minutes: number): string {
	return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export function generateSlotsForDay(schedule: DaySchedule): string[] {
	const start = timeToMinutes(schedule.startTime);
	const end = timeToMinutes(schedule.endTime);
	const excluded = new Set(schedule.excludedStartTimes ?? []);
	const slots: string[] = [];
	for (let t = start; t + schedule.durationMinutes <= end; t += schedule.durationMinutes) {
		const startTime = minutesToTime(t);
		if (!excluded.has(startTime)) {
			slots.push(startTime);
		}
	}
	return slots;
}

function getDaySchedule(weeklySchedule: WeeklySchedule, dayOfWeek: number): DaySchedule | null {
	if (!weeklySchedule.days.includes(dayOfWeek)) return null;
	if (weeklySchedule.sameForAllDays) {
		return weeklySchedule.defaultSchedule ?? null;
	}
	return weeklySchedule.perDaySchedule?.[dayOfWeek] ?? null;
}

export function generateSlotsForMonth(
	weeklySchedule: WeeklySchedule,
	year: number,
	month: number,
	exceptions: ScheduleException[],
	bookedStartTimes: Map<string, Set<string>>,
): CalendarSlotDto[] {
	const exceptionMap = new Map<string, ScheduleException>();
	for (const ex of exceptions) {
		exceptionMap.set(ex.date, ex);
	}

	const slots: CalendarSlotDto[] = [];
	const daysInMonth = new Date(year, month, 0).getDate();

	for (let day = 1; day <= daysInMonth; day++) {
		const date = new Date(year, month - 1, day);
		const dayOfWeek = date.getDay();
		const dateStr = `${year}-${pad(month)}-${pad(day)}`;

		const daySchedule = getDaySchedule(weeklySchedule, dayOfWeek);
		if (!daySchedule) continue;

		const exception = exceptionMap.get(dateStr);
		if (exception && !exception.disabledSlotTimes) continue;

		const disabledSlots = new Set(exception?.disabledSlotTimes ?? []);
		const bookedSlots = bookedStartTimes.get(dateStr) ?? new Set<string>();

		const startTimes = generateSlotsForDay(daySchedule);
		for (const startTime of startTimes) {
			if (disabledSlots.has(startTime)) continue;
			if (bookedSlots.has(startTime)) continue;

			const startMin = timeToMinutes(startTime);
			const endTime = minutesToTime(startMin + daySchedule.durationMinutes);

			slots.push({
				id: `${dateStr.replace(/-/g, '')}_${startTime.replace(':', '')}`,
				date: dateStr,
				startTime,
				endTime,
			});
		}
	}

	return slots;
}
