import { apiFetch } from "@/lib/api/client";

export interface TenantUsage {
  membersUsed: number;
  membersLimit: number;
  seatsUsed: number;
  seatsLimit: number;
}

export function getTenantUsage() {
  return apiFetch<TenantUsage>("/tenant/usage");
}
