import type { ClassAttendee, GymClass } from "@/types/schedule";

/**
 * Capa de datos del módulo Agenda y Clases (Bloque 6).
 * MOCK para demo de UI. Para conectar el backend, reemplazar `getClasses()` por:
 *   getClasses -> apiFetch<GymClass[]>(`/classes?from=${from}&to=${to}`)
 */

/** Devuelve el lunes (00:00 local) de la semana que contiene `ref`. */
function mondayOf(ref: Date): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const offset = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - offset);
  return d;
}

/** Construye un ISO local a partir del lunes base + desplazamiento de día/hora. */
function slot(monday: Date, dayOffset: number, hour: number, minute = 0): string {
  const d = new Date(monday);
  d.setDate(monday.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Suma minutos a un ISO y devuelve el nuevo ISO. */
function plusMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

/**
 * Genera las clases de la semana que contiene la fecha indicada.
 * Distribuidas de lunes a domingo, en distintas franjas y con
 * aforos variados (libres, casi llenas y llenas con lista de espera).
 */
export function getClasses(ref: Date = new Date()): GymClass[] {
  // TODO(backend): GET /api/classes?from=&to=
  const monday = mondayOf(ref);
  const mk = (
    id: string,
    title: string,
    coach: string,
    room: string,
    type: GymClass["type"],
    day: number,
    hour: number,
    durationMin: number,
    capacity: number,
    booked: number,
    waitlist: number,
    minute = 0,
  ): GymClass => {
    const start = slot(monday, day, hour, minute);
    return {
      id,
      title,
      coach,
      room,
      type,
      start,
      end: plusMinutes(start, durationMin),
      capacity,
      booked,
      waitlist,
    };
  };

  return [
    // Lunes
    mk("cls_1", "CrossFit WOD", "Marco Guzmán", "Sala A", "crossfit", 0, 7, 60, 20, 12, 0),
    mk("cls_2", "Spinning Power", "Lucía Fernández", "Sala Ciclo", "spinning", 0, 9, 45, 24, 24, 5),
    mk("cls_3", "Yoga Flow", "Ana López", "Sala B", "yoga", 0, 18, 60, 18, 8, 0),
    // Martes
    mk("cls_4", "HIIT Express", "Diego Ramírez", "Sala A", "hiit", 1, 8, 30, 16, 15, 0),
    mk("cls_5", "Funcional", "Carla Méndez", "Sala A", "funcional", 1, 12, 50, 20, 9, 0, 30),
    mk("cls_6", "Boxeo", "Javier Soto", "Ring", "boxeo", 1, 19, 60, 14, 14, 3),
    // Miércoles
    mk("cls_7", "CrossFit WOD", "Marco Guzmán", "Sala A", "crossfit", 2, 7, 60, 20, 18, 0),
    mk("cls_8", "Spinning Power", "Lucía Fernández", "Sala Ciclo", "spinning", 2, 9, 45, 24, 17, 0),
    mk("cls_9", "Yoga Flow", "Ana López", "Sala B", "yoga", 2, 18, 60, 18, 6, 0),
    // Jueves
    mk("cls_10", "HIIT Express", "Diego Ramírez", "Sala A", "hiit", 3, 8, 30, 16, 16, 7),
    mk("cls_11", "Funcional", "Carla Méndez", "Sala A", "funcional", 3, 17, 50, 20, 11, 0, 30),
    mk("cls_12", "Boxeo", "Javier Soto", "Ring", "boxeo", 3, 19, 60, 14, 10, 0),
    // Viernes
    mk("cls_13", "CrossFit WOD", "Marco Guzmán", "Sala A", "crossfit", 4, 7, 60, 20, 14, 0),
    mk("cls_14", "Spinning Power", "Lucía Fernández", "Sala Ciclo", "spinning", 4, 12, 45, 24, 22, 0),
    mk("cls_15", "Yoga Flow", "Ana López", "Sala B", "yoga", 4, 18, 60, 18, 18, 2),
    // Sábado
    mk("cls_16", "Funcional", "Carla Méndez", "Sala A", "funcional", 5, 10, 50, 20, 13, 0),
    mk("cls_17", "Boxeo", "Javier Soto", "Ring", "boxeo", 5, 11, 60, 14, 7, 0, 30),
    // Domingo
    mk("cls_18", "Yoga Flow", "Ana López", "Sala B", "yoga", 6, 10, 60, 18, 4, 0),
  ];
}

/** Lista de inscritos mock para el detalle de una clase. */
export function getAttendees(cls: GymClass): ClassAttendee[] {
  const nombres = [
    "Sofía Navarro", "Pablo Iglesias", "María Torres", "Hugo Castro",
    "Elena Vidal", "Iván Reyes", "Laura Gil", "Adrián Moya",
    "Noa Serrano", "Marta Ortega", "Bruno Lima", "Vera Cano",
    "Óscar Peña", "Daniela Rico", "Leo Bravo", "Irene Sanz",
    "Mateo Cruz", "Alba Ferrer", "Nil Aguado", "Rocío Pardo",
    "Gael Ibáñez", "Lía Crespo", "Saúl Vega", "Aitana Lozano",
  ];
  const total = cls.booked + cls.waitlist;
  return Array.from({ length: total }, (_, i) => ({
    id: `${cls.id}_att_${i + 1}`,
    name: nombres[i % nombres.length],
    waitlisted: i >= cls.booked,
  }));
}
