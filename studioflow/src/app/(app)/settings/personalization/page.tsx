import { requireTeacher } from "@/lib/auth";
import { PersonalizationEditor } from "@/components/personalization-editor";

export default async function PersonalizationPage() {
  const { personalization } = await requireTeacher();
  return <PersonalizationEditor initial={personalization} />;
}
