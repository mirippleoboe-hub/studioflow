import { createClient } from "@/lib/supabase/server";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { requireAppContext } from "@/lib/auth";

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { profile, studio, membership, personalization } = await requireAppContext();

  const db = await createClient();
  const avatarUrl = profile.avatar_path ? (await db.storage.from("avatars").createSignedUrl(profile.avatar_path, 3600)).data?.signedUrl : null;

  return (
    <AppShell avatarUrl={avatarUrl} personalization={personalization} membership={membership} profile={profile} studio={studio}>
      {children}
    </AppShell>
  );
}
