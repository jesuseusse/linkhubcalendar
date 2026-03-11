import { User, CalendarSlot } from "../../domain/entities/User";
import { UserResponseDto, CalendarSlotResponseDto } from "../../domain/dtos/AuthDtos";

export function toUserResponse(user: User, slots: CalendarSlot[] = []): UserResponseDto {
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
    subscriptionCancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd,
    subscriptionStatus: user.subscriptionStatus,
    stripeSubscriptionId: user.stripeSubscriptionId,
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
    calendarSlots: slots.map((slot): CalendarSlotResponseDto => ({
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      booked: slot.booked ?? false,
    })),
  };
}
