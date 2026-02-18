export function isPlanExpired(planExpiredAt?: number | null): boolean {
  if (!planExpiredAt) return false;
  return planExpiredAt <= Date.now();
}
