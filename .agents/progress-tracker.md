# Progress Tracker

Keep this file honest. Mark only completed work as complete.

## Current Status

Frontend UI is complete across all 5 required pages. Backend Prisma schema, Neon/PostgreSQL migration, core services, protected note routes, share-link business logic, and main Hono entrypoint are now in place. Auth and public share route files still need real handlers before the frontend can fully replace mock behavior.

## Current Task

Connect frontend to real backend APIs.

## Environment

- Hono.js
- Drizzle ORM
- Neon PostgreSQL
- Bun
- Cloudflare Workers

## Completed

- [x] Assessment requirements captured in context files.
- [x] Current frontend stack documented as TanStack Start/TanStack Router.
- [x] UI structure analyzed and documented.
- [x] Required routes exist in the frontend.
- [x] Frontend UI completed across all 5 required pages.
- [x] Backend scaffold initialized with Hono, Drizzle, Neon, and Cloudflare Workers config.
- [x] Shared UI shell exists through `Navbar` and `PageShell`.
- [x] shadcn-style UI primitives exist under `frontend/src/components/ui`.
- [x] Mock `/login` page exists.
- [x] Mock `/register` page exists.
- [x] Mock `/notes/new` page exists.
- [x] Mock `/notes` list page exists for showing all user notes.
- [x] Mock `/notes/$id` page exists.
- [x] Mock `/share/$token` page exists with required demo states.
- [x] Root `AGENTS.md` and canonical `.agents/` files added.
- [x] Tailwind IntelliSense canonical-class suggestions fixed for pasted UI diagnostics.
- [x] Backend auth service added for register, login, JWT creation, and user lookup.
- [x] Prisma 7 datasource config fixed and Prisma client generated.
- [x] Prisma schema added for User, Note, ShareLink, ShareType, and AccessType.
- [x] Initial database migration created and applied to PostgreSQL/Neon.
- [x] Backend note service added for create, owner lookup, and user note listing.
- [x] Backend share service added for secure token creation, public/password access, revoke, atomic one-time consumption, and view counts.
- [x] Protected backend note routes added for create, owner fetch, share-link creation, and revoke.
- [x] Backend Hono entrypoint configured with CORS, mounted routers, global error handling, and Node server startup.

## Known Working Endpoints

- `GET /health` returns backend health status.
- `POST /notes` creates a note for the authenticated user.
- `GET /notes/:id` returns an owned note with share links.
- `POST /notes/:id/share` creates a secure share link and returns the raw access key when password-protected.
- `POST /notes/:id/revoke` revokes a share link owned by the authenticated user.

These protected endpoints require `Authorization: Bearer <token>`.

## Pending Frontend Work

- [ ] Replace mock auth with backend-backed auth.
- [ ] Replace mock note creation with API calls.
- [ ] Replace client-side token/key generation with backend-generated secure values.
- [ ] Replace mock note detail data with API data.
- [ ] Replace demo share state switcher with real backend responses, or keep only behind an explicit demo/dev mode.
- [ ] Fix mojibake characters in rendered text, including broken dash, bullet, and middle-dot sequences.
- [ ] Confirm final responsive behavior after backend wiring.

## Pending Backend Work

- [x] Configure backend TypeScript/Hono project.
- [x] Configure PostgreSQL.
- [x] Choose and configure Prisma or Drizzle.
- [ ] Add user model and auth routes.
- [x] Hash user passwords.
- [x] Add note model and note routes.
- [x] Add share-link model.
- [x] Generate cryptographically secure share tokens.
- [x] Hash share tokens before storing.
- [x] Generate and hash password-protected access keys.
- [x] Implement public share access.
- [x] Implement password-protected unlock.
- [x] Implement expired, revoked, invalid, and already-used responses.
- [x] Implement atomic one-time link consumption.
- [x] Implement safe view count increments.
- [ ] Implement brute-force protection/rate limiting.

## Pending README Work

- [ ] Setup instructions.
- [ ] Tech stack.
- [ ] Environment variables.
- [ ] Database schema.
- [ ] Share link flow.
- [ ] Password/key generation logic.
- [ ] Expiry logic.
- [ ] Revoke logic.
- [ ] View count logic.
- [ ] Race-condition handling.
- [ ] Scaling answer for 1 million opens.
- [ ] Brute-force prevention answer.
- [ ] Test credentials.

## Pending Demo Checklist

- [ ] Note creation.
- [ ] Share link generation.
- [ ] Public share link flow.
- [ ] Password-protected share link flow.
- [ ] Dynamic password/key generation.
- [ ] Wrong password case.
- [ ] One-time expiry case.
- [ ] Time-based expiry case.
- [ ] Force invalidate case.
- [ ] View count update.
