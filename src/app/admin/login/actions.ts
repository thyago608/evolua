"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
import { verifyCredentials } from "@/lib/auth-credentials";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const user = String(formData.get("user") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!user || !password) {
    return { error: "Informe usuário e senha." };
  }

  let ok = false;
  try {
    ok = await verifyCredentials(user, password);
  } catch {
    return { error: "Servidor sem credenciais configuradas." };
  }

  if (!ok) {
    return { error: "Usuário ou senha inválidos." };
  }

  await createSession(user);
  redirect(next.startsWith("/admin") ? next : "/admin");
}
