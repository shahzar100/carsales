"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, X } from "lucide-react";

import { CarInterface } from "@/lib/interfaces";
import Dropdown from "@/components/Form/Dropdown";
import {
  FormInput,
  FormTextarea,
  FormToggle,
} from "@/components/Form/FormPrimitives";
import ImageUploader from "@/components/Admin/ImageUploader";
import { useToast } from "@/contexts/ToastContext";
import {
  currentYear,
  fuelOptions,
  transmissionOptions,
  doorOptions,
  statusOptions,
} from "./carFormOptions";

interface EditCarFormProps {
  car: CarInterface;
}

/**
 * Full edit form for an existing car. Mirrors the field set of the
 * multi-step `CarForm` (create flow) but as a single scrollable page —
 * editing an existing listing is a "jump to the field I want" task, not a
 * guided wizard. Wires the `PUT /api/admin/cars` endpoint, which validates
 * against `carSchema.partial()` and so accepts every field below.
 */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <fieldset className="space-y-4 border-t border-gray-100 pt-5 first:border-0 first:pt-0">
    <legend className="text-sm font-semibold text-gray-900">{title}</legend>
    {children}
  </fieldset>
);

const EditCarForm: React.FC<EditCarFormProps> = ({ car }) => {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [make, setMake] = useState(car.make ?? "");
  const [model, setModel] = useState(car.model ?? "");
  const [year, setYear] = useState(String(car.year ?? ""));
  const [price, setPrice] = useState(String(car.price ?? ""));
  const [mileage, setMileage] = useState(String(car.mileage ?? ""));
  const [fuel, setFuel] = useState<string>(car.fuel ?? "");
  const [transmission, setTransmission] = useState<string>(
    car.transmission ?? ""
  );
  const [doors, setDoors] = useState(car.doors ? String(car.doors) : "");
  const [colour, setColour] = useState(car.colour ?? "");
  const [image, setImage] = useState(car.image ?? "");
  const [images, setImages] = useState<string[]>(car.images ?? []);
  const [features, setFeatures] = useState<string[]>(car.features ?? []);
  const [featureInput, setFeatureInput] = useState("");
  const [status, setStatus] = useState(car.status);
  const [featured, setFeatured] = useState(car.featured);
  const [description, setDescription] = useState(car.description ?? "");
  const [submitting, setSubmitting] = useState(false);

  // Mirror CarForm: the first image is the "main" listing photo (`image`),
  // the rest live in `images`. Present them as one flat gallery to the
  // uploader and split back out on add/remove.
  const allImages = useMemo(() => {
    const imgs: string[] = [];
    if (image) imgs.push(image);
    imgs.push(...images);
    return imgs;
  }, [image, images]);

  const handleImageUpload = useCallback(
    (url: string) => {
      if (!image) {
        setImage(url);
      } else {
        setImages((prev) => [...prev, url]);
      }
    },
    [image]
  );

  const handleImageRemove = useCallback(
    (url: string) => {
      if (url === image) {
        // Promote the first additional image to main, or clear.
        setImages((prev) => {
          const [next, ...rest] = prev;
          setImage(next || "");
          return rest;
        });
      } else {
        setImages((prev) => prev.filter((u) => u !== url));
      }
    },
    [image]
  );

  const addFeature = () => {
    const value = featureInput.trim();
    if (!value) return;
    setFeatures((prev) =>
      prev.some((f) => f.toLowerCase() === value.toLowerCase())
        ? prev
        : [...prev, value]
    );
    setFeatureInput("");
  };

  const removeFeature = (value: string) => {
    setFeatures((prev) => prev.filter((f) => f !== value));
  };

  const validate = (): string | null => {
    if (!make.trim()) return "Make is required";
    if (!model.trim()) return "Model is required";
    const y = Number(year);
    if (!year || y < 1900 || y > currentYear + 1)
      return `Year must be between 1900 and ${currentYear + 1}`;
    if (!price || Number(price) <= 0) return "Price must be greater than 0";
    if (mileage === "" || Number(mileage) < 0)
      return "Mileage cannot be negative";
    if (!fuel) return "Fuel type is required";
    if (!transmission) return "Transmission is required";
    if (!doors) return "Number of doors is required";
    if (!colour.trim()) return "Colour is required";
    if (!status) return "Status is required";
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!car._id) {
      toastError("Cannot save changes", "Missing car ID");
      return;
    }

    const validationError = validate();
    if (validationError) {
      toastError("Check the form", validationError);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/cars", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: car._id,
          make: make.trim(),
          model: model.trim(),
          year: Number(year),
          price: Number(price),
          mileage: Number(mileage),
          fuel,
          transmission,
          doors: Number(doors),
          colour: colour.trim(),
          image,
          images,
          features,
          status,
          featured,
          description,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const detail =
          result?.details && typeof result.details === "object"
            ? Object.values(result.details).flat().join(", ")
            : undefined;
        throw new Error(detail || result?.error || "Failed to update car");
      }

      success("Vehicle updated", `${year} ${make} ${model} saved.`);
      router.push("/admin/dashboard/cars");
      router.refresh();
    } catch (err) {
      toastError(
        "Failed to update car",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6"
    >
      <Section title="Basic information">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Make"
            value={make}
            onChange={setMake}
            placeholder="e.g. Toyota"
            required
          />
          <FormInput
            label="Model"
            value={model}
            onChange={setModel}
            placeholder="e.g. Corolla"
            required
          />
          <FormInput
            label="Year"
            type="number"
            value={year}
            onChange={setYear}
            min="1900"
            max={String(currentYear + 1)}
            required
          />
        </div>
      </Section>

      <Section title="Pricing & mileage">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Price (£)"
            type="number"
            value={price}
            onChange={setPrice}
            min="0"
            required
          />
          <FormInput
            label="Mileage"
            type="number"
            value={mileage}
            onChange={setMileage}
            min="0"
            required
          />
        </div>
      </Section>

      <Section title="Specs & appearance">
        <div className="grid gap-4 sm:grid-cols-2">
          <Dropdown
            label="Fuel type"
            placeholder="Select fuel"
            options={fuelOptions}
            value={fuel}
            onChange={setFuel}
            required
          />
          <Dropdown
            label="Transmission"
            placeholder="Select transmission"
            options={transmissionOptions}
            value={transmission}
            onChange={setTransmission}
            required
          />
          <Dropdown
            label="Doors"
            placeholder="Select doors"
            options={doorOptions}
            value={doors}
            onChange={setDoors}
            required
          />
          <FormInput
            label="Colour"
            value={colour}
            onChange={setColour}
            placeholder="e.g. Midnight Blue"
            required
          />
        </div>
      </Section>

      <Section title="Photos">
        <p className="text-sm text-gray-500">
          The first image is the main listing photo. You can upload up to 10
          images.
        </p>
        <ImageUploader
          folder="cars"
          onUpload={handleImageUpload}
          onRemove={handleImageRemove}
          existingImages={allImages}
          maxImages={10}
          multiple
        />
      </Section>

      <Section title="Features">
        <div className="flex gap-2">
          <div className="flex-1">
            <FormInput
              label="Add a feature"
              value={featureInput}
              onChange={setFeatureInput}
              placeholder="e.g. Heated seats"
            />
          </div>
          <button
            type="button"
            onClick={addFeature}
            className="mt-7 inline-flex h-[42px] items-center gap-1.5 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
        {features.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <li
                key={feature}
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pr-1.5 pl-3 text-sm text-gray-700"
              >
                {feature}
                <button
                  type="button"
                  onClick={() => removeFeature(feature)}
                  className="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
                  aria-label={`Remove ${feature}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Listing">
        <div className="grid gap-4 sm:grid-cols-2">
          <Dropdown
            label="Status"
            options={statusOptions}
            value={status}
            onChange={(v) => setStatus(v as CarInterface["status"])}
            required
          />
          <FormToggle
            label="Featured"
            description="Show on homepage"
            checked={featured}
            onChange={setFeatured}
          />
        </div>
        <FormTextarea
          label="Description"
          value={description}
          onChange={setDescription}
          rows={4}
          placeholder="Add any extra details about this vehicle..."
        />
      </Section>

      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
        <button
          type="button"
          onClick={() => router.push("/admin/dashboard/cars")}
          disabled={submitting}
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save changes
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default EditCarForm;
