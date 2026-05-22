export type CampaignStatus = 'draft' | 'sent';

export interface Campaign {
  id: string;
  subject: string;
  htmlBody: string;
  recipients: string[];
  status: CampaignStatus;
  createdAt: number;
  sentAt?: number;
  stats: {
    totalRecipients: number;
    clicksCount: number;
  };
}

export interface CampaignClick {
  id: string;
  recipientEmail: string;
  originalUrl: string;
  clickedAt: number;
}
