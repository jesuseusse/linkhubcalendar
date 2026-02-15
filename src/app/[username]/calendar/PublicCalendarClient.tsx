'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { CalendarSlotDto, PublicCalendarDto } from '@/dtos/user.dto';
import { profileService } from '@/services/serviceFactory';
import { AppointmentBookingForm } from '@/components/Appointments/AppointmentBookingForm';
import { getProfilePhotoUrl } from '@/utils/profilePhoto';
import 'react-day-picker/style.css';

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

	const selectedDateStr = selectedDate
		? format(selectedDate, 'yyyy-MM-dd')
		: '';
	const slotsForSelectedDate = calendar.calendarSlots.filter(
		slot => slot.date === selectedDateStr
	);

	const datesWithSlots = calendar.calendarSlots.reduce<Record<string, number>>(
		(acc, slot) => {
			acc[slot.date] = (acc[slot.date] || 0) + 1;
			return acc;
		},
		{}
	);

	const highlightedDays = Object.keys(datesWithSlots).map(
		d => new Date(d + 'T00:00:00')
	);

	const sortedSlots = [...calendar.calendarSlots].sort((a, b) => {
		if (a.date !== b.date) return a.date.localeCompare(b.date);
		return a.startTime.localeCompare(b.startTime);
	});

	const groupedSlots = sortedSlots.reduce<Record<string, typeof sortedSlots>>(
		(acc, slot) => {
			if (!acc[slot.date]) acc[slot.date] = [];
			acc[slot.date].push(slot);
			return acc;
		},
		{}
	);

	return (
		<div className='min-h-screen bg-zinc-50 flex flex-col items-center p-4'>
			<div className='w-full max-w-2xl'>
				<div className='flex justify-between items-center mb-6'>
					<Link
						href={`/${username}`}
						className='text-sm text-zinc-500 hover:text-zinc-900 transition-colors'
					>
						&larr; Back to profile
					</Link>
				</div>

				<div className='text-center mb-8'>
					{calendar.profilePhoto ? (
						<img
							src={getProfilePhotoUrl(calendar.profilePhoto)}
							alt={calendar.name}
							className='w-16 h-16 object-cover mx-auto mb-3'
						/>
					) : (
						<div className='w-16 h-16 bg-zinc-900 text-white flex items-center justify-center text-2xl font-semibold mx-auto mb-3'>
							{calendar.name.charAt(0).toUpperCase()}
						</div>
					)}
					<h1 className='text-lg font-semibold text-zinc-900'>
						{calendar.name}
					</h1>
					<p className='text-xs text-zinc-400 mt-1'>@{calendar.username}</p>
					<h2 className='text-sm font-medium text-zinc-600 mt-3'>
						Calendario público
					</h2>
				</div>

				<div className='bg-white border border-zinc-200 p-6'>
					<div className='flex flex-col md:flex-row gap-6'>
						<div className='shrink-0 flex justify-center'>
							<DayPicker
								mode='single'
								selected={selectedDate}
								onSelect={setSelectedDate}
								modifiers={{ hasSlots: highlightedDays }}
								modifiersStyles={{
									hasSlots: { backgroundColor: '#d1fae5', borderRadius: '100%' }
								}}
							/>
						</div>
						<div className='flex-1 min-w-0'>
							{selectedDate ? (
								<div>
									<h3 className='text-sm font-medium text-zinc-700 mb-3'>
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
														className={`w-full text-left px-4 py-3 text-sm border transition-colors ${selectedSlot?.id === slot.id ? 'bg-emerald-200 border-emerald-400 text-emerald-900' : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'}`}
													>
														{slot.startTime} - {slot.endTime}
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
										<p className='text-xs text-zinc-400'>
											No slots available for this date
										</p>
									)}
								</div>
							) : (
								<div className='py-8 text-center'>
									<p className='text-sm text-zinc-400'>
										Select a date to view available slots
									</p>
								</div>
							)}
						</div>
					</div>

					{Object.keys(groupedSlots).length > 0 && (
						<div className='mt-6 border-t border-zinc-200 pt-4'>
							<h3 className='text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider'>
								All Available Slots
							</h3>
							<div className='space-y-3'>
								{Object.entries(groupedSlots).map(([date, dateSlots]) => (
									<div key={date}>
										<p className='text-xs font-medium text-zinc-600 mb-1'>
											{format(new Date(date + 'T00:00:00'), 'MMMM d, yyyy')}
										</p>
										<div className='flex flex-wrap gap-2'>
											{dateSlots.map(slot => (
												<span
													key={slot.id}
													className='inline-block bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs text-emerald-700'
												>
													{slot.startTime} - {slot.endTime}
												</span>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{calendar.calendarSlots.length === 0 && (
						<p className='text-sm text-zinc-400 text-center py-8'>
							No available slots
						</p>
					)}
				</div>

				<p className='mt-8 text-xs text-zinc-300 text-center'>
					Powered by LinkHub
				</p>
			</div>
		</div>
	);
}
