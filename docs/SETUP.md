# Car Sales Application - Setup Guide

## Overview

This is a comprehensive car sales application with:

- Car inventory management
- Service booking system
- Car viewing appointment scheduling
- Admin dashboard with full CRUD operations
- Email notifications (booking confirmations & cancellations)
- Customer booking lookup portal

## Prerequisites

- Node.js 18+ installed
- MongoDB database (Atlas or local instance)
- Resend API key for email sending

## Environment Setup

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Configure your `.env.local` with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/carsales?retryWrites=true&w=majority

# Admin Authentication
ADMIN_PASSWORD=your_admin_password_here
SESSION_SECRET=your_session_secret_key_at_least_32_characters_long

# Email Configuration (Resend)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Business Information (Server-side for API routes)
NEXT_BUSINESS_NAME="Car Sales & Viewing"
NEXT_BUSINESS_ADDRESS="123 Auto Street"
NEXT_BUSINESS_CITY="City"
NEXT_BUSINESS_STATE="State"
NEXT_BUSINESS_ZIP="12345"
NEXT_BUSINESS_PHONE="(555) 123-4567"
NEXT_BUSINESS_EMAIL="info@carsales.com"

# Business Information (Client-side for frontend display)
NEXT_PUBLIC_BUSINESS_NAME="Car Sales & Viewing"
NEXT_PUBLIC_BUSINESS_ADDRESS="123 Auto Street"
NEXT_PUBLIC_BUSINESS_CITY="City"
NEXT_PUBLIC_BUSINESS_STATE="State"
NEXT_PUBLIC_BUSINESS_ZIP="12345"
NEXT_PUBLIC_BUSINESS_PHONE="(555) 123-4567"
NEXT_PUBLIC_BUSINESS_EMAIL="info@carsales.com"
```

### Getting API Keys

#### MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Replace `<username>`, `<password>`, and `<cluster>` in the connection string

#### Resend

1. Go to [Resend](https://resend.com)
2. Sign up for a free account
3. Generate an API key from the dashboard
4. Add your domain and verify it (or use the test domain for development)

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create an admin user:

```bash
# Make sure ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD are set in .env.local,
# then run:
npm run setup-admin
```

The script reads from `.env.local` and bcrypt-hashes the password into the
`adminUsers` collection in MongoDB. It's idempotent — re-running on an
existing user updates the password.

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Application Structure

### User-Facing Pages

- `/` - Home page with featured vehicles
- `/BrowseFleet` - Browse available cars
- `/BrowseFleet/[id]` - Individual car details with booking
- `/Services` - Service offerings
- `/bookings/lookup` - Customer booking lookup

### Admin Pages

- `/admin` - Admin redirect (checks authentication)
- `/admin/login` - Admin login page
- `/admin/dashboard` - Main admin dashboard with:
  - **Cars Tab**: Add, edit, delete vehicles
  - **Service Bookings Tab**: View and manage service appointments
  - **Car Viewings Tab**: View and manage car viewing bookings
  - **Shop Settings Tab**: Update business information

### API Endpoints

#### Public Endpoints

- `POST /api/bookings/service` - Create service appointment
- `POST /api/bookings/viewing` - Create car viewing appointment
- `GET /api/bookings/lookup?ref=BK-XXXXX` - Lookup booking by reference
- `GET /api/shop` - Get shop information

#### Admin Endpoints (Authenticated)

- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/logout` - Check session status
- `GET /api/admin/bookings` - Get all bookings
- `GET /api/admin/cars` - Get all cars
- `POST /api/admin/cars` - Add new car
- `PUT /api/admin/cars` - Update car
- `DELETE /api/admin/cars?id=xxx` - Delete car
- `GET /api/admin/shop` - Get shop info (admin)
- `PUT /api/admin/shop` - Update shop info
- `POST /api/bookings/cancel` - Cancel booking with reason

## Features

### For Customers

1. **Browse Vehicles**: View available cars with detailed information
2. **Book Car Viewings**: Schedule appointments to view cars
3. **Book Services**: Schedule service appointments
4. **Booking Lookup**: Check booking status using reference number
5. **Email Notifications**: Receive confirmation emails for all bookings

### For Administrators

1. **Vehicle Management**:

   - Add new vehicles with full details
   - Edit existing vehicles
   - Delete vehicles
   - Update vehicle status (available, reserved, sold)

2. **Booking Management**:

   - View all service and viewing bookings
   - Search and filter bookings
   - Cancel bookings with reason (customer gets email)
   - Track booking status

3. **Shop Configuration**:

   - Update business information
   - Set operating hours
   - Configure contact details
   - Manage social media links

4. **Security**:
   - Password-protected admin access
   - Session-based authentication
   - Secure API endpoints

## Email Templates

The system includes professional HTML email templates for:

1. **Service Booking Confirmation**

   - Booking reference
   - Service details
   - Date and time
   - Customer information
   - Link to booking lookup

2. **Car Viewing Confirmation**

   - Booking reference
   - Vehicle details with image
   - Date and time
   - Location information
   - Customer information

3. **Booking Cancellation**
   - Booking reference
   - Cancellation reason (from admin)
   - Original booking details
   - Link to rebook

## Database Collections

The application uses the following MongoDB collections:

- `cars` - Vehicle inventory
- `serviceAppointments` - Service bookings
- `carViewingBookings` - Car viewing appointments
- `shopInfo` - Business information
- `adminUsers` - Admin user accounts

## Booking Reference System

Each booking receives a unique reference in the format `BK-XXXXXX` where XXXXXX is a 6-character alphanumeric code. Customers can use this reference to:

- Look up their booking
- Contact support
- Reference in communications

## Development Notes

### Adding New Features

#### Add a New Service Type

1. Update the service booking form
2. Ensure the `serviceType` field accepts the new type
3. No database changes needed - it's a flexible string field

#### Add Car Images

Upload images to a CDN (Cloudinary, AWS S3, etc.) and store URLs in the `image` field when adding cars through the admin dashboard.

### Customization

#### Email Branding

Edit `/src/lib/email/templates.ts` to customize:

- Colors and styling
- Company logo
- Email footer
- Template layout

#### UI Theme

The application uses Tailwind CSS. Customize colors in `tailwind.config.js`.

## Troubleshooting

### MongoDB Connection Issues

- Verify your connection string is correct
- Ensure your IP is whitelisted in MongoDB Atlas
- Check that the database user has proper permissions

### Email Not Sending

- Verify Resend API key is correct
- Check that the sender email is verified in Resend
- Review Resend dashboard for error logs

### Build Errors

- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run type-check`

### Session Issues

- Ensure SESSION_SECRET is at least 32 characters
- Clear browser cookies and try again
- Check that iron-session is properly installed

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Admin Passwords**: Use strong passwords (minimum 8 characters recommended)
3. **Session Secret**: Generate a strong random string
4. **MongoDB**: Use IP whitelisting and strong database credentials
5. **HTTPS**: Always use HTTPS in production
6. **Input Validation**: All user inputs are validated on the server side

## Sentry (production error tracking)

The app routes all `console.error` / `console.warn` calls through
`src/lib/utils/observability.ts` (`logError`, `logEvent`). When `SENTRY_DSN`
is unset, the shim falls through to `console.*` so dev and tests behave
exactly as before. To wire Sentry for production:

1. **Install the SDK** (one-time):

   ```bash
   npm i @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

   The wizard creates `sentry.client.config.ts`, `sentry.server.config.ts`,
   and `sentry.edge.config.ts`. Accept the defaults; the wizard reads
   `SENTRY_DSN` from `.env.local`.

2. **Update `observability.ts`** to forward to Sentry:

   ```ts
   import * as Sentry from "@sentry/nextjs";

   export function logError(error: unknown, context: LogContext = {}): void {
     Sentry.captureException(error, { extra: redactObject(context) });
     // keep console.error for local visibility
     console.error("[error]", { ...redactObject(context) });
   }

   export function logEvent(name: string, context: LogContext = {}): void {
     Sentry.addBreadcrumb({ category: "app", message: name, data: redactObject(context) });
     console.log(`[event] ${name}`, redactObject(context));
   }
   ```

3. **Set `SENTRY_DSN` in Vercel** for production and preview, and (optionally)
   in `.env.local` for dev testing.

4. **Verify**: trigger a known error (e.g. `/api/admin/cars` with a bad payload)
   and confirm the event lands in your Sentry project within ~30 seconds.

Start at `tracesSampleRate: 0.1`. The PII redactor in `observability.ts`
already strips emails, phones, passwords, and tokens before send.

## Staging environment

Run staging as a **separate Vercel project + separate MongoDB cluster** —
never point staging at the production database. Concretely:

| Resource | Production | Staging |
|---|---|---|
| Vercel project | `carsales` | `carsales-staging` |
| MongoDB Atlas cluster | `MMC-prod` | `MMC-staging` |
| S3 bucket | `mmc-images-prod` | `mmc-images-staging` |
| Sentry env | `production` | `staging` |
| Turnstile site key | prod sitekey | staging sitekey (Cloudflare dashboard) |

Staging should mirror production env vars 1:1 except for the credentials
above. Use the staging Vercel project's "Production" environment for the
`day-N-*` branch deploys; use its "Preview" for PR previews.

## MongoDB backup & restore

**Atlas (recommended).** Both the production and staging clusters should
have **Continuous Cloud Backup** enabled with point-in-time recovery
(PIT). Atlas retains:

- 24h of oplog continuously
- Daily snapshots for 7 days
- Weekly snapshots for 4 weeks
- Monthly snapshots for 12 months

To restore: Atlas UI → Backup → Restore → choose timestamp →
"Restore into a new cluster" (never overwrite live). After verification,
update `MONGODB_URI` in Vercel to point at the new cluster.

**Local / self-hosted.** Use `mongodump` nightly via cron:

```bash
mongodump --uri="$MONGODB_URI" --out=/backups/$(date +%F)
```

…and copy the result to S3 (or wherever) with a 30-day retention policy.
Test restores quarterly: `mongorestore --uri="$STAGING_URI" /backups/2026-05-01`.

## Secret rotation

Rotate the secrets below on a schedule. The `Owner` column should match
your handover spreadsheet.

| Secret | Owner | Cadence | Last rotated |
|---|---|---|---|
| `SESSION_SECRET` | Engineering | Quarterly | _(fill in)_ |
| `ADMIN_PASSWORD` (seed) | Engineering | Once + on offboarding | _(fill in)_ |
| `SMTP_PASS` | Operations | Per provider policy (Resend: yearly) | _(fill in)_ |
| `AWS_SECRET_ACCESS_KEY` | Engineering | Quarterly | _(fill in)_ |
| `CRON_SECRET` | Engineering | Quarterly | _(fill in)_ |
| `TURNSTILE_SECRET_KEY` | Engineering | On compromise only | _(fill in)_ |
| `SENTRY_DSN` | Engineering | On compromise only (auth tokens only, not DSN) | _(fill in)_ |
| MongoDB Atlas DB user | DBA / Engineering | Quarterly | _(fill in)_ |

To rotate: generate the new value, deploy to Vercel as a new env var,
verify a preview deploy, then promote and remove the old value. For
`SESSION_SECRET` rotation, expect every admin user to be logged out — do
it during a quiet window.

## Support

For issues or questions:

1. Check this README
2. Review the code comments
3. Check MongoDB and Resend service status
4. Review application logs in the console

## License

This project is private and confidential.
