import type { ID } from "@/types/shared";

/** Etapa del lead dentro del embudo comercial (kanban). */
export type LeadStage = "new" | "contacted" | "scheduled" | "won" | "lost";

/** Canal de captación del lead. */
export type LeadSource = "Instagram" | "Web" | "Referido" | "Walk-in";

/** Prospecto/lead gestionado en el CRM del gimnasio. */
export interface Lead {
  id: ID;
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  /** Valor potencial de la membresía. */
  value: number;
  /** Comercial responsable del seguimiento. */
  assignedTo: string;
  createdAt: string;
  stage: LeadStage;
  note?: string;
}
