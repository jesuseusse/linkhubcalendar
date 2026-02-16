import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth/checkAuth';
import { container } from '@/infrastructure/container';

export async function GET(req: NextRequest) {
	try {
		const { userId, tenantId } = await checkAuth(req);
		const result = await container.getProfileUseCase.execute(tenantId, userId);

		return NextResponse.json(result);
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : 'Failed to get profile';
		console.error(err);

		return NextResponse.json({ error: message }, { status: 401 });
	}
}

export async function PUT(req: NextRequest) {
	try {
		const { userId, tenantId } = await checkAuth(req);
		const body = await req.json();
		const result = await container.updateProfileUseCase.execute(
			tenantId,
			userId,
			body
		);
		return NextResponse.json(result);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Update failed';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
