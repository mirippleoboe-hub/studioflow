"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/components/action-form";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function renameStudio(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) return { error: "Enter a studio name." };
  if (name.length > 80) return { error: "Studio names must be 80 characters or fewer." };

  const { studio } = await requireTeacher();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("studios")
    .update({ name })
    .eq("id", studio!.id)
    .select("id")
    .maybeSingle();

  if (error) return { error: "We couldn't rename your studio. Please try again." };
  if (!data) return { error: "This studio is no longer available." };

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { message: "Studio name updated." };
}
