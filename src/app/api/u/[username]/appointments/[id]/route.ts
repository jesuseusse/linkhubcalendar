import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { resolveTenantId } from '@/lib/auth/resolveTenantId';

// Public status check used by the public calendar page to validate the appointment it remembers
// in localStorage. It only exposes the status and creation timestamp (no personal data), and
// the username in the path must own the appointment.
export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ username: string; id: string }> }
) {
	try {
		const { username, id } = await params;
		const tenantId = await resolveTenantId(req);

		const user = await container.userRepo.findByUsername(tenantId, username);
		if (!user) {
			return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
		}

		const appointment = await container.appointmentRepo.findById(tenantId, user.id, id);
		if (!appointment) {
			return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
		}

		return NextResponse.json(
			{ status: appointment.status, createdAt: appointment.createdAt },
			{ headers: { 'Cache-Control': 'no-store' } }
		);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Appointment lookup failed';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
