"use server";

import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/auth";
import { normalizePersonalization } from "@/lib/personalization";
import { createClient } from "@/lib/supabase/server";

export async function savePersonalization(value: unknown) {
  await requireTeacher();
  const preferences = normalizePersonalization(value);
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { studioflow_personalization: preferences } });
  if (error) return { error: "We couldn't save your preferences. Please try again." };
  revalidatePath("/", "layout");
  return { preferences };
}
