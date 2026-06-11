import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { requireAppContext } from "@/lib/auth";

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { profile, studio, membership } = await requireAppContext();

  return (
    <AppShell membership={membership} profile={profile} studio={studio}>
      {children}
    </AppShell>
  );
}
