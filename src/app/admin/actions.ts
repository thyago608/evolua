"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
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
