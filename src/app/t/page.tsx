import { container } from "@/infrastructure/container";
import { PublicProfileClient } from "@/app/[username]/PublicProfileClient";
import { resolveTenantIdFromHeaders } from "@/lib/auth/resolveTenantId";

export default async function TenantProfilePage({ searchParams }: { searchParams: Promise<{ username?: string }> }) {
  const { username } = await searchParams;
  if (!username) {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><p className="text-sm text-muted-foreground">Not found</p></div>;
  }
  try {
    const tenantId = await resolveTenantIdFromHeaders();
    const profile = await container.getPublicProfileUseCase.execute(tenantId, username);
    return <PublicProfileClient profile={profile} />;
  } catch {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><p className="text-sm text-muted-foreground">Profile not found</p></div>;
  }
}
