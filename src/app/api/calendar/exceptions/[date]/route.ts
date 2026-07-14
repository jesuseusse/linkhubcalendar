import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth/checkAuth';
import { container } from '@/infrastructure/container';
import { toUserResponse } from '@/application/use-cases/mappers';

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ date: string }> }
) {
	try {
		const { userId, tenantId } = await checkAuth(req);
		const { date } = await params;

		const user = await container.userRepo.findById(tenantId, userId);
		if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

		const exceptions = (user.scheduleExceptions ?? []).filter((e) => e.date !== date);
		const updated = await container.userRepo.updateScheduleExceptions(tenantId, userId, exceptions);
		if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

		const slots = await container.appointmentRepo.findAllSlots(tenantId, userId);
		return NextResponse.json(toUserResponse(updated, slots));
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Failed';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
