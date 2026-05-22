import { ICampaignRepository } from '@/domain/interfaces/ICampaignRepository';
import { IEmailSenderService, EmailSenderConfig } from '@/domain/interfaces/IEmailSenderService';
import { CampaignDto, PaginatedCampaignsDto, SendCampaignResultDto } from '@/dtos/user.dto';
import { Campaign } from '@/domain/entities/Campaign';
import { injectTrackingLinks } from '@/lib/campaign/trackingUrl';

const MAX_RECIPIENTS = 200;

function toDto(c: Campaign): CampaignDto {
  return {
    id: c.id,
    subject: c.subject,
    htmlBody: c.htmlBody,
    recipients: c.recipients,
    status: c.status,
    createdAt: c.createdAt,
    sentAt: c.sentAt,
    stats: { ...c.stats },
  };
}

// ---------------------------------------------------------------------------
// SendCampaignUseCase
// ---------------------------------------------------------------------------

export class SendCampaignUseCase {
  constructor(
    private campaignRepo: ICampaignRepository,
    private emailSenderService: IEmailSenderService | null,
    private emailConfig: EmailSenderConfig | null,
    private appBaseUrl: string
  ) {}

  async execute(
    tenantId: string,
    { subject, htmlBody, recipientEmails }: { subject: string; htmlBody: string; recipientEmails: string[] }
  ): Promise<SendCampaignResultDto> {
    if (!this.emailSenderService || !this.emailConfig) {
      throw new Error('Servicio de correo no configurado para este tenant');
    }
    if (recipientEmails.length === 0) {
      throw new Error('No hay destinatarios');
    }
    if (recipientEmails.length > MAX_RECIPIENTS) {
      throw new Error(`Máximo ${MAX_RECIPIENTS} destinatarios por campaña`);
    }

    const deduped = [...new Set(recipientEmails)];

    const campaign = await this.campaignRepo.create(tenantId, {
      subject,
      htmlBody,
      recipients: deduped,
      status: 'draft',
      stats: { totalRecipients: deduped.length, clicksCount: 0 },
    });

    let failedCount = 0;
    for (const email of deduped) {
      try {
        const trackedHtml = injectTrackingLinks(
          htmlBody,
          tenantId,
          campaign.id,
          email,
          this.appBaseUrl
        );
        await this.emailSenderService.sendCampaignEmail(
          this.emailConfig,
          email,
          subject,
          trackedHtml
        );
      } catch {
        failedCount++;
      }
    }

    await this.campaignRepo.markSent(tenantId, campaign.id, Date.now());

    return { campaign: toDto({ ...campaign, status: 'sent' }), failedCount };
  }
}

// ---------------------------------------------------------------------------
// GetCampaignsPaginatedUseCase
// ---------------------------------------------------------------------------

export class GetCampaignsPaginatedUseCase {
  constructor(private campaignRepo: ICampaignRepository) {}

  async execute(
    tenantId: string,
    opts: { cursor?: string; limit: number }
  ): Promise<PaginatedCampaignsDto> {
    const result = await this.campaignRepo.findPaginated(tenantId, opts);
    return {
      campaigns: result.campaigns.map(toDto),
      cursor: result.cursor,
      hasMore: result.hasMore,
    };
  }
}

// ---------------------------------------------------------------------------
// GetCampaignDetailUseCase
// ---------------------------------------------------------------------------

export class GetCampaignDetailUseCase {
  constructor(private campaignRepo: ICampaignRepository) {}

  async execute(tenantId: string, campaignId: string): Promise<CampaignDto> {
    const campaign = await this.campaignRepo.findById(tenantId, campaignId);
    if (!campaign) throw new Error('Campaña no encontrada');
    return toDto(campaign);
  }
}
