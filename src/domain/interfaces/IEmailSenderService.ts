export interface EmailSenderConfig {
  tenantId: string;
  apiKey: string;
  fromEmail: string;
}

export interface AppointmentNotificationData {
  name: string;
  email: string;
  phone: string;
  reason: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface UpcomingRenewalData {
  email: string;
  amountFormatted: string;
  renewalDate: string;
}

export interface IEmailSenderService {
  sendVerificationEmail(
    config: EmailSenderConfig,
    to: string,
    verificationLink: string,
    companyName?: string
  ): Promise<void>;

  sendAppointmentNotification(
    config: EmailSenderConfig,
    ownerEmail: string,
    appointment: AppointmentNotificationData,
    dashboardUrl: string,
    companyName?: string
  ): Promise<void>;

  sendUpcomingRenewalEmail(
    config: EmailSenderConfig,
    data: UpcomingRenewalData,
    companyName?: string
  ): Promise<void>;
}
