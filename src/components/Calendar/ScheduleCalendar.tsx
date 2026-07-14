'use client';

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { WeeklySchedule, ScheduleException } from '@/domain/entities/User';
import { generateSlotsForMonth } from '@/lib/utils/scheduleGenerator';
import { ExceptionModal } from './ExceptionModal';
import 'react-day-picker/style.css';

const MONTH_NAMES = [
	'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
	'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface Props {
	weeklySchedule: WeeklySchedule;
	exceptions: ScheduleException[];
	onUpdateExceptions: (exceptions: ScheduleException[]) => Promise<void>;
}

function getDayStatus(
	dateStr: string,
	weeklySchedule: WeeklySchedule,
	exceptions: ScheduleException[]
): 'none' | 'available' | 'partial' | 'disabled' {
	const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
	if (!weeklySchedule.days.includes(dayOfWeek)) return 'none';

	const exception = exceptions.find((e) => e.date === dateStr);
	if (exception && !exception.disabledSlotTimes) return 'disabled';
	if (exception?.disabledSlotTimes && exception.disabledSlotTimes.length > 0) return 'partial';
	return 'available';
}

export function ScheduleCalendar({ weeklySchedule, exceptions, onUpdateExceptions }: Props) {
	const today = new Date();
	const [displayMonth, setDisplayMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
	const [selectedDate, setSelectedDate] = useState<string | null>(null);

	const year = displayMonth.getFullYear();
	const month = displayMonth.getMonth() + 1;

	const allSlots = generateSlotsForMonth(weeklySchedule, year, month, [], new Map());
	const activeDates = new Set(allSlots.map((s) => s.date));

	const prevMonth = () => {
		setDisplayMonth(new Date(year, month - 2, 1));
	};
	const nextMonth = () => {
		setDisplayMonth(new Date(year, month, 1));
	};

	const handleDayClick = (day: Date) => {
		const pad = (n: number) => n.toString().padStart(2, '0');
		const dateStr = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
		if (activeDates.has(dateStr)) {
			setSelectedDate(dateStr);
		}
	};

	const handleSaveException = async (exception: ScheduleException | null) => {
		if (!selectedDate) return;
		let updated: ScheduleException[];
		if (exception === null) {
			updated = exceptions.filter((e) => e.date !== selectedDate);
		} else {
			const without = exceptions.filter((e) => e.date !== selectedDate);
			updated = [...without, exception];
		}
		await onUpdateExceptions(updated);
	};

	const modifiers: Record<string, Date[]> = { available: [], partial: [], disabled: [] };
	for (const dateStr of activeDates) {
		const [y, m, d] = dateStr.split('-').map(Number);
		const date = new Date(y, m - 1, d);
		const status = getDayStatus(dateStr, weeklySchedule, exceptions);
		if (status === 'available') modifiers.available.push(date);
		else if (status === 'partial') modifiers.partial.push(date);
		else if (status === 'disabled') modifiers.disabled.push(date);
	}

	const modifiersStyles = {
		available: { backgroundColor: '#d1fae5', borderRadius: '100%' },
		partial: { backgroundColor: '#fef3c7', borderRadius: '100%' },
		disabled: { backgroundColor: '#f3f4f6', borderRadius: '100%', textDecoration: 'line-through', opacity: 0.5 },
	};

	const selectedException = selectedDate
		? exceptions.find((e) => e.date === selectedDate)
		: undefined;

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<button
					type='button'
					onClick={prevMonth}
					className='text-sm text-muted-foreground hover:text-foreground transition-colors px-2'
				>
					‹ Anterior
				</button>
				<span className='text-sm font-medium text-foreground'>
					{MONTH_NAMES[month - 1]} {year}
				</span>
				<button
					type='button'
					onClick={nextMonth}
					className='text-sm text-muted-foreground hover:text-foreground transition-colors px-2'
				>
					Siguiente ›
				</button>
			</div>

			<DayPicker
				mode='single'
				month={displayMonth}
				onMonthChange={setDisplayMonth}
				onDayClick={handleDayClick}
				modifiers={modifiers}
				modifiersStyles={modifiersStyles}
				hideNavigation
			/>

			<div className='flex gap-4 text-xs text-muted-foreground'>
				<span className='flex items-center gap-1'>
					<span className='w-3 h-3 rounded-full bg-green-100 border border-green-200 inline-block' /> Disponible
				</span>
				<span className='flex items-center gap-1'>
					<span className='w-3 h-3 rounded-full bg-yellow-100 border border-yellow-200 inline-block' /> Parcial
				</span>
				<span className='flex items-center gap-1'>
					<span className='w-3 h-3 rounded-full bg-gray-100 border border-gray-200 inline-block' /> Desactivado
				</span>
			</div>

			<p className='text-xs text-muted-foreground'>
				Toca un día activo para gestionar su disponibilidad.
			</p>

			{selectedDate && (
				<ExceptionModal
					date={selectedDate}
					weeklySchedule={weeklySchedule}
					existingException={selectedException}
					onSave={handleSaveException}
					onClose={() => setSelectedDate(null)}
				/>
			)}
		</div>
	);
}
