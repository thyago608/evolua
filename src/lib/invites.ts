import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { invites, forms } from "@/db/schema";
import { nextDueDate } from "./dates";

/** Busca o formulário ativo; lança erro se não houver. */
export async function getActiveForm() {
  const [form] = await db
    .select()
    .from(forms)
    .where(eq(forms.isActive, true))
    .limit(1);
  return form ?? null;
}

/**
 * Gera um novo convite (link) para o paciente usando o formulário ativo.
 * Expira convites anteriores ainda não respondidos.
 * Retorna o convite criado.
 */
export async function createInviteForPatient(patientId: string) {
  const form = await getActiveForm();
  if (!form) {
    throw new Error(
      "Nenhum formulário ativo. Ative um formulário antes de gerar links."
    );
  }

  // Expira convites pendentes/enviados anteriores deste paciente.
  await db
    .update(invites)
    .set({ status: "expired" })
    .where(
      and(
        eq(invites.patientId, patientId),
        inArray(invites.status, ["pending", "sent"])
      )
    );

  const [invite] = await db
    .insert(invites)
    .values({
      patientId,
      formId: form.id,
      dueAt: nextDueDate(),
      status: "pending",
    })
    .returning();

  return invite;
}

/** Marca um convite como enviado (registra sent_at). */
export async function markInviteSent(inviteId: string) {
  await db
    .update(invites)
    .set({ status: "sent", sentAt: new Date() })
    .where(eq(invites.id, inviteId));
}
