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

export interface ContactNotificationData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface SupportTicketNotificationData {
  title: string;
  /** 'error' or 'suggestion' */
  type: string;
  userName: string;
  userEmail: string;
  description: string;
}

export interface StripeWebhookErrorNotificationData {
  eventId: string;
  eventType: string;
  domain: string;
  tenantId: string;
  /** Machine-readable failure reason, e.g. 'PRICE_ID_MISMATCH' — see WebhookFailureReason */
  reason: string;
  /** Whether Stripe will keep retrying this event (5xx was returned) */
  retryable: boolean;
  detail: string;
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

  sendContactNotification(
    config: EmailSenderConfig,
    ownerEmail: string,
    data: ContactNotificationData,
    dashboardUrl: string,
    companyName?: string
  ): Promise<void>;

  /**
   * Sends a new-ticket notification to one or more super-admin email addresses.
   * @param config - Tenant email sender config.
   * @param adminEmails - List of recipient addresses (from NEXT_SUPER_ADMINS_EMAILS).
   * @param data - Ticket summary data for the email body.
   * @param companyName - Optional tenant company name for the email header.
   */
  sendSupportTicketNotification(
    config: EmailSenderConfig,
    adminEmails: string[],
    data: SupportTicketNotificationData,
    companyName?: string
  ): Promise<void>;

  /**
   * Sends a billing-critical webhook failure alert to the configured ops recipients.
   * @param config - Tenant email sender config.
   * @param alertEmails - List of recipient addresses (from NEXT_STRIPE_ALERT_EMAILS).
   * @param data - Failure summary data for the email body.
   * @param companyName - Optional tenant company name for the email header.
   */
  sendStripeWebhookErrorNotification(
    config: EmailSenderConfig,
    alertEmails: string[],
    data: StripeWebhookErrorNotificationData,
    companyName?: string
  ): Promise<void>;

  sendCampaignEmail(
    config: EmailSenderConfig,
    to: string,
    subject: string,
    html: string
  ): Promise<void>;

  sendPasswordResetEmail(
    config: EmailSenderConfig,
    to: string,
    resetLink: string,
    companyName?: string | null,
    logoUrl?: string | null,
  ): Promise<void>;
}
