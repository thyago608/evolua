import { eq } from "drizzle-orm";
import { db } from "@/db";
import { patients } from "@/db/schema";

/**
 * Notifica o admin sobre uma nova resposta (Fase 2, via Resend).
 * Env-gated: sem RESEND_API_KEY/NOTIFY_EMAIL não faz nada e não quebra o fluxo.
 */
export async function notifyNewResponse(patientId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!apiKey || !to) return; // Fase 1: notificação só no painel.

  const [patient] = await db
    .select({ name: patients.name })
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);

  const subject = "Nova resposta de pesquisa";
  const text = `O paciente ${patient?.name ?? ""} respondeu a pesquisa.`;

  // Chamada direta à API da Resend (sem SDK para manter leve).
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Pesquisa <onboarding@resend.dev>",
      to: [to],
      subject,
      text,
    }),
  });
}
