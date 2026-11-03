"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { forms, formQuestions } from "@/db/schema";

const QUESTION_TYPES = [
  "text",
  "textarea",
  "single_choice",
  "multi_choice",
  "scale",
  "boolean",
] as const;

type QuestionType = (typeof QUESTION_TYPES)[number];

interface IncomingQuestion {
  type: QuestionType;
  label: string;
  required: boolean;
  options: string[] | { min: number; max: number } | null;
}

export async function createFormAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim() || "Nova pesquisa";
  const [created] = await db
    .insert(forms)
    .values({ title })
    .returning({ id: forms.id });
  revalidatePath("/admin/forms");
  redirect(`/admin/forms/${created.id}`);
}

export async function activateFormAction(formData: FormData) {
  const formId = String(formData.get("formId") ?? "");
  if (!formId) return;
  // Desativa todos os outros e ativa este.
  await db
    .update(forms)
    .set({ isActive: false })
    .where(ne(forms.id, formId));
  await db.update(forms).set({ isActive: true }).where(eq(forms.id, formId));
  revalidatePath("/admin/forms");
  revalidatePath("/admin");
}

export async function deleteFormAction(formData: FormData) {
  const formId = String(formData.get("formId") ?? "");
  if (!formId) return;
  await db.delete(forms).where(eq(forms.id, formId));
  revalidatePath("/admin/forms");
  redirect("/admin/forms");
}

export interface SaveFormState {
  ok?: boolean;
  error?: string;
  /** Marca temporal do último salvamento bem-sucedido (usado pelo cliente
   * para saber que uma nova gravação ocorreu, mesmo que `ok` já fosse true). */
  savedAt?: number;
}

/**
 * Substitui todas as perguntas do formulário pelo conjunto enviado.
 * As perguntas vão serializadas em JSON no campo "questions".
 */
export async function saveFormAction(
  _prev: SaveFormState,
  formData: FormData
): Promise<SaveFormState> {
  const formId = String(formData.get("formId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const rawQuestions = String(formData.get("questions") ?? "[]");

  if (!formId) return { error: "Formulário inválido." };
  if (!title) return { error: "Informe um título." };

  let questions: IncomingQuestion[];
  try {
    questions = JSON.parse(rawQuestions);
  } catch {
    return { error: "Perguntas inválidas." };
  }

  // Validação básica.
  for (const q of questions) {
    if (!q.label?.trim()) return { error: "Toda pergunta precisa de um título." };
    if (!QUESTION_TYPES.includes(q.type))
      return { error: "Tipo de pergunta inválido." };
    if (
      (q.type === "single_choice" || q.type === "multi_choice") &&
      (!Array.isArray(q.options) || q.options.filter((o) => o.trim()).length < 2)
    ) {
      return {
        error: `A pergunta "${q.label}" precisa de ao menos 2 opções.`,
      };
    }
  }

  await db.update(forms).set({ title }).where(eq(forms.id, formId));
  await db.delete(formQuestions).where(eq(formQuestions.formId, formId));

  if (questions.length > 0) {
    await db.insert(formQuestions).values(
      questions.map((q, i) => ({
        formId,
        order: i,
        type: q.type,
        label: q.label.trim(),
        required: q.required,
        options:
          q.type === "single_choice" || q.type === "multi_choice"
            ? (q.options as string[]).map((o) => o.trim()).filter(Boolean)
            : q.type === "scale"
              ? (q.options as { min: number; max: number })
              : null,
      }))
    );
  }

  revalidatePath(`/admin/forms/${formId}`);
  revalidatePath("/admin/forms");
  return { ok: true, savedAt: Date.now() };
}
