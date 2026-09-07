"use server";

import { safeNextPath } from "@/lib/safe-redirect";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function fieldValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function signInAction(formData: FormData) {
  const email = fieldValue(formData, "email");
  const password = String(formData.get("password") ?? "");
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
  const password = String(formData.get("password") ?? "");
  const role = fieldValue(formData, "role") === "teacher" ? "teacher" : "student";
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      data: {
        full_name: fullName,
        role
      }
    }
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.session) redirect("/dashboard");
  redirect("/login?message=Check%20your%20email%20to%20confirm%20your%20account%20before%20signing%20in.");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = fieldValue(formData, "email");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Check%20your%20email%20for%20a%20password-reset%20link.");
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("password_confirmation") ?? "");

  if (password.length < 8) {
    redirect("/reset-password?error=Password%20must%20be%20at%20least%208%20characters.");
  }

  if (password !== confirmation) {
    redirect("/reset-password?error=Passwords%20do%20not%20match.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.auth.signOut();
  redirect("/login?message=Your%20password%20has%20been%20updated.%20Sign%20in%20with%20your%20new%20password.");
}
