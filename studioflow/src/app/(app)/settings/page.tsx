import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { requireTeacher } from "@/lib/auth";

export default async function SettingsPage() {
  const { studio } = await requireTeacher();

  return (
    <div>
      <PageHeader description="Phase 1 studio configuration." title="Settings" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{studio?.name}</CardTitle>
          <CardDescription>Students use this invite code to join your studio.</CardDescription>
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
