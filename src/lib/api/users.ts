import { apiFetch } from "@/lib/api/client";
import type {
  InviteUserInput, PermissionModule, Role, StaffUser, UsersMetrics,
} from "@/types/users";

export function getUsersMetrics() {
  return apiFetch<UsersMetrics>("/users/metrics");
}

export function getStaff() {
  return apiFetch<StaffUser[]>("/users");
}

export function getRoles() {
  return apiFetch<Role[]>("/roles");
}

export function getPermissionCatalog() {
  return apiFetch<PermissionModule[]>("/permissions/catalog");
}

export interface InviteUserResult extends StaffUser {
  tempPassword: string;
  emailSent: boolean;
}

export function inviteUser(input: InviteUserInput) {
  return apiFetch<InviteUserResult>("/users", { method: "POST", body: JSON.stringify(input) });
}

export function updateRolePermissions(roleId: string, permissions: string[]) {
  return apiFetch<{ id: string; permissions: string[] }>(`/roles/${roleId}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permissions }),
  });
}

export interface CreateRoleInput {
  name: string;
  description?: string;
}

export function createRole(input: CreateRoleInput) {
  return apiFetch<Role>("/roles", { method: "POST", body: JSON.stringify(input) });
}

export interface UpdateStaffInput {
  name?: string;
  email?: string;
  roleId?: string;
  status?: StaffUser["status"];
}

export function updateStaff(id: string, input: UpdateStaffInput) {
  return apiFetch<StaffUser>(`/users/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteStaff(id: string) {
  return apiFetch<{ ok: true }>(`/users/${id}`, { method: "DELETE" });
}
