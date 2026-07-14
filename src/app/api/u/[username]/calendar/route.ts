import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { resolveTenantId } from '@/lib/auth/resolveTenantId';
import { generateSlotsForMonth } from '@/lib/utils/scheduleGenerator';

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ username: string }> }
) {
	try {
		const { username } = await params;
		const tenantId = await resolveTenantId(req);

		const monthParam = req.nextUrl.searchParams.get('month');
		let year: number;
		let month: number;

		if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
			const [y, m] = monthParam.split('-').map(Number);
			year = y;
			month = m;
		} else {
			const now = new Date();
			year = now.getFullYear();
			month = now.getMonth() + 1;
		}

		const user = await container.userRepo.findByUsername(tenantId, username);
		if (!user || !user.calendarEnabled) {
			return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });
		}

		if (user.weeklySchedule) {
			const appointments = await container.appointmentRepo.findAppointmentsByMonth(
				tenantId,
				user.id,
				year,
				month
			);

			const bookedStartTimes = new Map<string, Set<string>>();
			for (const appt of appointments) {
				if (!bookedStartTimes.has(appt.date)) {
					bookedStartTimes.set(appt.date, new Set());
				}
				bookedStartTimes.get(appt.date)!.add(appt.startTime);
			}

			const today = new Date().toISOString().slice(0, 10);
			const allSlots = generateSlotsForMonth(
				user.weeklySchedule,
				year,
				month,
				user.scheduleExceptions ?? [],
				bookedStartTimes
			);
			const slots = allSlots.filter((s) => s.date >= today);

			return NextResponse.json({
				name: user.name,
				username: user.username,
				profilePhoto: user.profilePhoto,
				calendarSlots: slots,
				hasWeeklySchedule: true,
			});
		}

		// Fallback: old slot-doc based system
		const result = await container.getPublicCalendarUseCase.execute(tenantId, username);
		return NextResponse.json({ ...result, hasWeeklySchedule: false });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Calendar not found';
		return NextResponse.json({ error: message }, { status: 404 });
	}
}
