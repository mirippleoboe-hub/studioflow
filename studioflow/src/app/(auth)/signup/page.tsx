import Link from "next/link";

import { signUpAction } from "@/app/(auth)/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignUpPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your StudioFlow account</CardTitle>
        <CardDescription>Choose the account type that matches your role.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signUpAction} className="space-y-4">
          {params.error ? <Alert>{params.error}</Alert> : null}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" autoComplete="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Account type</legend>
            <div className="grid grid-cols-2 gap-3">
              <Label className="flex cursor-pointer items-center gap-3 rounded-md border bg-background p-3">
                <input className="h-4 w-4 accent-primary" name="role" type="radio" value="teacher" defaultChecked />
                Teacher
              </Label>
              <Label className="flex cursor-pointer items-center gap-3 rounded-md border bg-background p-3">
                <input className="h-4 w-4 accent-primary" name="role" type="radio" value="student" />
                Student
              </Label>
            </div>
          </fieldset>
          <Button className="w-full" type="submit">
            Create account
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-medium text-primary hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
