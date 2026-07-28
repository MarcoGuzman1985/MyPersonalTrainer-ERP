"use client";

import { useEffect, useState } from "react";
import { Modal, Button, Field, Input } from "@/components/ui";
import { getMemberBilling, updateMemberBilling } from "@/lib/api/members";
import type { MemberBillingProfile } from "@/types/members";

const empty: MemberBillingProfile = { legalName: "", taxId: "", billingEmail: "", address: "" };

interface BillingModalProps {
  open: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
}

export function BillingModal({ open, onClose, memberId, memberName }: BillingModalProps) {
  const [form, setForm] = useState<MemberBillingProfile>(empty);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    getMemberBilling(memberId)
      .then(setForm)
      .catch(() => setError("No se pudieron cargar los datos de facturación."))
      .finally(() => setLoading(false));
  }, [open, memberId]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateMemberBilling(memberId, form);
      onClose();
    } catch {
      setError("No se pudieron guardar los datos de facturación.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Actualizar datos de facturación"
      description={memberName}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving} disabled={loading}>Guardar</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Razón social / Nombre fiscal" htmlFor="billing-legal-name">
          <Input
            id="billing-legal-name"
            value={form.legalName}
            onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))}
            disabled={loading}
          />
        </Field>
        <Field label="RFC / NIF / RUC" htmlFor="billing-tax-id">
          <Input
            id="billing-tax-id"
            value={form.taxId}
            onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
            disabled={loading}
          />
        </Field>
        <Field label="Correo de facturación" htmlFor="billing-email">
          <Input
            id="billing-email"
            type="email"
            value={form.billingEmail}
            onChange={(e) => setForm((f) => ({ ...f, billingEmail: e.target.value }))}
            disabled={loading}
          />
        </Field>
        <Field label="Dirección fiscal" htmlFor="billing-address">
          <Input
            id="billing-address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            disabled={loading}
          />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
