# UI Context

## Current UI Structure

The UI is a TanStack Start React app with file-based TanStack Router routes.

Key files:

- `frontend/src/routes/__root.tsx`: root shell, query client, global toaster, error and not-found UI.
- `frontend/src/routes/index.tsx`: current product entry/landing page with feature cards.
- `frontend/src/routes/login.tsx`: centered auth card.
- `frontend/src/routes/register.tsx`: centered auth card.
- `frontend/src/routes/notes.new.tsx`: note creation form and post-create share output.
- `frontend/src/routes/notes.$id.tsx`: note owner detail page with share metadata, view count, and revoke action.
- `frontend/src/routes/share.$token.tsx`: public share page with loading, locked, unlocked, expired, revoked, used, and invalid API-driven states.
- `frontend/src/components/Navbar.tsx`: sticky top navigation with auth-aware actions.
- `frontend/src/components/PageShell.tsx`: shared max-width layout and footer.
- `frontend/src/styles.css`: Tailwind v4 theme tokens, custom utilities, and animations.

## Visual Direction

Current visual language:

- Light, clean, security-focused interface.
- Indigo primary gradient (`gradient-primary`) with restrained accent surfaces.
- Rounded cards and controls.
- Subtle shadows: `shadow-soft`, `shadow-elegant`, `shadow-glow`.
- Simple entrance animations: fade, scale, slide, shake.
- lucide-react icons for feature and action affordances.

Keep the UI professional and assessment-focused. Do not turn it into a large dashboard or marketing-heavy site.

## Required Pages

### `/login`

Purpose: authenticate a user.

Keep:

- Email and password fields.
- Visible labels.
- Loading state.
- Specific validation/auth errors.
- Link to register.

### `/register`

Purpose: create a user account.

Keep:

- Email, password, and confirm password fields.
- Visible validation.
- Loading state.
- Link to login.

### `/notes/new`

Purpose: create a note and generate share details.

Required fields:

- Title
- Content
- Expiry date/time
- Share type: one-time or time-based
- Access type: public or password-protected

After successful creation:

- Show share URL.
- Show generated access key only for password-protected links.
- Provide copy actions.
- Link to note detail/manage page.

### `/notes/$id`

Purpose: note owner management.

Display:

- Title and content.
- Share URL.
- Share type.
- Access type.
- Expiry time.
- Revoked/active/used/expired state.
- View count.

Action:

- Revoke share link.

Do not re-show generated access keys unless backend intentionally supports it.

### `/share/$token`

Purpose: public-facing shared note view.

Required states:

- Loading
- Password required
- Wrong password/key
- Invalid link
- Expired link
- Revoked link
- One-time link already used
- Successfully unlocked note

Never show note title or content before access is confirmed.

## Component Guidance

- Prefer existing `frontend/src/components/ui` primitives.
- Use `Button` with lucide icons for actions like copy, revoke, unlock, and create.
- Use `Input`, `Textarea`, `Label`, `Card`, `Badge`, `Skeleton`, and dialogs from the existing UI folder.
- Keep button text and icon layouts from the current code unless there is a usability reason to change them.
- Keep error messages near the relevant form.

## Demo-Friendly Requirements

The UI should make these easy to demonstrate:

- Public share link opens after backend validation.
- Password-protected link asks for the generated key.
- Wrong key shows an error and does not increment view count.
- One-time link fails after first successful access.
- Time-based link fails after expiry.
- Revoke button invalidates the link.
- Note detail page shows view count.
