"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function fieldValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createStudioAction(formData: FormData) {
  const name = fieldValue(formData, "name");

  if (!name) {
    redirect("/onboarding/teacher?error=Studio%20name%20is%20required");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_studio_with_owner", {
    p_name: name
  });

  if (error) {
    redirect(`/onboarding/teacher?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function joinStudioAction(formData: FormData) {
  const inviteCode = fieldValue(formData, "invite_code").toUpperCase();

  if (!inviteCode) {
    redirect("/onboarding/student?error=Invite%20code%20is%20required");
  }

  const supabase = await createClient();
  const studentInviteResult = await supabase.rpc("redeem_student_invite", {
    p_invite_code: inviteCode
  });

  if (!studentInviteResult.error) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  const { error } = await supabase.rpc("join_studio_by_invite", {
    p_invite_code: inviteCode
  });

  if (error) {
    redirect(`/onboarding/student?error=${encodeURIComponent(studentInviteResult.error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
