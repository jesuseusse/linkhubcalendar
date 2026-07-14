import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth/checkAuth';
import { container } from '@/infrastructure/container';
import { ScheduleException } from '@/domain/entities/User';
import { toUserResponse } from '@/application/use-cases/mappers';

export async function PUT(req: NextRequest) {
	try {
		const { userId, tenantId } = await checkAuth(req);
		const exceptions: ScheduleException[] = await req.json();

		const updated = await container.userRepo.updateScheduleExceptions(tenantId, userId, exceptions);
		if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

		const slots = await container.appointmentRepo.findAllSlots(tenantId, userId);
		return NextResponse.json(toUserResponse(updated, slots));
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Failed';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
