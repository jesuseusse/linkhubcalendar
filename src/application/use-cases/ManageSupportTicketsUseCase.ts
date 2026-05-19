import { ISupportTicketRepository } from '../../domain/interfaces/ISupportTicketRepository';
import { IEmailSenderService, EmailSenderConfig } from '../../domain/interfaces/IEmailSenderService';
import { TicketStatus, TicketType } from '../../domain/entities/SupportTicket';
import {
  CreateSupportTicketDto,
  SupportTicketResponseDto,
  TicketDetailResponseDto,
  TicketCommentResponseDto,
} from '../../domain/dtos/AuthDtos';

// ---------------------------------------------------------------------------
// Shared mapper helpers
// ---------------------------------------------------------------------------

function toTicketDto(ticket: import('../../domain/entities/SupportTicket').SupportTicket): SupportTicketResponseDto {
  return {
    id: ticket.id,
    type: ticket.type,
    status: ticket.status,
    title: ticket.title,
    description: ticket.description,
    deviceType: ticket.deviceType,
    deviceOther: ticket.deviceOther,
    screenshotUrl: ticket.screenshotUrl,
    whatsappPhone: ticket.whatsappPhone,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

function toCommentDto(comment: import('../../domain/entities/SupportTicket').TicketComment): TicketCommentResponseDto {
  return {
    id: comment.id,
    content: comment.content,
    userName: comment.userName,
    userEmail: comment.userEmail,
    createdAt: comment.createdAt,
  };
}

// ---------------------------------------------------------------------------
// CreateSupportTicketUseCase
// ---------------------------------------------------------------------------

/**
 * Creates a new support ticket after validating the one-open-per-type constraint.
 * Fires an admin email notification in the background (failure is silently suppressed).
 */
export class CreateSupportTicketUseCase {
  constructor(
    private supportTicketRepo: ISupportTicketRepository,
    private emailSenderService?: IEmailSenderService | null,
    private emailConfig?: EmailSenderConfig | null,
    private companyName?: string | null
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    userEmail: string,
    userName: string,
    dto: CreateSupportTicketDto,
    screenshotUrl?: string
  ): Promise<SupportTicketResponseDto> {
    const existing = await this.supportTicketRepo.findOpenByType(tenantId, userId, dto.type);
    if (existing) {
      const typeLabel = dto.type === 'error' ? 'reporte de error' : 'sugerencia';
      throw new Error(`Ya tienes un ${typeLabel} abierto. Ciérralo antes de abrir uno nuevo.`);
    }

    const ticket = await this.supportTicketRepo.create(tenantId, {
      userId,
      type: dto.type,
      status: 'open',
      title: dto.title,
      description: dto.description,
      deviceType: dto.deviceType,
      deviceOther: dto.deviceOther,
      screenshotUrl,
      whatsappPhone: dto.whatsappPhone,
    });

    if (this.emailSenderService && this.emailConfig) {
      const adminEmailsRaw = process.env.NEXT_SUPER_ADMINS_EMAILS ?? '';
      const adminEmails = adminEmailsRaw.split(',').map((e) => e.trim()).filter(Boolean);
      if (adminEmails.length > 0) {
        this.emailSenderService.sendSupportTicketNotification(
          this.emailConfig,
          adminEmails,
          {
            title: ticket.title,
            type: ticket.type,
            userName,
            userEmail,
            description: ticket.description,
          },
          this.companyName ?? undefined
        ).catch(() => {});
      }
    }

    return toTicketDto(ticket);
  }
}

// ---------------------------------------------------------------------------
// GetSupportTicketsUseCase
// ---------------------------------------------------------------------------

/**
 * Returns all support tickets for a user, ordered by creation date descending.
 */
export class GetSupportTicketsUseCase {
  constructor(private supportTicketRepo: ISupportTicketRepository) {}

  async execute(tenantId: string, userId: string): Promise<SupportTicketResponseDto[]> {
    const tickets = await this.supportTicketRepo.findByUserId(tenantId, userId);
    return tickets.map(toTicketDto);
  }
}

// ---------------------------------------------------------------------------
// GetTicketDetailUseCase
// ---------------------------------------------------------------------------

/**
 * Returns a ticket together with its comment thread.
 */
export class GetTicketDetailUseCase {
  constructor(private supportTicketRepo: ISupportTicketRepository) {}

  async execute(
    tenantId: string,
    userId: string,
    ticketId: string
  ): Promise<TicketDetailResponseDto> {
    const result = await this.supportTicketRepo.findByIdWithComments(tenantId, userId, ticketId);
    if (!result) throw new Error('Ticket not found');

    return {
      ticket: toTicketDto(result.ticket),
      comments: result.comments.map(toCommentDto),
    };
  }
}

// ---------------------------------------------------------------------------
// UpdateTicketStatusUseCase
// ---------------------------------------------------------------------------

/**
 * Updates the status of a support ticket.
 */
export class UpdateTicketStatusUseCase {
  constructor(private supportTicketRepo: ISupportTicketRepository) {}

  async execute(
    tenantId: string,
    userId: string,
    ticketId: string,
    status: TicketStatus
  ): Promise<SupportTicketResponseDto> {
    const ticket = await this.supportTicketRepo.updateStatus(tenantId, userId, ticketId, status);
    return toTicketDto(ticket);
  }
}

// ---------------------------------------------------------------------------
// AddCommentUseCase
// ---------------------------------------------------------------------------

/**
 * Appends a comment to a ticket. Throws if the ticket is not `open`.
 */
export class AddCommentUseCase {
  constructor(private supportTicketRepo: ISupportTicketRepository) {}

  async execute(
    tenantId: string,
    userId: string,
    ticketId: string,
    content: string,
    userName: string,
    userEmail: string
  ): Promise<TicketCommentResponseDto> {
    const result = await this.supportTicketRepo.findByIdWithComments(tenantId, userId, ticketId);
    if (!result) throw new Error('Ticket not found');
    if (result.ticket.status !== 'open') {
      throw new Error('Solo se pueden agregar comentarios a tickets abiertos.');
    }

    const comment = await this.supportTicketRepo.addComment(tenantId, userId, ticketId, {
      ticketId,
      userId,
      userName,
      userEmail,
      content,
    });

    return toCommentDto(comment);
  }
}

// ---------------------------------------------------------------------------
// Re-export TicketType / TicketStatus for use in API routes
// ---------------------------------------------------------------------------
export type { TicketType, TicketStatus };
