import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { profile, studio } = await requireAppContext();
  const calendarDb = await createClient();
  const { data: upcoming } = await calendarDb.from("calendar_events").select("title,starts_at,time_zone").eq("studio_id",studio!.id).gte("starts_at",new Date().toISOString()).order("starts_at").limit(1);
  const nextEvent = upcoming?.[0];
  const nextTime = nextEvent ? new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZone:nextEvent.time_zone,timeZoneName:"short"}).format(new Date(nextEvent.starts_at)) : "Nothing scheduled";

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
          <Link href="/calendar"><WidgetCard description={nextEvent?.title ?? "Open your calendar to schedule a lesson."} title="Upcoming Lessons" value={nextTime} /></Link>
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
        <Link href="/calendar"><WidgetCard description={nextEvent?.title ?? "Your teacher will schedule your next lesson here."} title="Upcoming Events" value={nextTime} /></Link>
      </div>
    </div>
  );
}
