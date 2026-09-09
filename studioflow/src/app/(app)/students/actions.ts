"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function fieldValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectWithError(message: string): never {
  redirect(`/students?error=${encodeURIComponent(message)}`);
}

function safeReturnPath(value: FormDataEntryValue | null): "/students" | `/students/${string}` {
  const path = String(value ?? "");
  return /^\/students\/[0-9a-f-]{36}$/i.test(path) ? path as `/students/${string}` : "/students";
}

export async function createStudentInviteAction(formData: FormData) {
  const { studio } = await requireTeacher();

  if (!studio) {
    redirectWithError("Studio is required");
  }

  const invitedName = fieldValue(formData, "invited_name");
  const invitedEmail = fieldValue(formData, "invited_email");

  if (!invitedName) {
    redirectWithError("Student name is required");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_student_invite", {
    p_studio_id: studio.id,
    p_invited_email: invitedEmail || null,
    p_invited_name: invitedName,
    p_expires_at: null
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/students");
  redirect("/students?message=Student%20invite%20created");
}

export async function addStudentByEmailAction(formData: FormData) {
  const { studio } = await requireTeacher();

  if (!studio) {
    redirectWithError("Studio is required");
  }

  const studentEmail = fieldValue(formData, "student_email");

  if (!studentEmail) {
    redirectWithError("Student email is required");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_student_by_email", {
    p_studio_id: studio.id,
    p_student_email: studentEmail
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/students");
  redirect("/students?message=Student%20added");
}

export async function removeStudentAction(formData: FormData) {
  const { studio } = await requireTeacher();
  const returnTo = safeReturnPath(formData.get("return_to"));

  if (!studio) {
    redirectWithError("Studio is required");
  }

  const profileId = fieldValue(formData, "profile_id");

  if (!profileId) {
    redirectWithError("Student is required");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_student_from_studio", {
    p_studio_id: studio.id,
    p_profile_id: profileId
  });

  if (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/students");
  redirect(`${returnTo}?message=Student%20removed`);
}

export async function revokeStudentInviteAction(formData: FormData) {
  await requireTeacher();
  const inviteId = fieldValue(formData, "invite_id");

  if (!inviteId) {
    redirectWithError("Invite is required");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_student_invite", {
    p_invite_id: inviteId
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/students");
  redirect("/students?message=Invite%20revoked");
}
