# Database And RLS

## Tables

`profiles`

- `id`: UUID primary key linked to `auth.users`.
- `email`: unique email from Supabase Auth.
- `full_name`: display name from signup.
- `role`: `teacher` or `student`.
- `created_at`: profile creation timestamp.

`studios`

- `id`: UUID primary key.
- `name`: studio name.
- `owner_id`: teacher profile that owns the studio.
- `invite_code`: unique code students use to join.
- `created_at`: studio creation timestamp.

`studio_memberships`

- `id`: UUID primary key.
- `studio_id`: studio reference.
- `profile_id`: profile reference.
- `role`: `owner`, `teacher`, or `student`.

`student_invites`

- `id`: UUID primary key.
- `studio_id`: studio reference.
- `invited_email`: optional invited student email.
- `invited_name`: invited student display name.
- `invite_code`: unique student-specific invite code.
- `status`: `pending`, `accepted`, `revoked`, or `expired`.
- `created_by`: teacher profile that created the invite.
- `accepted_by`: student profile that redeemed the invite.
- `created_at`, `expires_at`, `accepted_at`, `revoked_at`: invite lifecycle timestamps.

`lesson_notes`

- `id`: UUID primary key.
- `studio_id`: studio reference.
- `student_id`: assigned student profile.
- `teacher_id`: teacher profile that created the note.
- `lesson_date`: lesson date.
- `repertoire`: repertoire covered in the lesson.
- `technique`: technical work from the lesson.
- `teacher_notes`: teacher observations.
- `student_notes`: student reflections or reminders.
- `action_items`: practice actions before the next lesson.
- `created_at`, `updated_at`: note lifecycle timestamps.

`studio_hub_pages`

- `id`: UUID primary key.
- `studio_id`: studio reference with one hub page per studio.
- `title`: page title.
- `blocks`: ordered JSONB array of hub blocks.
- `is_published`: controls student visibility.
- `updated_by`: profile that last saved the hub.
- `created_at`, `updated_at`: page lifecycle timestamps.

## Secure Functions

- `create_studio_with_owner(p_name text)` creates a studio only for authenticated teacher profiles.
- `join_studio_by_invite(p_invite_code text)` lets authenticated student profiles join a studio without exposing studios by invite code.
- `current_profile_role()`, `is_studio_member()`, and `is_studio_owner()` keep RLS policies readable and avoid direct client-side trust.
- `create_student_invite()` creates pending student invites for studio teachers.
- `add_student_by_email()` adds existing student accounts without exposing global profile search.
- `redeem_student_invite()` lets student accounts redeem student-specific invite codes.
- `remove_student_from_studio()` removes only student memberships.
- `revoke_student_invite()` revokes pending invites.
- `create_lesson_note()` creates notes for active students in a teacher's studio.
- `update_lesson_note()` lets studio teachers edit lesson note fields.
- `update_lesson_note_student_notes()` lets assigned active students update only their student notes.
- `delete_lesson_note()` lets studio teachers delete notes.
- `upsert_studio_hub_page()` lets studio teachers save and publish the hub page.

## RLS Policy Summary

- Profiles are readable by the user and by users who share a studio membership.
- Studios are readable by owners and members.
- Only teacher profiles can insert owned studios.
- Only studio owners can update or delete studios.
- Memberships are readable by members of the same studio.
- Owners can manage memberships.
- Student joins happen through `join_studio_by_invite()` instead of broad insert permissions.
- Student invites are readable by studio teachers and by students only after acceptance.
- Student invite creation, revocation, redemption, and removal all happen through security-definer RPCs.
- Lesson notes are readable by studio teachers and assigned active students.
- Lesson note writes happen through security-definer RPCs so students cannot modify teacher-owned fields.
- Studio hub pages are readable by studio teachers and by studio members only when published.
- Studio hub writes happen through `upsert_studio_hub_page()` so only studio teachers can save page-builder content.
