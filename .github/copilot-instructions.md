# Copilot Instructions

## Project Overview

This is a **Next.js** car sales application using TypeScript, Tailwind CSS, and MongoDB.

## Tech Stack

- **Framework:** Next.js (App Router) with Turbopack
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** MongoDB
- **Testing:** Jest with React Testing Library
- **Email:** React Email with Nodemailer

## Conventions

- Use TypeScript strict mode for all files.
- Components live in `src/components/` and are organized by domain (Admin, Car, Shop, etc.).
- API routes live in `src/app/api/`.
- Shared types and interfaces are in `src/lib/interfaces.ts` and `src/lib/types.ts`.
- Database models are in `src/lib/models/`.
- Tests go in `__tests__/` mirroring the source structure.

## Testing

- Run all tests: `npm test`
- Run API tests: `npx jest --config jest.config.api.js`
- Run component tests: `npx jest --config jest.config.js`

## Branch Strategy

- Create feature branches from `main`.
- Use descriptive branch names (e.g., `feat/add-validation`, `fix/search-bug`).
