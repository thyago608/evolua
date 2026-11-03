import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { forms, formQuestions } from "@/db/schema";
import { FormEditor, type EditorQuestion } from "./form-editor";

export const dynamic = "force-dynamic";

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [form] = await db
    .select()
    .from(forms)
    .where(eq(forms.id, id))
    .limit(1);

  if (!form) notFound();

  const questions = await db
    .select()
    .from(formQuestions)
    .where(eq(formQuestions.formId, id))
    .orderBy(asc(formQuestions.order));

  const initial: EditorQuestion[] = questions.map((q, i) => ({
    clientId: `q-${i}-${q.id}`,
    type: q.type,
    label: q.label,
    required: q.required,
    options: Array.isArray(q.options)
      ? (q.options as string[])
      : q.type === "scale" && q.options
        ? (q.options as { min: number; max: number })
        : q.type === "single_choice" || q.type === "multi_choice"
          ? ["", ""]
          : null,
  }));

  return (
    <div className="space-y-6">
      <FormEditor
        formId={form.id}
        initialTitle={form.title}
        initialQuestions={initial}
        isActive={form.isActive}
      />
    </div>
  );
}
