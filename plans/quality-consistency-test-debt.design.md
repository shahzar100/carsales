# Design Specification — Phase 4: Car Parts UI

> Covers **Task 12** (Update Car Parts Page to Use DB Data) and **Task 13** (Create Admin Car Parts Management Page).

---

## Interface Reference

```ts
// src/lib/interfaces.ts
export interface CarPartInterface {
  _id?: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  image?: string;
  condition: "New" | "Used" | "Refurbished";
  compatibility: string;
  description: string;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Task 12 — Update Car Parts Page to Use DB Data

### 12.1 Data Fetching (Server Component)

The page at `src/app/(main)/CarParts/page.tsx` is already a **server component**. Replace the `mockCarParts` array with a direct DB call — no client-side loading state needed.

```tsx
// src/app/(main)/CarParts/page.tsx
import { getCarPartsCollection, serializeDocument } from "@/lib/models";
import { CarPartInterface } from "@/lib/interfaces";

// Inside the default export (async server component):
const collection = await getCarPartsCollection();
const parts: CarPartInterface[] = (
  await collection.find({ inStock: true }).toArray()
).map((doc) => serializeDocument(doc));
```

**Key decisions:**

- Fetch only `inStock: true` parts for the public page (out-of-stock parts are admin-only).
- No client-side loading spinner — the page renders with data already resolved.
- The existing `metadata` export stays unchanged.

### 12.2 CarPartsGrid Changes

**File:** `src/components/CarParts/CarPartsGrid.tsx`

| Change                           | Detail                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Remove local `CarPart` interface | Import `CarPartInterface` from `@/lib/interfaces` instead                                                                                                                                 |
| Props type                       | `parts: CarPartInterface[]`                                                                                                                                                               |
| ID field                         | Use `part._id` (string) instead of `part.id` (number)                                                                                                                                     |
| Condition badge                  | The `condition` union is now `"New" \| "Used" \| "Refurbished"` — update `getConditionBadgeClass` to handle all three (drop `"Used - Excellent"` / `"Used - Good"` which no longer exist) |
| Image handling                   | `part.image` is now optional (`string \| undefined`). Fall back to a placeholder when absent                                                                                              |
| Reserve button                   | Replace `handleReservePart` — see §12.4                                                                                                                                                   |

**Condition badge mapping (updated):**

```tsx
const getConditionBadgeClass = (condition: CarPartInterface["condition"]) => {
  switch (condition) {
    case "New":
      return "badge badge-green"; // bg-emerald-100 text-emerald-700
    case "Refurbished":
      return "badge badge-gray"; // bg-gray-100 text-gray-700
    case "Used":
      return "badge badge-amber"; // bg-amber-100 text-amber-700
  }
};
```

**Image fallback when `part.image` is undefined:**

```tsx
{part.image ? (
  <Image src={part.image} alt={part.name} ... />
) : (
  <div className="flex h-full w-full items-center justify-center bg-gray-100">
    <Cog className="h-12 w-12 text-gray-300" />
  </div>
)}
```

Use the `Cog` icon from `lucide-react` at 48px — consistent with design system XL icon size for placeholder/empty states.

### 12.3 FilterSection Changes

**File:** `src/components/CarParts/FilterSection.tsx`

Currently the filter options are hardcoded. They should be **derived from the actual data** and passed as props.

**New props:**

```tsx
interface FilterSectionProps {
  brands: string[]; // unique brands from DB data
  categories: string[]; // unique categories from DB data
  conditions: string[]; // unique conditions from DB data
  selectedBrand: string;
  selectedCategory: string;
  selectedCondition: string;
  onBrandChange: (brand: string) => void;
  onCategoryChange: (category: string) => void;
  onConditionChange: (condition: string) => void;
}
```

**Deriving options in CarPartsGrid** (before passing to `FilterSection`):

```tsx
const brands = useMemo(
  () => [...new Set(parts.map((p) => p.brand))].sort(),
  [parts]
);
const categories = useMemo(
  () => [...new Set(parts.map((p) => p.category))].sort(),
  [parts]
);
const conditions = useMemo(
  () => [...new Set(parts.map((p) => p.condition))].sort(),
  [parts]
);
```

Inside `FilterSection`, build the dropdown options from these arrays:

```tsx
const brandOptions = [
  { value: "", label: "All Brands" },
  ...brands.map((b) => ({ value: b, label: b })),
];
```

The `CustomDropdown` component remains unchanged — it already accepts `options` dynamically.

### 12.4 Reserve Part → Enquiry Link

**Decision:** Replace `alert()` with a link to the Enquiry page with pre-filled context via query params.

The "Reserve Part" button becomes a `<Link>` (or a button that calls `router.push`). Since `CarPartsGrid` is already a `"use client"` component, use `useRouter`:

```tsx
import { useRouter } from "next/navigation";

const router = useRouter();

const handleReservePart = (part: CarPartInterface) => {
  const params = new URLSearchParams({
    subject: `Part Enquiry: ${part.name}`,
    part: part.name,
    brand: part.brand,
  });
  router.push(`/Enquiry?${params.toString()}`);
};
```

**Button stays as `<Button>`** — it is an action that navigates, not a semantic link:

```tsx
<Button onClick={() => handleReservePart(part)} size="sm">
  Reserve Part
</Button>
```

The Enquiry page doesn't need changes in this task — the query params simply add context for the user when they arrive (the Enquiry page is a contact page, not a form that reads params). Future enhancement: the Enquiry page could pre-fill a contact form with the `subject` and `part` params.

### 12.5 Empty State (No Parts in DB)

When `parts.length === 0` (no parts exist in the database at all), render an empty state **instead of** the `CarPartsGrid`. This check happens in the page server component:

```tsx
{
  parts.length === 0 ? (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-16">
      <Cog className="mx-auto mb-4 h-12 w-12 text-gray-300" />
      <p className="mb-2 text-lg font-semibold text-gray-600">
        No Parts Available
      </p>
      <p className="mb-6 text-sm text-gray-400">
        Check back soon — we regularly add new parts and accessories.
      </p>
      <Link
        href="/Enquiry"
        className="inline-flex items-center rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700"
      >
        Contact Us
      </Link>
    </div>
  ) : (
    <CarPartsGrid parts={parts} />
  );
}
```

**Design rationale:**

- Matches the existing empty state pattern from `CarView` (dashed border, centered icon + text).
- Uses `Cog` icon at 48px to match the car parts domain.
- Provides a CTA to the Enquiry page — keeps the user engaged.
- The `CarPartsGrid` already has its own "No parts found" message for when filters return zero results, which remains unchanged.

### 12.6 Loading State

Not needed. The page is a **server component** — it renders with data. No skeleton or spinner required. The browser shows its native loading indicator while the page streams.

### 12.7 Summary of File Changes

| File                                        | Action                                                                                                      |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/app/(main)/CarParts/page.tsx`          | Remove `mockCarParts`, add async DB fetch, add empty state, remove `CarPart` import                         |
| `src/components/CarParts/CarPartsGrid.tsx`  | Import `CarPartInterface`, update types, add image fallback, update reserve handler, update condition badge |
| `src/components/CarParts/FilterSection.tsx` | Accept `brands`, `categories`, `conditions` as props, derive options dynamically                            |

---

## Task 13 — Admin Car Parts Management Page

### 13.1 Admin Navigation Integration

**File:** `src/components/Admin/Navigation/AdminNavigationTabs.tsx`

Add a "Car Parts" entry to the `links` array:

```tsx
import {
  Car,
  Calendar,
  Eye,
  Settings,
  LogOut,
  PlusCircle,
  Activity,
  Cog,
} from "lucide-react";

const links = [
  { href: "/admin/dashboard/cars", text: "Cars", icon: Car },
  { href: "/admin/dashboard/carparts", text: "Car Parts", icon: Cog }, // NEW
  {
    href: "/admin/dashboard/service",
    text: "Service Bookings",
    icon: Calendar,
  },
  { href: "/admin/dashboard/viewing", text: "Car Viewings", icon: Eye },
  { href: "/admin/dashboard/shop", text: "Business Info", icon: Settings },
  { href: "/admin/dashboard/add", text: "Create New", icon: PlusCircle },
  { href: "/admin/dashboard/status", text: "System Status", icon: Activity },
];
```

**Placement:** Immediately after "Cars" — grouping vehicle-related items together. Icon: `Cog` from lucide-react (matches the car parts domain).

### 13.2 Page Architecture

**File:** `src/app/(admin)/admin/dashboard/carparts/page.tsx`

This is a **client component** (`"use client"`) following the same pattern as the shop page (`admin/dashboard/shop/page.tsx`):

1. Fetches data from `/api/admin/carparts` on mount via `useEffect`
2. Manages local state for the parts list
3. Uses `useToast()` for success/error notifications
4. Contains all CRUD logic inline (no separate component extraction needed for the initial implementation — the page is self-contained)

```
"use client"
├── State: parts[], loading, showAddForm, editingPart, deletingPart
├── useEffect → fetchParts()
├── Handlers: handleAdd, handleEdit, handleDelete
├── Render:
│   ├── Header (title + "Add Part" button)
│   ├── Add/Edit Form (conditionally rendered)
│   ├── Parts Table
│   └── Delete Confirmation Modal
```

### 13.3 Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  Car Parts Management                    [+ Add Part]   │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │  Add/Edit Form (collapsible, shown when active)   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Parts Table                                      │  │
│  │  Name | Brand | Category | Price | Cond | Stock | │  │
│  │  ─────────────────────────────────────────────────│  │
│  │  BMW M3 Brake Pads | BMW | Brakes | £149 | New   │  │
│  │    ✓ In Stock                    [Edit] [Delete]  │  │
│  │  ...                                              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Pagination (if > 10 items)                       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Container:** `mx-auto max-w-7xl` — standard page container.

### 13.4 Header Section

```tsx
<div className="mb-6 flex items-center justify-between">
  <div>
    <h1 className="page-title">Car Parts</h1>
    <p className="subtitle mt-1">{parts.length} parts in inventory</p>
  </div>
  <Button onClick={() => setShowAddForm(true)} variant="primary" size="md">
    <PlusCircle className="h-4 w-4" />
    Add Part
  </Button>
</div>
```

### 13.5 Parts Table

Follows the same pattern as `CarTable` — responsive table with horizontal scroll on mobile.

**Columns:**

| Column    | Content                                                                      | Width hint | Alignment |
| --------- | ---------------------------------------------------------------------------- | ---------- | --------- |
| Name      | Part name (bold) with description preview below in gray-500 text-xs          | flexible   | left      |
| Brand     | Brand name                                                                   | auto       | left      |
| Category  | Category badge (`badge badge-gray`)                                          | auto       | left      |
| Price     | `£XX.XX` formatted, `text-red-600 font-semibold`                             | auto       | right     |
| Condition | Badge: New → `badge-green`, Used → `badge-amber`, Refurbished → `badge-gray` | auto       | center    |
| In Stock  | Toggle or status indicator: ✓ green / ✗ red                                  | auto       | center    |
| Actions   | Edit, Delete buttons                                                         | auto       | right     |

**Table structure:**

```tsx
<div className="card overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="border-b-2 border-gray-200 bg-linear-to-r from-gray-50 to-gray-100">
        <th className="px-5 py-4 text-left text-xs font-bold tracking-wider text-gray-700 uppercase">Name</th>
        <th className="px-4 py-4 text-left text-xs font-bold tracking-wider text-gray-700 uppercase">Brand</th>
        <th className="px-4 py-4 text-left text-xs font-bold tracking-wider text-gray-700 uppercase">Category</th>
        <th className="px-4 py-4 text-right text-xs font-bold tracking-wider text-gray-700 uppercase">Price</th>
        <th className="px-4 py-4 text-center text-xs font-bold tracking-wider text-gray-700 uppercase">Condition</th>
        <th className="px-4 py-4 text-center text-xs font-bold tracking-wider text-gray-700 uppercase">In Stock</th>
        <th className="px-4 py-4 text-right text-xs font-bold tracking-wider text-gray-700 uppercase">Actions</th>
      </tr>
    </thead>
    <tbody>
      {parts.map((part) => ( ... ))}
    </tbody>
  </table>
</div>
```

**In Stock indicator:**

```tsx
<span className={`badge ${part.inStock ? "badge-green" : "badge-red"}`}>
  {part.inStock ? "In Stock" : "Out of Stock"}
</span>
```

**Actions column:**

```tsx
<div className="flex items-center justify-end gap-2">
  <Button onClick={() => startEdit(part)} variant="outline" size="sm">
    <Pencil className="h-3.5 w-3.5" />
  </Button>
  <Button onClick={() => confirmDelete(part)} variant="danger" size="sm">
    <Trash2 className="h-3.5 w-3.5" />
  </Button>
</div>
```

### 13.6 Add/Edit Form

**Decision:** Inline collapsible form above the table (not a modal). This is simpler, keeps context visible, and follows the precedent of the `MainForm/CarForm` pattern for creating items.

When "Add Part" is clicked or "Edit" is clicked on a row, the form appears above the table. The form reuses the same layout for both add and edit — pre-filled when editing, empty when adding.

**Form layout** — two-column grid on desktop, single column on mobile:

```
┌─────────────────────────────────────────────────────────┐
│  Add New Part / Edit Part                          [X]  │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌────────────────────┐         │
│  │ Part Name *        │  │ Brand *            │         │
│  └────────────────────┘  └────────────────────┘         │
│  ┌────────────────────┐  ┌────────────────────┐         │
│  │ Category *         │  │ Price *            │         │
│  └────────────────────┘  └────────────────────┘         │
│  ┌────────────────────┐  ┌────────────────────┐         │
│  │ Condition *        │  │ Compatibility *    │         │
│  └────────────────────┘  └────────────────────┘         │
│  ┌────────────────────┐  ┌────────────────────┐         │
│  │ Image URL          │  │ In Stock ☑         │         │
│  └────────────────────┘  └────────────────────┘         │
│  ┌──────────────────────────────────────────────┐       │
│  │ Description *                                 │       │
│  └──────────────────────────────────────────────┘       │
│                                                         │
│                          [Cancel]  [Save Part]          │
└─────────────────────────────────────────────────────────┘
```

**Form fields:**

| Field         | Type         | Required | Input class                | Notes                                           |
| ------------- | ------------ | -------- | -------------------------- | ----------------------------------------------- |
| Name          | text input   | Yes      | `input`                    | max 200 chars                                   |
| Brand         | text input   | Yes      | `input`                    | free text (not a dropdown — brands are dynamic) |
| Category      | text input   | Yes      | `input`                    | free text                                       |
| Price         | number input | Yes      | `input`                    | `min="0"` `step="0.01"`                         |
| Condition     | select       | Yes      | `select`                   | Options: "New", "Used", "Refurbished"           |
| Compatibility | text input   | Yes      | `input`                    | e.g. "BMW M3 2019-2023"                         |
| Image URL     | text input   | No       | `input`                    | Optional, placeholder: "/car.jpg"               |
| In Stock      | checkbox     | —        | Custom toggle/checkbox     | Default: `true`                                 |
| Description   | textarea     | Yes      | `input` (textarea variant) | 3 rows                                          |

**Form container:**

```tsx
<div className="card mb-6 p-6">
  <div className="mb-4 flex items-center justify-between">
    <h2 className="heading-3">{editingPart ? "Edit Part" : "Add New Part"}</h2>
    <button
      onClick={closeForm}
      className="text-gray-400 transition-colors hover:text-gray-600"
      aria-label="Close form"
    >
      <X className="h-5 w-5" />
    </button>
  </div>
  <form onSubmit={handleSubmit}>
    <div className="grid gap-4 sm:grid-cols-2">{/* fields */}</div>
    <div className="mt-6 flex justify-end gap-3">
      <Button onClick={closeForm} variant="outline">
        Cancel
      </Button>
      <Button type="submit" loading={saving}>
        {editingPart ? "Update Part" : "Add Part"}
      </Button>
    </div>
  </form>
</div>
```

**Validation:** Client-side — check all required fields are non-empty and price > 0 before submitting. Show inline `text-sm text-red-600` error messages below each invalid field.

**API calls:**

- **Add:** `POST /api/admin/carparts` with form data as JSON body
- **Edit:** `PUT /api/admin/carparts` with `{ _id, ...formData }` as JSON body
- After success, call `fetchParts()` to refresh the list and close the form

### 13.7 Edit Flow

**Decision:** Inline form (same as add). NOT a modal — keeping the table visible gives context.

1. User clicks the **Edit** (pencil) button on a table row
2. `editingPart` state is set to that part
3. The form appears above the table, pre-filled with the part's data
4. The table scrolls slightly down; the form scrolls into view via `scrollIntoView({ behavior: "smooth" })`
5. On save: `PUT /api/admin/carparts` → toast success → refresh list → close form
6. On cancel: clear `editingPart`, hide form

### 13.8 Delete Confirmation Flow

**Decision:** Modal (using the existing `Modal` component). Destructive actions need explicit confirmation — modals prevent accidental deletion.

1. User clicks **Delete** (trash) button on a table row
2. `deletingPart` state is set to that part
3. The `Modal` opens:

```tsx
<Modal title="Delete Part" onClose={() => setDeletingPart(null)} size="sm">
  <div className="flex items-center gap-2 text-red-600">
    <AlertTriangle className="h-5 w-5" />
    <span className="text-sm font-semibold">This action cannot be undone</span>
  </div>
  <p className="text-sm text-gray-600">
    Are you sure you want to delete{" "}
    <span className="font-semibold text-gray-900">{deletingPart.name}</span>?
    This will permanently remove it from the parts catalog.
  </p>
  <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
    <Button onClick={() => setDeletingPart(null)} variant="outline">
      Cancel
    </Button>
    <Button
      onClick={() => handleDelete(deletingPart._id)}
      variant="danger"
      loading={deleting}
    >
      Delete Part
    </Button>
  </div>
</Modal>
```

Follows the exact pattern of `CancelBookingModal`: warning icon, bold part name, cancel/confirm buttons.

**API call:** `DELETE /api/admin/carparts` with body `{ _id: part._id }`

### 13.9 Loading State

On initial page load (while fetching parts from the API):

```tsx
if (loading) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-red-600" />
        <p className="text-gray-600">Loading car parts...</p>
      </div>
    </div>
  );
}
```

Matches the shop page loading pattern exactly.

### 13.10 Empty State

When `parts.length === 0` after loading completes:

```tsx
<div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-16">
  <Cog className="mx-auto mb-4 h-12 w-12 text-gray-300" />
  <p className="mb-2 text-lg font-semibold text-gray-600">No Parts Yet</p>
  <p className="mb-6 text-sm text-gray-400">
    Add your first car part to get started.
  </p>
  <Button onClick={() => setShowAddForm(true)}>
    <PlusCircle className="h-4 w-4" />
    Add First Part
  </Button>
</div>
```

### 13.11 Toast Notifications

| Action           | Type            | Title              | Message                                          |
| ---------------- | --------------- | ------------------ | ------------------------------------------------ |
| Part added       | `toast.success` | "Part Added"       | "{name} has been added to the catalog"           |
| Part updated     | `toast.success` | "Part Updated"     | "{name} has been updated"                        |
| Part deleted     | `toast.success` | "Part Deleted"     | "{name} has been removed"                        |
| Fetch error      | `toast.error`   | "Load Failed"      | "Could not load car parts from the server"       |
| Save error       | `toast.error`   | "Save Failed"      | API error message or "Could not save the part"   |
| Delete error     | `toast.error`   | "Delete Failed"    | API error message or "Could not delete the part" |
| Validation error | `toast.error`   | "Validation Error" | "Please fill in all required fields"             |

### 13.12 State Management

```tsx
const [parts, setParts] = useState<CarPartInterface[]>([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [deleting, setDeleting] = useState(false);
const [showAddForm, setShowAddForm] = useState(false);
const [editingPart, setEditingPart] = useState<CarPartInterface | null>(null);
const [deletingPart, setDeletingPart] = useState<CarPartInterface | null>(null);
const [formData, setFormData] = useState<Partial<CarPartInterface>>({
  name: "",
  brand: "",
  category: "",
  price: 0,
  condition: "New",
  compatibility: "",
  description: "",
  image: "",
  inStock: true,
});
```

**Form state reset** happens when:

- Add form opens (reset to defaults)
- Edit starts (populate from `editingPart`)
- Form closes (no explicit reset needed — next open will set it)

### 13.13 Responsive Behavior

| Viewport          | Behavior                                                                             |
| ----------------- | ------------------------------------------------------------------------------------ |
| Mobile (< 640px)  | Table has horizontal scroll (`overflow-x-auto`). Form fields stack to single column. |
| Tablet (640px+)   | Form fields in 2-column grid. Table fits without scroll for most columns.            |
| Desktop (1024px+) | Full table visible. Form in 2-column grid. Comfortable spacing.                      |

The "Brand" and "Description" columns are hidden on mobile using `hidden sm:table-cell` if needed — Name, Price, and Actions are always visible.

### 13.14 Auth Protection

The admin layout already handles auth redirects. The page fetches from `/api/admin/carparts` which requires `isAuthenticated()` — a 401 response triggers:

```tsx
if (response.status === 401) {
  window.location.href = "/admin";
  return;
}
```

This matches the existing admin page pattern.

### 13.15 File Summary

| File                                                      | Action                                            |
| --------------------------------------------------------- | ------------------------------------------------- |
| `src/app/(admin)/admin/dashboard/carparts/page.tsx`       | **Create** — full admin CRUD page                 |
| `src/components/Admin/Navigation/AdminNavigationTabs.tsx` | **Modify** — add "Car Parts" link with `Cog` icon |

---

## Design Decisions Summary

| Decision                   | Choice                                   | Rationale                                                                                  |
| -------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| Public page data fetch     | Direct DB call in server component       | Matches `admin/dashboard/cars` pattern; no API round-trip needed for server components     |
| Public page — out of stock | Filter out `inStock: false`              | Public users shouldn't see unavailable parts                                               |
| Filter options             | Derived from data, not hardcoded         | Scales automatically as parts are added/removed                                            |
| Reserve Part action        | Navigate to `/Enquiry` with query params | No alert(); provides enquiry context without a separate reservation API                    |
| Image fallback             | `Cog` icon at 48px in gray-100 container | Consistent with design system empty state icon pattern                                     |
| Admin form pattern         | Inline collapsible form above table      | Simpler than modal; keeps table visible for context; matches `MainForm`/`CarForm` approach |
| Delete confirmation        | Modal with `Modal` component             | Destructive actions require explicit confirmation; matches `CancelBookingModal` pattern    |
| Admin nav placement        | After "Cars", before "Service Bookings"  | Groups vehicle-related items together                                                      |
| Admin nav icon             | `Cog` from lucide-react                  | Matches the car parts domain; distinct from `Settings` gear                                |
| Condition values           | "New", "Used", "Refurbished" (3 values)  | Simplified from the old 4+ values; matches `CarPartInterface` union type                   |
| Client vs server for admin | Client component                         | Admin pages need interactivity (forms, delete, toasts); matches shop page pattern          |
