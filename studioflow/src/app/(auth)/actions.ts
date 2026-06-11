"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function fieldValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function safeNextPath(value: FormDataEntryValue | null) {
  const next = String(value ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signInAction(formData: FormData) {
  const email = fieldValue(formData, "email");
  const password = fieldValue(formData, "password");
  const next = safeNextPath(formData.get("next"));
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(next);
}

export async function signUpAction(formData: FormData) {
  const fullName = fieldValue(formData, "full_name");
  const email = fieldValue(formData, "email");
  const password = fieldValue(formData, "password");
  const role = fieldValue(formData, "role") === "teacher" ? "teacher" : "student";
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role
      }
    }
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Account%20created.%20Sign%20in%20to%20continue.");
}
