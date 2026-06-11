import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, User, X } from "lucide-react";

import { removeStudentAction } from "@/app/(app)/students/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type StudentProfilePageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export default async function StudentProfilePage({ params }: StudentProfilePageProps) {
  const { studentId } = await params;
  const { studio } = await requireTeacher();
  const supabase = await createClient();

  if (!studio) {
    notFound();
  }

  const { data: membership } = await supabase
    .from("studio_memberships")
    .select("*")
    .eq("studio_id", studio.id)
    .eq("profile_id", studentId)
    .eq("role", "student")
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  const { data: student } = await supabase.from("profiles").select("*").eq("id", studentId).maybeSingle();

  if (!student) {
    notFound();
  }

  return (
    <div>
      <div className="mb-5">
        <Button asChild variant="ghost">
          <Link href="/students">
            <ArrowLeft className="h-4 w-4" />
            Students
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader description={student.email} title={student.full_name || "Unnamed student"} />
        <form action={removeStudentAction}>
          <input name="profile_id" type="hidden" value={student.id} />
          <input name="return_to" type="hidden" value="/students" />
          <Button type="submit" variant="destructive">
            <X className="h-4 w-4" />
            Remove student
          </Button>
        </form>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Student account details from Supabase Auth profile data.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border bg-muted/20 p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <User className="h-4 w-4" />
              </div>
              <p className="text-sm text-muted-foreground">Full name</p>
              <p className="mt-1 font-medium">{student.full_name || "Not provided"}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <Mail className="h-4 w-4" />
              </div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="mt-1 break-all font-medium">{student.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Studio membership</CardTitle>
            <CardDescription>Current roster status for {studio.name}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border px-4 py-3">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border px-4 py-3">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="text-sm font-medium capitalize">{membership.role}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border px-4 py-3">
              <span className="text-sm text-muted-foreground">Account created</span>
              <span className="text-sm font-medium">{formatDate(student.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
