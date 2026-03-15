"use client";
import React, { useState } from "react";
import type {
  ShopInfo,
  DetailingPackage,
  TintOption,
  ServiceOverview,
  RecoveryPricingTier,
} from "@/lib/interfaces";
import Button from "@/components/Helpful/Buttons/Button";
import {
  Building2,
  Clock,
  Globe,
  BarChart3,
  Sparkles,
  Shield,
  Truck,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";

// ── Shared styles ──────────────────────────────────────────
const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

// ── Section wrapper ────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  description,
  children,
  defaultOpen = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <Icon size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        {open ? (
          <ChevronUp size={18} className="text-gray-400" />
        ) : (
          <ChevronDown size={18} className="text-gray-400" />
        )}
      </button>
      {open && <div className="border-t px-6 py-5">{children}</div>}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
interface BusinessInfoFormProps {
  shopInfo: ShopInfo;
  onShopInfoChange: (shopInfo: ShopInfo) => void;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function BusinessInfoForm({
  shopInfo,
  onShopInfoChange,
  onSave,
}: BusinessInfoFormProps) {
  const update = (partial: Partial<ShopInfo>) =>
    onShopInfoChange({ ...shopInfo, ...partial });

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Business Settings</h2>
        <p className="text-sm text-gray-500">
          Manage all business information displayed across the website.
        </p>
      </div>

      <form onSubmit={onSave} className="space-y-4">
        {/* ─── Core Business Info ─── */}
        <Section
          icon={Building2}
          title="Business Information"
          description="Name, contact details, and address"
          defaultOpen
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Business Name</label>
                <input
                  type="text"
                  value={shopInfo.businessName ?? ""}
                  onChange={(e) => update({ businessName: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  value={shopInfo.phone ?? ""}
                  onChange={(e) => update({ phone: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={shopInfo.email ?? ""}
                  onChange={(e) => update({ email: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Bookings Email</label>
                <input
                  type="email"
                  value={shopInfo.bookingsEmail ?? ""}
                  onChange={(e) => update({ bookingsEmail: e.target.value })}
                  className={inputClass}
                  placeholder="bookings@yourbusiness.com"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Address</label>
              <input
                type="text"
                value={shopInfo.address ?? ""}
                onChange={(e) => update({ address: e.target.value })}
                className={inputClass}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className={labelClass}>City</label>
                <input
                  type="text"
                  value={shopInfo.city ?? ""}
                  onChange={(e) => update({ city: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>State/County</label>
                <input
                  type="text"
                  value={shopInfo.state ?? ""}
                  onChange={(e) => update({ state: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Post Code</label>
                <input
                  type="text"
                  value={shopInfo.zipCode ?? ""}
                  onChange={(e) => update({ zipCode: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Google Maps URL</label>
              <input
                type="url"
                value={shopInfo.googleMapsUrl ?? ""}
                onChange={(e) => update({ googleMapsUrl: e.target.value })}
                className={inputClass}
                placeholder="https://maps.google.com/maps?q=Your+Business"
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={shopInfo.description ?? ""}
                onChange={(e) => update({ description: e.target.value })}
                rows={3}
                className={inputClass}
              />
            </div>
          </div>
        </Section>

        {/* ─── Business Hours ─── */}
        <Section
          icon={Clock}
          title="Business Hours"
          description="Opening times displayed to customers"
        >
          <div className="space-y-2">
            {shopInfo.hours &&
              Object.keys(shopInfo.hours).map((day) => (
                <div key={day} className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 capitalize">
                    {day}
                  </label>
                  <input
                    type="text"
                    value={
                      shopInfo.hours[day as keyof typeof shopInfo.hours] ?? ""
                    }
                    onChange={(e) =>
                      update({
                        hours: { ...shopInfo.hours, [day]: e.target.value },
                      })
                    }
                    className={inputClass}
                    placeholder="e.g. 9:00 AM - 6:00 PM"
                  />
                </div>
              ))}
          </div>
        </Section>

        {/* ─── Social Media ─── */}
        <Section
          icon={Globe}
          title="Social Media"
          description="Social media profile links"
        >
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Facebook URL</label>
              <input
                type="url"
                value={shopInfo.socialMedia?.facebook ?? ""}
                onChange={(e) =>
                  update({
                    socialMedia: {
                      ...shopInfo.socialMedia,
                      facebook: e.target.value,
                    },
                  })
                }
                placeholder="https://facebook.com/yourbusiness"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Twitter URL</label>
              <input
                type="url"
                value={shopInfo.socialMedia?.twitter ?? ""}
                onChange={(e) =>
                  update({
                    socialMedia: {
                      ...shopInfo.socialMedia,
                      twitter: e.target.value,
                    },
                  })
                }
                placeholder="https://twitter.com/yourbusiness"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Instagram URL</label>
              <input
                type="url"
                value={shopInfo.socialMedia?.instagram ?? ""}
                onChange={(e) =>
                  update({
                    socialMedia: {
                      ...shopInfo.socialMedia,
                      instagram: e.target.value,
                    },
                  })
                }
                placeholder="https://instagram.com/yourbusiness"
                className={inputClass}
              />
            </div>
          </div>
        </Section>

        {/* ─── Hero Stats ─── */}
        <Section
          icon={BarChart3}
          title="Homepage Stats"
          description="Statistics shown on the hero section of the homepage"
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              These stats appear on the homepage hero section.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Vehicles
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={shopInfo.heroStats?.vehicles?.value ?? ""}
                    onChange={(e) =>
                      update({
                        heroStats: {
                          ...shopInfo.heroStats!,
                          vehicles: {
                            ...shopInfo.heroStats!.vehicles,
                            value: e.target.value,
                          },
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="500+"
                  />
                  <input
                    type="text"
                    value={shopInfo.heroStats?.vehicles?.label ?? ""}
                    onChange={(e) =>
                      update({
                        heroStats: {
                          ...shopInfo.heroStats!,
                          vehicles: {
                            ...shopInfo.heroStats!.vehicles,
                            label: e.target.value,
                          },
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="Quality Vehicles"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Booking
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={shopInfo.heroStats?.booking?.value ?? ""}
                    onChange={(e) =>
                      update({
                        heroStats: {
                          ...shopInfo.heroStats!,
                          booking: {
                            ...shopInfo.heroStats!.booking,
                            value: e.target.value,
                          },
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="24/7"
                  />
                  <input
                    type="text"
                    value={shopInfo.heroStats?.booking?.label ?? ""}
                    onChange={(e) =>
                      update({
                        heroStats: {
                          ...shopInfo.heroStats!,
                          booking: {
                            ...shopInfo.heroStats!.booking,
                            label: e.target.value,
                          },
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="Online Booking"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Rating
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={shopInfo.heroStats?.rating?.value ?? ""}
                    onChange={(e) =>
                      update({
                        heroStats: {
                          ...shopInfo.heroStats!,
                          rating: {
                            ...shopInfo.heroStats!.rating,
                            value: e.target.value,
                          },
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="4.9"
                  />
                  <input
                    type="text"
                    value={shopInfo.heroStats?.rating?.label ?? ""}
                    onChange={(e) =>
                      update({
                        heroStats: {
                          ...shopInfo.heroStats!,
                          rating: {
                            ...shopInfo.heroStats!.rating,
                            label: e.target.value,
                          },
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="Customer Rating"
                  />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ─── Detailing Packages ─── */}
        <Section
          icon={Sparkles}
          title="Detailing Packages"
          description="Car detailing service packages and pricing"
        >
          <DetailingEditor
            packages={shopInfo.detailingPackages ?? []}
            onChange={(pkgs) => update({ detailingPackages: pkgs })}
          />
        </Section>

        {/* ─── Tint Options ─── */}
        <Section
          icon={Shield}
          title="Window Tinting Options"
          description="Window tint products, pricing, and warranties"
        >
          <TintEditor
            options={shopInfo.tintOptions ?? []}
            onChange={(opts) => update({ tintOptions: opts })}
          />
        </Section>

        {/* ─── Service Overviews ─── */}
        <Section
          icon={Wrench}
          title="Service Overviews"
          description="Service summaries shown on the main Services page"
        >
          <ServiceOverviewEditor
            overviews={shopInfo.serviceOverviews ?? []}
            onChange={(ovs) => update({ serviceOverviews: ovs })}
          />
        </Section>

        {/* ─── Recovery Info ─── */}
        <Section
          icon={Truck}
          title="Breakdown Recovery"
          description="Coverage areas, pricing tiers, and response time"
        >
          <RecoveryEditor
            recovery={
              shopInfo.recovery ?? {
                coverageAreas: [],
                pricingTiers: [],
                responseTime: "",
              }
            }
            onChange={(r) => update({ recovery: r })}
          />
        </Section>

        {/* ─── Save ─── */}
        <div className="pt-2">
          <Button type="submit" size="lg" customWidth="w-full">
            Save All Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Sub-editors for complex sections
// ══════════════════════════════════════════════════════════════

// ── Detailing Package Editor ───────────────────────────────
function DetailingEditor({
  packages,
  onChange,
}: {
  packages: DetailingPackage[];
  onChange: (pkgs: DetailingPackage[]) => void;
}) {
  const updatePkg = (index: number, partial: Partial<DetailingPackage>) => {
    const updated = [...packages];
    updated[index] = { ...updated[index], ...partial };
    onChange(updated);
  };

  const addPackage = () => {
    onChange([
      ...packages,
      {
        id: `package-${Date.now()}`,
        name: "",
        subtitle: "",
        price: "",
        duration: "",
        description: "",
        exteriorFeatures: [],
        interiorFeatures: [],
        popular: false,
        includesPrevious: null,
      },
    ]);
  };

  const removePackage = (index: number) => {
    onChange(packages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {packages.map((pkg, index) => (
        <div
          key={pkg.id}
          className="rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              Package {index + 1}
            </h4>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={pkg.popular}
                  onChange={(e) =>
                    updatePkg(index, { popular: e.target.checked })
                  }
                  className="rounded"
                />
                Popular
              </label>
              <button
                type="button"
                onClick={() => removePackage(index)}
                className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={pkg.name}
                  onChange={(e) => updatePkg(index, { name: e.target.value })}
                  className={inputClass}
                  placeholder="Detailing Bronze"
                />
              </div>
              <div>
                <label className={labelClass}>Subtitle</label>
                <input
                  type="text"
                  value={pkg.subtitle}
                  onChange={(e) =>
                    updatePkg(index, { subtitle: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Mini Valet"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className={labelClass}>Price</label>
                <input
                  type="text"
                  value={pkg.price}
                  onChange={(e) => updatePkg(index, { price: e.target.value })}
                  className={inputClass}
                  placeholder="£150"
                />
              </div>
              <div>
                <label className={labelClass}>Duration</label>
                <input
                  type="text"
                  value={pkg.duration}
                  onChange={(e) =>
                    updatePkg(index, { duration: e.target.value })
                  }
                  className={inputClass}
                  placeholder="2-3 hours"
                />
              </div>
              <div>
                <label className={labelClass}>Includes Previous</label>
                <input
                  type="text"
                  value={pkg.includesPrevious ?? ""}
                  onChange={(e) =>
                    updatePkg(index, {
                      includesPrevious: e.target.value || null,
                    })
                  }
                  className={inputClass}
                  placeholder="Bronze"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <input
                type="text"
                value={pkg.description}
                onChange={(e) =>
                  updatePkg(index, { description: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Exterior Features (one per line)
                </label>
                <textarea
                  value={pkg.exteriorFeatures.join("\n")}
                  onChange={(e) =>
                    updatePkg(index, {
                      exteriorFeatures: e.target.value
                        .split("\n")
                        .filter(Boolean),
                    })
                  }
                  rows={4}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Interior Features (one per line)
                </label>
                <textarea
                  value={pkg.interiorFeatures.join("\n")}
                  onChange={(e) =>
                    updatePkg(index, {
                      interiorFeatures: e.target.value
                        .split("\n")
                        .filter(Boolean),
                    })
                  }
                  rows={4}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addPackage}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-red-300 hover:text-red-600"
      >
        <Plus size={16} /> Add Detailing Package
      </button>
    </div>
  );
}

// ── Tint Options Editor ────────────────────────────────────
function TintEditor({
  options,
  onChange,
}: {
  options: TintOption[];
  onChange: (opts: TintOption[]) => void;
}) {
  const updateOpt = (index: number, partial: Partial<TintOption>) => {
    const updated = [...options];
    updated[index] = { ...updated[index], ...partial };
    onChange(updated);
  };

  const addOption = () => {
    onChange([
      ...options,
      {
        name: "",
        type: "",
        price: "",
        vlt: "",
        warranty: "",
        description: "",
        features: [],
        popular: false,
      },
    ]);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {options.map((opt, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              Tint Option {index + 1}
            </h4>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={opt.popular}
                  onChange={(e) =>
                    updateOpt(index, { popular: e.target.checked })
                  }
                  className="rounded"
                />
                Popular
              </label>
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={opt.name}
                  onChange={(e) => updateOpt(index, { name: e.target.value })}
                  className={inputClass}
                  placeholder="Ceramic Premium"
                />
              </div>
              <div>
                <label className={labelClass}>Type</label>
                <input
                  type="text"
                  value={opt.type}
                  onChange={(e) => updateOpt(index, { type: e.target.value })}
                  className={inputClass}
                  placeholder="Ceramic"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className={labelClass}>Price</label>
                <input
                  type="text"
                  value={opt.price}
                  onChange={(e) => updateOpt(index, { price: e.target.value })}
                  className={inputClass}
                  placeholder="£400-£800"
                />
              </div>
              <div>
                <label className={labelClass}>VLT Options</label>
                <input
                  type="text"
                  value={opt.vlt}
                  onChange={(e) => updateOpt(index, { vlt: e.target.value })}
                  className={inputClass}
                  placeholder="5%, 20%, 35%, 50%"
                />
              </div>
              <div>
                <label className={labelClass}>Warranty</label>
                <input
                  type="text"
                  value={opt.warranty}
                  onChange={(e) =>
                    updateOpt(index, { warranty: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Lifetime"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <input
                type="text"
                value={opt.description}
                onChange={(e) =>
                  updateOpt(index, { description: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Features (one per line)</label>
              <textarea
                value={opt.features.join("\n")}
                onChange={(e) =>
                  updateOpt(index, {
                    features: e.target.value.split("\n").filter(Boolean),
                  })
                }
                rows={4}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addOption}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-red-300 hover:text-red-600"
      >
        <Plus size={16} /> Add Tint Option
      </button>
    </div>
  );
}

// ── Service Overview Editor ────────────────────────────────
function ServiceOverviewEditor({
  overviews,
  onChange,
}: {
  overviews: ServiceOverview[];
  onChange: (ovs: ServiceOverview[]) => void;
}) {
  const updateOv = (index: number, partial: Partial<ServiceOverview>) => {
    const updated = [...overviews];
    updated[index] = { ...updated[index], ...partial };
    onChange(updated);
  };

  const addOverview = () => {
    onChange([
      ...overviews,
      {
        id: `service-${Date.now()}`,
        title: "",
        subtitle: "",
        priceRange: "",
        duration: "",
        features: [],
      },
    ]);
  };

  const removeOverview = (index: number) => {
    onChange(overviews.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {overviews.map((ov, index) => (
        <div
          key={ov.id}
          className="rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              Service {index + 1}
            </h4>
            <button
              type="button"
              onClick={() => removeOverview(index)}
              className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Title</label>
                <input
                  type="text"
                  value={ov.title}
                  onChange={(e) => updateOv(index, { title: e.target.value })}
                  className={inputClass}
                  placeholder="Car Detailing"
                />
              </div>
              <div>
                <label className={labelClass}>Subtitle</label>
                <input
                  type="text"
                  value={ov.subtitle}
                  onChange={(e) =>
                    updateOv(index, { subtitle: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Premium interior & exterior care"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Price Range</label>
                <input
                  type="text"
                  value={ov.priceRange}
                  onChange={(e) =>
                    updateOv(index, { priceRange: e.target.value })
                  }
                  className={inputClass}
                  placeholder="£150 – £500"
                />
              </div>
              <div>
                <label className={labelClass}>Duration</label>
                <input
                  type="text"
                  value={ov.duration}
                  onChange={(e) =>
                    updateOv(index, { duration: e.target.value })
                  }
                  className={inputClass}
                  placeholder="3-6 hours"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Features (one per line)</label>
              <textarea
                value={ov.features.join("\n")}
                onChange={(e) =>
                  updateOv(index, {
                    features: e.target.value.split("\n").filter(Boolean),
                  })
                }
                rows={4}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addOverview}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-red-300 hover:text-red-600"
      >
        <Plus size={16} /> Add Service
      </button>
    </div>
  );
}

// ── Recovery Editor ────────────────────────────────────────
function RecoveryEditor({
  recovery,
  onChange,
}: {
  recovery: {
    coverageAreas: string[];
    pricingTiers: RecoveryPricingTier[];
    responseTime: string;
  };
  onChange: (r: {
    coverageAreas: string[];
    pricingTiers: RecoveryPricingTier[];
    responseTime: string;
  }) => void;
}) {
  const updateTier = (index: number, partial: Partial<RecoveryPricingTier>) => {
    const tiers = [...recovery.pricingTiers];
    tiers[index] = { ...tiers[index], ...partial };
    onChange({ ...recovery, pricingTiers: tiers });
  };

  const addTier = () => {
    onChange({
      ...recovery,
      pricingTiers: [
        ...recovery.pricingTiers,
        { name: "", price: "", distance: "" },
      ],
    });
  };

  const removeTier = (index: number) => {
    onChange({
      ...recovery,
      pricingTiers: recovery.pricingTiers.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Response Time */}
      <div>
        <label className={labelClass}>Average Response Time</label>
        <input
          type="text"
          value={recovery.responseTime}
          onChange={(e) =>
            onChange({ ...recovery, responseTime: e.target.value })
          }
          className={inputClass}
          placeholder="30-45 minutes within London"
        />
      </div>

      {/* Coverage Areas */}
      <div>
        <label className={labelClass}>Coverage Areas (one per line)</label>
        <textarea
          value={recovery.coverageAreas.join("\n")}
          onChange={(e) =>
            onChange({
              ...recovery,
              coverageAreas: e.target.value.split("\n").filter(Boolean),
            })
          }
          rows={6}
          className={inputClass}
          placeholder="Central London&#10;North London&#10;South London"
        />
      </div>

      {/* Pricing Tiers */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-700">
          Pricing Tiers
        </h4>
        <div className="space-y-3">
          {recovery.pricingTiers.map((tier, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
                <input
                  type="text"
                  value={tier.name}
                  onChange={(e) => updateTier(index, { name: e.target.value })}
                  className={inputClass}
                  placeholder="Local Recovery"
                />
                <input
                  type="text"
                  value={tier.price}
                  onChange={(e) => updateTier(index, { price: e.target.value })}
                  className={inputClass}
                  placeholder="From £60"
                />
                <input
                  type="text"
                  value={tier.distance}
                  onChange={(e) =>
                    updateTier(index, { distance: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Within 10 miles"
                />
              </div>
              <button
                type="button"
                onClick={() => removeTier(index)}
                className="mt-2 rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addTier}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:border-red-300 hover:text-red-600"
        >
          <Plus size={16} /> Add Pricing Tier
        </button>
      </div>
    </div>
  );
}
