import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { saveStudioHubAction } from "@/app/(app)/resources/actions";
import { StudioHubBuilder } from "@/components/studio-hub-builder";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { defaultStudioHubBlocks, parseStudioHubBlocks } from "@/lib/studio-hub";

type StudioHubEditPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function StudioHubEditPage({ searchParams }: StudioHubEditPageProps) {
  const params = await searchParams;
  const { studio } = await requireTeacher();
  const supabase = await createClient();

  if (!studio) {
    return null;
  }

  const { data: hubPage } = await supabase.from("studio_hub_pages").select("*").eq("studio_id", studio.id).maybeSingle();
  const blocks = hubPage ? parseStudioHubBlocks(hubPage.blocks) : defaultStudioHubBlocks();

  return (
    <div>
      <div className="mb-5">
        <Button asChild variant="ghost">
          <Link href="/resources">
            <ArrowLeft className="h-4 w-4" />
            Studio Hub
          </Link>
        </Button>
      </div>

      <PageHeader description="Build a shared page for students using movable content blocks." title="Edit Studio Hub" />

      {params.error ? <Alert className="mb-4">{params.error}</Alert> : null}

      <StudioHubBuilder
        action={saveStudioHubAction}
        initialBlocks={blocks}
        initialPublished={hubPage?.is_published ?? false}
        initialTitle={hubPage?.title ?? "Studio Hub"}
      />
    </div>
  );
}
