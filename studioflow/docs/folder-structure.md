# Folder Structure

```text
studioflow/
  src/
    app/
      (auth)/
        login/
        signup/
        actions.ts
      (app)/
        dashboard/
        students/
          [studentId]/
          actions.ts
        lessons/
          [noteId]/
          new/
          actions.ts
        lesson-notes/
          actions.ts
        assignments/
        resources/
          edit/
          actions.ts
        calendar/
        settings/
        lesson-notes/
        actions.ts
        layout.tsx
      auth/callback/
      onboarding/
        teacher/
        student/
        actions.ts
      globals.css
      layout.tsx
      page.tsx
    components/
      dashboard/
      ui/
      app-shell.tsx
      page-header.tsx
      placeholder-page.tsx
    lib/
      supabase/
      auth.ts
      database.types.ts
      types.ts
      utils.ts
    middleware.ts
  supabase/
    migrations/
      0001_phase_1_foundation.sql
      0002_student_management.sql
      0003_lesson_notes.sql
      0004_studio_hub.sql
```

## Route Groups

- `(auth)` contains unauthenticated login and signup pages.
- `onboarding` contains the post-signup setup flow before a user reaches the app shell.
- `(app)` contains the authenticated SaaS layout, role-aware navigation, dashboards, student management, lesson notes, Studio Hub, and placeholder product areas.

## Phase 1 Boundary

Student management, lesson notes, and Studio Hub are implemented. Assignments, standalone resources, messaging, and calendar features remain placeholders only.
