import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import { deleteLessonNoteAction, updateLessonNoteAction } from "@/app/(app)/lessons/actions";
import { LessonNoteForm } from "@/components/lesson-note-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { requireTeacher, type ProfileRow } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type TeacherLessonNotePageProps = {
  params: Promise<{
    noteId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function TeacherLessonNotePage({ params, searchParams }: TeacherLessonNotePageProps) {
  const { noteId } = await params;
  const query = await searchParams;
  const { studio } = await requireTeacher();
  const supabase = await createClient();

  if (!studio) {
    notFound();
  }

  const { data: note } = await supabase.from("lesson_notes").select("*").eq("id", noteId).eq("studio_id", studio.id).maybeSingle();

  if (!note) {
    notFound();
  }

  const { data: memberships } = await supabase
    .from("studio_memberships")
    .select("*")
    .eq("studio_id", studio.id)
    .eq("role", "student");

  const studentIds = Array.from(new Set([...(memberships ?? []).map((membership) => membership.profile_id), note.student_id]));
  let students: ProfileRow[] = [];

  if (studentIds.length > 0) {
    const { data } = await supabase.from("profiles").select("*").in("id", studentIds).order("full_name");
    students = data ?? [];
  }

  if (!students.some((student) => student.id === note.student_id)) {
    students = [
      {
        id: note.student_id,
        email: "",
        full_name: "Former student",
        avatar_path: null,
        role: "student",
        created_at: note.created_at
      },
      ...students
    ];
  }

  const selectedStudent = students.find((student) => student.id === note.student_id);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/lessons">
            <ArrowLeft className="h-4 w-4" />
            Lessons
          </Link>
        </Button>
        <form action={deleteLessonNoteAction}>
          <input name="note_id" type="hidden" value={note.id} />
          <Button type="submit" variant="destructive">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </form>
      </div>

      <PageHeader
        description={selectedStudent ? `For ${selectedStudent.full_name || selectedStudent.email}` : "Teacher lesson note"}
        title="Teacher Lesson Note"
      />

      {query.error ? <Alert className="mb-4">{query.error}</Alert> : null}
      {query.message ? (
        <div className="mb-4 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {query.message}
        </div>
      ) : null}

      <LessonNoteForm action={updateLessonNoteAction} buttonLabel="Save note" note={note} students={students} />
    </div>
  );
}
