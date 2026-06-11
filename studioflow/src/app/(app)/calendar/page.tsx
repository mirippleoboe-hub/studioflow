import { PlaceholderPage } from "@/components/placeholder-page";
import { requireAppContext } from "@/lib/auth";

export default async function CalendarPage() {
  await requireAppContext();

  return <PlaceholderPage description="A future calendar surface for lessons and studio events." title="Calendar" />;
}
