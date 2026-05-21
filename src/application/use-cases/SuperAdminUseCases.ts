import { IUserRepository } from '@/domain/interfaces/IUserRepository';
import { ISupportTicketRepository } from '@/domain/interfaces/ISupportTicketRepository';
import { UserSummaryDto, SuperAdminStatsDto, SuperAdminTicketDto } from '@/dtos/user.dto';

// ---------------------------------------------------------------------------
// GetSuperAdminStatsUseCase
// ---------------------------------------------------------------------------

export class GetSuperAdminStatsUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(tenantId: string): Promise<SuperAdminStatsDto> {
    const users = await this.userRepo.findAll(tenantId);
    const now = Date.now();
    const paid = users.filter((u) => {
      if (u.plan !== 'pro' && u.plan !== 'team') return false;
      return u.planExpiredAt == null || u.planExpiredAt > now;
    });
    return { totalUsers: users.length, usersWithActivePaidPlan: paid.length };
  }
}

// ---------------------------------------------------------------------------
// GetAllUsersUseCase
// ---------------------------------------------------------------------------

export class GetAllUsersUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(tenantId: string): Promise<UserSummaryDto[]> {
    const users = await this.userRepo.findAll(tenantId);
    const dtos: UserSummaryDto[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      username: u.username,
      plan: u.plan,
      planExpiredAt: u.planExpiredAt,
      links: u.links.map((l) => ({ id: l.id, title: l.title, url: l.url })),
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
    return dtos.sort((a, b) => b.createdAt - a.createdAt);
  }
}

// ---------------------------------------------------------------------------
// GetAllTicketsUseCase
// ---------------------------------------------------------------------------

export class GetAllTicketsUseCase {
  constructor(
    private userRepo: IUserRepository,
    private supportTicketRepo: ISupportTicketRepository
  ) {}

  async execute(tenantId: string): Promise<SuperAdminTicketDto[]> {
    const users = await this.userRepo.findAll(tenantId);
    const userMap = new Map(users.map((u) => [u.id, { email: u.email, name: u.name }]));
    const userIds = users.map((u) => u.id);

    const tickets = await this.supportTicketRepo.findAllByTenant(tenantId, userIds);

    const dtos: SuperAdminTicketDto[] = tickets.map((t) => {
      const user = userMap.get(t.userId);
      return {
        id: t.id,
        userId: t.userId,
        userEmail: user?.email ?? '(desconocido)',
        userName: user?.name ?? '(desconocido)',
        type: t.type,
        status: t.status,
        title: t.title,
        description: t.description,
        deviceType: t.deviceType,
        deviceOther: t.deviceOther,
        screenshotUrl: t.screenshotUrl,
        whatsappPhone: t.whatsappPhone,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });

    return dtos.sort((a, b) => b.createdAt - a.createdAt);
  }
}
