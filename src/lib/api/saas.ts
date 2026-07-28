import { apiFetch } from "@/lib/api/client";
import type {
  IntegrationProvider, PlanDefinition, SaaSMetrics, SubscriptionRenewal, Tenant, TenantIntegration,
} from "@/types/saas";

export function getSaasMetrics() {
  return apiFetch<SaaSMetrics>("/saas/metrics");
}

export function getPlans() {
  return apiFetch<PlanDefinition[]>("/saas/plans");
}

export function getTenants() {
  return apiFetch<Tenant[]>("/saas/tenants");
}

export interface CreateTenantInput {
  gymName: string;
  ownerName: string;
  ownerEmail: string;
  tempPassword: string;
  plan: string;
  trialDays: number;
}

export function createTenant(input: CreateTenantInput) {
  return apiFetch<Tenant>("/saas/tenants", { method: "POST", body: JSON.stringify(input) });
}

export function getRenewals() {
  return apiFetch<SubscriptionRenewal[]>("/saas/renewals");
}

export function uploadRenewalReceipt(amount: number, file: File) {
  const formData = new FormData();
  formData.append("amount", String(amount));
  formData.append("receipt", file);
  return apiFetch<SubscriptionRenewal>("/saas/renewals/upload", { method: "POST", body: formData });
}

export interface UpdateTenantInput {
  status?: Tenant["status"];
  owner?: string;
  ownerEmail?: string;
  plan?: string;
  monthlyPrice?: number;
  metadata?: Record<string, unknown>;
}

export function updateTenant(id: string, input: UpdateTenantInput) {
  return apiFetch<Tenant>(`/saas/tenants/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function resetTenantPassword(id: string, tempPassword?: string) {
  return apiFetch<{ ownerEmail: string; tempPassword: string; emailSent: boolean }>(
    `/saas/tenants/${id}/reset-password`,
    { method: "POST", body: JSON.stringify({ tempPassword }) },
  );
}

export interface UpdatePlanInput {
  monthlyPrice: number;
  maxMembers: number;
  maxSeats: number;
}

export function updatePlan(id: string, input: UpdatePlanInput) {
  return apiFetch<PlanDefinition>(`/saas/plans/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export interface CreatePlanInput {
  id: string;
  name: string;
  monthlyPrice: number;
  maxMembers: number;
  maxSeats: number;
  features: string[];
  highlighted?: boolean;
}

export function createPlan(input: CreatePlanInput) {
  return apiFetch<PlanDefinition>("/saas/plans", { method: "POST", body: JSON.stringify(input) });
}

export function deletePlan(id: string) {
  return apiFetch<{ ok: true }>(`/saas/plans/${id}`, { method: "DELETE" });
}

export function getTenantIntegrations(tenantId: string) {
  return apiFetch<TenantIntegration[]>(`/saas/tenants/${tenantId}/integrations`);
}

export function updateTenantIntegration(
  tenantId: string,
  provider: IntegrationProvider,
  input: { credentials: Record<string, unknown>; isActive: boolean },
) {
  return apiFetch<TenantIntegration>(`/saas/tenants/${tenantId}/integrations`, {
    method: "PUT",
    body: JSON.stringify({ provider, ...input }),
  });
}
