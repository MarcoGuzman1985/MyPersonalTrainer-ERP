"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Lock } from "lucide-react";
import { Card, CardHeader, CardContent, Button, Select, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { PermissionModule, Role } from "@/types/users";
import { updateRolePermissions } from "@/lib/api/users";
import { Checkbox } from "./Checkbox";

interface PermissionMatrixProps {
  roles: Role[];
  catalog: PermissionModule[];
  onSaved?: () => void;
}

/**
 * Editor RBAC: selecciona un rol y alterna permisos granulares
 * agrupados por módulo. Mantiene estado local hasta "Guardar cambios".
 */
export function PermissionMatrix({ roles, catalog, onSaved }: PermissionMatrixProps) {
  const [roleId, setRoleId] = useState<string>(roles[0]?.id ?? "");
  const selectedRole = useMemo(
    () => roles.find((r) => r.id === roleId) ?? roles[0],
    [roles, roleId],
  );

  // Estado local de permisos seleccionados (Set para alternar con rapidez).
  const [granted, setGranted] = useState<Set<string>>(new Set(selectedRole?.permissions ?? []));
  const [saving, setSaving] = useState(false);

  // Al cambiar de rol reseteamos el borrador a sus permisos guardados.
  useEffect(() => {
    setGranted(new Set(selectedRole?.permissions ?? []));
  }, [selectedRole]);

  const baseline = useMemo(() => new Set(selectedRole?.permissions ?? []), [selectedRole]);
  const isDirty = useMemo(() => {
    if (granted.size !== baseline.size) return true;
    for (const key of granted) if (!baseline.has(key)) return true;
    return false;
  }, [granted, baseline]);

  const toggle = (key: string) => {
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleModule = (module: PermissionModule, on: boolean) => {
    setGranted((prev) => {
      const next = new Set(prev);
      for (const a of module.actions) {
        if (on) next.add(a.key);
        else next.delete(a.key);
      }
      return next;
    });
  };

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateRolePermissions(selectedRole.id, Array.from(granted));
      onSaved?.();
    } catch {
      setSaveError("No se pudieron guardar los permisos.");
    } finally {
      setSaving(false);
    }
  };

  if (!selectedRole) return null;

  return (
    <Card>
      <CardHeader
        title="Matriz de permisos"
        description="Asigna accesos granulares por módulo al rol seleccionado."
        action={
          <Button
            variant="primary"
            size="sm"
            icon={Save}
            loading={saving}
            disabled={!isDirty}
            onClick={handleSave}
          >
            Guardar cambios
          </Button>
        }
      />
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[18rem_1fr] sm:items-end">
          <div>
            <label htmlFor="role-select" className="mb-1.5 block text-sm font-medium text-content">
              Rol
            </label>
            <Select id="role-select" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-content-muted">{selectedRole.description}</p>
            {selectedRole.isSystem && (
              <Badge tone="neutral" className="inline-flex items-center gap-1">
                <Lock className="h-3 w-3" /> Rol del sistema
              </Badge>
            )}
            <Badge tone="brand">{granted.size} permisos</Badge>
          </div>
        </div>
        {saveError && <p className="text-sm text-red-600">{saveError}</p>}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {catalog.map((module) => {
            const total = module.actions.length;
            const active = module.actions.filter((a) => granted.has(a.key)).length;
            const allOn = active === total;
            return (
              <div
                key={module.key}
                className="rounded-lg border border-line bg-surface-muted/40 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Checkbox
                    checked={allOn}
                    onChange={(on) => toggleModule(module, on)}
                    label={module.label}
                    className="font-medium"
                  />
                  <span
                    className={cn(
                      "shrink-0 text-xs tabular-nums",
                      allOn ? "text-teal-600" : "text-content-subtle",
                    )}
                  >
                    {active}/{total}
                  </span>
                </div>
                <div className="space-y-2 pl-1">
                  {module.actions.map((action) => (
                    <Checkbox
                      key={action.key}
                      checked={granted.has(action.key)}
                      onChange={() => toggle(action.key)}
                      label={action.label}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
