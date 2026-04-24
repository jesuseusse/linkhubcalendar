import { AppointmentNotificationData, ContactNotificationData, UpcomingRenewalData } from '@/domain/interfaces/IEmailSenderService';

export interface VerificationEmailTemplate {
	subject: (companyName: string) => string;
	html: (verificationLink: string, companyName: string) => string;
}

const defaultTemplate: VerificationEmailTemplate = {
	subject: (companyName) => `${companyName} — Confirma tu correo electrónico`,
	html: (verificationLink, companyName) => `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e4e4e7;padding:40px;">
        <tr><td style="text-align:center;padding-bottom:24px;">
          <h1 style="margin:0;font-size:20px;color:#18181b;">${companyName}</h1>
        </td></tr>
        <tr><td style="padding-bottom:16px;">
          <h2 style="margin:0;font-size:18px;color:#18181b;">Confirma tu correo electrónico</h2>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#52525b;">
            Haz clic en el botón de abajo para verificar tu dirección de correo electrónico y activar todas las funciones de tu cuenta.
          </p>
        </td></tr>
        <tr><td style="text-align:center;padding-bottom:24px;">
          <a href="${verificationLink}" style="display:inline-block;background:#18181b;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:6px;">
            Verificar correo
          </a>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0;font-size:12px;line-height:1.5;color:#a1a1aa;">
            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
          </p>
          <p style="margin:4px 0 0;font-size:12px;line-height:1.5;color:#a1a1aa;word-break:break-all;">
            ${verificationLink}
          </p>
        </td></tr>
        <tr><td>
          <p style="margin:0;font-size:12px;color:#a1a1aa;">
            Si no solicitaste esta verificación, puedes ignorar este correo.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
};

const tenantTemplates: Record<string, VerificationEmailTemplate> = {
	// Add tenant-specific templates here by tenantId:
	// 'tenant-abc123': { subject: ..., html: ... },
};

export function getVerificationEmailTemplate(tenantId: string): VerificationEmailTemplate {
	return tenantTemplates[tenantId] ?? defaultTemplate;
}

export interface AppointmentNotificationTemplate {
	subject: (appointment: AppointmentNotificationData) => string;
	html: (appointment: AppointmentNotificationData, dashboardUrl: string, companyName: string) => string;
}

const defaultAppointmentTemplate: AppointmentNotificationTemplate = {
	subject: (a) => `Nueva cita agendada — ${a.name}`,
	html: (a, dashboardUrl, companyName) => `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e4e4e7;padding:40px;">
        <tr><td style="text-align:center;padding-bottom:24px;">
          <h1 style="margin:0;font-size:20px;color:#18181b;">${companyName}</h1>
        </td></tr>
        <tr><td style="padding-bottom:8px;">
          <h2 style="margin:0;font-size:18px;color:#18181b;">Nueva cita agendada</h2>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#52525b;">
            Tienes una nueva cita en tu calendario. Aquí están los detalles:
          </p>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
            <tr style="background:#f4f4f5;">
              <td style="padding:10px 16px;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;width:35%;">Campo</td>
              <td style="padding:10px 16px;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Detalle</td>
            </tr>
            <tr style="border-top:1px solid #e4e4e7;">
              <td style="padding:10px 16px;font-size:13px;color:#71717a;">Nombre</td>
              <td style="padding:10px 16px;font-size:13px;color:#18181b;font-weight:500;">${a.name}</td>
            </tr>
            <tr style="border-top:1px solid #e4e4e7;background:#fafafa;">
              <td style="padding:10px 16px;font-size:13px;color:#71717a;">Correo</td>
              <td style="padding:10px 16px;font-size:13px;color:#18181b;">${a.email}</td>
            </tr>
            <tr style="border-top:1px solid #e4e4e7;">
              <td style="padding:10px 16px;font-size:13px;color:#71717a;">Teléfono</td>
              <td style="padding:10px 16px;font-size:13px;color:#18181b;">${a.phone}</td>
            </tr>
            <tr style="border-top:1px solid #e4e4e7;background:#fafafa;">
              <td style="padding:10px 16px;font-size:13px;color:#71717a;">Motivo</td>
              <td style="padding:10px 16px;font-size:13px;color:#18181b;">${a.reason}</td>
            </tr>
            <tr style="border-top:1px solid #e4e4e7;">
              <td style="padding:10px 16px;font-size:13px;color:#71717a;">Fecha</td>
              <td style="padding:10px 16px;font-size:13px;color:#18181b;">${a.date}</td>
            </tr>
            <tr style="border-top:1px solid #e4e4e7;background:#fafafa;">
              <td style="padding:10px 16px;font-size:13px;color:#71717a;">Horario</td>
              <td style="padding:10px 16px;font-size:13px;color:#18181b;">${a.startTime} – ${a.endTime}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="text-align:center;padding-bottom:24px;">
          <a href="${dashboardUrl}" style="display:inline-block;background:#18181b;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:6px;">
            Ver citas
          </a>
        </td></tr>
        <tr><td>
          <p style="margin:0;font-size:12px;color:#a1a1aa;">
            Este es un correo automático. Por favor no respondas a este mensaje.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
};

const tenantAppointmentTemplates: Record<string, AppointmentNotificationTemplate> = {
	// Add tenant-specific appointment templates here by tenantId:
	// 'tenant-abc123': { subject: ..., html: ... },
};

export function getAppointmentNotificationTemplate(tenantId: string): AppointmentNotificationTemplate {
	return tenantAppointmentTemplates[tenantId] ?? defaultAppointmentTemplate;
}

// ---------------------------------------------------------------------------
// Upcoming renewal template
// ---------------------------------------------------------------------------

export interface UpcomingRenewalTemplate {
	subject: (companyName: string) => string;
	html: (data: UpcomingRenewalData, companyName: string) => string;
}

const defaultRenewalTemplate: UpcomingRenewalTemplate = {
	subject: (companyName) => `${companyName} — Tu suscripción se renovará pronto`,
	html: (data, companyName) => `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e4e4e7;padding:40px;">
        <tr><td style="text-align:center;padding-bottom:24px;">
          <h1 style="margin:0;font-size:20px;color:#18181b;">${companyName}</h1>
        </td></tr>
        <tr><td style="padding-bottom:16px;">
          <h2 style="margin:0;font-size:18px;color:#18181b;">Tu suscripción se renovará pronto</h2>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#52525b;">
            Te informamos que tu suscripción Pro se renovará automáticamente el <strong>${data.renewalDate}</strong> por un monto de <strong>${data.amountFormatted}</strong>.
          </p>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#52525b;">
            Si no deseas continuar, puedes cancelar tu suscripción desde el panel de administración antes de esa fecha y no se realizará ningún cobro adicional.
          </p>
        </td></tr>
        <tr><td>
          <p style="margin:0;font-size:12px;color:#a1a1aa;">
            Este es un correo automático. Por favor no respondas a este mensaje.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
};

const tenantRenewalTemplates: Record<string, UpcomingRenewalTemplate> = {};

export function getUpcomingRenewalTemplate(tenantId: string): UpcomingRenewalTemplate {
	return tenantRenewalTemplates[tenantId] ?? defaultRenewalTemplate;
}

// ---------------------------------------------------------------------------
// Contact form notification template
// ---------------------------------------------------------------------------

export interface ContactNotificationTemplate {
	subject: (data: ContactNotificationData) => string;
	html: (data: ContactNotificationData, dashboardUrl: string, companyName: string) => string;
}

const defaultContactTemplate: ContactNotificationTemplate = {
	subject: (d) => `Nuevo contacto — ${d.name}`,
	html: (d, dashboardUrl, companyName) => `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e4e4e7;padding:40px;">
        <tr><td style="text-align:center;padding-bottom:24px;">
          <h1 style="margin:0;font-size:20px;color:#18181b;">${companyName}</h1>
        </td></tr>
        <tr><td style="padding-bottom:8px;">
          <h2 style="margin:0;font-size:18px;color:#18181b;">Nuevo mensaje de contacto</h2>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#52525b;">
            Has recibido un nuevo mensaje a través de tu formulario de contacto.
          </p>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
            <tr style="background:#f4f4f5;">
              <td style="padding:10px 16px;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;width:35%;">Campo</td>
              <td style="padding:10px 16px;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Detalle</td>
            </tr>
            <tr style="border-top:1px solid #e4e4e7;">
              <td style="padding:10px 16px;font-size:13px;color:#71717a;">Nombre</td>
              <td style="padding:10px 16px;font-size:13px;color:#18181b;font-weight:500;">${d.name}</td>
            </tr>
            <tr style="border-top:1px solid #e4e4e7;background:#fafafa;">
              <td style="padding:10px 16px;font-size:13px;color:#71717a;">Correo</td>
              <td style="padding:10px 16px;font-size:13px;color:#18181b;">${d.email}</td>
            </tr>
            <tr style="border-top:1px solid #e4e4e7;">
              <td style="padding:10px 16px;font-size:13px;color:#71717a;">Teléfono</td>
              <td style="padding:10px 16px;font-size:13px;color:#18181b;">${d.phone}</td>
            </tr>
            <tr style="border-top:1px solid #e4e4e7;background:#fafafa;">
              <td style="padding:10px 16px;font-size:13px;color:#71717a;">Mensaje</td>
              <td style="padding:10px 16px;font-size:13px;color:#18181b;">${d.message}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="text-align:center;padding-bottom:24px;">
          <a href="${dashboardUrl}" style="display:inline-block;background:#18181b;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:6px;">
            Ver contactos
          </a>
        </td></tr>
        <tr><td>
          <p style="margin:0;font-size:12px;color:#a1a1aa;">
            Este es un correo automático. Por favor no respondas a este mensaje.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
};

const tenantContactTemplates: Record<string, ContactNotificationTemplate> = {};

export function getContactNotificationTemplate(tenantId: string): ContactNotificationTemplate {
	return tenantContactTemplates[tenantId] ?? defaultContactTemplate;
}
