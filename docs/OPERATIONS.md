# OPERATIONS.md — how to run the site day-to-day

> Non-technical guide for the team running the dealership. If you need
> something that isn't here, the developer reference is [SETUP.md](./SETUP.md);
> on-call info is in [RUNBOOK.md](./RUNBOOK.md).

## Quick links

| What you want | Where |
|---|---|
| Sign in to admin | `https://<your-domain>/admin/login` |
| Reset a colleague's password | Admin → Users → row → **Send reset link** |
| Add a car for sale | Admin → Cars → **Add car** |
| Confirm a booking | Admin → Bookings → row → status dropdown → **Confirmed** |
| Cancel a booking and email the customer | Admin → Bookings → row → **Cancel** (asks for a reason) |
| Update business hours, phone, address | Admin → Shop |
| Customer-facing review URL | `https://<your-domain>/review?ref=BK-XXXXXX` |

## Daily checks

1. **Inbox & WhatsApp** — booking confirmations, reset emails, and customer
   replies all land in the address set as `EMAIL_FROM`. WhatsApp clicks
   open a chat with the number in **Admin → Shop → phone**.
2. **Admin → Bookings** — anything new from last night will be **pending**.
   Confirm it, change date/time if you spoke with the customer, or
   cancel with a reason if it can't go ahead. The customer gets an email
   either way.
3. **Admin → Status widget** (top-right) — green dot means MongoDB and
   SMTP are reachable. If red, see [RUNBOOK.md](./RUNBOOK.md).

## Adding a car

1. Admin → Cars → **Add car**.
2. Fill in make, model, year, price, mileage, fuel, transmission, doors,
   colour, status (`available` / `reserved` / `sold`), and description.
3. Upload one or more photos. They go to S3 (or CloudFront in front of
   S3) — first photo is the main listing image, the rest show in the
   gallery.
4. Tick **Featured** if you want this car on the home page. Only one
   can be featured at a time; ticking a new one will untick the
   previous.
5. Save. The car appears on `/BrowseFleet` within ~60 seconds (sooner
   if you hit refresh on the public site).

## Confirming or cancelling a booking

- Service booking: Admin → Service Bookings → row → click. Status
  options: `pending`, `confirmed`, `completed`, `cancelled`.
- Car viewing: Admin → Car Viewings → same flow.
- Marking **completed** unlocks the review-invite email (sent the
  next day by a scheduled job).
- **Cancelling** asks for a reason. The reason is emailed to the
  customer with the rest of the cancellation notice — be polite.

## Resetting a colleague's password

1. Admin → Users → find the row by username or email.
2. Click **Send reset link**.
3. The user gets an email with a one-time link to `/admin/reset-password`.
   Link expires after 1 hour.
4. They click it, choose a new password (≥ 12 chars, upper + lower +
   digit), sign in.

You can never see anyone else's password. If a user is locked out and
can't get the email, ask the developer to bootstrap a new account via
the `setup-admin` script (see [SETUP.md](./SETUP.md)) and delete the
broken account.

## Adding a new admin user

1. Admin → Users → **New user**.
2. Username (letters / numbers / underscore, 3+ chars), email, role.
   Roles:
   - **staff** — read-only on most surfaces.
   - **manager** — can create users + manage cars and bookings.
   - **admin** — same as manager, plus password resets.
3. Save. The new user gets a **Set up your admin account** email with
   a link to choose their own password. Until they click it, the
   account exists but can't be logged into.

## Updating business info / opening hours / detailing packages

Admin → Shop. The form has sections for the basics (name, address,
phone), opening hours, social media links, hero stats on the home page,
service packages, tint options, and the recovery service description.
Save commits everything in one transaction; partial saves are not
possible by design.

## Sending review invites

Review invites send automatically 24 hours after a booking is marked
**completed**. The email points at `/review?ref=BK-XXXXXX` which
forwards the customer to your Google Business listing.

If the customer never clicked **completed** they won't get a review
invite. Mark old confirmed bookings as completed in batches if you
want to retroactively send invites.

## Backups

Atlas (the MongoDB host) takes a snapshot every 24 hours and keeps the
last 7 days, then weekly snapshots for a month, then monthly for a year.
You don't need to do anything for this to happen. To restore, your
developer can follow the procedure in [SETUP.md](./SETUP.md) → "MongoDB
backup & restore" — typically Atlas UI → Backup → choose a timestamp
→ restore into a fresh cluster.

## When something goes wrong

Triage in order:

1. The status widget is red — wait 60 seconds and refresh. If still
   red, page the developer.
2. Customers report a 404 or a booking email link not working — copy
   the link they were sent and forward to the developer.
3. You can't sign in — try the **Forgot password?** flow first. If
   the reset email doesn't arrive within 5 minutes, page the developer.
4. Anything else (slow page loads, missing data) — note the time and
   what you were doing, then page the developer.

See [RUNBOOK.md](./RUNBOOK.md) for the developer-side response.
