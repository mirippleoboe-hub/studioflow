import Link from "next/link";
import { renameStudio } from "@/app/(app)/settings/actions";
import { ActionForm } from "@/components/action-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { requireTeacher } from "@/lib/auth";

export default async function SettingsPage() {
  const { studio } = await requireTeacher();

  return (
    <div>
      <PageHeader description="Manage your studio and make your workspace your own." title="Settings" />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Studio name</CardTitle>
          <CardDescription>This name appears throughout your teacher and student workspaces.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={renameStudio} label="Save studio name">
            <div className="space-y-2">
              <Label htmlFor="studio-name">Studio name</Label>
              <Input id="studio-name" name="name" defaultValue={studio?.name ?? ""} maxLength={80} required />
            </div>
          </ActionForm>
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Personalization</CardTitle>
          <CardDescription>Choose your colors and rearrange your menu.</CardDescription>
        </CardHeader>
        <CardContent><Link className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/settings/personalization">Personalize your workspace</Link></CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student invite code</CardTitle>
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
