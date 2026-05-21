import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import { IAppointmentRepository } from "../../domain/interfaces/IAppointmentRepository";
import { PublicProfileDto } from "../../domain/dtos/AuthDtos";

export class GetPublicProfileUseCase {
  constructor(
    private userRepository: IUserRepository,
    private appointmentRepository: IAppointmentRepository
  ) {}

  async execute(tenantId: string, username: string): Promise<PublicProfileDto> {
    const user = await this.userRepository.findByUsername(tenantId, username);
    if (!user || !user.username) {
      throw new Error("Profile not found");
    }

    const availableSlots = user.calendarEnabled
      ? await this.appointmentRepository.findAvailableSlots(tenantId, user.id)
      : [];

    return {
      name: user.name,
      description: user.description,
      username: user.username,
      profilePhoto: user.profilePhoto,
      plan: user.plan ?? "free",
      planExpiredAt: user.planExpiredAt ?? null,
      contactFormEnabled: user.contactFormEnabled,
      calendarEnabled: user.calendarEnabled,
      galleryEnabled: user.galleryEnabled,
      galleryPhotos: (user.galleryPhotos ?? []).map((p) => ({
        id: p.id,
        url: p.url,
        order: p.order,
      })),
      theme: user.theme
        ? {
            backgroundColor: user.theme.backgroundColor,
            textColor: user.theme.textColor,
            buttonColor: user.theme.buttonColor,
            buttonTextColor: user.theme.buttonTextColor,
            accentColor: user.theme.accentColor,
          }
        : undefined,
      links: user.links.map((link) => ({
        id: link.id,
        title: link.title,
        url: link.url,
      })),
      calendarSlots: availableSlots.map((slot) => ({
        id: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        booked: slot.booked ?? false,
      })),
    };
  }
}
