# Note Sharing App

Live demo: https://note-sharing-app-nyde.vercel.app/

This is a secure note-sharing assessment app. A signed-in user can create a note, generate a share link, and control how that link behaves using expiry rules, one-time access, and optional password protection.

## Overview

The project is split into two parts:

- `client/` - Next.js frontend for authentication, note creation, note management, and public share access.
- `backend/` - Hono-based API, database access, validation, and share-link business logic.

The app is designed to be easy to explain in an interview: the frontend handles UI only, while the backend owns security decisions such as token validation, password checks, link expiry, revocation, and view counting.

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS v4
- shadcn/ui style components
- Radix UI primitives
- lucide-react icons
- sonner for toast notifications
- Hono.js backend
- Prisma ORM
- PostgreSQL / Neon
- Cloudflare Workers and Vercel deployment support

## Features

- Register and log in users
- Create notes with title, content, expiry, share type, and access type
- Generate secure share links from the backend
- Create public or password-protected shares
- Support one-time and time-based links
- Revoke active share links
- View shared notes through a public token route
- Show accurate view counts after successful access only
- Block invalid, expired, revoked, or already-used links

## How It Works

1. A user logs in and creates a note.
2. The backend generates a cryptographically secure share token.
3. Only the hash of that token is stored in the database.
4. If the link is password-protected, the backend also generates a secure access key and stores only its hash.
5. The frontend receives the raw share URL and raw access key once, then displays them to the user.
6. When someone opens the share URL, the backend validates the token, expiry, revocation state, and access type before returning note content.
7. For one-time links, the backend consumes the link atomically so two requests cannot both succeed.

## Database Model

The backend stores three main entities:

- User: account identity and password hash
- Note: note title, content, owner, and timestamps
- ShareLink: token hash, share type, access type, password hash, expiry, revocation state, consumption state, failed attempts, and view count

Important security rule: the app never stores raw share tokens or raw generated passwords/access keys in the database.

## Environment Variables

Frontend:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8787
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

Backend:

Set the database and auth values required by the API runtime. The exact names depend on the deployment target, but the backend expects PostgreSQL connection details and a JWT secret.

## Local Setup

### 1. Install dependencies

Run this in each folder:

```bash
cd client
npm install

cd ../backend
npm install
```

### 2. Start the backend

```bash
cd backend
npx wrangler dev
```

### 3. Start the frontend

```bash
cd client
npm run dev
```

Open the frontend in your browser, then sign up and create notes.

## Useful Scripts

Frontend:

```bash
npm run dev
npm run build
npm run lint
```

Backend:

```bash
npm run dev
npm run build
```

## Share Link Rules

- Public links can be opened directly if they are valid and active.
- Password-protected links must be unlocked with the generated key.
- Expired links return an expired state.
- Revoked links return a revoked state.
- One-time links stop working after the first successful access.
- View count increases only after a successful access event.

## Race-Condition Handling

One-time links are consumed with an atomic update or transaction. That means if two users open the same one-time link at nearly the same time, only one request can mark the link as used and receive the content.

## Brute-Force Protection

Password-protected shares should be rate-limited on the backend. A practical setup is to track failed unlock attempts per token and slow or block repeated guesses after a threshold.

## Scaling Notes

For a high-traffic link, the backend should:

- Index the token hash column
- Keep token lookup to a single fast query when possible
- Use atomic updates for view counts and one-time consumption
- Cache only non-sensitive metadata if needed
- Push brute-force throttling into Redis or a similar rate-limit store

If this app ever had 1 million opens, the important rule would be to keep the access check cheap, keep content protected behind the backend, and avoid turning view counting into a separate fragile process.

## Test Credentials

No default test account is shipped with the repo. Create a new account from the register page, then use that account to create notes and test share links.

## Deployment

The current hosted frontend is available at:

https://note-sharing-app-nyde.vercel.app/

The frontend reads the API base URL from `NEXT_PUBLIC_API_URL`, so you can point it at the local backend during development or a production backend when deployed.

## Project Structure

```txt
client/
  app/
  components/
  hooks/
  lib/
backend/
  src/
  prisma/
```

## Notes

- The frontend keeps UI state in the browser, but security-sensitive decisions always happen on the backend.
- Raw share tokens and access keys are shown only once when they are created.
- Note content is never exposed before access is confirmed.
