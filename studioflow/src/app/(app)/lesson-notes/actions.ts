"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAppContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function fieldValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function updateStudentLessonNotesAction(formData: FormData) {
  const { profile } = await requireAppContext();

  if (profile.role !== "student") {
    redirect("/dashboard");
  }

  const noteId = fieldValue(formData, "note_id");
  const studentNotes = fieldValue(formData, "student_notes");

  if (!noteId) {
    redirect("/lesson-notes?error=Lesson%20note%20is%20required");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_lesson_note_student_notes", {
    p_note_id: noteId,
    p_student_notes: studentNotes
  });

  if (error) {
    redirect(`/lesson-notes?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/lesson-notes");
  redirect("/lesson-notes?message=Student%20notes%20saved");
}
