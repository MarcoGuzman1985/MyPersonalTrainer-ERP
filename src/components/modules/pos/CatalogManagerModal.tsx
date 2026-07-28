"use client";

import { useState, type FormEvent } from "react";
import { Trash2, Plus, Pencil } from "lucide-react";
import { Modal, Button, Field, Input, Select } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { createProduct, updateProduct, deleteProduct, posCategories } from "@/lib/api/pos";
import { ApiError } from "@/lib/api/client";
import type { PosProduct } from "@/store/usePosStore";

interface CatalogManagerModalProps {
  open: boolean;
  onClose: () => void;
  products: PosProduct[];
  onChanged: () => void;
}

const emptyForm = { name: "", category: posCategories[0] as string, kind: "product" as PosProduct["kind"], price: "", stock: "" };

export function CatalogManagerModal({ open, onClose, products, onChanged }: CatalogManagerModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", stock: "" });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function startEdit(p: PosProduct) {
    setEditingId(p.id);
    setEditForm({ name: p.name, price: String(p.price), stock: p.stock != null ? String(p.stock) : "" });
    setRowError(null);
  }

  async function handleSaveEdit(id: string) {
    setSavingId(id);
    setRowError(null);
    try {
      await updateProduct(id, {
        name: editForm.name,
        price: Number(editForm.price),
        stock: editForm.stock === "" ? null : Number(editForm.stock),
      });
      setEditingId(null);
      onChanged();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "No se pudo guardar.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: string) {
    setSavingId(id);
    setRowError(null);
    try {
      await deleteProduct(id);
      onChanged();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "No se pudo eliminar.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);

    const price = Number(createForm.price);
    if (!createForm.name || !Number.isFinite(price) || price < 0) {
      setCreateError("Completa nombre y precio válidos.");
      return;
    }

    setCreating(true);
    try {
      await createProduct({
        name: createForm.name,
        category: createForm.category,
        kind: createForm.kind,
        price,
        stock: createForm.stock === "" ? null : Number(createForm.stock),
      });
      setCreateForm(emptyForm);
      onChanged();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "No se pudo crear el producto.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Administrar catálogo"
      description="Crea, edita o da de baja productos y membresías del POS."
      size="lg"
      footer={<Button variant="outline" onClick={onClose}>Cerrar</Button>}
    >
      <div className="space-y-6">
        <ul className="max-h-80 divide-y divide-line overflow-y-auto rounded-lg border border-line">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              {editingId === p.id ? (
                <div className="grid flex-1 grid-cols-3 gap-2">
                  <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                  <Input type="number" min={0} step={0.01} value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} />
                  <Input type="number" min={0} value={editForm.stock} onChange={(e) => setEditForm((f) => ({ ...f, stock: e.target.value }))} placeholder="Sin límite" />
                </div>
              ) : (
                <div>
                  <p className="font-medium text-content">{p.name}</p>
                  <p className="text-content-subtle">
                    {p.category} · {formatCurrency(p.price)} · {p.stock != null ? `${p.stock} ud` : "sin límite"}
                  </p>
                </div>
              )}

              <div className="flex shrink-0 gap-2">
                {editingId === p.id ? (
                  <Button size="sm" loading={savingId === p.id} onClick={() => handleSaveEdit(p.id)}>Guardar</Button>
                ) : (
                  <Button variant="outline" size="icon" icon={Pencil} aria-label={`Editar ${p.name}`} onClick={() => startEdit(p)} />
                )}
                <Button
                  variant="outline"
                  size="icon"
                  icon={Trash2}
                  aria-label={`Eliminar ${p.name}`}
                  loading={savingId === p.id && editingId !== p.id}
                  onClick={() => handleDelete(p.id)}
                />
              </div>
            </li>
          ))}
        </ul>

        {rowError && <p className="text-sm text-red-600">{rowError}</p>}

        <form onSubmit={handleCreate} className="space-y-4 border-t border-line pt-5">
          <p className="text-sm font-medium text-content">Nuevo producto</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="prod-name">
              <Input id="prod-name" value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} required />
            </Field>
            <Field label="Categoría" htmlFor="prod-category">
              <Select id="prod-category" value={createForm.category} onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}>
                {posCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Tipo" htmlFor="prod-kind">
              <Select id="prod-kind" value={createForm.kind} onChange={(e) => setCreateForm((f) => ({ ...f, kind: e.target.value as PosProduct["kind"] }))}>
                <option value="product">Producto</option>
                <option value="membership">Membresía</option>
              </Select>
            </Field>
            <Field label="Precio" htmlFor="prod-price">
              <Input id="prod-price" type="number" min={0} step={0.01} value={createForm.price} onChange={(e) => setCreateForm((f) => ({ ...f, price: e.target.value }))} required />
            </Field>
            <Field label="Stock" htmlFor="prod-stock" hint="Vacío = sin límite (membresías/servicios)">
              <Input id="prod-stock" type="number" min={0} value={createForm.stock} onChange={(e) => setCreateForm((f) => ({ ...f, stock: e.target.value }))} />
            </Field>
          </div>

          {createError && <p className="text-sm text-red-600">{createError}</p>}

          <Button type="submit" icon={Plus} loading={creating}>Crear producto</Button>
        </form>
      </div>
    </Modal>
  );
}
