# Code Standards

## General

- Use TypeScript for frontend and backend code.
- Prefer clear, explainable code over clever abstractions.
- Keep assessment domain rules explicit.
- Validate all request bodies on the backend.
- Keep frontend state for UI only; security decisions belong on the backend.

## Frontend

- Follow existing TanStack Router route patterns.
- Use existing `@/components/ui/*` primitives before creating new primitives.
- Use `PageShell` and `Navbar` when a page should match the app layout.
- Use visible labels for all form fields.
- Use loading, success, empty, and error states where the user can act.
- Do not store generated share passwords/access keys in `localStorage`.
- Do not expose note content in `/share/$token` before backend confirms access.

## Backend

- Keep validation near route boundaries.
- Keep share-link business rules in a service/helper layer.
- Return consistent error objects:

```json
{
  "error": {
    "code": "EXPIRED_LINK",
    "message": "This share link has expired."
  }
}
```

Recommended error codes:

- `INVALID_CREDENTIALS`
- `UNAUTHORIZED`
- `VALIDATION_ERROR`
- `INVALID_SHARE_LINK`
- `PASSWORD_REQUIRED`
- `WRONG_PASSWORD`
- `EXPIRED_LINK`
- `REVOKED_LINK`
- `ONE_TIME_LINK_USED`
- `RATE_LIMITED`

## Security

- Hash user passwords with a strong password hashing algorithm.
- Hash generated share passwords/access keys.
- Hash share tokens.
- Generate tokens and keys with cryptographically secure randomness.
- Never expose internal database IDs in share URLs.
- Never return another user's note through owner endpoints.
- Rate-limit password-protected unlock attempts.
- Use transactions or atomic updates for one-time link consumption.
- Increment `viewCount` only after successful access.

## Naming

- React components and TypeScript types: `PascalCase`
- Variables and functions: `camelCase`
- Database enum values may use `UPPER_CASE`
- Prefer names like `expiresAt`, `revokedAt`, `consumedAt`, `viewCount`, `tokenHash`, and `passwordHash`.

## Verification

Before finishing meaningful changes:

- Run frontend lint/build when frontend code changes.
- Run backend tests/build once backend tooling exists.
- Manually check affected required edge cases.
- Update `.agents/progress-tracker.md`.
