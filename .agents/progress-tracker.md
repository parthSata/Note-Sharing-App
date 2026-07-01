# Progress Tracker

Keep this file honest. Mark only completed work as complete.

## Current Status

Frontend UI is complete across all 5 required pages. Backend scaffold and Drizzle schema setup are now started. Backend implementation, real authentication, secure share-link logic, and README still need substantial work.

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

## Pending Frontend Work

- [ ] Replace mock auth with backend-backed auth.
- [ ] Replace mock note creation with API calls.
- [ ] Replace client-side token/key generation with backend-generated secure values.
- [ ] Replace mock note detail data with API data.
- [ ] Replace demo share state switcher with real backend responses, or keep only behind an explicit demo/dev mode.
- [ ] Fix mojibake characters in rendered text, including broken dash, bullet, and middle-dot sequences.
- [ ] Confirm final responsive behavior after backend wiring.

## Pending Backend Work

- [ ] Configure backend TypeScript/Hono project.
- [ ] Configure PostgreSQL.
- [ ] Choose and configure Prisma or Drizzle.
- [ ] Add user model and auth routes.
- [ ] Hash user passwords.
- [ ] Add note model and note routes.
- [ ] Add share-link model.
- [ ] Generate cryptographically secure share tokens.
- [ ] Hash share tokens before storing.
- [ ] Generate and hash password-protected access keys.
- [ ] Implement public share access.
- [ ] Implement password-protected unlock.
- [ ] Implement expired, revoked, invalid, and already-used responses.
- [ ] Implement atomic one-time link consumption.
- [ ] Implement safe view count increments.
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
