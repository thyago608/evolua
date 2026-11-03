"use server";

import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { invites, formQuestions, responses } from "@/db/schema";
import { nextDueDate } from "@/lib/dates";
import type { StoredAnswer, AnswerValue } from "@/lib/answers";
import { notifyNewResponse } from "@/lib/email";

export interface SurveyState {
  error?: string;
}

export async function submitSurveyAction(
  _prev: SurveyState,
  formData: FormData
): Promise<SurveyState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Link inválido." };

  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1);

  if (!invite) return { error: "Link inválido ou expirado." };
  if (invite.status === "completed") {
    return { error: "Esta pesquisa já foi respondida." };
  }
  if (invite.status === "expired") {
    return { error: "Este link não está mais ativo." };
  }

  const questions = await db
    .select()
    .from(formQuestions)
    .where(eq(formQuestions.formId, invite.formId))
    .orderBy(asc(formQuestions.order));

  const answers: StoredAnswer[] = [];
  for (const q of questions) {
    let value: AnswerValue;
    if (q.type === "multi_choice") {
      value = formData.getAll(q.id).map((v) => String(v));
    } else {
      const raw = formData.get(q.id);
      value = raw === null ? null : String(raw);
    }

    const isEmpty =
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);

    if (q.required && isEmpty) {
      return { error: `Responda: "${q.label}".` };
    }

    answers.push({
      questionId: q.id,
      label: q.label,
      type: q.type,
      value,
    });
  }

  await db.insert(responses).values({
    inviteId: invite.id,
    patientId: invite.patientId,
    answers: answers as unknown as Record<string, unknown>,
  });

  // Marca concluído e agenda o próximo ciclo (+3 meses a partir de agora).
  await db
    .update(invites)
    .set({
      status: "completed",
      completedAt: new Date(),
      dueAt: nextDueDate(),
    })
    .where(eq(invites.id, invite.id));

  // Notificação por e-mail (Fase 2; env-gated, não quebra se ausente).
  await notifyNewResponse(invite.patientId).catch(() => {});

  redirect(`/s/${token}/obrigado`);
}
