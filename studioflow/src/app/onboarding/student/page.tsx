import { redirect } from "next/navigation";

import { joinStudioAction } from "@/app/onboarding/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAppContext } from "@/lib/auth";

type StudentOnboardingPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function StudentOnboardingPage({ searchParams }: StudentOnboardingPageProps) {
  const params = await searchParams;
  const context = await getAppContext();

  if (context.profile.role !== "student") {
    redirect("/onboarding/teacher");
  }

  if (context.membership) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Join your studio</CardTitle>
          <CardDescription>Enter the student invite code or studio code from your teacher.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={joinStudioAction} className="space-y-4">
            {params.error ? <Alert>{params.error}</Alert> : null}
            <div className="space-y-2">
              <Label htmlFor="invite_code">Invite code</Label>
              <Input id="invite_code" name="invite_code" className="uppercase tracking-widest" required />
            </div>
            <Button className="w-full" type="submit">
              Join studio
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
