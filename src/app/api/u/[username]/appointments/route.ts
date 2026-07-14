import { NextRequest, NextResponse } from 'next/server';
import { BookAppointmentUseCase } from '@/application/use-cases/BookAppointmentUseCase';
import { userRepo, appointmentRepo } from '@/infrastructure/container';
import { resolveTenantRegistry, resolveEffectiveHostname } from '@/lib/auth/resolveTenantId';
import { createEmailSenderService } from '@/infrastructure/services/emailSenderFactory';
import { IEmailSenderService, EmailSenderConfig } from '@/domain/interfaces/IEmailSenderService';
import { generateSlotsForMonth } from '@/lib/utils/scheduleGenerator';

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ username: string }> }
) {
	try {
		const { username } = await params;
		const host = req.headers.get('host') || '';
		const hostname = resolveEffectiveHostname(host);
		const registry = await resolveTenantRegistry(req);
		const { tenantId } = registry;

		let emailSenderService: IEmailSenderService | null = null;
		let emailConfig: EmailSenderConfig | null = null;
		try {
			emailSenderService = createEmailSenderService(registry);
			const fromEmail = registry.sesConfig?.fromEmail ?? registry.resendFromEmail!;
			emailConfig = { tenantId, apiKey: registry.resendApiKey ?? '', fromEmail };
		} catch {
			// Email not configured for this tenant — proceed without notification
		}

		const dashboardUrl = `https://${hostname}/u/admin/dashboard/dates`;
		const body = await req.json();

		// Schedule-based booking: body has { date, startTime, endTime, name, email, phone, reason }
		if (!body.slotId && body.date && body.startTime && body.endTime) {
			const user = await userRepo.findByUsername(tenantId, username);
			if (!user || !user.calendarEnabled) {
				return NextResponse.json({ error: 'Calendario no disponible' }, { status: 400 });
			}
			if (!user.weeklySchedule) {
				return NextResponse.json({ error: 'Sin horario configurado' }, { status: 400 });
			}

			// Validate slot is valid per schedule and not excepted
			const [year, month] = body.date.split('-').map(Number);
			const validSlots = generateSlotsForMonth(
				user.weeklySchedule,
				year,
				month,
				user.scheduleExceptions ?? [],
				new Map()
			);
			const isValid = validSlots.some(
				(s) => s.date === body.date && s.startTime === body.startTime
			);
			if (!isValid) {
				return NextResponse.json({ error: 'Slot no disponible' }, { status: 400 });
			}

			const appointment = await appointmentRepo.bookScheduleSlotAtomically(tenantId, user.id, {
				date: body.date,
				startTime: body.startTime,
				endTime: body.endTime,
				userId: user.id,
				name: body.name,
				email: body.email,
				phone: body.phone,
				reason: body.reason,
			});

			if (emailSenderService && emailConfig && user.email) {
				emailSenderService.sendAppointmentNotification(
					emailConfig,
					user.email,
					{
						name: appointment.name,
						email: appointment.email,
						phone: appointment.phone,
						reason: appointment.reason,
						date: appointment.date,
						startTime: appointment.startTime,
						endTime: appointment.endTime,
					},
					dashboardUrl,
					registry.companyName ?? undefined
				).catch(() => {});
			}

			return NextResponse.json({
				id: appointment.id,
				slotId: appointment.slotId,
				date: appointment.date,
				startTime: appointment.startTime,
				endTime: appointment.endTime,
				name: appointment.name,
				email: appointment.email,
				phone: appointment.phone,
				reason: appointment.reason,
				status: appointment.status,
				createdAt: appointment.createdAt,
			}, { status: 201 });
		}

		// Legacy slot-doc booking: body has { slotId, name, email, phone, reason }
		const useCase = new BookAppointmentUseCase(
			userRepo,
			appointmentRepo,
			emailSenderService,
			emailConfig,
			dashboardUrl,
			registry.companyName
		);

		const result = await useCase.execute(tenantId, username, body);
		return NextResponse.json(result, { status: 201 });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Booking failed';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
