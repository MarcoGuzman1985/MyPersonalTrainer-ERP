import type { Lead } from "@/types/crm";

/**
 * Capa de datos del módulo CRM y Leads.
 * MOCK para demo de UI. Para conectar el backend, reemplazar por:
 *   getLeads  -> apiFetch<Lead[]>("/leads")
 *   moveLead  -> apiFetch<Lead>(`/leads/${id}`, { method: "PATCH", body: { stage } })
 *
 * // TODO(backend): GET /api/leads
 * // TODO(backend): PATCH /api/leads/:id (mover etapa)
 */

export const leadsMock: Lead[] = [
  // Lead Nuevo
  { id: "lead_1", name: "Sofía Herrera", phone: "+34 611 222 333", email: "sofia@mail.com", source: "Instagram", value: 49, assignedTo: "Marco Guzmán", createdAt: "2026-05-22", stage: "new" },
  { id: "lead_2", name: "Andrés Pérez", phone: "+34 622 333 444", source: "Web", value: 79, assignedTo: "Lucía Fernández", createdAt: "2026-05-23", stage: "new" },
  { id: "lead_3", name: "Marta Vidal", phone: "+34 633 444 555", email: "marta.v@mail.com", source: "Walk-in", value: 39, assignedTo: "Marco Guzmán", createdAt: "2026-05-24", stage: "new" },

  // Contactado
  { id: "lead_4", name: "Javier Soto", phone: "+34 644 555 666", source: "Referido", value: 99, assignedTo: "Lucía Fernández", createdAt: "2026-05-18", stage: "contacted", note: "Interesado en plan trimestral." },
  { id: "lead_5", name: "Elena Ríos", phone: "+34 655 666 777", email: "elena@mail.com", source: "Instagram", value: 49, assignedTo: "Diego Ramírez", createdAt: "2026-05-19", stage: "contacted" },

  // Visita Programada
  { id: "lead_6", name: "Pablo Cano", phone: "+34 666 777 888", source: "Web", value: 79, assignedTo: "Marco Guzmán", createdAt: "2026-05-15", stage: "scheduled", note: "Visita el viernes 17:00." },
  { id: "lead_7", name: "Nuria Gil", phone: "+34 677 888 999", email: "nuria.gil@mail.com", source: "Referido", value: 129, assignedTo: "Diego Ramírez", createdAt: "2026-05-16", stage: "scheduled" },

  // Membresía Vendida
  { id: "lead_8", name: "Carlos Bravo", phone: "+34 688 999 000", source: "Walk-in", value: 99, assignedTo: "Lucía Fernández", createdAt: "2026-05-10", stage: "won" },
  { id: "lead_9", name: "Lucía Mena", phone: "+34 699 000 111", email: "lucia.mena@mail.com", source: "Instagram", value: 79, assignedTo: "Marco Guzmán", createdAt: "2026-05-12", stage: "won" },
  { id: "lead_10", name: "Iván Toledo", phone: "+34 600 111 222", source: "Web", value: 149, assignedTo: "Diego Ramírez", createdAt: "2026-05-13", stage: "won" },

  // Perdido
  { id: "lead_11", name: "Rosa Lima", phone: "+34 610 222 333", source: "Referido", value: 49, assignedTo: "Lucía Fernández", createdAt: "2026-05-05", stage: "lost", note: "Eligió otro gimnasio." },
  { id: "lead_12", name: "Hugo Salas", phone: "+34 620 333 444", email: "hugo@mail.com", source: "Instagram", value: 39, assignedTo: "Diego Ramírez", createdAt: "2026-05-07", stage: "lost" },
];
