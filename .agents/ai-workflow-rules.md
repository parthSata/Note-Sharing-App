# AI Workflow Rules

## Before Editing

1. Read root `AGENTS.md`.
2. Read the relevant files in `.agents/`.
3. Inspect the existing code that will be affected.
4. Check `.agents/progress-tracker.md`.

## Implementation Style

- Make one focused change at a time.
- Prefer existing project patterns.
- Avoid unused dependencies.
- Do not add unrelated features.
- Keep the app demoable and interview-friendly.

## Frontend Workflow

- Keep the TanStack Start/TanStack Router stack intact.
- Use route files under `frontend/src/routes`.
- Use `PageShell`, `Navbar`, Tailwind utilities, and existing UI primitives.
- Make required states visible and testable.
- Remove mock-only behavior only when replacing it with backend-backed behavior.

## Backend Workflow

- Define database schema before API behavior depends on it.
- Add validation.
- Implement share-link rules in backend services.
- Return clear error codes/messages.
- Protect one-time links and view counts with atomic database operations.

## Do Not

- Do not trust client-side expiry, revoke, password, or one-time checks.
- Do not store raw tokens or raw generated access keys.
- Do not increment view count for failed access.
- Do not hide assessment-critical states from the UI.
- Do not leave context files stale after changing architecture.
