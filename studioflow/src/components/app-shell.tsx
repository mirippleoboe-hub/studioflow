"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Library,
  LogOut,
  Music,
  NotebookText,
  Settings,
  Users
} from "lucide-react";

import { signOutAction } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MembershipRow, ProfileRow, StudioRow } from "@/lib/auth";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const teacherNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Lessons", href: "/lessons", icon: Music },
  { label: "Assignments", href: "/assignments", icon: ClipboardList },
  { label: "Studio Hub", href: "/resources", icon: Library },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Settings", href: "/settings", icon: Settings }
];

const studentNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Assignments", href: "/assignments", icon: ClipboardList },
  { label: "Lesson Notes", href: "/lesson-notes", icon: NotebookText },
  { label: "Studio Hub", href: "/resources", icon: BookOpen },
  { label: "Calendar", href: "/calendar", icon: CalendarDays }
];

type AppShellProps = {
  children: ReactNode;
  membership: MembershipRow | null;
  profile: ProfileRow;
  studio: StudioRow | null;
};

export function AppShell({ children, membership, profile, studio }: AppShellProps) {
  const pathname = usePathname();
  const navItems = profile.role === "teacher" ? teacherNav : studentNav;

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[264px_1fr]">
        <aside className="border-b bg-card lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col">
            <div className="border-b p-5">
              <Link className="text-xl font-semibold tracking-normal" href="/dashboard">
                StudioFlow
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{studio?.name ?? "Studio workspace"}</p>
            </div>
            <nav className="grid gap-1 p-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                      active && "bg-accent text-accent-foreground"
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto border-t p-4">
              <div className="mb-4">
                <p className="truncate text-sm font-medium">{profile.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile.role === "teacher" ? "Teacher" : "Student"}
                  {membership ? ` - ${membership.role}` : ""}
                </p>
              </div>
              <form action={signOutAction}>
                <Button className="w-full justify-start" type="submit" variant="outline">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </aside>
        <main className="min-w-0 p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
