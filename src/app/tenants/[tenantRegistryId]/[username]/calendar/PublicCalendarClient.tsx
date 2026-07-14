'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { CalendarSlotDto, PublicCalendarDto } from '@/dtos/user.dto';
import { profileService } from '@/services/serviceFactory';
import { AppointmentBookingForm, BookingFormData } from '@/components/Appointments/AppointmentBookingForm';
import { ReservedAppointmentModal, StoredAppointment } from '@/components/Calendar/ReservedAppointmentModal';
import { getProfilePhotoUrl } from '@/utils/profilePhoto';
import { sortSlotsByDateTime } from '@/lib/utils/sortSlots';
import Image from 'next/image';

const MONTH_NAMES = [
	'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
	'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatTime(hhmm: string): string {
	const [h, m] = hhmm.split(':').map(Number);
	const period = h >= 12 ? 'pm' : 'am';
	const hour = h % 12 || 12;
	return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

function storageKey(username: string) {
	return `linkhub_appointment_${username}`;
}

function loadStoredAppointment(username: string): StoredAppointment | null {
	try {
		const raw = localStorage.getItem(storageKey(username));
		if (!raw) return null;
		const stored: StoredAppointment = JSON.parse(raw);
		const today = format(new Date(), 'yyyy-MM-dd');
		if (stored.date < today) {
			localStorage.removeItem(storageKey(username));
			return null;
		}
		return stored;
	} catch {
		return null;
	}
}

function saveAppointment(username: string, data: StoredAppointment) {
	try {
		localStorage.setItem(storageKey(username), JSON.stringify(data));
	} catch {
		// ignore
	}
}

function toMonthParam(year: number, month: number): string {
	return `${year}-${month.toString().padStart(2, '0')}`;
}

interface Props {
	calendar: PublicCalendarDto;
	username: string;
}

export function PublicCalendarClient({
	calendar: initialCalendar,
	username
}: Props) {
	const now = new Date();
	const [displayMonth, setDisplayMonth] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
	const [calendar, setCalendar] = useState(initialCalendar);
	const [monthLoading, setMonthLoading] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [selectedSlot, setSelectedSlot] = useState<CalendarSlotDto | null>(null);
	const [bookingLoading, setBookingLoading] = useState(false);
	const [reservedAppointment, setReservedAppointment] = useState<StoredAppointment | null>(null);

	useEffect(() => {
		const stored = loadStoredAppointment(username);
		if (stored) setReservedAppointment(stored);
	}, [username]);

	const fetchMonth = useCallback(async (year: number, month: number) => {
		setMonthLoading(true);
		setSelectedDate(undefined);
		setSelectedSlot(null);
		try {
			const data = await profileService.getPublicCalendar(username, toMonthParam(year, month));
			setCalendar(data);
		} catch {
			// keep previous data on error
		} finally {
			setMonthLoading(false);
		}
	}, [username]);

	const goToPrevMonth = () => {
		const prev = displayMonth.month === 1
			? { year: displayMonth.year - 1, month: 12 }
			: { year: displayMonth.year, month: displayMonth.month - 1 };
		setDisplayMonth(prev);
		fetchMonth(prev.year, prev.month);
	};

	const goToNextMonth = () => {
		const next = displayMonth.month === 12
			? { year: displayMonth.year + 1, month: 1 }
			: { year: displayMonth.year, month: displayMonth.month + 1 };
		setDisplayMonth(next);
		fetchMonth(next.year, next.month);
	};

	const todayStr = format(new Date(), 'yyyy-MM-dd');
	const visibleSlots = calendar.calendarSlots.filter(slot => slot.date >= todayStr);
	const availableSlots = visibleSlots.filter(slot => !slot.booked);

	const selectedDateStr = selectedDate
		? format(selectedDate, 'yyyy-MM-dd')
		: '';
	const slotsForSelectedDate = sortSlotsByDateTime(
		visibleSlots.filter(slot => slot.date === selectedDateStr)
	);

	const highlightedDays = [...new Set(availableSlots.map(s => s.date))].map(
		d => new Date(d + 'T00:00:00')
	);

	const pickerMonth = new Date(displayMonth.year, displayMonth.month - 1, 1);

	const handleBook = async (slot: CalendarSlotDto, data: BookingFormData) => {
		setBookingLoading(true);
		try {
			const dto = calendar.hasWeeklySchedule
				? { date: slot.date, startTime: slot.startTime, endTime: slot.endTime, ...data }
				: { slotId: slot.id, ...data };
			await profileService.bookAppointment(username, dto);
			const stored: StoredAppointment = {
				name: data.name,
				date: slot.date,
				startTime: slot.startTime,
				endTime: slot.endTime,
			};
			saveAppointment(username, stored);
			setReservedAppointment(stored);
			setCalendar(prev => ({
				...prev,
				calendarSlots: prev.calendarSlots.map(s =>
					s.id === slot.id ? { ...s, booked: true } : s
				),
			}));
			setSelectedSlot(null);
		} finally {
			setBookingLoading(false);
		}
	};

	return (
		<div className='min-h-screen bg-surface flex flex-col items-center p-4'>
			{reservedAppointment && (
				<ReservedAppointmentModal
					appointment={reservedAppointment}
					onClose={() => setReservedAppointment(null)}
				/>
			)}
			<div className='w-full max-w-2xl'>
				<div className='flex justify-between items-center mb-6'>
					<Link
						href={`/${username}`}
						className='text-sm text-muted-foreground hover:text-foreground transition-colors'
					>
						&larr; Volver al perfil
					</Link>
				</div>

				<div className='text-center mb-8'>
					{calendar.profilePhoto ? (
						<Image
							src={getProfilePhotoUrl(calendar.profilePhoto)}
							alt={calendar.name}
							width={64}
							height={64}
							className='w-16 h-16 object-cover mx-auto mb-3'
						/>
					) : (
						<div className='w-16 h-16 bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold mx-auto mb-3'>
							{calendar.name.charAt(0).toUpperCase()}
						</div>
					)}
					<h1 className='text-lg font-semibold text-foreground'>
						{calendar.name}
					</h1>
					<p className='text-xs text-muted-foreground mt-1'>
						@{calendar.username}
					</p>
					<h2 className='text-sm font-medium text-muted-foreground mt-3'>
						Calendario de citas
					</h2>
				</div>

				<div className='bg-background border border-border p-6'>
					{/* Month navigation */}
					<div className='flex items-center justify-between mb-4'>
						<button
							type='button'
							onClick={goToPrevMonth}
							disabled={monthLoading}
							className='text-sm text-muted-foreground hover:text-foreground transition-colors px-2 disabled:opacity-40'
						>
							‹ Anterior
						</button>
						<span className='text-sm font-medium text-foreground'>
							{MONTH_NAMES[displayMonth.month - 1]} {displayMonth.year}
						</span>
						<button
							type='button'
							onClick={goToNextMonth}
							disabled={monthLoading}
							className='text-sm text-muted-foreground hover:text-foreground transition-colors px-2 disabled:opacity-40'
						>
							Siguiente ›
						</button>
					</div>

					{monthLoading ? (
						<div className='py-12 flex items-center justify-center'>
							<div className='w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin' />
						</div>
					) : (
						<div className='flex flex-col md:flex-row gap-6'>
							<div className='shrink-0 flex justify-center'>
								<DayPicker
									mode='single'
									selected={selectedDate}
									onSelect={setSelectedDate}
									month={pickerMonth}
									onMonthChange={() => {}}
									disabled={{ before: new Date() }}
									modifiers={{ hasSlots: highlightedDays }}
									modifiersStyles={{
										hasSlots: {
											backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, var(--color-background))',
											borderRadius: '100%'
										}
									}}
									hideNavigation
								/>
							</div>
							<div className='flex-1 min-w-0'>
								{selectedDate ? (
									<div>
										<h3 className='text-sm font-medium text-foreground mb-3'>
											{format(selectedDate, 'MMMM d, yyyy')}
										</h3>
										{slotsForSelectedDate.length > 0 ? (
											<ul className='space-y-2'>
												{slotsForSelectedDate.map(slot => (
													<li key={slot.id}>
														{slot.booked ? (
															<div className='w-full px-4 py-3 text-sm border border-border bg-muted text-muted-foreground flex items-center justify-between'>
																<span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
																<span className='text-xs'>No disponible</span>
															</div>
														) : (
															<>
																<button
																	onClick={() =>
																		setSelectedSlot(
																			selectedSlot?.id === slot.id ? null : slot
																		)
																	}
																	className={`cursor-pointer w-full text-left px-4 py-3 text-sm border transition-colors ${selectedSlot?.id === slot.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-surface border-border text-foreground hover:border-primary'}`}
																>
																	{formatTime(slot.startTime)} - {formatTime(slot.endTime)}
																</button>
																{selectedSlot?.id === slot.id && (
																	<AppointmentBookingForm
																		slot={slot}
																		loading={bookingLoading}
																		onSubmit={(data) => handleBook(slot, data)}
																	/>
																)}
															</>
														)}
													</li>
												))}
											</ul>
										) : (
											<p className='text-xs text-muted-foreground'>
												No hay horarios disponibles para este día.
											</p>
										)}
									</div>
								) : (
									<div className='py-8 text-center'>
										<p className='text-sm text-muted-foreground'>
											Selecciona una fecha para ver los horarios disponibles.
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					{!monthLoading && availableSlots.length === 0 && (
						<p className='text-sm text-muted-foreground text-center py-8'>
							No hay horarios disponibles este mes.
						</p>
					)}
				</div>

				<p className='mt-8 text-xs text-muted-foreground text-center'>
					Powered by LinkHub
				</p>
			</div>
		</div>
	);
}
