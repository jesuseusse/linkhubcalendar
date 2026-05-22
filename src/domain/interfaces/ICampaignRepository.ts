import { Campaign, CampaignClick } from '../entities/Campaign';

export interface CampaignQueryOptions {
  cursor?: string;
  limit: number;
}

export interface PaginatedCampaigns {
  campaigns: Campaign[];
  cursor: string | null;
  hasMore: boolean;
}

export interface ICampaignRepository {
  create(tenantId: string, data: Omit<Campaign, 'id' | 'createdAt'>): Promise<Campaign>;
  findById(tenantId: string, campaignId: string): Promise<Campaign | null>;
  findPaginated(tenantId: string, opts: CampaignQueryOptions): Promise<PaginatedCampaigns>;
  markSent(tenantId: string, campaignId: string, sentAt: number): Promise<void>;
  incrementClicks(tenantId: string, campaignId: string): Promise<void>;
  recordClick(tenantId: string, campaignId: string, click: Omit<CampaignClick, 'id'>): Promise<void>;
}
