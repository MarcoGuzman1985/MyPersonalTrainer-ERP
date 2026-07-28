import { apiFetch } from "@/lib/api/client";
import type { Coach } from "@/types/schedule";

export function getCoaches() {
  return apiFetch<Coach[]>("/coaches");
}

export interface CoachInput {
  firstName: string;
  lastName: string;
  dob?: string | null;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
  anthropometricData?: Record<string, unknown>;
}

export function createCoach(input: CoachInput) {
  return apiFetch<Coach>("/coaches", { method: "POST", body: JSON.stringify(input) });
}

export function updateCoach(id: string, input: CoachInput) {
  return apiFetch<Coach>(`/coaches/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteCoach(id: string) {
  return apiFetch<{ ok: true }>(`/coaches/${id}`, { method: "DELETE" });
}
