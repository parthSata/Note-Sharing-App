# Project Overview

## Assessment

PERN/MERN-style developer POC: build a note-sharing app with secure expiring share links.

AI assistance is allowed, but the final app must be easy for the developer to explain, modify, and defend in an interview.

## Current Repository

```txt
Note-Sharing-App/
  AGENTS.md
  .agents/
  .agents/
  frontend/
  backend/
```

## Current Frontend Stack

- TanStack Start
- TanStack Router file routes
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn-style component structure in `frontend/src/components/ui`
- Radix UI primitives
- lucide-react icons
- sonner toasts

Do not describe this app as a Next.js App Router app unless the stack is intentionally migrated.

## Current Backend Status

`backend/` currently contains only a minimal `package.json`. The API, database, auth, ORM, and business logic still need to be implemented.

Recommended backend stack for the assessment:

- Hono.js
- PostgreSQL
- Prisma or Drizzle
- TypeScript
- Cookie session or JWT auth

## Product Goal

A logged-in user can create a note and generate a share link with:

- Title
- Content
- Expiry date/time
- Share type: one-time or time-based
- Access type: public or password-protected

The share link allows another person to access the note only when the backend confirms the token is valid and the access rules are satisfied.

## Required Pages

Current TanStack route equivalents:

- `/register` in `frontend/src/routes/register.tsx`
- `/login` in `frontend/src/routes/login.tsx`
- `/notes/new` in `frontend/src/routes/notes.new.tsx`
- `/notes/$id` in `frontend/src/routes/notes.$id.tsx`
- `/share/$token` in `frontend/src/routes/share.$token.tsx`

## Required Edge Cases

- Invalid share link
- Public share link access
- Password-protected share link access
- Wrong password/key
- Expired share link
- One-time link already used
- Revoked share link
- Multiple users opening a one-time link at the same time
- Accurate view count update

## View Count Rules

Increase view count only after successful access:

- Public successful view
- Successful password unlock

Do not increment view count for:

- Invalid token
- Wrong password/key
- Expired link
- Revoked link
- Already-used one-time link

## README Must Explain

- Setup instructions
- Tech stack
- Database schema
- Share link flow
- Password/key generation
- Expiry logic
- Revoke/invalidate logic
- View count logic
- Race-condition handling
- Scaling answer for 1 million opens
- Brute-force prevention for password-protected links
- Test credentials
