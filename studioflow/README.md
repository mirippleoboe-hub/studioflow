# StudioFlow MVP

Phase 1 and Phase 2 foundation for a studio management SaaS for music teachers.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style components
- Supabase Auth
- PostgreSQL with Row Level Security

## Quick Start

1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project.
3. Run the migration in `supabase/migrations/0001_phase_1_foundation.sql`.
4. Install dependencies with `npm install`.
5. Start the app with `npm run dev`.

## Implemented Scope

Included:

- Teacher and student signup/login using Supabase Auth.
- Profile creation from Supabase Auth metadata.
- Teacher studio creation with invite code generation.
- Student studio joining via invite code.
- Teacher student roster management.
- Student-specific invite codes.
- Add existing student accounts by email.
- Student search, filtering, profile pages, and removal.
- Lesson note schema, editor, teacher note pages, and student lesson history.
- Studio Hub page builder with Notion-style blocks.
- RLS-protected tables for profiles, studios, and memberships.
- Role-aware app shell and dashboard placeholders.

Deferred:

- Assignment creation and submissions.
- Standalone resource library content.
- Messaging and announcements CRUD.
- Calendar integrations.

## Important Files

- `supabase/migrations/0001_phase_1_foundation.sql`: schema, functions, triggers, and RLS.
- `supabase/migrations/0002_student_management.sql`: student invites, roster RPCs, and invite RLS.
- `supabase/migrations/0003_lesson_notes.sql`: lesson note schema, RLS, and secure note RPCs.
- `supabase/migrations/0004_studio_hub.sql`: studio hub schema, RLS, and page-builder save RPC.
- `src/middleware.ts`: Supabase session refresh and route protection.
- `src/app/(auth)`: login and signup screens.
- `src/app/onboarding`: teacher studio creation and student invite join.
- `src/app/(app)`: authenticated role-aware application shell, dashboards, student management, lesson notes, and Studio Hub.
