import { redirect } from "next/navigation";

import { createStudioAction } from "@/app/onboarding/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAppContext } from "@/lib/auth";

type TeacherOnboardingPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function TeacherOnboardingPage({ searchParams }: TeacherOnboardingPageProps) {
  const params = await searchParams;
  const context = await getAppContext();

  if (context.profile.role !== "teacher") {
    redirect("/onboarding/student");
  }

  if (context.membership) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create your studio</CardTitle>
          <CardDescription>Your studio becomes the workspace students join with an invite code.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createStudioAction} className="space-y-4">
            {params.error ? <Alert>{params.error}</Alert> : null}
            <div className="space-y-2">
              <Label htmlFor="name">Studio name</Label>
              <Input id="name" name="name" placeholder="River City Piano Studio" required />
            </div>
            <Button className="w-full" type="submit">
              Create studio
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
