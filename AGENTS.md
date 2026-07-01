# AGENTS.md

This file is the entry point for AI agents and coding assistants working on the Note-Sharing-App assessment.

## Mandatory Context

Before making code changes, read these files in order:

1. `.agents/project-overview.md`
2. `.agents/architecture-context.md`
3. `.agents/code-standards.md`
4. `.agents/ui-context.md`
5. `.agents/progress-tracker.md`

For UI work, also read:

- `.agents/feature-spec/01-design-system.md`

## Project Direction

Build a simple, secure note-sharing assessment app with expiring share links.

The current frontend is a TanStack Start app using TanStack Router, React, TypeScript, Tailwind CSS v4, shadcn-style components, Radix UI primitives, lucide-react icons, and sonner toasts.

The backend folder is currently only scaffolded and still needs the actual Hono/API/database implementation.

## Hard Rules

- Match the existing project structure before adding new patterns.
- Keep the app assessment-focused and easy to explain.
- Do not replace the current frontend stack with Next.js unless the user explicitly asks.
- Do not rely on frontend-only state for security behavior.
- Never expose note content before access is confirmed.
- Hash user passwords, share tokens, and generated share passwords/access keys on the backend.
- Use atomic database updates or transactions for one-time link consumption and view count updates.
- Update `.agents/progress-tracker.md` after meaningful work.

## Verification

Run available checks before finishing when practical:

- Frontend: `npm run lint`, `npm run build`
- Backend: the relevant test/build command once backend tooling exists
