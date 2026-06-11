import Link from "next/link";
import { Edit3, EyeOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StudioHubRenderer } from "@/components/studio-hub-renderer";
import { requireAppContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { defaultStudioHubBlocks, parseStudioHubBlocks } from "@/lib/studio-hub";

type ResourcesPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

function formatDate(value?: string) {
  if (!value) {
    return "Not saved yet";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const params = await searchParams;
  const { profile, studio } = await requireAppContext();
  const supabase = await createClient();

  if (!studio) {
    return null;
  }

  const { data: hubPage } = await supabase.from("studio_hub_pages").select("*").eq("studio_id", studio.id).maybeSingle();
  const isTeacher = profile.role === "teacher";
  const blocks = hubPage ? parseStudioHubBlocks(hubPage.blocks) : isTeacher ? defaultStudioHubBlocks() : [];
  const title = hubPage?.title ?? "Studio Hub";

  if (!isTeacher && !hubPage) {
    return (
      <div>
        <PageHeader description={studio.name} title="Studio Hub" />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hub not published</CardTitle>
            <CardDescription>Your teacher has not published the studio hub yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-center justify-center rounded-md border border-dashed bg-muted/20 text-sm text-muted-foreground">
              <EyeOff className="mr-2 h-4 w-4" />
              Check back later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader description={studio.name} title={title} />
        {isTeacher ? (
          <Button asChild>
            <Link href="/resources/edit">
              <Edit3 className="h-4 w-4" />
              Edit hub
            </Link>
          </Button>
        ) : null}
      </div>

      {params.error ? (
        <div className="mb-4 rounded-md border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}
      {params.message ? (
        <div className="mb-4 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {params.message}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-base">Studio hub</CardTitle>
              <CardDescription>Last updated {formatDate(hubPage?.updated_at)}</CardDescription>
            </div>
            {isTeacher ? <Badge variant={hubPage?.is_published ? "secondary" : "muted"}>{hubPage?.is_published ? "Published" : "Draft"}</Badge> : null}
          </div>
        </CardHeader>
        <CardContent>
          <StudioHubRenderer blocks={blocks} emptyMessage="Add blocks to build your studio hub." />
        </CardContent>
      </Card>
    </div>
  );
}
