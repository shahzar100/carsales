// TODO (Day 12.6): convert to the server-component + client-island pattern.
// See viewing/page.tsx + components/Admin/ViewingBookingsClient.tsx for the
// canonical example. This page is larger (CRUD on car parts inventory) so
// the conversion is bigger — fetch the parts list server-side, hand to a
// CarPartsClient that owns the create/edit/delete modals.
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { PlusCircle, Pencil, Trash2, Loader2 } from "lucide-react";
import Button from "@/components/Helpful/Buttons/Button";
import Modal from "@/components/Helpful/Buttons/Modal";
import ConfirmDialog from "@/components/UI/ConfirmDialog";
import EmptyState from "@/components/UI/EmptyState";
import ImageUploader from "@/components/Admin/ImageUploader";
import { useToast } from "@/contexts/ToastContext";
import { CarPartInterface } from "@/lib/interfaces";
import { formatPrice } from "@/lib/utils/format";

const EMPTY_FORM = {
  name: "",
  brand: "",
  category: "",
  price: "",
  image: "",
  condition: "New" as "New" | "Used" | "Refurbished",
  compatibility: "",
  description: "",
  inStock: true,
};

export default function CarPartsManagement() {
  const [parts, setParts] = useState<CarPartInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  // editTarget == null means we're adding; non-null means we're editing that part.
  const [editTarget, setEditTarget] = useState<CarPartInterface | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CarPartInterface | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  // Form state — shared between Add and Edit flows.
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchParts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/carparts");
      if (!res.ok) throw new Error("Failed to fetch car parts");
      const json = await res.json();
      // API returns { success: true, data: CarPartInterface[] } — unwrap it
      setParts(Array.isArray(json) ? json : json.data || []);
    } catch {
      toast.error("Failed to load car parts");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const openEditModal = (part: CarPartInterface) => {
    setEditTarget(part);
    setFormData({
      name: part.name,
      brand: part.brand,
      category: part.category,
      price: String(part.price),
      image: part.image ?? "",
      condition: part.condition,
      compatibility: part.compatibility ?? "",
      description: part.description ?? "",
      inStock: part.inStock,
    });
  };

  const closeFormModal = () => {
    setShowAddForm(false);
    setEditTarget(null);
    setFormData(EMPTY_FORM);
  };

  // Single submit handler — POSTs for new parts, PUTs for edits to the same
  // /api/admin/carparts endpoint. The PUT route exists and is tested but
  // until now had no UI calling it.
  const handleSubmitPart = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = editTarget !== null;
    try {
      setSubmitting(true);
      const body = isEdit
        ? {
            _id: editTarget!._id,
            ...formData,
            price: parseFloat(formData.price),
          }
        : { ...formData, price: parseFloat(formData.price) };

      const res = await fetch("/api/admin/carparts", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(
          isEdit ? "Failed to update part" : "Failed to add part"
        );
      }
      toast.success(
        isEdit ? "Car part updated successfully" : "Car part added successfully"
      );
      closeFormModal();
      fetchParts();
    } catch {
      toast.error(
        isEdit ? "Failed to update car part" : "Failed to add car part"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePart = async () => {
    if (!deleteTarget?._id) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/carparts?id=${deleteTarget._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete part");
      toast.success("Car part deleted successfully");
      setDeleteTarget(null);
      fetchParts();
    } catch {
      toast.error("Failed to delete car part");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-red-600" />
          <span className="text-lg text-gray-600">Loading car parts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Car Parts Management
          </h1>
          <p className="text-sm text-gray-500">
            {parts.length} parts in inventory
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Part
        </Button>
      </div>

      {/* Add / Edit Part Form Modal — same form, different submit method */}
      {(showAddForm || editTarget) && (
        <Modal
          title={editTarget ? "Edit Part" : "Add New Part"}
          onClose={closeFormModal}
        >
          <form onSubmit={handleSubmitPart} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      condition: e.target.value as
                        | "New"
                        | "Used"
                        | "Refurbished",
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="New">New</option>
                  <option value="Used">Used</option>
                  <option value="Refurbished">Refurbished</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Compatibility
              </label>
              <input
                type="text"
                value={formData.compatibility}
                onChange={(e) =>
                  setFormData({ ...formData, compatibility: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Image
              </label>
              <ImageUploader
                folder="parts"
                onUpload={(url) => setFormData({ ...formData, image: url })}
                onRemove={() => setFormData({ ...formData, image: "" })}
                existingImages={formData.image ? [formData.image] : []}
                maxImages={1}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="inStock"
                checked={formData.inStock}
                onChange={(e) =>
                  setFormData({ ...formData, inStock: e.target.checked })
                }
              />
              <label
                htmlFor="inStock"
                className="text-sm font-medium text-gray-700"
              >
                In Stock
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={closeFormModal}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                {editTarget ? "Save Changes" : "Add Part"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation — uses the shared ConfirmDialog primitive */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete car part?"
          description={
            <>
              <strong>{deleteTarget.name}</strong> will be permanently removed
              from inventory. This cannot be undone.
            </>
          }
          confirmLabel="Delete part"
          variant="danger"
          loading={deleting}
          onConfirm={handleDeletePart}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Content (overlay handles its own dimming via backdrop) */}
      <>
          {parts.length === 0 ? (
            <EmptyState
              icon={PlusCircle}
              title="No parts yet"
              description="Add your first car part to get started."
              action={
                <Button onClick={() => setShowAddForm(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add First Part
                </Button>
              }
              size="lg"
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Condition
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      In Stock
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {parts.map((part) => (
                    // _id is `string | ObjectId` per the interface; the API
                    // serialises ObjectId → string before returning, so at
                    // runtime this is always a string. (CODEBASE_ISSUES C18.)
                    <tr key={String(part._id)} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                        {part.name}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        {part.brand}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        {part.category}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        {formatPrice(part.price)}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            part.condition === "New"
                              ? "bg-emerald-100 text-emerald-700"
                              : part.condition === "Refurbished"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {part.condition}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <span
                          className={`font-medium ${
                            part.inStock ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          <span className="sr-only">Status: </span>
                          {part.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditModal(part)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteTarget(part)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
    </div>
  );
}
