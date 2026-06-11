import { PlaceholderPage } from "@/components/placeholder-page";
import { requireAppContext } from "@/lib/auth";

export default async function AssignmentsPage() {
  await requireAppContext();

  return <PlaceholderPage description="A future workspace for assigned practice and teacher feedback." title="Assignments" />;
}
