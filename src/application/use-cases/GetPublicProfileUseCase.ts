import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import { PublicProfileDto } from "../../domain/dtos/AuthDtos";

export class GetPublicProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(tenantId: string, username: string): Promise<PublicProfileDto> {
    const user = await this.userRepository.findByUsername(tenantId, username);
    if (!user || !user.username) {
      throw new Error("Profile not found");
    }

    return {
      name: user.name,
      username: user.username,
      profilePhoto: user.profilePhoto,
      plan: user.plan ?? "free",
      planExpiredAt: user.planExpiredAt ?? null,
      contactFormEnabled: user.contactFormEnabled,
      calendarEnabled: user.calendarEnabled,
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
      calendarSlots: user.calendarEnabled
        ? (user.calendarSlots || []).map((slot) => ({
            id: slot.id,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            booked: slot.booked ?? false,
          }))
        : [],
    };
  }
}
