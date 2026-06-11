import Link from "next/link";

import { signInAction } from "@/app/(auth)/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to StudioFlow</CardTitle>
        <CardDescription>Sign in to manage your studio or join your teacher.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signInAction} className="space-y-4">
          {params.error ? <Alert>{params.error}</Alert> : null}
          {params.message ? (
            <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
              {params.message}
            </div>
          ) : null}
          <input name="next" type="hidden" value={params.next ?? "/dashboard"} />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <Button className="w-full" type="submit">
            Sign in
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          New to StudioFlow?{" "}
          <Link className="font-medium text-primary hover:underline" href="/signup">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
