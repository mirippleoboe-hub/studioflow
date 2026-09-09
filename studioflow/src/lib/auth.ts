import { normalizePersonalization, type Personalization } from "@/lib/personalization";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type StudioRow = Database["public"]["Tables"]["studios"]["Row"];
export type MembershipRow = Database["public"]["Tables"]["studio_memberships"]["Row"];

export type AppContext = {
  profile: ProfileRow;
  personalization: Personalization;
  studio: StudioRow | null;
  membership: MembershipRow | null;
};

export async function getAppContext(): Promise<AppContext> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  if (profileError || !profile) {
    redirect("/account-error");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("studio_memberships")
    .select("*")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) redirect("/account-error");

  let studio: StudioRow | null = null;

  if (membership) {
    const { data, error } = await supabase.from("studios").select("*").eq("id", membership.studio_id).maybeSingle();
    if (error || !data) redirect("/account-error");
    studio = data;
  }

  return {
    profile,
    personalization: normalizePersonalization(user.user_metadata?.studioflow_personalization),
    membership,
    studio
  };
}

export async function requireAppContext(): Promise<AppContext> {
  const context = await getAppContext();

  if (!context.membership) {
    redirect(context.profile.role === "teacher" ? "/onboarding/teacher" : "/onboarding/student");
  }

  return context;
}

export async function requireTeacher(): Promise<AppContext> {
  const context = await requireAppContext();

  if (context.profile.role !== "teacher") {
    redirect("/dashboard");
  }

  return context;
}
