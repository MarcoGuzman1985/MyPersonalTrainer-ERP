import { apiFetch } from "@/lib/api/client";
import type { Room } from "@/types/schedule";

export function getRooms() {
  return apiFetch<Room[]>("/rooms");
}

export interface RoomInput {
  name: string;
  capacity: number;
  status: Room["status"];
  notes?: string;
}

export function createRoom(input: RoomInput) {
  return apiFetch<Room>("/rooms", { method: "POST", body: JSON.stringify(input) });
}

export function updateRoom(id: string, input: RoomInput) {
  return apiFetch<Room>(`/rooms/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteRoom(id: string) {
  return apiFetch<{ ok: true }>(`/rooms/${id}`, { method: "DELETE" });
}
