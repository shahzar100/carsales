# Copilot Instructions for Morley Motor Company

## Project Overview

**Morley Motor Company** is a full-stack car sales platform built with Next.js. It features an admin dashboard for managing inventory, a customer-facing shop, car viewing/service appointment booking, and integrated email notifications.

- **Owner:** shahzar100  
- **Repository:** carsales  
- **Default Branch:** main

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) with Turbopack |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS v4 |
| **Database** | MongoDB (Node driver v6) |
| **Testing** | Jest + React Testing Library + jest-axe |
| **Email** | React Email + Nodemailer |
| **Image Storage** | AWS S3 (SDK v3) |
| **Auth** | iron-session + bcryptjs |
| **Validation** | Zod |
| **UI Components** | Lucide React (icons), Recharts (charts) |
| **Animation** | Motion (Framer Motion) |

## Project Structure

```
src/
├── app/
│   ├── (main)/              # Customer-facing routes
│   ├── (admin)/             # Admin dashboard routes
│   ├── api/                 # API endpoints
│   │   ├── admin/           # Admin operations (auth required)
│   │   ├── bookings/        # Booking services
│   │   ├── shop/            # Shop info
│   │   ├── about/           # About page
│   │   ├── carparts/        # Car parts/inventory
│   │   └── cron/            # Scheduled tasks
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── Admin/               # Admin-specific components
│   ├── Car/                 # Car listing & display
│   ├── Shop/                # Shop components
│   ├── Booking/             # Booking forms & flows
│   ├── Form/                # Form components
│   ├── UI/                  # Generic UI primitives
│   ├── SEO/                 # SEO-related components
│   └── Shared/              # Shared across app
├── contexts/
│   ├── AuthContext.tsx      # Admin authentication state
│   ├── FilterContext.tsx    # Car filter state
│   └── ToastContext.tsx     # Toast notifications
├── hooks/
│   └── [custom hooks]       # Reusable logic
├── lib/
│   ├── models/              # MongoDB schemas
│   ├── interfaces.ts        # Shared types
│   ├── types.ts             # Type exports
│   ├── mongodb.ts           # DB connection
│   └── [utilities]
├── emails/
│   └── [React Email templates]
├── backend/
│   └── [Context providers, utilities]
└── middleware.ts            # Next.js middleware

__tests__/                   # Test suite (mirrors src structure)
├── api/
├── components/
├── contexts/
├── hooks/
└── utils/
```

## Code Conventions

### TypeScript
- Strict mode enabled (`strict: true` in tsconfig.json)
- All files must have explicit type annotations
- Use interfaces for data models, types for unions/utilities
- Use `as const` for literal type constants

### Components
- Functional components with props destructuring
- Export naming: `export default ComponentName` at bottom
- Props interfaces suffix with `Props` (e.g., `HeaderProps`)
- Memoize components only if re-renders are measurable
- Use `'use client'` directive for interactive features

**File locations:**
- Customer UI: `src/components/[Domain]/[Component].tsx`
- Admin UI: `src/components/Admin/[Feature]/[Component].tsx`
- Shared UI: `src/components/UI/[Component].tsx` or `src/components/Shared/[Component].tsx`

### Database & API
- Models in `src/lib/models/[model].ts` using MongoDB driver
- API routes in `src/app/api/[route]/route.ts`
- Always validate input with Zod schemas
- Return consistent JSON structure: `{ success: boolean, data?: T, error?: string }`
- Implement error handling with try-catch and proper HTTP status codes

### Forms & Validation
- Define Zod schemas near the form component or in `src/lib/`
- Validate server-side; schema is source of truth
- Use `FormData` API for form submissions
- Provide field-level error messages

### Testing
- Test file naming: `[component/function].test.ts[x]`
- Mirror `src/` structure in `__tests__/`
- Each test file focuses on one module
- Use `describe()` to organize related tests
- Mock external dependencies (API calls, DB, storage)

**Test Configs:**
- Component tests: `jest.config.js` (jsdom environment)
- API tests: `jest.config.api.js` (node environment)
- Setup file: `jest.setup.js` for component setup, API has inline setup

### Styling
- Use Tailwind CSS utility classes (no custom CSS unless necessary)
- Follow design system in `design.md` and `README.md` for colors, spacing, typography
- Responsive design: mobile-first, use `md:`, `lg:`, `xl:` breakpoints
- Brand colors: red-600 (primary), red-700 (hover), gray tones for neutrals

**Key color variables:**
- Primary action: `text-red-600`, `bg-red-600`
- Text body: `text-gray-700`
- Text muted: `text-gray-500`
- Borders: `border-gray-200`

## Design System

### Brand Colors
- **Primary:** red-600 (`#dc2626`) — CTAs, links, titles
- **Primary Dark:** red-700 (`#b91c1c`) — Hover states
- **Primary Light:** red-50 (`#fef2f2`) — Subtle backgrounds
- **Text:** gray-900 (headings), gray-700 (body)
- **Borders:** gray-200 (default), gray-300 (hover)
- **Semantic:** emerald (success), amber (warning), red (error), blue (info)

### Typography
- **Headings:** Bold, red-600 (H1/H2) or gray-900 (H3/H4)
- **Body:** gray-700, system font stack
- **Type scale:** 4xl (H1), 2xl (H2), lg (H3), base (body), sm (small), xs (tiny)

See `design.md` for complete design specification.

## Common Workflows

### Adding a New Feature
1. Create a feature branch: `git checkout -b feat/feature-name`
2. Design component/page structure in `design.md` (if UI)
3. Write Zod schema for validation (if form/API)
4. Implement component(s) in `src/components/[Domain]/`
5. Add API route in `src/app/api/[endpoint]/route.ts` (if needed)
6. Write tests in `__tests__/` mirroring the structure
7. Run full test suite: `npm test`
8. Push branch and create PR

### Creating an API Endpoint
1. Create route file: `src/app/api/[domain]/route.ts`
2. Define Zod schema for request validation
3. Implement handler (GET, POST, PUT, DELETE)
4. Return: `{ success: true, data: {...} }` on success
5. Return: `{ success: false, error: "message" }` on failure
6. Add auth check if admin-only (`src/app/api/admin/`)
7. Write test in `__tests__/api/[domain].test.ts`

### Adding a Component
1. Create file: `src/components/[Domain]/[ComponentName].tsx`
2. Define `interface [ComponentName]Props { ... }`
3. Implement component with proper types
4. Export at bottom: `export default [ComponentName]`
5. Add test: `__tests__/components/[Domain]/[ComponentName].test.tsx`

### Running Tests
- All tests: `npm test`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage`
- Specific file: `npm test -- [filename]`
- API only: `npx jest --config jest.config.api.js`
- Components only: `npx jest --config jest.config.js`

### Debugging
- Inspect with `console.log()` (will show in test output)
- Use Jest `--verbose` flag for detailed test output
- Check coverage report: `coverage/lcov-report/index.html`
- Database errors: Check MongoDB connection and schema validation

## Testing Best Practices

- **Database tests:** Use mocked MongoDB in tests (memory server)
- **API tests:** Mock external services (email, S3, auth)
- **Component tests:** Use React Testing Library (not Enzyme)
- **Accessibility:** Use jest-axe for a11y checks
- **Coverage goal:** Aim for 80%+ line coverage per file
- **Naming:** Describe what the test verifies (e.g., "should validate email format")

## Git & Deployment

### Branch Strategy
- Main branch: `main` (always deployable)
- Feature branches: `feat/description`
- Bugfix branches: `fix/description`
- Docs branches: `docs/description`

### Commit Messages
- Format: `type: short description`
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
- Example: `feat: add email validation to service bookings`

### Pre-Push Checklist
1. All tests pass: `npm test`
2. Code lints: `npm run lint`
3. TypeScript compiles: `npm run build`
4. Tests have >80% coverage
5. No console errors/warnings

## Key Files & Entry Points

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout, providers |
| `src/app/(main)/page.tsx` | Home page |
| `src/app/(admin)/dashboard/page.tsx` | Admin dashboard |
| `src/lib/interfaces.ts` | Shared type definitions |
| `src/lib/models/` | MongoDB document schemas |
| `src/middleware.ts` | Route protection, auth checks |
| `design.md` | Design system specification |
| `jest.config.js` | Component test config |
| `jest.config.api.js` | API test config |

## Special Tools & Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting |
| `npm run email` | Preview React Email templates |

## Important Notes

- **Auth:** iron-session stores admin session in HTTP-only cookie
- **Emails:** Nodemailer + React Email templates for notifications
- **Images:** S3 presigned URLs for car photos (no direct file uploads)
- **Rate limiting:** Implement in API routes to prevent abuse
- **Errors:** Consistent error handling with meaningful messages
- **Accessibility:** All interactive components must be keyboard-navigable
- **Performance:** Use Next.js Image component for all images
- **SEO:** Static metadata in layouts, dynamic metadata in pages

## When in Doubt

1. **Check existing patterns** in similar files (`grep` for examples)
2. **Review design.md** for UI/UX requirements
3. **Check test examples** in `__tests__/` for patterns
4. **Read TypeScript errors** carefully (strict mode is helpful)
5. **Consult tests** as living documentation of how code should work

---

**Last Updated:** May 2026  
**Version:** 1.0  
**Maintained By:** Development Team
