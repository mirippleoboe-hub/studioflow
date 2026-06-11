import Link from "next/link";
import { BookOpen, CalendarDays, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { requireTeacher, type ProfileRow } from "@/lib/auth";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type LessonNote = Database["public"]["Tables"]["lesson_notes"]["Row"];

type LessonsPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function preview(value: string) {
  return value.trim() || "No details yet";
}

export default async function LessonsPage({ searchParams }: LessonsPageProps) {
  const params = await searchParams;
  const { studio } = await requireTeacher();
  const supabase = await createClient();

  if (!studio) {
    return null;
  }

  const { data: notes } = await supabase
    .from("lesson_notes")
    .select("*")
    .eq("studio_id", studio.id)
    .order("lesson_date", { ascending: false })
    .order("created_at", { ascending: false });

  const studentIds = Array.from(new Set((notes ?? []).map((note) => note.student_id)));
  let students: ProfileRow[] = [];

  if (studentIds.length > 0) {
    const { data } = await supabase.from("profiles").select("*").in("id", studentIds);
    students = data ?? [];
  }

  const studentById = new Map(students.map((student) => [student.id, student]));

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader description="Create and manage lesson notes for your students." title="Lessons" />
        <Button asChild>
          <Link href="/lessons/new">
            <Plus className="h-4 w-4" />
            New note
          </Link>
        </Button>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lesson notes</CardTitle>
          <CardDescription>{notes?.length ?? 0} notes in {studio.name}</CardDescription>
        </CardHeader>
        <CardContent>
          {notes && notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <LessonNoteRow key={note.id} note={note} student={studentById.get(note.student_id)} />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed bg-muted/20 px-4 py-10 text-center">
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No lesson notes yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create the first note after a student lesson.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LessonNoteRow({ note, student }: { note: LessonNote; student?: ProfileRow }) {
  return (
    <Link className="block rounded-md border bg-card p-4 transition-colors hover:bg-accent/50" href={`/lessons/${note.id}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{student?.full_name || student?.email || "Student"}</Badge>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(note.lesson_date)}
            </span>
          </div>
          <p className="font-medium">{preview(note.repertoire)}</p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{preview(note.teacher_notes)}</p>
        </div>
        <p className="text-sm text-muted-foreground md:text-right">{preview(note.action_items)}</p>
      </div>
    </Link>
  );
}
