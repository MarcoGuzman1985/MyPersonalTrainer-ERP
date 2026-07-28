"use client";

import { useEffect, useState } from "react";
import { getMember } from "@/lib/api/members";
import { getClasses } from "@/lib/api/schedule";
import { formatDateTime } from "@/lib/utils";
import type { GymClass } from "@/types/schedule";

const TYPE_LABEL: Record<GymClass["type"], string> = {
  crossfit: "CrossFit", spinning: "Spinning", yoga: "Yoga",
  funcional: "Funcional", boxeo: "Boxeo", hiit: "HIIT",
};

export default function AgendaPrintPage({ params }: { params: { memberId: string } }) {
  const [member, setMember] = useState<{ name: string; email: string; phone: string } | null>(null);
  const [classes, setClasses] = useState<GymClass[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const to = new Date(now.getTime() + 90 * 86400_000);
    Promise.all([
      getMember(params.memberId),
      getClasses({ from: now.toISOString(), to: to.toISOString(), memberId: params.memberId }),
    ])
      .then(([m, cls]) => {
        setMember(m);
        setClasses(cls);
      })
      .catch(() => setError("No se pudo cargar la agenda."));
  }, [params.memberId]);

  useEffect(() => {
    if (!classes) return;
    const timer = setTimeout(() => window.print(), 350);
    return () => clearTimeout(timer);
  }, [classes]);

  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!member || !classes) return <p className="p-6 text-sm text-gray-500">Cargando agenda…</p>;

  return (
    <>
      <style>{`
        @page { size: A4; margin: 20mm; }
        @media print { .no-print { display: none !important; } }
        .doc { font-family: Arial, Helvetica, sans-serif; color: #111; max-width: 700px; margin: 0 auto; }
        .doc table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .doc th, .doc td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; font-size: 13px; }
        .doc th { background: #f3f4f6; }
      `}</style>

      <div className="no-print flex justify-center gap-3 py-4">
        <button onClick={() => window.print()} className="rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white">
          Exportar / Imprimir
        </button>
      </div>

      <div className="doc p-6">
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Agenda de clases</h1>
        <p style={{ marginTop: 4, color: "#444" }}>
          {member.name} · {member.email} · {member.phone}
        </p>
        <p style={{ marginTop: 2, fontSize: 12, color: "#777" }}>
          Generado el {formatDateTime(new Date().toISOString())}
        </p>

        {classes.length === 0 ? (
          <p style={{ marginTop: 20 }}>No tiene clases futuras agendadas.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Clase</th>
                <th>Sala</th>
                <th>Coach</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id}>
                  <td>{formatDateTime(c.start)}</td>
                  <td>{c.title} ({TYPE_LABEL[c.type]})</td>
                  <td>{c.room}</td>
                  <td>{c.coach}</td>
                  <td>{c.memberBookingStatus === "waitlisted" ? "En lista de espera" : "Confirmada"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
