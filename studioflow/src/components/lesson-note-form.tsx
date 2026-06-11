import { CalendarDays, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/lib/database.types";
import type { ProfileRow } from "@/lib/auth";

type LessonNote = Database["public"]["Tables"]["lesson_notes"]["Row"];

type LessonNoteFormProps = {
  action: (formData: FormData) => void;
  buttonLabel: string;
  note?: LessonNote;
  students: ProfileRow[];
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function LessonNoteForm({ action, buttonLabel, note, students }: LessonNoteFormProps) {
  return (
    <form action={action} className="space-y-4">
      {note ? <input name="note_id" type="hidden" value={note.id} /> : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lesson details</CardTitle>
          <CardDescription>Choose the student and lesson date for this note.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="student_id">Student</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={note?.student_id ?? ""}
              id="student_id"
              name="student_id"
              required
            >
              <option disabled value="">
                Select a student
              </option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name || student.email}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lesson_date">Date</Label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                defaultValue={note?.lesson_date ?? today()}
                id="lesson_date"
                name="lesson_date"
                required
                type="date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lesson note editor</CardTitle>
          <CardDescription>Capture repertoire, technique, observations, and next actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="repertoire">Repertoire</Label>
              <Textarea defaultValue={note?.repertoire} id="repertoire" name="repertoire" placeholder="Pieces, sections, measures" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="technique">Technique</Label>
              <Textarea defaultValue={note?.technique} id="technique" name="technique" placeholder="Scales, posture, articulation" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="teacher_notes">Teacher notes</Label>
            <Textarea
              defaultValue={note?.teacher_notes}
              id="teacher_notes"
              name="teacher_notes"
              placeholder="Teacher observations from the lesson"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="student_notes">Student notes</Label>
            <Textarea
              defaultValue={note?.student_notes}
              id="student_notes"
              name="student_notes"
              placeholder="Student reflections or reminders"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="action_items">Action items</Label>
            <Textarea defaultValue={note?.action_items} id="action_items" name="action_items" placeholder="Practice goals before the next lesson" />
          </div>
          <Button type="submit">
            <Save className="h-4 w-4" />
            {buttonLabel}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
