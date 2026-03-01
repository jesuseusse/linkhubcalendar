export type LeadStatus = 'attended' | 'canceled' | 'contacted';

export interface Lead {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status?: LeadStatus;
  createdAt: number;
}
