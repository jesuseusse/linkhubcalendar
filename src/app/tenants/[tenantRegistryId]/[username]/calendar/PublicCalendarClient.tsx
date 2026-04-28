'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { CalendarSlotDto, PublicCalendarDto } from '@/dtos/user.dto';
import { profileService } from '@/services/serviceFactory';
import { AppointmentBookingForm } from '@/components/Appointments/AppointmentBookingForm';
import { ReservedAppointmentModal, StoredAppointment } from '@/components/Calendar/ReservedAppointmentModal';
import { getProfilePhotoUrl } from '@/utils/profilePhoto';
import { sortSlotsByDateTime } from '@/lib/utils/sortSlots';
import Image from 'next/image';

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

interface Props {
	calendar: PublicCalendarDto;
	username: string;
}

export function PublicCalendarClient({
	calendar: initialCalendar,
	username
}: Props) {
	const [calendar, setCalendar] = useState(initialCalendar);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [selectedSlot, setSelectedSlot] = useState<CalendarSlotDto | null>(
		null
	);
	const [bookingLoading, setBookingLoading] = useState(false);
	const [reservedAppointment, setReservedAppointment] =
		useState<StoredAppointment | null>(null);

	useEffect(() => {
		const stored = loadStoredAppointment(username);
		if (stored) setReservedAppointment(stored);
	}, [username]);

	const now = new Date();
	const localToday = format(now, 'yyyy-MM-dd');
	const localNow = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
	const visibleSlots = calendar.calendarSlots.filter(slot => {
		if (slot.date > localToday) return true;
		if (slot.date === localToday) return slot.startTime >= localNow;
		return false;
	});

	const selectedDateStr = selectedDate
		? format(selectedDate, 'yyyy-MM-dd')
		: '';
	const slotsForSelectedDate = sortSlotsByDateTime(
		visibleSlots.filter(slot => slot.date === selectedDateStr)
	);

	const datesWithSlots = visibleSlots.reduce<Record<string, number>>(
		(acc, slot) => {
			acc[slot.date] = (acc[slot.date] || 0) + 1;
			return acc;
		},
		{}
	);

	const highlightedDays = Object.keys(datesWithSlots).map(
		d => new Date(d + 'T00:00:00')
	);

	const sortedSlots = sortSlotsByDateTime(visibleSlots);

	const groupedSlots = sortedSlots.reduce<Record<string, typeof sortedSlots>>(
		(acc, slot) => {
			if (!acc[slot.date]) acc[slot.date] = [];
			acc[slot.date].push(slot);
			return acc;
		},
		{}
	);

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
						&larr; Back to profile
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
						Calendario público
					</h2>
				</div>

				<div className='bg-background border border-border p-6'>
					<div className='flex flex-col md:flex-row gap-6'>
						<div className='shrink-0 flex justify-center'>
							<DayPicker
								mode='single'
								selected={selectedDate}
								onSelect={setSelectedDate}
								disabled={{ before: new Date() }}
								modifiers={{ hasSlots: highlightedDays }}
								modifiersStyles={{
									hasSlots: {
										backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, var(--color-background))',
										borderRadius: '100%'
									}
								}}
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
															onSubmit={async data => {
																setBookingLoading(true);
																try {
																	await profileService.bookAppointment(
																		username,
																		data
																	);
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
																		calendarSlots: prev.calendarSlots.filter(
																			s => s.id !== slot.id
																		)
																	}));
																	setSelectedSlot(null);
																} finally {
																	setBookingLoading(false);
																}
															}}
														/>
													)}
												</li>
											))}
										</ul>
									) : (
										<p className='text-xs text-muted-foreground'>
											No slots available for this date
										</p>
									)}
								</div>
							) : (
								<div className='py-8 text-center'>
									<p className='text-sm text-muted-foreground'>
										Select a date to view available slots
									</p>
								</div>
							)}
						</div>
					</div>

					{/* {Object.keys(groupedSlots).length > 0 && (
						<div className='mt-6 border-t border-border pt-4'>
							<h3 className='text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider'>
								All Available Slots
							</h3>
							<div className='space-y-3'>
								{Object.entries(groupedSlots).map(([date, dateSlots]) => (
									<div key={date}>
										<p className='text-xs font-medium text-muted-foreground mb-1'>
											{format(new Date(date + 'T00:00:00'), 'MMMM d, yyyy')}
										</p>
										<div className='flex flex-wrap gap-2'>
											{dateSlots.map(slot => (
												<span
													key={slot.id}
													className='inline-block bg-success-light border border-success px-3 py-1 text-xs text-success'
												>
													{slot.startTime} - {slot.endTime}
												</span>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					)} */}

					{visibleSlots.length === 0 && (
						<p className='text-sm text-muted-foreground text-center py-8'>
							No available slots
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
