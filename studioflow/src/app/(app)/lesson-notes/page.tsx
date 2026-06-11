import { redirect } from "next/navigation";
import { CalendarDays, ClipboardList, Music, Save } from "lucide-react";

import { updateStudentLessonNotesAction } from "@/app/(app)/lesson-notes/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { requireAppContext, type ProfileRow } from "@/lib/auth";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type LessonNote = Database["public"]["Tables"]["lesson_notes"]["Row"];

type LessonNotesPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function SectionText({ value }: { value: string }) {
  return value.trim() ? (
    <p className="whitespace-pre-wrap text-sm leading-6">{value}</p>
  ) : (
    <p className="text-sm text-muted-foreground">No notes added.</p>
  );
}

export default async function LessonNotesPage({ searchParams }: LessonNotesPageProps) {
  const params = await searchParams;
  const { profile, studio } = await requireAppContext();

  if (profile.role !== "student") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: notes } = await supabase
    .from("lesson_notes")
    .select("*")
    .eq("student_id", profile.id)
    .order("lesson_date", { ascending: false })
    .order("created_at", { ascending: false });

  const teacherIds = Array.from(new Set((notes ?? []).map((note) => note.teacher_id)));
  let teachers: ProfileRow[] = [];

  if (teacherIds.length > 0) {
    const { data } = await supabase.from("profiles").select("*").in("id", teacherIds);
    teachers = data ?? [];
  }

  const teacherById = new Map(teachers.map((teacher) => [teacher.id, teacher]));

  return (
    <div>
      <PageHeader description={studio?.name ?? "Your lesson history"} title="Lesson Notes" />

      {params.error ? (
        <div className="mb-4 rounded-md border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}
      {params.message ? (
        <div className="mb-4 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {params.message}
        </div>
      ) : null}

      {notes && notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note) => (
            <LessonHistoryCard key={note.id} note={note} teacher={teacherById.get(note.teacher_id)} />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No lesson notes yet</CardTitle>
            <CardDescription>Your teacher's notes will appear here after lessons.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40 rounded-md border border-dashed bg-muted/20" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LessonHistoryCard({ note, teacher }: { note: LessonNote; teacher?: ProfileRow }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="text-base">{formatDate(note.lesson_date)}</CardTitle>
            <CardDescription>{teacher ? `Teacher: ${teacher.full_name || teacher.email}` : "Teacher lesson note"}</CardDescription>
          </div>
          <Badge variant="secondary">
            <CalendarDays className="mr-1 h-3.5 w-3.5" />
            Lesson
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-md border bg-muted/20 p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Music className="h-4 w-4" />
              Repertoire
            </h2>
            <SectionText value={note.repertoire} />
          </section>
          <section className="rounded-md border bg-muted/20 p-4">
            <h2 className="mb-2 text-sm font-semibold">Technique</h2>
            <SectionText value={note.technique} />
          </section>
        </div>

        <section className="rounded-md border bg-muted/20 p-4">
          <h2 className="mb-2 text-sm font-semibold">Teacher notes</h2>
          <SectionText value={note.teacher_notes} />
        </section>

        <section className="rounded-md border bg-muted/20 p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ClipboardList className="h-4 w-4" />
            Action items
          </h2>
          <SectionText value={note.action_items} />
        </section>

        <form action={updateStudentLessonNotesAction} className="space-y-3">
          <input name="note_id" type="hidden" value={note.id} />
          <div className="space-y-2">
            <Label htmlFor={`student_notes_${note.id}`}>Student notes</Label>
            <Textarea
              defaultValue={note.student_notes}
              id={`student_notes_${note.id}`}
              name="student_notes"
              placeholder="Add your reflections or practice reminders"
            />
          </div>
          <Button type="submit" variant="secondary">
            <Save className="h-4 w-4" />
            Save student notes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
