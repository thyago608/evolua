import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { invites, forms, patients } from "@/db/schema";
import { nextDueDate } from "./dates";
import {
  formBranchForPatientBranch,
  type PatientBranch,
} from "./patient-branches";

/** Busca o formulário ativo aplicável ao ramo informado. */
export async function getActiveForm(branch: PatientBranch) {
  const formBranch = formBranchForPatientBranch(branch);
  const [form] = await db
    .select()
    .from(forms)
    .where(and(eq(forms.isActive, true), eq(forms.branch, formBranch)))
    .limit(1);
  return form ?? null;
}

/**
 * Gera um novo convite (link) para o paciente usando o formulário ativo.
 * Expira convites anteriores ainda não respondidos.
 * Retorna o convite criado.
 */
export async function createInviteForPatient(patientId: string) {
  const [patient] = await db
    .select({ branch: patients.branch })
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);

  if (!patient) throw new Error("Paciente não encontrado.");

  const form = await getActiveForm(patient.branch);
  if (!form) {
    throw new Error(
      "Nenhum formulário ativo para este ramo. Ative um formulário antes de gerar links."
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
      branch: patient.branch,
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
