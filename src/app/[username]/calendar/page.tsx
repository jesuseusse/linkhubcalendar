import { container } from "@/infrastructure/container";
import { PublicCalendarClient } from "./PublicCalendarClient";
import { resolveTenantIdFromHeaders } from "@/lib/auth/resolveTenantId";

export default async function PublicCalendarPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  try {
    const tenantId = await resolveTenantIdFromHeaders();
    const calendar = await container.getPublicCalendarUseCase.execute(tenantId, username);
    return <PublicCalendarClient calendar={calendar} username={username} />;
  } catch {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Calendar is not available</p>
      </div>
    );
  }
}
