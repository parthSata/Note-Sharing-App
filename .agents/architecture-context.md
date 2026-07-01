# Architecture Context

## Existing Frontend Shape

```txt
frontend/
  src/
    components/
      Navbar.tsx
      PageShell.tsx
      ui/
    hooks/
    lib/
      mock-auth.ts
      utils.ts
    routes/
      __root.tsx
      index.tsx
      login.tsx
      register.tsx
      notes.new.tsx
      notes.$id.tsx
      share.$token.tsx
    router.tsx
    server.ts
    start.ts
    styles.css
```

The app uses TanStack Router file routes. Route files export `Route = createFileRoute(...)`.

Global document shell, `QueryClientProvider`, `Outlet`, `Toaster`, error handling, and stylesheet loading live in `frontend/src/routes/__root.tsx`.

Shared layout lives in:

- `frontend/src/components/Navbar.tsx`
- `frontend/src/components/PageShell.tsx`

UI primitives live in `frontend/src/components/ui`, following shadcn/Radix conventions.

## Current UI Behavior

The frontend is currently a polished mock/demo:

- Auth uses `frontend/src/lib/mock-auth.ts` and `localStorage`.
- Note creation generates client-side mock tokens and keys.
- Note detail displays mock note data and simulated view count.
- Share page has a demo state switcher and a mock password of `OPEN`.

These are useful for frontend demonstration only. They are not secure or production backend behavior.

## Target Backend Shape

Recommended structure:

```txt
backend/
  src/
    index.ts
    routes/
      auth.ts
      notes.ts
      share.ts
    services/
      auth-service.ts
      note-service.ts
      share-service.ts
    db/
    utils/
      crypto.ts
      errors.ts
      validation.ts
  prisma/ 
```

## Domain Model

### User

- `id`
- `email`
- `passwordHash`
- `createdAt`
- `updatedAt`

### Note

- `id`
- `userId`
- `title`
- `content`
- `createdAt`
- `updatedAt`

### Share Link

- `id`
- `noteId`
- `tokenHash`
- `shareType`: `ONE_TIME` or `TIME_BASED`
- `accessType`: `PUBLIC` or `PASSWORD`
- `passwordHash`: nullable
- `expiresAt`
- `revokedAt`: nullable
- `consumedAt`: nullable
- `viewCount`
- `failedAttempts`
- `lastFailedAttemptAt`: nullable
- `createdAt`
- `updatedAt`

Store only hashes of share tokens and generated passwords/access keys. The raw token and raw key should be returned only once after creation.

## API Contract

Recommended endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `POST /notes`
- `GET /notes/:id`
- `POST /notes/:id/revoke`
- `GET /share/:token`
- `POST /share/:token/unlock`

For password-protected links, `GET /share/:token` may return `PASSWORD_REQUIRED` metadata but must not return note content.

## Access Flow

1. Authenticated user creates a note.
2. Backend generates a cryptographically secure raw share token.
3. Backend stores only `tokenHash`.
4. If password-protected, backend generates a cryptographically secure key and stores only its hash.
5. Backend returns the raw share URL and raw key once.
6. Frontend displays copyable URL and key.

## One-Time Race Handling

One-time links must be consumed atomically.

Use a transaction or conditional update that requires:

- matching `tokenHash`
- `consumedAt IS NULL`
- `revokedAt IS NULL`
- `expiresAt > now()`

Set `consumedAt` and increment `viewCount` in the same successful operation. If no row updates, return already-used, expired, or revoked without revealing content.

## Scaling Notes

- Index `tokenHash`.
- Keep share checks single-query where possible.
- Use atomic increments for exact counts.
- Use Redis or a similar store for rate limiting unlock attempts.
- For very high read volume, cache non-sensitive metadata and keep content access behind backend validation.
- If exact real-time view count becomes expensive, separate analytics from access control.

