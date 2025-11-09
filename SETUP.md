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
node scripts/setup-admin.mjs
```

Follow the prompts to create your admin username and password.

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

## Support

For issues or questions:
1. Check this README
2. Review the code comments
3. Check MongoDB and Resend service status
4. Review application logs in the console

## License

This project is private and confidential.
