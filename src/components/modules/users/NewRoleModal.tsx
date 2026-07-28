"use client";

import { useState, type FormEvent } from "react";
import { Modal, Button, Field, Input } from "@/components/ui";
import { createRole } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";

interface NewRoleModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function NewRoleModal({ open, onClose, onCreated }: NewRoleModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("El nombre del rol es requerido.");
      return;
    }
    setSubmitting(true);
    try {
      await createRole({ name: name.trim(), description: description.trim() });
      setName("");
      setDescription("");
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el rol.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo rol"
      description="Después de crearlo, asígnale permisos en la matriz de abajo."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button form="new-role-form" type="submit" loading={submitting}>Crear rol</Button>
        </>
      }
    >
      <form id="new-role-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre" htmlFor="role-name">
          <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Descripción" htmlFor="role-description">
          <Input id="role-description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
