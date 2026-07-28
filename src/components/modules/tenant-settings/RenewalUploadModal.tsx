"use client";

import { useState } from "react";
import { Modal, Button, Field, Input } from "@/components/ui";
import { uploadRenewalReceipt } from "@/lib/api/saas";
import { ApiError } from "@/lib/api/client";

interface RenewalUploadModalProps {
  open: boolean;
  onClose: () => void;
  defaultAmount?: number;
  onUploaded?: () => void;
}

export function RenewalUploadModal({ open, onClose, defaultAmount, onUploaded }: RenewalUploadModalProps) {
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : "");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError("Ingresa un monto válido.");
      return;
    }
    if (!file) {
      setError("Adjunta la foto del comprobante.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await uploadRenewalReceipt(amountNum, file);
      setAmount(defaultAmount ? String(defaultAmount) : "");
      setFile(null);
      onUploaded?.();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo enviar el comprobante.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adjuntar comprobante de pago"
      description="Súbelo y el equipo de la plataforma lo revisará para renovar tu suscripción."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={submitting}>Enviar comprobante</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Monto pagado" htmlFor="renewal-amount">
          <Input
            id="renewal-amount"
            type="number"
            min={0}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Foto del comprobante" htmlFor="renewal-file">
          <input
            id="renewal-file"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-content-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-content"
          />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
