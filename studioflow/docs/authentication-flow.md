# Authentication Flow

## Signup

1. A user creates an account at `/signup`.
2. The form writes `full_name` and `role` into Supabase Auth user metadata.
3. The `on_auth_user_created` trigger inserts a matching row into `public.profiles`.
4. The user signs in at `/login`.

## Login

1. `/login` calls Supabase `signInWithPassword`.
2. `src/middleware.ts` refreshes Supabase SSR cookies.
3. Authenticated users are sent to `/dashboard`.
4. `requireAppContext()` checks whether the user has a studio membership.

## Teacher Onboarding

1. A teacher without a membership is redirected to `/onboarding/teacher`.
2. The teacher enters a studio name.
3. `create_studio_with_owner()` verifies the authenticated profile is a teacher.
4. The function creates a studio and owner membership atomically.
5. The teacher reaches `/dashboard` and can share the studio invite code.

## Student Onboarding

1. A student without a membership is redirected to `/onboarding/student`.
2. The student enters a teacher-provided student invite code or studio code.
3. `redeem_student_invite()` first checks for a student-specific invite.
4. If no student invite is found, `join_studio_by_invite()` checks the studio-level code.
5. The matching function creates the student membership.
6. The student reaches the student dashboard.

## Teacher Student Management

1. Teachers use `/students` to view active students and pending invites.
2. `create_student_invite()` creates a student-specific code that can optionally be tied to an email.
3. `add_student_by_email()` adds an existing student account directly to the studio.
4. `remove_student_from_studio()` removes active student memberships.
5. `revoke_student_invite()` revokes pending invites.

## Sign Out

The app shell posts to `signOutAction()`, which calls Supabase `signOut()` and redirects to `/login`.
