import { container } from "@/infrastructure/container";
import { PublicCalendarClient } from "@/app/[username]/calendar/PublicCalendarClient";
import { resolveTenantIdFromHeaders } from "@/lib/auth/resolveTenantId";

export default async function TenantCalendarPage({ searchParams }: { searchParams: Promise<{ username?: string }> }) {
  const { username } = await searchParams;
  if (!username) {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><p className="text-sm text-muted-foreground">Not found</p></div>;
  }
  try {
    const tenantId = await resolveTenantIdFromHeaders();
    const calendar = await container.getPublicCalendarUseCase.execute(tenantId, username);
    return <PublicCalendarClient calendar={calendar} username={username} />;
  } catch {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><p className="text-sm text-muted-foreground">Calendar not available</p></div>;
  }
}
