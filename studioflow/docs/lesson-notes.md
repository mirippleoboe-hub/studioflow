# Lesson Notes

## Teacher Workflow

Teachers use `/lessons` to view lesson notes for their studio.

- `/lessons/new` creates a note for an active student.
- `/lessons/[noteId]` edits a teacher lesson note.
- Teachers can update date, repertoire, technique, teacher notes, student notes, and action items.
- Teachers can delete lesson notes.

## Student Workflow

Students use `/lesson-notes` to view their lesson history.

- Notes are ordered by lesson date.
- Students can read repertoire, technique, teacher notes, and action items.
- Active students can update only the `student_notes` field.

## Security

The `lesson_notes` table has RLS enabled. Direct table writes are not granted to authenticated users. All mutations happen through RPCs that verify teacher studio membership or assigned active-student ownership.
