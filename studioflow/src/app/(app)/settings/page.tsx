import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { requireTeacher } from "@/lib/auth";

export default async function SettingsPage() {
  const { studio } = await requireTeacher();

  return (
    <div>
      <PageHeader description="Manage your studio and make your workspace your own." title="Settings" />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Personalization</CardTitle>
          <CardDescription>Choose your colors and rearrange your menu.</CardDescription>
        </CardHeader>
        <CardContent><Link className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/settings/personalization">Personalize your workspace</Link></CardContent>
      </Card>
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
