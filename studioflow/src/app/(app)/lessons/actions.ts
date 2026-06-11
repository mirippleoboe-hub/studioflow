"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function fieldValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function lessonPayload(formData: FormData) {
  return {
    studentId: fieldValue(formData, "student_id"),
    lessonDate: fieldValue(formData, "lesson_date"),
    repertoire: fieldValue(formData, "repertoire"),
    technique: fieldValue(formData, "technique"),
    teacherNotes: fieldValue(formData, "teacher_notes"),
    studentNotes: fieldValue(formData, "student_notes"),
    actionItems: fieldValue(formData, "action_items")
  };
}

function redirectToLessonError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createLessonNoteAction(formData: FormData) {
  const { studio } = await requireTeacher();

  if (!studio) {
    redirectToLessonError("/lessons/new", "Studio is required");
  }

  const payload = lessonPayload(formData);

  if (!payload.studentId) {
    redirectToLessonError("/lessons/new", "Student is required");
  }

  if (!payload.lessonDate) {
    redirectToLessonError("/lessons/new", "Lesson date is required");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_lesson_note", {
    p_studio_id: studio.id,
    p_student_id: payload.studentId,
    p_lesson_date: payload.lessonDate,
    p_repertoire: payload.repertoire,
    p_technique: payload.technique,
    p_teacher_notes: payload.teacherNotes,
    p_student_notes: payload.studentNotes,
    p_action_items: payload.actionItems
  });

  if (error || !data) {
    redirectToLessonError("/lessons/new", error?.message ?? "Lesson note could not be created");
  }

  revalidatePath("/lessons");
  redirect(`/lessons/${data.id}?message=Lesson%20note%20created`);
}

export async function updateLessonNoteAction(formData: FormData) {
  await requireTeacher();
  const noteId = fieldValue(formData, "note_id");
  const path = noteId ? `/lessons/${noteId}` : "/lessons";

  if (!noteId) {
    redirectToLessonError("/lessons", "Lesson note is required");
  }

  const payload = lessonPayload(formData);

  if (!payload.studentId) {
    redirectToLessonError(path, "Student is required");
  }

  if (!payload.lessonDate) {
    redirectToLessonError(path, "Lesson date is required");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_lesson_note", {
    p_note_id: noteId,
    p_student_id: payload.studentId,
    p_lesson_date: payload.lessonDate,
    p_repertoire: payload.repertoire,
    p_technique: payload.technique,
    p_teacher_notes: payload.teacherNotes,
    p_student_notes: payload.studentNotes,
    p_action_items: payload.actionItems
  });

  if (error) {
    redirectToLessonError(path, error.message);
  }

  revalidatePath("/lessons");
  revalidatePath(path);
  redirect(`${path}?message=Lesson%20note%20saved`);
}

export async function deleteLessonNoteAction(formData: FormData) {
  await requireTeacher();
  const noteId = fieldValue(formData, "note_id");

  if (!noteId) {
    redirectToLessonError("/lessons", "Lesson note is required");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_lesson_note", {
    p_note_id: noteId
  });

  if (error) {
    redirectToLessonError(`/lessons/${noteId}`, error.message);
  }

  revalidatePath("/lessons");
  redirect("/lessons?message=Lesson%20note%20deleted");
}
