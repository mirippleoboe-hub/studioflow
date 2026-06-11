import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type WidgetCardProps = {
  title: string;
  description: string;
  value?: string;
};

export function WidgetCard({ title, description, value = "Coming soon" }: WidgetCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-normal">{value}</p>
      </CardContent>
    </Card>
  );
}
