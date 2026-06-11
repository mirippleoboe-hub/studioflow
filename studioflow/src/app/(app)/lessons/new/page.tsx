import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createLessonNoteAction } from "@/app/(app)/lessons/actions";
import { LessonNoteForm } from "@/components/lesson-note-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { requireTeacher, type ProfileRow } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type NewLessonNotePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewLessonNotePage({ searchParams }: NewLessonNotePageProps) {
  const params = await searchParams;
  const { studio } = await requireTeacher();
  const supabase = await createClient();

  if (!studio) {
    return null;
  }

  const { data: memberships } = await supabase
    .from("studio_memberships")
    .select("*")
    .eq("studio_id", studio.id)
    .eq("role", "student");

  const studentIds = (memberships ?? []).map((membership) => membership.profile_id);
  let students: ProfileRow[] = [];

  if (studentIds.length > 0) {
    const { data } = await supabase.from("profiles").select("*").in("id", studentIds).order("full_name");
    students = data ?? [];
  }

  return (
    <div>
      <div className="mb-5">
        <Button asChild variant="ghost">
          <Link href="/lessons">
            <ArrowLeft className="h-4 w-4" />
            Lessons
          </Link>
        </Button>
      </div>

      <PageHeader description="Write a lesson note for an active student." title="New Lesson Note" />

      {params.error ? <Alert className="mb-4">{params.error}</Alert> : null}

      {students.length > 0 ? (
        <LessonNoteForm action={createLessonNoteAction} buttonLabel="Create note" students={students} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No active students</CardTitle>
            <CardDescription>Add a student before creating lesson notes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/students">Go to students</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
