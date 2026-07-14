import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth/checkAuth';
import { container } from '@/infrastructure/container';
import { WeeklySchedule } from '@/domain/entities/User';
import { toUserResponse } from '@/application/use-cases/mappers';

export async function GET(req: NextRequest) {
	try {
		const { userId, tenantId } = await checkAuth(req);
		const user = await container.userRepo.findById(tenantId, userId);
		if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
		return NextResponse.json({
			weeklySchedule: user.weeklySchedule ?? null,
			scheduleExceptions: user.scheduleExceptions ?? [],
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Failed';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}

export async function PUT(req: NextRequest) {
	try {
		const { userId, tenantId } = await checkAuth(req);
		const body = await req.json();
		const schedule: WeeklySchedule | null = body ?? null;

		const updated = await container.userRepo.updateWeeklySchedule(tenantId, userId, schedule);
		if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

		const slots = await container.appointmentRepo.findAllSlots(tenantId, userId);
		return NextResponse.json(toUserResponse(updated, slots));
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Failed';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
