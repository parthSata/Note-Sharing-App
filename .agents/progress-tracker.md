# Progress Tracker

Keep this file honest. Mark only completed work as complete.

## Current Status

Frontend UI is complete across all 5 required pages and is wired to backend APIs for auth, notes, share-link creation, note management, and public share access. Backend schema, Neon/PostgreSQL migration, Worker-safe SQL services, protected note routes, public share routes, share-link business logic, main Hono entrypoint, and backend auth routes are now in place.

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
- [x] Next.js `client/` scaffold created on explicit request as a separate sibling app.
- [x] UI structure analyzed and documented.
- [x] Required routes exist in the frontend.
- [x] Frontend UI completed across all 5 required pages.
- [x] Backend scaffold initialized with Hono, Drizzle, Neon, and Cloudflare Workers config.
- [x] Shared UI shell exists through `Navbar` and `PageShell`.
- [x] shadcn-style UI primitives exist under `frontend/src/components/ui`.
- [x] Backend-backed `/login` page exists.
- [x] Backend-backed `/register` page exists.
- [x] Backend-backed `/notes/new` page exists.
- [x] Backend-backed `/notes` list page exists for showing all user notes.
- [x] Backend-backed `/notes/$id` page exists.
- [x] Backend-backed `/share/$token` page exists with required API states.
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
- [x] Backend Worker entrypoint updated to avoid Node server startup during Wrangler dev.
- [x] Backend auth routes added for register, login, current user, and logout.
- [x] Frontend auth client defaults to the local Wrangler backend when `VITE_API_URL` is not set.
- [x] Note and share services moved off Prisma/Node-only runtime paths for Wrangler local Worker compatibility.
- [x] Time-based share view counts are deduplicated per browser session so refresh does not inflate views.
- [x] Vercel backend API entrypoint configured for the generic Node.js runtime.
- [x] Backend env access supports Vercel Node.js `process.env` as well as Worker bindings.
- [x] Frontend Vercel build configured for Nitro's Vercel preset output.
- [x] Backend root and favicon routes return safe API responses on Vercel.
- [x] Backend CORS allowlist corrected for the Vercel frontend origin.
- [x] Backend CORS origin matching now normalizes env-configured frontend URLs.
- [x] Backend Vercel API entrypoint switched to Edge runtime to match the Hono Vercel adapter.
- [x] Backend package scripts simplified for Vercel build/start expectations.
- [x] Backend Vercel config includes Prisma files in the serverless bundle.
- [x] Backend CORS middleware pinned to localhost/Vercel origins and registered before routes.
- [x] Backend explicit OPTIONS preflight handler added after CORS middleware.
- [x] Next.js `client/` page/component imports reviewed and build-breaking issues fixed.
- [x] Backend CORS allowlist updated for local Next.js client origins on port 3000.
- [x] Backend CORS preflight handling verified for `http://localhost:3000`.
- [x] Next.js `client/` Navbar hydration mismatch fixed by deferring localStorage user reads to client snapshots.
- [x] Next.js `client/` note detail page shows the generated share/view URL after note creation.
- [x] Next.js `client/` share URLs normalized to the current browser origin so local links use port 3000.
- [x] Next.js `client/` deployment config added for hosting instead of the old `frontend/` project.
- [x] Next.js `client/` note detail page now keeps generated share URLs visible from browser cache and shows a clear secure fallback when an older raw URL is unavailable.

## Known Working Endpoints

- `GET /health` returns backend health status.
- `POST /auth/register` creates a user and returns a JWT plus public user object.
- `POST /auth/login` validates credentials and returns a JWT plus public user object.
- `GET /auth/me` returns the authenticated user.
- `POST /auth/logout` returns success for client-side logout.
- `GET /notes` returns notes owned by the authenticated user with share-link summaries.
- `POST /notes` creates a note for the authenticated user.
- `GET /notes/:id` returns an owned note with share links.
- `POST /notes/:id/share` creates a secure share link and returns the raw access key when password-protected.
- `POST /notes/:id/revoke` revokes a share link owned by the authenticated user.
- `GET /share/:token` resolves public share links or password-required metadata.
- `POST /share/:token/unlock` unlocks password-protected share links.

These protected endpoints require `Authorization: Bearer <token>`.

## Pending Frontend Work

- [x] Replace mock auth with backend-backed auth.
- [x] Replace mock note creation with API calls.
- [x] Replace client-side token/key generation with backend-generated secure values.
- [x] Replace mock note list data with API data.
- [x] Replace mock note detail data with API data.
- [x] Replace demo share state switcher with real backend responses.
- [ ] Fix mojibake characters in rendered text, including broken dash, bullet, and middle-dot sequences.
- [ ] Confirm final responsive behavior after backend wiring.

## Pending Backend Work

- [x] Configure backend TypeScript/Hono project.
- [x] Configure PostgreSQL.
- [x] Choose and configure Prisma or Drizzle.
- [x] Add user model and auth routes.
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
