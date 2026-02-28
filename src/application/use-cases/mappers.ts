import { User } from "../../domain/entities/User";
import { UserResponseDto } from "../../domain/dtos/AuthDtos";

export function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    name: user.name,
    description: user.description,
    email: user.email,
    emailVerified: user.emailVerified ?? false,
    username: user.username,
    usernameChangedAt: user.usernameChangedAt,
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
    calendarSlots: (user.calendarSlots || []).map((slot) => ({
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      booked: slot.booked ?? false,
    })),
  };
}
