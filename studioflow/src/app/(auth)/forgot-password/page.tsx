import Link from "next/link";

import { requestPasswordResetAction } from "@/app/(auth)/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>We will email you a secure link to choose a new password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={requestPasswordResetAction} className="space-y-4">
          {params.error ? <Alert>{params.error}</Alert> : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <Button className="w-full" type="submit">Send reset link</Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          <Link className="font-medium text-primary hover:underline" href="/login">Back to sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
