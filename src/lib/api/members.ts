import { apiFetch } from "@/lib/api/client";
import type { Paginated } from "@/types/shared";
import type { Member, MemberBillingProfile, MembersMetrics } from "@/types/members";

export interface GetMembersParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function getMembers(params: GetMembersParams = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.status && params.status !== "all") qs.set("status", params.status);
  qs.set("page", String(params.page ?? 1));
  qs.set("pageSize", String(params.pageSize ?? 50));
  return apiFetch<Paginated<Member>>(`/members?${qs.toString()}`);
}

export function getMembersMetrics() {
  return apiFetch<MembersMetrics>("/members/metrics");
}

export function getMember(id: string) {
  return apiFetch<Pick<Member, "id" | "name" | "email" | "phone">>(`/members/${id}`);
}

export type CreateMemberInput = Pick<Member, "name" | "email" | "phone" | "gender" | "birthDate" | "subscription"> &
  Partial<Pick<Member, "avatarUrl" | "tags">>;

export function createMember(input: CreateMemberInput) {
  return apiFetch<Member>("/members", { method: "POST", body: JSON.stringify(input) });
}

export function getMemberBilling(memberId: string) {
  return apiFetch<MemberBillingProfile>(`/members/${memberId}/billing`);
}

export function updateMemberBilling(memberId: string, input: MemberBillingProfile) {
  return apiFetch<MemberBillingProfile>(`/members/${memberId}/billing`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
