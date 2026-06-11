# Student Management

## Teacher UI

Teachers manage students at `/students`.

- Search active students and pending invites by name, email, or invite code.
- Filter the roster by all, active, or invited.
- Invite a student by name and optional email.
- Add an existing student account by email.
- Remove active students.
- Revoke pending invites.

## Student Profiles

Active student profile pages live at `/students/[studentId]`.

The page verifies the student is a member of the teacher's studio before showing profile information. Removed students no longer resolve through this route.

## Invite Model

Student invites do not create Supabase Auth users. A student still creates their own student account, then redeems the student-specific code during onboarding. If the invite has an email, redemption is restricted to that student email.
