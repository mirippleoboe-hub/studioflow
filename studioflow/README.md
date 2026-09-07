# StudioFlow MVP

A music studio management app with teacher/student accounts, studio invitations, student rosters, lesson notes, a customizable Studio Hub, messaging, scheduling, and private materials.

## Architecture

Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, and shadcn-style components. Server Actions call Supabase Auth and PostgreSQL functions. Row Level Security enforces studio membership and teacher/student access. All database requests use the signed-in user's session; no service-role key is needed by this application.

The repository contains an outer folder and this inner `studioflow` app folder. Run the commands below from the folder containing this README and `package.json`.

## Local setup

Install Node.js 22 or newer, including npm. Then:

```sh
npm ci
cp .env.example .env.local
```

On Windows Command Prompt, use `copy .env.example .env.local` instead.

Set these values in `.env.local`:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Alternative for projects using the legacy anon key; leave blank when using a publishable key |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally; your actual site origin on Vercel, without a trailing slash |

Use only public/publishable keys in `NEXT_PUBLIC_*` variables. Do not put a service-role or secret key there. Keep `.env.local` out of Git.

Without Supabase configuration, the app shows a setup screen. This is not a demo or an authenticated workspace.

## Database setup

In your Supabase project's SQL editor, apply every migration in filename order to a new database. Migrations `0001`–`0004` create the core studio, roster, lesson-note, and Studio Hub features. Migrations `0005`–`0008` add communication, private storage, refined scheduling, assignments, and announcements.

1. `supabase/migrations/0001_phase_1_foundation.sql`
2. `supabase/migrations/0002_student_management.sql`
3. `supabase/migrations/0003_lesson_notes.sql`
4. `supabase/migrations/0004_studio_hub.sql`

For an existing database, inspect its migration history and apply only missing migrations. These repairs do not require resetting the database or deleting existing records.

The first migration installs the trigger that creates profiles for new Auth users. If an account was created before this migration, an administrator must check and repair that account's missing profile, preserving its intended teacher/student role. The app shows an account error screen rather than looping between login and dashboard.

## Authentication

In Supabase Auth URL Configuration, set the Site URL and allow these redirect URLs:

- `http://localhost:3000/auth/callback`
- `https://YOUR-VERCEL-DOMAIN/auth/callback`

Use the exact callback URL for any preview deployment you test, and set its `NEXT_PUBLIC_SITE_URL` accordingly. New signups receive an email confirmation when confirmation is enabled. Open that email in the same browser used to sign up, then sign in. When confirmation is disabled, signup continues directly to onboarding.

Supabase SSR reference: https://supabase.com/docs/guides/auth/server-side/creating-a-client

## Run and verify

```sh
npm run dev
```

Open http://localhost:3000. If this Mac reports `EMFILE: too many open files, watch`, start with `WATCHPACK_POLLING=true npm run dev` instead. For a production build:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

The database test runs the migrations in an isolated, in-memory PostgreSQL instance. It checks studio creation, invitation redemption, teacher lesson notes, student edits, unpublished hub visibility, cross-studio isolation, and removed-student access. It stubs Supabase Auth identity and skips the pgcrypto extension declaration because UUID generation is built in. It does not replace hosted Auth, email, or PostgREST testing.

Manual hosted checks still required:

1. Create and confirm a teacher account; create a studio.
2. Create and confirm a student account in a separate browser session; redeem an invitation.
3. Save a teacher lesson note and edit the student notes as that student.
4. Save a draft Studio Hub; verify it stays hidden from students, then publish it.
5. Sign out and sign back in; confirm the saved work remains.

## Vercel

- Repository: `mirippleoboe-hub/studioflow`
- **Root Directory: `studioflow`**
- Framework preset: **Next.js**
- Node.js: **22.x or newer supported version**
- Install command: `npm ci`
- Build command: `npm run build`
- Output Directory: leave at the Next.js default; do not override with a static folder.
- Add the environment variables above to each intended environment before building.
- Redeploy after changing environment variables; public variables are included at build time.

The dependency lockfile makes installs repeatable. Supabase SSR and JS versions are aligned. A narrow PostCSS override keeps Next.js 15 while using a patched CSS processor.

## Visual direction

Neutral surfaces, charcoal primary actions, subtle borders, no card shadows, generous spacing, and restrained headings. The existing layout and features are preserved.

## Teacher personalization

Teachers can open Settings → Personalize your workspace to choose a color palette and reorder their sidebar. The page previews unsaved changes; Save preferences applies them, Cancel changes restores the last save, and Reset to default prepares the original colors/order for saving.

Preferences are stored per account in Supabase Auth user metadata under `studioflow_personalization`, containing a `palette` identifier and `menuOrder` array. No schema migration or extra environment variable is required. Server rendering reads and normalizes the metadata; unknown menu entries are removed and missing entries restored. Authorization continues to use the database profile, never personalization metadata. Student navigation and colors are unchanged.

Verification: as a teacher, choose Forest, move Lessons first, save, and reload. Check the sidebar and another page retain both choices. Cancel an unsaved change and test Reset to default followed by Save. Student accounts should redirect away from `/settings/personalization` and cannot invoke its save action.

## Profiles, messaging, calendar and materials

Apply `0005_communication_calendar_materials.sql`, `0006_private_storage.sql`, and `0007_refined_scheduling.sql` after the first four migrations. Migration 0006 creates private Supabase Storage buckets and object policies. Do not make either bucket public. Migration 0007 preserves existing events while adding event types, weekly availability, recurring lesson series, and student booking requests. No new environment variables are required.

- Both roles: Edit profile under the account name uploads a cropped 384px photo (JPG/PNG/WebP input up to 2 MB). Images are available to studio peers through signed URLs.
- Messages: direct teacher/student conversations inside the same active studio. Last 100 messages, 15-second refresh while visible, and read receipts. No email notifications or group chat.
- Scheduling: month grid and agenda, lessons/studio events/unavailable blocks, weekly series of up to 24 events, teacher availability, student lesson requests, teacher approval or decline, time-zone-safe display, student-specific visibility, and overlap rejection within a studio. External calendar sync is not included.
- Assignments: teachers create and edit current or archived assignments for one active student or the whole studio, with optional instructions and due dates. Students see only studio-wide work and work assigned directly to them.
- Announcements: teachers post, edit, expire, and remove studio-wide dashboard announcements. Active studio members can read current announcements.
- Materials: private uploads up to 20 MB, explicit sharing with current studio members, authenticated downloads, and removal. New teacher menu entries are appended without resetting existing personalization. Student navigation includes Messages and Materials.
- Cloud providers: implementation and operator credential setup in [cloud-storage-setup.md](docs/cloud-storage-setup.md). These are separate from ChatGPT's connectors. Optional integrations remain disabled until configured.

Validation includes RLS/column-permission tests for message spoofing, student event writes, outsiders, private/shared files, avatar updates, and cloud token isolation. Hosted tests still require signed-in teacher and student accounts; external provider connections require the credentials above.
