# Design Specification

> **Instructions:** Fill out every section below before running the UXUIStandards agent.
> The agent will refuse to proceed until this file is complete.
> Replace all `[placeholder]` values with your actual specifications.

---

## 1. Brand Identity

### Brand Name

Morley Motor Company

### Brand Voice & Personality

Bold, confident, and performance-driven. The brand communicates authority and reliability through a striking black and red visual identity. It should feel premium without being pretentious — approachable for everyday car buyers but with the edge and energy of a performance-focused dealership. Direct, no-nonsense language with a focus on quality and trust.

### Logo Usage

- Logo appears in the top-left corner of the sticky header navigation.
- Displayed as a circular image (`logo.jpeg`) at 64px mobile, 80px tablet, 100px desktop.
- On black backgrounds only (header is always black).
- Clear space: minimum 16px padding around the logo on all sides.
- No text-based logo variant — image-only.

---

## 2. Color Palette

### Primary Colors

| Role           | Hex     | Tailwind Class | Usage                                   |
| -------------- | ------- | -------------- | --------------------------------------- |
| Primary        | #dc2626 | red-600        | CTAs, links, active states, page titles |
| Primary Dark   | #b91c1c | red-700        | Hover states, emphasis, button hover    |
| Primary Light  | #fef2f2 | red-50         | Subtle backgrounds, selected highlights |
| Primary Muted  | #fee2e2 | red-100        | Tags, soft badges, light accent areas   |
| Primary Darker | #991b1b | red-800        | Deep emphasis, pressed states           |
| Accent         | #f87171 | red-400        | Featured prices, icon accents on dark bg|
| Accent Alt     | #ef4444 | red-500        | Hero subheading text, focus rings       |

### Neutral Colors

| Role           | Hex     | Tailwind Class | Usage                                    |
| -------------- | ------- | -------------- | ---------------------------------------- |
| Text Primary   | #111827 | gray-900       | Headings, primary body text              |
| Text Secondary | #4b5563 | gray-600       | Descriptions, subtitles                  |
| Text Body      | #374151 | gray-700       | Body copy, form input text, footer links |
| Text Muted     | #9ca3af | gray-400       | Captions, placeholders, subtle labels    |
| Text Faint     | #6b7280 | gray-500       | Subtitles, secondary descriptions        |
| Background     | #ffffff | white          | Page backgrounds, card backgrounds       |
| Surface        | #f9fafb | gray-50        | Footer background, muted sections        |
| Surface Alt    | #f3f4f6 | gray-100       | Disabled inputs, neutral badges, tags    |
| Border         | #e5e7eb | gray-200       | Card borders, dividers, input borders    |
| Border Hover   | #d1d5db | gray-300       | Input hover borders, outline buttons     |
| Dark Surface   | #0a0a0a | gray-950       | Dark section backgrounds                 |
| Pure Black     | #000000 | black          | Header background, hero section          |
| Dark Card      | #111827 | gray-900       | Cards on dark backgrounds                |
| Dark Border    | #374151 | gray-700       | Borders on dark backgrounds              |

### Semantic Colors

| Role         | Hex     | Tailwind Class | Usage                            |
| ------------ | ------- | -------------- | -------------------------------- |
| Success      | #22c55e | green-500      | Toast border, progress bars      |
| Success BG   | #d1fae5 | emerald-100    | Success badges                   |
| Success Text | #047857 | emerald-700    | Badge text, toast titles         |
| Warning      | #eab308 | yellow-500     | Toast border, warning indicators |
| Warning BG   | #fef3c7 | amber-100      | Warning badges                   |
| Warning Text | #b45309 | amber-700      | Badge text, toast titles         |
| Error        | #ef4444 | red-500        | Toast border, validation rings   |
| Error BG     | #fee2e2 | red-100        | Error badges                     |
| Error Text   | #b91c1c | red-700        | Badge text, toast titles         |
| Info         | #3b82f6 | blue-500       | Toast border, informational icons|
| Info BG      | #fef2f2 | red-50         | Info badges (branded as red)     |
| Info Text    | #dc2626 | red-600        | Info badge text (branded as red) |

### Dark Mode (if applicable)

Not applicable. The site is light mode only. Dark backgrounds are used only in specific sections (header, hero, featured car cards) as part of the black and red brand identity — not as a user-togglable dark mode.

---

## 3. Typography

### Font Family

| Usage     | Font Name      | Fallback Stack        | Weight(s)                    |
| --------- | -------------- | --------------------- | ---------------------------- |
| Headings  | System default | system-ui, sans-serif | 600 (semibold), 700 (bold)   |
| Body      | System default | system-ui, sans-serif | 400 (normal), 500 (medium)   |
| Monospace | System default | monospace             | 400 (normal)                 |

### Type Scale

| Element         | Size (desktop)    | Size (mobile)   | Weight         | Line Height    | Letter Spacing  |
| --------------- | ----------------- | --------------- | -------------- | -------------- | --------------- |
| H1 / Page Title | text-4xl (36px)   | text-2xl (24px) | 700 (bold)     | 1.2 (tight)    | -0.02em (tight) |
| H2 / Section    | text-2xl (24px)   | text-xl (20px)  | 700 (bold)     | 1.3            | normal          |
| H3              | text-lg (18px)    | text-lg (18px)  | 600 (semibold) | 1.4            | normal          |
| H4              | text-base (16px)  | text-base (16px)| 600 (semibold) | 1.4            | normal          |
| Body            | text-sm (14px)    | text-sm (14px)  | 400 (normal)   | 1.6 (relaxed)  | normal          |
| Description     | text-lg (18px)    | text-base (16px)| 400 (normal)   | 1.6 (relaxed)  | normal          |
| Small / Caption | text-xs (12px)    | text-xs (12px)  | 400 (normal)   | 1.4            | normal          |
| Label           | text-sm (14px)    | text-sm (14px)  | 500 (medium)   | 1.4            | normal          |
| Label Small     | text-[11px]       | text-[11px]     | 600 (semibold) | 1.4            | 0.05em (wider)  |

**Typography color rules:**
- H1 (page-title): `text-red-600` — branded heading color
- H2 (section-title): `text-red-600` — branded section heading
- H3 (heading-3): `text-gray-900` — standard dark text
- H4 (heading-4): `text-gray-900` — standard dark text
- Body: `text-gray-700`
- Subtitle: `text-gray-500`
- Description: `text-gray-600`
- Caption: `text-gray-400`
- Label: `text-gray-700`
- Label Small: `text-gray-400` uppercase

---

## 4. Spacing & Layout

### Spacing Scale

| Token | Value | Tailwind | Usage                                    |
| ----- | ----- | -------- | ---------------------------------------- |
| xs    | 4px   | 1        | Icon gaps, tight inline spacing          |
| sm    | 8px   | 2        | Between related elements, badge padding  |
| md    | 16px  | 4        | Card padding, grid gaps, section padding |
| lg    | 24px  | 6        | Between sections, larger card padding    |
| xl    | 32px  | 8        | Page section vertical spacing            |
| 2xl   | 48px  | 12       | Major section separators                 |

### Container & Grid

| Property          | Value                                                         |
| ----------------- | ------------------------------------------------------------- |
| Max content width | 1280px (`max-w-7xl`)                                          |
| Page padding      | `px-4 sm:px-6 lg:px-8`                                       |
| Grid columns      | CSS Grid with Tailwind (`grid grid-cols-*`)                   |
| Grid gap          | `gap-4` standard, `gap-6` for card grids, `gap-8` for footer |
| Common card grid  | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`   |
| Standard container| `mx-auto max-w-7xl px-4 sm:px-6`                             |

### Responsive Breakpoints

| Name | Min Width | Target Devices              |
| ---- | --------- | --------------------------- |
| sm   | 640px     | Large phones, small tablets |
| md   | 768px     | Tablets                     |
| lg   | 1024px    | Laptops, small desktops     |
| xl   | 1280px    | Desktops, wide screens      |

---

## 5. Component Standards

### Buttons

| Variant   | Background    | Text Color | Border          | Hover State             | Usage                  |
| --------- | ------------- | ---------- | --------------- | ----------------------- | ---------------------- |
| Primary   | bg-red-600    | white      | none            | bg-red-700              | Main CTAs, form submits|
| Secondary | transparent   | gray-700   | none            | text-red-500 bg-red-100 | Secondary actions      |
| Ghost     | transparent   | gray-500   | none            | text-gray-700           | Tertiary/subtle actions|
| Outline   | transparent   | gray-700   | border-gray-300 | border-gray-400         | Alternative secondary  |
| Danger    | bg-red-600    | white      | none            | bg-red-700              | Destructive actions    |

| Size   | Padding     | Font Size  | Border Radius |
| ------ | ----------- | ---------- | ------------- |
| Small  | p-2         | text-base  | rounded-lg    |
| Medium | py-2.5 px-5 | text-sm    | rounded-lg    |
| Large  | py-3 px-6   | text-base  | rounded-lg    |
| CTA    | py-5 px-10  | text-lg    | rounded-lg    |

**Button states:**
- Disabled: `bg-gray-100 text-gray-300 cursor-not-allowed shadow-none`
- Transition: `transition-all duration-200`
- All buttons use `cursor-pointer`

### Form Inputs

| Property       | Value                                                  |
| -------------- | ------------------------------------------------------ |
| Border         | `border border-gray-200`                               |
| Border Radius  | `rounded-lg`                                           |
| Padding        | `px-3 py-2.5` (standard), `px-4 py-3` (large)         |
| Font Size      | `text-sm`                                              |
| Text Color     | `text-gray-700`                                        |
| Background     | `bg-white`                                             |
| Shadow         | `shadow-sm`                                            |
| Placeholder    | `placeholder:text-gray-400`                            |
| Hover          | `hover:border-gray-300`                                |
| Focus Ring     | `focus:border-red-500 focus:ring-2 focus:ring-red-100` |
| Error State    | `border-red-300 ring-2 ring-red-100`                   |
| Disabled State | `bg-gray-100 text-gray-400 cursor-not-allowed`         |
| Label Position | Above input, left-aligned, `mb-1.5`                   |
| Error Message  | Below input, `text-sm text-red-600`                    |
| Transition     | `transition-all`                                       |

### Cards

| Property      | Value                                                   |
| ------------- | ------------------------------------------------------- |
| Background    | `bg-white`                                              |
| Border        | `border border-gray-200`                                |
| Border Radius | `rounded-xl`                                            |
| Shadow        | `shadow-sm`                                             |
| Overflow      | `overflow-hidden`                                       |
| Elevated      | `rounded-2xl shadow-lg ring-1 ring-gray-100` (no border)|
| Interactive   | `hover:shadow-md transition-all`                        |
| Padding       | `p-4 sm:p-6` (internal content)                         |

### Badges / Tags

| Variant | Background     | Text Color      | Usage                      |
| ------- | -------------- | --------------- | -------------------------- |
| Success | bg-emerald-100 | text-emerald-700| Active, completed          |
| Warning | bg-amber-100   | text-amber-700  | Pending, attention         |
| Error   | bg-red-100     | text-red-700    | Failed, overdue            |
| Info    | bg-red-50      | text-red-600    | Informational (branded)    |
| Neutral | bg-gray-100    | text-gray-700   | Default, inactive          |

**Badge sizing:**
- Standard: `px-2.5 py-0.5 text-xs font-semibold rounded-full`
- Small: `px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full`

**Tags (removable pills):**
- Branded: `bg-red-50 text-red-600 px-2.5 py-1 text-xs font-medium rounded-full`
- Neutral: `bg-gray-100 text-gray-600 px-2.5 py-1 text-xs font-medium rounded-full`

### Modals / Dialogs

| Property      | Value                                            |
| ------------- | ------------------------------------------------ |
| Overlay       | `bg-black/50` (fixed inset-0, z-100)             |
| Background    | `bg-white`                                       |
| Border        | `border` (default gray)                          |
| Border Radius | `rounded-lg`                                     |
| Padding       | `p-8`                                            |
| Close Button  | Top right, red primary button with X icon        |
| Animation     | None (instant mount via portal)                  |
| Body Scroll   | Locked when modal is open (`overflow-y: hidden`) |
| Sizes         | sm: `w-11/12 sm:w-1/3`, md: `w-11/12 sm:w-1/2`, lg: `w-11/12 sm:w-2/3`, xl: `w-11/12 sm:w-4/5`, full: `w-full h-full m-4` |
| Title         | `text-xl font-bold` in flex header with close button |

### Toast Notifications

| Type    | Icon          | Background | Border                      | Duration |
| ------- | ------------- | ---------- | --------------------------- | -------- |
| Success | CheckCircle   | white      | border-l-4 border-green-500 | 5000ms   |
| Error   | XCircle       | white      | border-l-4 border-red-500   | 7000ms   |
| Warning | AlertTriangle | white      | border-l-4 border-yellow-500| 6000ms   |
| Info    | Info          | white      | border-l-4 border-blue-500  | 5000ms   |

**Toast behavior:**
- Max width: `max-w-md`
- Shadow: `shadow-lg`
- Border radius: `rounded-lg`
- Animation: Slide in from right (`translate-x-full` to `translate-x-0`), scale 0.95 to 1.0
- Progress bar at bottom showing remaining time
- Close button: top right, X icon, `text-gray-400 hover:text-gray-600`
- Transition duration: `300ms ease-in-out`

---

## 6. Iconography

| Property     | Value                                     |
| ------------ | ----------------------------------------- |
| Library      | Lucide React (`lucide-react`)             |
| Default Size | 20px (`size={20}`)                        |
| Small Size   | 14-16px (`size={14}` or `size={16}`)      |
| Large Size   | 24-32px (`size={24}` or `size={32}`)      |
| XL Size      | 48px (`size={48}`) — placeholder/empty states |
| Stroke Width | 2 (Lucide default)                        |
| Color        | `currentColor` (inherits text color)      |

**Icon color conventions on dark backgrounds:**
- Primary accent icons: `text-red-400`
- Secondary icons: `text-gray-400`
- Interactive icons on dark: `text-gray-300`

---

## 7. Animation & Transitions

| Property            | Value                                         |
| ------------------- | --------------------------------------------- |
| Default Duration    | 200ms (`duration-200`)                        |
| Long Duration       | 300ms (`duration-300`) — toasts, overlays     |
| Slow Duration       | 500ms (`duration-500`) — image hover effects  |
| Easing              | `ease-in-out` (default)                       |
| Hover Transitions   | `transition-all` or `transition-colors`       |
| Page Transitions    | None (no page transition animations)          |
| Loading Spinners    | `animate-spin` with brand red color           |
| Skeleton Screens    | `animate-pulse` with `bg-gray-200`            |
| Disabled Animations | Not currently handled (no `prefers-reduced-motion`) |
| CTA Hover Effect    | `hover:-translate-y-1 hover:shadow-xl` on hero CTA |
| Image Hover         | `group-hover:scale-105 transition-transform duration-500` |

---

## 8. Accessibility Requirements

| Requirement              | Standard                                                                        |
| ------------------------ | ------------------------------------------------------------------------------- |
| WCAG Level               | AA                                                                              |
| Minimum Contrast Ratio   | 4.5:1 for normal text, 3:1 for large text (18px+ bold or 24px+)                |
| Focus Indicators         | `focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none` for inputs; browser default for links/buttons |
| Keyboard Navigation      | All interactive elements must be focusable and operable via keyboard            |
| Screen Readers           | All images must have `alt` text; icon-only buttons must have `aria-label`; decorative icons use `sr-only` spans |
| Skip Links               | No (not currently implemented)                                                  |
| Form Error Announcements | `aria-invalid` on errored inputs; `aria-describedby` linking to error message   |
| Reduced Motion           | Respect `prefers-reduced-motion` (recommended improvement)                      |
| ARIA Patterns            | `role="switch"` + `aria-checked` on toggles; `aria-haspopup="listbox"` + `aria-expanded` on dropdowns; `aria-selected` on list items |
| Semantic HTML            | Use `nav`, `main`, `header`, `footer`, `section`, `article` appropriately       |

---

## 9. Image & Media Standards

| Property            | Value                                                  |
| ------------------- | ------------------------------------------------------ |
| Image Format        | WebP preferred (`.webp`), JPEG fallback                |
| Image Component     | Next.js `next/image` with automatic optimization       |
| Lazy Loading        | All below-the-fold images; hero/featured use `priority` |
| Placeholder         | Gray background fallback with centered icon            |
| Aspect Ratios       | 16:9 (`aspect-video`) for hero/featured car images; square (`aspect-square`) for logo |
| Max File Size       | No enforced limit (relies on `next/image` optimization)|
| Alt Text Convention | Descriptive: `"{Make} {Model}"` for cars; `"Business Logo"` for logo |
| Avatar Fallback     | Not applicable                                         |

---

## 10. Navigation & Information Architecture

### Primary Navigation

| Label              | Route           | Visibility | Description                                              |
| ------------------ | --------------- | ---------- | -------------------------------------------------------- |
| Browse Fleet       | /BrowseFleet    | Always     | Vehicle listings with brand sub-nav (Toyota, Honda, BMW, Audi) |
| Services           | /Services       | Always     | Service hub with sub-nav (Detailing, Tints, Repairs)     |
| Car Parts          | /CarParts       | Always     | Parts catalog                                            |
| Breakdown Recovery | /Recoveries     | Always     | Recovery service page                                    |
| Accident Claims    | /AccidentClaims | Always     | Claims information                                       |
| Track Booking      | /Booking/lookup | Always     | Booking status lookup                                    |
| About Us           | /AboutUs        | Always     | Company information                                      |

### Mobile Navigation Pattern

Hamburger menu icon (`Menu` / `X` from Lucide) with full-screen overlay. The menu is hidden at desktop widths (`xl:hidden`), desktop nav is `hidden xl:flex`. Mobile menu locks body scroll when open. Menu renders as vertical stack of links with dropdowns expanding inline.

### Breadcrumbs

No — breadcrumbs are not used in the current design.

### Footer Structure

Light gray background (`bg-gray-50`) with 4-column grid on desktop:

1. **Company Info** — Business name, description, address (MapPin icon), phone (Phone icon), email (Mail icon) with hover-to-red links
2. **Browse & Services** — Links: Browse Fleet, Services, Repairs, Recoveries, Car Parts, Accident Claims
3. **Support & Info** — Links: FAQ, About Us, Contact Us
4. **Admin & Legal** — Links: Admin Dashboard, Privacy Policy, Terms of Service

Bottom bar: Copyright text left, social media icons right (Facebook, Twitter, Instagram) — 44x44px circular touch targets with `sr-only` labels.

---

## 11. Page-Specific Layouts

### Homepage

1. **Hero Section** — Full-width black background with white text. H1 "Find Your Perfect Car" with red accent line "Book a Viewing Today". Optional two-column layout when featured car exists (content left, featured car card right on dark gray-900 card). Large red CTA button "Browse Cars" centered below. Stats row at bottom (3 columns: vehicles count, booking availability, customer rating).
2. **Content Sections** — Standard light background below hero.

### Listing / Collection Page

Filter bar at top with dropdown filters (CustomDropdown components). Product grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` with `gap-6`. Each car displayed as a card with image, details, and CTA. No pagination currently — full list rendered.

### Detail / Product Page

Car image display at top. Vehicle details in structured layout (CarDetailView component). Booking CTA buttons. Feature list (CarFeatures component). VehicleDetails shared component for specs.

### Admin Dashboard

Tab-based navigation (`AdminNavigationTabs`). KPI stat cards in `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` grid. Charts section with Recharts (bookings, services, inventory, pricing, popular cars). Recent activity table. Date selector and refresh controls.

### Forms / Checkout

Multi-step form pattern (Form component with step tracking). Form inputs stacked vertically with labels above. Validation errors shown inline below fields. Submit button as red primary CTA at bottom. Service booking form, car viewing form, and appointment form share consistent patterns.

---

## 12. Interaction Patterns

### Loading States

| Context       | Pattern                                                     |
| ------------- | ----------------------------------------------------------- |
| Page Load     | Full-screen PageLoader component with spinner               |
| Data Fetching | DashboardSkeleton with `animate-pulse` gray blocks          |
| Button Submit | Button disabled state (`bg-gray-100 text-gray-300 cursor-not-allowed`) |
| Image Load    | Gray fallback container with centered Car icon placeholder  |

### Empty States

| Context    | Pattern                                                    |
| ---------- | ---------------------------------------------------------- |
| No Results | Text message ("No vehicles found" or similar) in content area |
| No Data    | Gray card with descriptive prompt text                     |
| First Use  | Not applicable (no onboarding flow)                        |

### Error States

| Context         | Pattern                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Form Validation | Inline red text below field (`text-sm text-red-600`); input gets `border-red-300 ring-2 ring-red-100`; `aria-invalid` set |
| API Error       | Toast notification (error type: red border, XCircle icon, 7s duration)                            |
| 404 Page        | Not currently custom-styled                                                                       |
| 500 Page        | Not currently custom-styled                                                                       |

---

## 13. Performance Targets

| Metric                   | Target                                          |
| ------------------------ | ----------------------------------------------- |
| Largest Contentful Paint | < 2.5s                                           |
| First Input Delay        | < 100ms                                          |
| Cumulative Layout Shift  | < 0.1                                            |
| Bundle Size (JS)         | Minimize via Next.js automatic code splitting    |
| Image Optimization       | `next/image` with automatic WebP, sizing, and lazy loading |

---

## 14. Additional Notes

- **No external UI library** — all components are custom-built with Tailwind CSS utility classes.
- **Semantic CSS classes** are defined in `src/app/globals.css` (e.g., `.page-title`, `.card`, `.badge-green`, `.input`) and should be used over raw Tailwind when they exist.
- **CSS custom properties** for brand colors are defined in `:root` in `globals.css` (`--color-brand`, `--color-brand-dark`, etc.) but components predominantly use Tailwind classes directly.
- **No Storybook** or external design documentation exists — this file and the generated README.md are the canonical design references.
- **Recharts** is used for all dashboard charts, styled with Tailwind-compatible colors.
- **Body class**: `min-h-screen overflow-x-hidden antialiased` on the root `<body>`.
- **Z-index scale**: Header uses `z-60`, modal overlay uses `z-100`, hero uses `z-50`.
