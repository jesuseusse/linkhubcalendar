export function isPlanExpired(planExpiredAt?: string | null): boolean {
  if (!planExpiredAt) return false;
  return new Date(planExpiredAt) <= new Date();
}
