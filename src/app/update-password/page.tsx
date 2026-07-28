"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Card, CardContent, Button, Input, Field } from "@/components/ui";
import { apiFetch, ApiError } from "@/lib/api/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{ ok: boolean; accessToken: string }>("/auth/update-password", {
        method: "POST",
        body: JSON.stringify({ newPassword }),
      });
      localStorage.setItem("mpt_token", data.accessToken);
      router.push("/clientes");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-5 py-8">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-content">Actualiza tu contraseña</h1>
            <p className="mt-1 text-sm text-content-subtle">
              Soporte generó una contraseña temporal. Define una nueva antes de continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nueva contraseña" htmlFor="newPassword">
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Field>

            <Field label="Confirmar contraseña" htmlFor="confirmPassword">
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Field>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" icon={KeyRound} loading={loading}>
              Guardar y continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
