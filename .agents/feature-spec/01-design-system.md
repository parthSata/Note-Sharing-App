# 01 - Design System

This file defines the UI design system for the NoteVault note-sharing assessment.

## Product Tone

The app should feel:

- Secure
- Calm
- Focused
- Practical
- Demo-friendly

Keep the current polished style, but avoid adding complex dashboards, decorative sections, or unrelated product-marketing content.

## Stack

- TanStack Start
- TanStack Router
- React
- TypeScript
- Tailwind CSS v4
- shadcn-style UI components
- Radix UI primitives
- lucide-react icons

## Existing Theme

Defined in `frontend/src/styles.css`.

Important utilities/tokens:

- `gradient-primary`
- `text-gradient`
- `shadow-soft`
- `shadow-elegant`
- `shadow-glow`
- `animate-fade-in`
- `animate-fade-in-up`
- `animate-scale-in`
- `animate-shake`
- `animate-pulse-ring`

Use the semantic Tailwind theme variables already configured:

- `bg-background`
- `text-foreground`
- `bg-card`
- `text-muted-foreground`
- `border-border`
- `bg-primary`
- `text-primary-foreground`
- `bg-accent`
- `text-accent-foreground`
- `text-destructive`
- `text-success`

## Layout

Use `PageShell` for authenticated/product pages that need the standard navbar and centered content.

Use centered auth layouts for login and register:

```tsx
<main className="flex flex-1 items-center justify-center px-6 py-12">
  <Card className="w-full max-w-md p-8">
    ...
  </Card>
</main>
```

Use constrained widths:

- Auth forms: `max-w-md`
- Create note: `PageShell narrow`
- Note detail: `PageShell narrow`
- Share page: `max-w-xl`
- General/product page: `max-w-6xl`

## Forms

All forms should include:

- Visible `Label`
- Accessible `Input` or `Textarea`
- Clear validation error
- Disabled/loading submit state
- Human-readable text

Do not rely only on placeholders.

## Controls

Preferred existing components:

- `Button`
- `Input`
- `Textarea`
- `Label`
- `Card`
- `Badge`
- `Skeleton`
- `AlertDialog`
- `Select` when the choice is a standard dropdown

The current `notes.new.tsx` uses option cards for share/access type. Keep that if preserving the existing UI, or use shadcn `Select` if simplifying during backend wiring.

## Buttons

Use primary gradient buttons for main actions:

- Create note
- Login
- Register
- Unlock note

Use outline buttons for secondary actions:

- Copy share link
- Copy access key
- Back navigation

Use destructive styling only for revoke/invalidate actions.

## Share Page Rules

For `/share/$token`:

- Loading may show skeletons.
- Password-protected links must show an access-key input first.
- Wrong keys show a clear error near the input.
- Invalid, expired, revoked, and used links should have distinct messages.
- Note content appears only after backend-confirmed successful access.

## Copy UI

Use:

- Read-only `Input`
- Copy icon button or icon plus text
- Temporary copied state
- Toast feedback where already used

## Accessibility

- Every input has a label.
- Icon-only buttons need accessible labels or titles.
- Error messages are visible and near the relevant action.
- Status is communicated with text, not color alone.
- Use semantic headings in order.

## Avoid

- Sidebar dashboards unless requested.
- Extra analytics panels unrelated to assessment.
- Heavy decorative hero layouts.
- Storing access keys in local storage.
- Frontend-only security logic as final implementation.

