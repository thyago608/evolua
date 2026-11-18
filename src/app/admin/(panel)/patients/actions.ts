"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, ne, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { invites, patients } from "@/db/schema";
import { patientSchema, patientDetailsSchema, onlyDigits } from "@/lib/validation";
import { createInviteForPatient, markInviteSent } from "@/lib/invites";
import { getSession } from "@/lib/auth";
import type { PatientBranch } from "@/lib/patient-branches";

export interface PatientFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function createPatientAction(
  _prev: PatientFormState,
  formData: FormData
): Promise<PatientFormState> {
  const raw = {
    cpf: String(formData.get("cpf") ?? ""),
    name: String(formData.get("name") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
    branch: String(formData.get("branch") ?? "acompanhamento"),
    planStartDate: String(formData.get("planStartDate") ?? ""),
    planEndDate: String(formData.get("planEndDate") ?? ""),
  };

  const parsed = patientSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { error: "Verifique os campos.", fieldErrors };
  }

  const cpf = parsed.data.cpf ? onlyDigits(parsed.data.cpf) : null;

  let newId: string;
  try {
    const [created] = await db
      .insert(patients)
      .values({
        name: parsed.data.name,
        birthDate: parsed.data.birthDate || null,
        cpf,
        branch: parsed.data.branch,
        planStartDate:
          parsed.data.branch === "acompanhamento"
            ? parsed.data.planStartDate
            : null,
        planEndDate:
          parsed.data.branch === "acompanhamento"
            ? parsed.data.planEndDate
            : null,
      })
      .returning({ id: patients.id });
    newId = created.id;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return {
        error: "Já existe um paciente com este CPF.",
        fieldErrors: { cpf: "CPF já cadastrado." },
      };
    }
    return { error: "Erro ao salvar paciente." };
  }

  revalidatePath("/admin");
  redirect(`/admin/patients/${newId}`);
}

export interface PatientDetailsState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  savedAt?: number;
}

export interface PatientBranchState {
  error?: string;
  fieldErrors?: Record<string, string>;
  savedAt?: number;
}

export interface DeletePatientState {
  error?: string;
  deletedAt?: number;
}

/** Remove um paciente e seus convites/respostas associados. */
export async function deletePatientAction(
  _prev: DeletePatientState,
  formData: FormData
): Promise<DeletePatientState> {
  const session = await getSession();
  if (!session) return { error: "Sua sessão expirou. Entre novamente." };

  const patientId = String(formData.get("patientId") ?? "");
  if (!patientId) return { error: "Paciente inválido." };

  try {
    await db.delete(patients).where(eq(patients.id, patientId));
    revalidatePath("/admin");
    return { deletedAt: Date.now() };
  } catch {
    return { error: "Não foi possível excluir o paciente." };
  }
}

/** Preenche/atualiza o CPF e a data de nascimento de um paciente já cadastrado. */
export async function updatePatientDetailsAction(
  _prev: PatientDetailsState,
  formData: FormData
): Promise<PatientDetailsState> {
  const patientId = String(formData.get("patientId") ?? "");
  if (!patientId) return { error: "Paciente inválido." };

  const raw = {
    cpf: String(formData.get("cpf") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
  };

  const parsed = patientDetailsSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { error: "Verifique os campos.", fieldErrors };
  }

  const cpf = parsed.data.cpf ? onlyDigits(parsed.data.cpf) : null;

  if (cpf) {
    const [existing] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(and(eq(patients.cpf, cpf), ne(patients.id, patientId)))
      .limit(1);
    if (existing) {
      return {
        error: "Já existe outro paciente com este CPF.",
        fieldErrors: { cpf: "CPF já cadastrado." },
      };
    }
  }

  await db
    .update(patients)
    .set({ cpf, birthDate: parsed.data.birthDate || null })
    .where(eq(patients.id, patientId));

  revalidatePath(`/admin/patients/${patientId}`);
  revalidatePath("/admin");
  return { ok: true, savedAt: Date.now() };
}

/** Atualiza o ramo atual do paciente e a vigência quando necessária. */
export async function updatePatientBranchAction(
  _prev: PatientBranchState,
  formData: FormData
): Promise<PatientBranchState> {
  const patientId = String(formData.get("patientId") ?? "");
  const branch = String(formData.get("branch") ?? "") as PatientBranch;
  const planStartDate = String(formData.get("planStartDate") ?? "");
  const planEndDate = String(formData.get("planEndDate") ?? "");

  if (!patientId) return { error: "Paciente inválido." };
  if (!['acompanhamento', 'novo', 'segmento'].includes(branch)) {
    return { error: "Ramo inválido." };
  }

  if (branch === "acompanhamento") {
    const fieldErrors: Record<string, string> = {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(planStartDate)) {
      fieldErrors.planStartDate = "Informe o início da vigência.";
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(planEndDate)) {
      fieldErrors.planEndDate = "Informe o fim da vigência.";
    } else if (planStartDate && planEndDate < planStartDate) {
      fieldErrors.planEndDate = "O fim deve ser igual ou posterior ao início.";
    }
    if (Object.keys(fieldErrors).length) {
      return { error: "Verifique a vigência.", fieldErrors };
    }
  }

  const [currentPatient] = await db
    .select({ branch: patients.branch })
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);
  if (!currentPatient) return { error: "Paciente não encontrado." };

  if (currentPatient.branch !== branch) {
    await db
      .update(invites)
      .set({ status: "expired" })
      .where(
        and(
          eq(invites.patientId, patientId),
          inArray(invites.status, ["pending", "sent"])
        )
      );
  }

  await db
    .update(patients)
    .set({
      branch,
      planStartDate: branch === "acompanhamento" ? planStartDate : null,
      planEndDate: branch === "acompanhamento" ? planEndDate : null,
    })
    .where(eq(patients.id, patientId));

  revalidatePath(`/admin/patients/${patientId}`);
  revalidatePath("/admin");
  return { savedAt: Date.now() };
}

/** Gera (ou regenera) o link de pesquisa para um paciente. */
export async function generateLinkAction(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  if (!patientId) return;
  await createInviteForPatient(patientId);
  revalidatePath(`/admin/patients/${patientId}`);
  revalidatePath("/admin");
}

/** Marca o convite atual como enviado (envio manual via WhatsApp). */
export async function markSentAction(formData: FormData) {
  const inviteId = String(formData.get("inviteId") ?? "");
  const patientId = String(formData.get("patientId") ?? "");
  if (!inviteId) return;
  await markInviteSent(inviteId);
  revalidatePath(`/admin/patients/${patientId}`);
  revalidatePath("/admin");
}
