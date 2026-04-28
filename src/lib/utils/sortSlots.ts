interface SlotLike {
	date: string;
	startTime: string;
}

export function sortSlotsByDateTime<T extends SlotLike>(slots: T[]): T[] {
	return [...slots].sort((a, b) => {
		if (a.date !== b.date) return a.date.localeCompare(b.date);
		return a.startTime.localeCompare(b.startTime);
	});
}

export function filterFutureSlots<T extends SlotLike>(slots: T[], nowDate: string, nowTime: string): T[] {
	return slots.filter((slot) => {
		if (slot.date > nowDate) return true;
		if (slot.date === nowDate) return slot.startTime >= nowTime;
		return false;
	});
}
