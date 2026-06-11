import { PageHeader } from "@/components/page-header";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { profile, studio } = await requireAppContext();

  if (profile.role === "teacher") {
    const supabase = await createClient();
    const { count: studentCount } = studio
      ? await supabase
          .from("studio_memberships")
          .select("*", { count: "exact", head: true })
          .eq("studio_id", studio.id)
          .eq("role", "student")
      : { count: 0 };
    const { count: pendingInviteCount } = studio
      ? await supabase
          .from("student_invites")
          .select("*", { count: "exact", head: true })
          .eq("studio_id", studio.id)
          .eq("status", "pending")
      : { count: 0 };

    return (
      <div>
        <PageHeader description={studio?.name ?? "Your teaching workspace"} title="Teacher Dashboard" />
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <WidgetCard description="Lessons scheduled for the next few days." title="Upcoming Lessons" />
          <WidgetCard
            description={`${pendingInviteCount ?? 0} pending invite${pendingInviteCount === 1 ? "" : "s"}.`}
            title="Students"
            value={`${studentCount ?? 0} active`}
          />
          <WidgetCard description="Assigned work waiting for review." title="Assignments" />
          <WidgetCard description="Studio-wide updates and reminders." title="Announcements" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Student invite code</CardTitle>
            <CardDescription>Share this code with students when they create a student account.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="inline-flex rounded-md border bg-muted px-3 py-2 font-mono text-lg tracking-widest">
              {studio?.invite_code}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader description={studio?.name ?? "Your student workspace"} title="Student Dashboard" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <WidgetCard description="Current work assigned by your teacher." title="Assignments" />
        <WidgetCard description="Suggested practice focus for the week." title="Practice Plan" />
        <WidgetCard description="Teacher-shared studio materials." title="Studio Hub" />
        <WidgetCard description="Upcoming lessons and studio dates." title="Upcoming Events" />
      </div>
    </div>
  );
}
