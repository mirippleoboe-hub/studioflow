import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader description={description} title={title} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phase 1 placeholder</CardTitle>
          <CardDescription>This workspace area is intentionally reserved for a later build phase.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 rounded-md border border-dashed bg-muted/30" />
        </CardContent>
      </Card>
    </div>
  );
}
