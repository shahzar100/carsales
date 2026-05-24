# Admin guide

A practical how-to for staff using the MMC Leeds admin dashboard. Written for non-technical readers. If something here doesn't match what you see on screen, ask the developer — the underlying code is the source of truth.

## Logging in

- Admin login page: **`/admin/login`** (e.g. `https://<your-site>/admin/login`).
- Enter your **username** and **password**. There is no "Sign up" — accounts are created by an admin.
- If two-factor authentication (2FA) is enabled on your account, you'll be asked for a 6-digit code from your authenticator app after entering your password.
- After a successful login you land on `/admin/dashboard`.
- Sessions last 24 hours. If you've been away longer, you'll be sent back to the login page.
- Three roles exist, in increasing order of permission: **staff**, **manager**, **admin**.
  - Image uploads, marking bookings confirmed/completed, and cancellations require at least **manager**.
  - Resetting another user's password requires **admin**.

### Setting up 2FA on your account

1. Sign in, then click **Account** (or go to `/admin/dashboard/account`).
2. Click "Enable 2FA". Scan the QR code with an authenticator app (Google Authenticator, 1Password, Authy, etc.).
3. Type the 6-digit code from the app to confirm. From the next sign-in onwards you'll be asked for a code.
4. You can disable 2FA from the same page — you'll need to enter your password to do so.

## Adding a car

The cars dashboard lives at **`/admin/dashboard/cars`** (click "Cars" in the top nav).

1. Click **"Add Car"** (or go directly to `/admin/dashboard/add`).
2. Fill in the form. Required fields:
   - **Make**, **Model** (max 100 chars each)
   - **Year** (1900 – next year)
   - **Price** (positive number, in GBP)
   - **Mileage**
   - **Fuel** — Petrol / Diesel / Electric / Hybrid
   - **Transmission** — Manual / Automatic / CVT
   - **Doors** (1 – 10)
   - **Colour**
3. Optional fields: description, features (free-text list), and images.
4. **Images** are uploaded directly to S3 via the in-form uploader.
   - Allowed types: JPEG, PNG, WebP, AVIF.
   - Max 10 MB per image.
   - Images upload as you drop them — wait for the progress bar to finish before saving.
   - You need at least the **manager** role to upload.
5. **Status** — controls where the car appears on the public site:
   - **available** (default) — shows on `/BrowseFleet` and is bookable for viewings.
   - **reserved** — a deposit has been taken; viewings are blocked. Set automatically when a customer reserves the car, but you can also set it manually.
   - **sold** — removed from `/BrowseFleet` and the "Latest Arrivals" carousel on the home page.
6. **Featured** — when on, the car appears in the home-page hero spot. Only one car shows at a time.
7. Click **Save**. The public site updates within a few seconds (admin saves invalidate the relevant page caches).

To **edit** a car, find it in the table and click the row (or use the pencil/edit action). The edit form is at `/admin/dashboard/cars/edit/<id>`. To **delete** a car, use the delete action in the row — the associated S3 images are cleaned up automatically.

## Editing business info

Business settings live at **`/admin/dashboard/shop`** ("Business Info" in the top nav). Changes here flow through to almost every public page (header, footer, hero, contact, services, FAQ, etc.) — there is no per-page override.

The form is split into collapsible sections:

- **Business Information** — name, phone, email, address. Drives footer + contact page + Schema.org metadata.
- **Business Hours** — opening times per day. Shown in the footer, on `/contact`, and used to display "Open now" / "Closed" status.
- **Social Media** — Facebook / Instagram / etc. links. Hidden when blank.
- **Homepage Stats** — the three numbers in the hero section (e.g. "20+ years", "1000+ cars sold"). Edit freely; no validation beyond non-empty.
- **Detailing Packages** — list of detailing packages shown on `/Services/Detailing`. Add, remove, edit price/features per package.
- **Tint Options** — list of window-tint options shown on `/Services/Tints`.
- **Service Overviews** — short blurbs for the service overview cards on `/Services`.
- **Recovery** — copy and contact details for `/Recoveries`.

Click **Save** at the bottom to push changes. The save sends one PUT to `/api/admin/shop` covering every section at once — the form has a single submit button, not one per section.

Heads-up on propagation delay: `PUT /api/admin/shop` (`src/app/api/admin/shop/route.ts`) writes to MongoDB and records an audit entry, but it does **not** call `revalidatePath` or `revalidateTag`. Most marketing pages set `export const revalidate = 3600` (one hour) — `/AboutUs`, `/FAQ`, `/Services`, `/Recoveries`, `/contact`, the terms/privacy pages — so a saved change may not appear publicly until that window expires. The home page revalidates every 60 seconds; `/Services/Tints` every 10 minutes. If you need a change live immediately, ask the developer to trigger a manual redeploy or to add the `revalidatePath` calls (the pattern is already used by `/api/admin/cars`, lines 31–33).

## Handling bookings

There are two booking tabs:

- **`/admin/dashboard/service`** — service appointments (MOT, repair, detailing, tinting, recovery).
- **`/admin/dashboard/viewing`** — car-viewing appointments.

Each tab lists bookings newest-first with the customer name, reference (`BK-XXXXXX`), date/time, and current status (**pending**, **confirmed**, **completed**, **cancelled**).

Per booking, you can:

- **Confirm** — moves status from `pending` to `confirmed`. Used after you've checked the slot works.
- **Mark completed** — once the appointment has actually happened. Stamps `completedAt`; 24 hours later the daily cron sends a review-invite email to the customer.
- **Cancel** — opens a modal asking for a reason (minimum 10 characters). The reason is included in the customer's cancellation email, so write something they can read. Cancellation re-opens the slot for someone else.

### Emails sent automatically

- **On booking** — customer receives a confirmation email with their reference number (`BK-XXXXXX`) and details. They can look the booking up at `/Booking/<id>`.
- **On admin confirm** — **no email is sent.** The `PUT /api/admin/bookings` handler (`src/app/api/admin/bookings/route.ts`) updates `status` and writes an audit entry, but does not call `sendEmail` on any status transition other than cancel. If a customer expects a "your booking is confirmed" email, that has to come from you out-of-band (a phone call or a fresh email) or be added to the route.
- **On cancel** — customer receives a cancellation email with the reason you typed.
- **On mark completed** — no immediate email. The daily 10:00 UTC cron sends a review-invite 24 hours after completion (one per booking; idempotent so customers don't get duplicates).

To **cancel** requires at least the **manager** role. Staff can view bookings but cannot change status.

## Customer accounts

- **`/admin/dashboard`** — the main dashboard surfaces top-level KPIs (registered users among them) and recent activity. There is no dedicated "all customers" tab.
- Customers can register at `/register`, sign in at `/login` (email/password, magic link, or Google), reset their password at `/forgot-password`, save cars to a wish list (`/saved`), and view their booking history at `/account`.
- **There is no admin UI for viewing or editing an individual customer account.** Confirmed by walking every page under `src/app/(admin)/admin/dashboard/`: the tabs are `account` (your own 2FA), `add`, `audit`, `carparts`, `cars`, `part-exchange`, `quotes`, `reservations`, `service`, `shop`, `status`, `viewing` — none of them surface the `users` (Auth.js / NextAuth) collection. Customer accounts are managed by Auth.js directly; if you need to inspect or remove one, the developer has to do it in the Mongo `users` collection. The `/api/admin/users/*` routes only manage **admin staff** (the `adminUsers` collection), not customers.

## Reservations, part-exchange, quotes

Three secondary tabs in the top nav, all customer-initiated and admin-managed the same way (newest first, status flow):

- **`/admin/dashboard/reservations`** — reservations on specific cars (deposits / holds). One active reservation per car at a time (DB-enforced).
- **`/admin/dashboard/part-exchange`** — customers offering a trade-in vehicle for an enquiry.
- **`/admin/dashboard/quotes`** — quote requests.

## Reports / analytics

The main dashboard (`/admin/dashboard`) shows:

- **KPIs** — bookings this week, available stock, average price, total stock, recent customers, etc.
- **Charts** — bookings over time (month + day), inventory by fuel type, inventory by status, service-type breakdown, price distribution, popular cars.
- **Date selector** — change the range (last 7 days / 30 days / custom).
- **Upcoming appointments** + **Recent activity** tables at the bottom.

For raw inspection, two more tabs help:

- **`/admin/dashboard/audit`** — every privileged admin action (booking status changes, password resets, car deletions, etc.) writes to an audit log. Filter by actor, target type, or date.
- **`/admin/dashboard/status`** — system health: DB connectivity, KV connectivity, SMTP, recent errors. Use this first when "something feels broken".

## What to do when X breaks

**"A customer says they didn't receive their booking email"**
1. Find the booking by reference in the relevant tab. Confirm the email address on the booking is correct (typos happen).
2. Check the system status page — if SMTP is red, no emails are going out for anyone.
3. Ask the customer to check spam. The sender address is whatever `EMAIL_FROM` is set to.
4. If everything looks right and SMTP is healthy, ask the developer to check the SMTP provider's send log — the API will report `success` even if the SMTP provider later bounces the message.

**"I lost my 2FA device / can't log in with my code"**
- Another admin (at minimum **admin** role) can reset your password from **`/admin/dashboard/add`** → use the "Type" dropdown at the top of the page and pick **"Password"**. Look up the user by username or email, pick "reset", and confirm — the user receives an email with a reset link. Resetting the password does **not** disable 2FA — you'll still need a code afterwards. (Under the hood the form POSTs to `/api/admin/users/password`, which is the only UI surface that calls that route.)
- To disable 2FA without a code, ask the developer to clear `totpEnabled` and `totpSecret` for your user in the `adminUsers` collection. Then log in with your password and re-enrol 2FA.

**"A car won't save"**
- Validation errors show inline. Check the year (must be ≥ 1900 and ≤ next year), price (positive), mileage (non-negative), and fuel/transmission (must be one of the dropdown values).
- Image uploads can stall if your role is **staff** — you need at least **manager** to upload. The form will reject the save if a required image is still uploading.
- A 413 on upload means the file is over 10 MB. Resize it first.
- A 400 "Invalid content type" means the file isn't JPEG/PNG/WebP/AVIF. Re-export.

**"The public site doesn't show my edit"**
- **Car saves** call `revalidatePath` for `/BrowseFleet`, `/`, and the specific car page, so changes appear immediately. If a car edit doesn't show, hard-refresh first (Ctrl+F5).
- **Business-info saves** (`/admin/dashboard/shop`) do **not** revalidate. Marketing pages cache for up to one hour (`/AboutUs`, `/FAQ`, `/Services`, `/Recoveries`, `/contact`); `/Services/Tints` for 10 minutes; the home page for 60 seconds. If you need a business-info change live faster, ask the developer to redeploy.
- The home page hero updates on a `featured` toggle for any car.

**"Bookings are being double-booked"**
- Shouldn't happen — the database enforces slot uniqueness for `pending` and `confirmed` bookings. If you see two `pending` bookings on the same slot for the same car, take a screenshot and notify the developer immediately.

**"I clicked something and got a red error toast"**
- The system status page (`/admin/dashboard/status`) usually reflects the underlying cause within a minute. If everything is green, retry once — transient network blips are rare but possible.
- If it persists, screenshot the error toast and the URL bar, and send to the developer.
