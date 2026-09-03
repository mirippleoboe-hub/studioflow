import Link from "next/link";
import { Eye, MailPlus, Search, UserPlus, X } from "lucide-react";

import {
  addStudentByEmailAction,
  createStudentInviteAction,
  removeStudentAction,
  revokeStudentInviteAction
} from "@/app/(app)/students/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { requireTeacher, type MembershipRow, type ProfileRow } from "@/lib/auth";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type StudentInvite = Database["public"]["Tables"]["student_invites"]["Row"];

type StudentsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    q?: string;
    status?: string;
  }>;
};

type ActiveStudent = {
  membership: MembershipRow;
  profile: ProfileRow;
};

const filters = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Invited", value: "invited" }
];

function matchesSearch(value: string, query: string) {
  return value.toLowerCase().includes(query);
}

function filterHref(status: string, query: string): "/students" | `/students?${string}` {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  if (query) {
    params.set("q", query);
  }

  const suffix = params.toString();
  return suffix ? `/students?${suffix}` : "/students";
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams;
  const { studio } = await requireTeacher();
  const supabase = await createClient();

  if (!studio) {
    return null;
  }

  const query = String(params.q ?? "").trim().toLowerCase();
  const status = ["all", "active", "invited"].includes(String(params.status)) ? String(params.status) : "all";

  const { data: memberships } = await supabase
    .from("studio_memberships")
    .select("*")
    .eq("studio_id", studio.id)
    .eq("role", "student");

  const profileIds = (memberships ?? []).map((membership) => membership.profile_id);
  let profiles: ProfileRow[] = [];

  if (profileIds.length > 0) {
    const { data } = await supabase.from("profiles").select("*").in("id", profileIds).order("full_name");
    profiles = data ?? [];
  }

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const activeStudents: ActiveStudent[] = (memberships ?? [])
    .map((membership) => {
      const profile = profileById.get(membership.profile_id);
      return profile ? { membership, profile } : null;
    })
    .filter((student): student is ActiveStudent => Boolean(student));

  const { data: invites } = await supabase
    .from("student_invites")
    .select("*")
    .eq("studio_id", studio.id)
    .order("created_at", { ascending: false });

  const pendingInvites = (invites ?? []).filter((invite) => invite.status === "pending");

  const filteredStudents = activeStudents.filter(({ profile }) => {
    if (!query) {
      return true;
    }

    return matchesSearch(`${profile.full_name} ${profile.email}`, query);
  });

  const filteredInvites = pendingInvites.filter((invite) => {
    if (!query) {
      return true;
    }

    return matchesSearch(`${invite.invited_name} ${invite.invited_email ?? ""} ${invite.invite_code}`, query);
  });

  const showActive = status === "all" || status === "active";
  const showInvited = status === "all" || status === "invited";

  return (
    <div>
      <PageHeader description="Manage active students and invite new ones into your studio." title="Students" />

      {params.error ? <Alert className="mb-4">{params.error}</Alert> : null}
      {params.message ? (
        <div className="mb-4 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {params.message}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite student</CardTitle>
            <CardDescription>Create a student-specific invite code.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createStudentInviteAction} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="invited_name">Name</Label>
                <Input id="invited_name" name="invited_name" placeholder="Alex Johnson" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invited_email">Email</Label>
                <Input id="invited_email" name="invited_email" placeholder="alex@example.com" type="email" />
              </div>
              <Button className="self-end" type="submit">
                <MailPlus className="h-4 w-4" />
                Invite
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add existing student</CardTitle>
            <CardDescription>Add a student who already has a StudioFlow account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={addStudentByEmailAction} className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="student_email">Student email</Label>
                <Input id="student_email" name="student_email" placeholder="student@example.com" type="email" required />
              </div>
              <Button className="self-end" type="submit" variant="secondary">
                <UserPlus className="h-4 w-4" />
                Add
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <CardTitle className="text-base">Student roster</CardTitle>
              <CardDescription>
                {activeStudents.length} active, {pendingInvites.length} invited
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <form className="flex gap-2" method="get">
                <input name="status" type="hidden" value={status} />
                <Input className="w-full md:w-72" name="q" placeholder="Search students" type="search" defaultValue={params.q ?? ""} />
                <Button type="submit" variant="outline">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </form>
              <div className="flex rounded-md border bg-background p-1">
                {filters.map((filter) => (
                  <Link
                    className={cn(
                      "rounded-sm px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                      status === filter.value && "bg-accent text-accent-foreground"
                    )}
                    href={filterHref(filter.value, query)}
                    key={filter.value}
                  >
                    {filter.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showActive ? <ActiveStudentsTable students={filteredStudents} /> : null}
          {showInvited ? <PendingInvitesTable invites={filteredInvites} /> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function ActiveStudentsTable({ students }: { students: ActiveStudent[] }) {
  if (students.length === 0) {
    return (
      <section>
        <h2 className="mb-3 text-sm font-semibold">Active students</h2>
        <div className="rounded-md border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          No active students match this view.
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold">Active students</h2>
      <div className="overflow-x-auto rounded-md border">
        <div className="grid min-w-[720px] grid-cols-[1.5fr_1.5fr_auto] gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
          <span>Name</span>
          <span>Email</span>
          <span className="text-right">Actions</span>
        </div>
        {students.map(({ profile }) => (
          <div className="grid min-w-[720px] grid-cols-[1.5fr_1.5fr_auto] items-center gap-3 border-b px-4 py-3 last:border-b-0" key={profile.id}>
            <div>
              <Link className="font-medium text-foreground hover:underline" href={`/students/${profile.id}`}>
                {profile.full_name || "Unnamed student"}
              </Link>
              <div className="mt-1">
                <Badge variant="secondary">Active</Badge>
              </div>
            </div>
            <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
            <div className="flex justify-end gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/students/${profile.id}`}>
                  <Eye className="h-4 w-4" />
                  View
                </Link>
              </Button>
              <form action={removeStudentAction}>
                <input name="profile_id" type="hidden" value={profile.id} />
                <input name="return_to" type="hidden" value="/students" />
                <Button size="sm" type="submit" variant="destructive">
                  <X className="h-4 w-4" />
                  Remove
                </Button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PendingInvitesTable({ invites }: { invites: StudentInvite[] }) {
  if (invites.length === 0) {
    return (
      <section>
        <h2 className="mb-3 text-sm font-semibold">Pending invites</h2>
        <div className="rounded-md border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          No pending invites match this view.
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold">Pending invites</h2>
      <div className="overflow-x-auto rounded-md border">
        <div className="grid min-w-[760px] grid-cols-[1.2fr_1.2fr_0.8fr_auto] gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
          <span>Name</span>
          <span>Email</span>
          <span>Code</span>
          <span className="text-right">Actions</span>
        </div>
        {invites.map((invite) => (
          <div className="grid min-w-[760px] grid-cols-[1.2fr_1.2fr_0.8fr_auto] items-center gap-3 border-b px-4 py-3 last:border-b-0" key={invite.id}>
            <div>
              <p className="font-medium">{invite.invited_name}</p>
              <div className="mt-1">
                <Badge variant="muted">Invited</Badge>
              </div>
            </div>
            <p className="truncate text-sm text-muted-foreground">{invite.invited_email ?? "Open invite"}</p>
            <p className="font-mono text-sm tracking-widest">{invite.invite_code}</p>
            <form action={revokeStudentInviteAction} className="flex justify-end">
              <input name="invite_id" type="hidden" value={invite.id} />
              <Button size="sm" type="submit" variant="outline">
                <X className="h-4 w-4" />
                Revoke
              </Button>
            </form>
          </div>
        ))}
      </div>
    </section>
  );
}
