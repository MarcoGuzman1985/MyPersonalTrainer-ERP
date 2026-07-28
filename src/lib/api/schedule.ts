import { apiFetch } from "@/lib/api/client";
import type { ClassAttendee, ClassType, GymClass } from "@/types/schedule";

export interface GetClassesParams {
  from: string;
  to: string;
  roomId?: string | null;
  coachId?: string | null;
  memberId?: string | null;
}

export function getClasses(params: GetClassesParams) {
  const qs = new URLSearchParams({ from: params.from, to: params.to });
  if (params.roomId) qs.set("roomId", params.roomId);
  if (params.coachId) qs.set("coachId", params.coachId);
  if (params.memberId) qs.set("memberId", params.memberId);
  return apiFetch<GymClass[]>(`/classes?${qs.toString()}`);
}

export function getAttendees(classId: string) {
  return apiFetch<ClassAttendee[]>(`/classes/${classId}/attendees`);
}

export interface CreateClassInput {
  title: string;
  roomId: string;
  coachId?: string | null;
  type: ClassType;
  start: string;
  end: string;
  capacity?: number;
}

export function createClass(input: CreateClassInput) {
  return apiFetch<GymClass>("/classes", { method: "POST", body: JSON.stringify(input) });
}

export interface BookClassResult {
  status: "confirmed" | "waitlisted";
}

export function bookClass(classId: string, memberId: string) {
  return apiFetch<BookClassResult>(`/classes/${classId}/book`, {
    method: "POST",
    body: JSON.stringify({ memberId }),
  });
}
