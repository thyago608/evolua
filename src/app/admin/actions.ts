"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { responses } from "@/db/schema";
import { destroySession } from "@/lib/auth";

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

/** Marca todas as respostas como vistas (limpa as notificações). */
export async function clearNotificationsAction() {
  await db
    .update(responses)
    .set({ seen: true })
    .where(eq(responses.seen, false));
  revalidatePath("/admin", "layout");
}

/** Marca uma resposta específica como vista ao abrir sua notificação. */
export async function markNotificationSeenAction(responseId: string) {
  await db
    .update(responses)
    .set({ seen: true })
    .where(and(eq(responses.id, responseId), eq(responses.seen, false)));

  revalidatePath("/admin", "layout");
}
