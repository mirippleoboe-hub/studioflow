"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import type { Json } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { parseStudioHubBlocks } from "@/lib/studio-hub";

function fieldValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectWithError(message: string): never {
  redirect(`/resources/edit?error=${encodeURIComponent(message)}`);
}

export async function saveStudioHubAction(formData: FormData) {
  const { studio } = await requireTeacher();

  if (!studio) {
    redirectWithError("Studio is required");
  }

  const title = fieldValue(formData, "title");
  const blocks = parseStudioHubBlocks(fieldValue(formData, "blocks"));
  const isPublished = formData.get("is_published") === "on";

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_studio_hub_page", {
    p_studio_id: studio.id,
    p_title: title,
    p_blocks: blocks as unknown as Json,
    p_is_published: isPublished
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/resources");
  revalidatePath("/resources/edit");
  redirect("/resources?message=Studio%20hub%20saved");
}
